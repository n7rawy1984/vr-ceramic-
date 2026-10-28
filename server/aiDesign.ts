import { createHash } from 'node:crypto';
import { AI_LIMITS, parseAIRequest, parseAIResult, UNSAFE_AI_MESSAGE } from '../src/aiDesign/protocol.ts';
import { endpoint, HttpError, json, sameOrigin } from './http.ts';
import { OpenAIResponsesProvider, ProviderFailure, type AIProvider } from './ai/openai.ts';
export const AI_SERVER_TIMEOUT_MS=40_000;
/** Verify actual JPEG dimensions; data URLs cannot proxy remote URLs or mislabeled files. */
export function validateAnalysisJPEG(url:string){
 const bytes=Buffer.from(url.slice(url.indexOf(',')+1),'base64');
 if(bytes.length>AI_LIMITS.imageBytes||bytes.length<12||bytes[0]!==255||bytes[1]!==216||bytes.at(-2)!==255||bytes.at(-1)!==217||bytes.toString('base64')!==url.split(',')[1])throw new HttpError(400,'Choose a supported analysis image.');
 let pos=2;
 while(pos+4<bytes.length){if(bytes[pos++]!==255)break;while(bytes[pos]===255)pos++;const marker=bytes[pos++];if(marker===0xda||marker===0xd9)break;const length=bytes.readUInt16BE(pos);if(length<2||pos+length>bytes.length)break;if([0xc0,0xc1,0xc2].includes(marker)&&length>=8){const h=bytes.readUInt16BE(pos+3),w=bytes.readUInt16BE(pos+5);if(w<1||h<1||Math.max(w,h)>AI_LIMITS.imageEdge)break;return;}pos+=length;}
 throw new HttpError(400,'Resize analysis images to at most 1024 pixels per side.');
}
async function readBody(request:Request,signal:AbortSignal){
 if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')throw new HttpError(415,'Send an AI Designer JSON request.');
 const advertised=Number(request.headers.get('content-length')??0);if(advertised>AI_LIMITS.bodyBytes)throw new HttpError(413,'AI Designer request is too large.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'AI Designer request is missing.');const chunks:Uint8Array[]=[];let count=0;
 if(signal.aborted){await reader.cancel();throw new HttpError(504,'AI Designer timed out.');}
 const abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener('abort',abort,{once:true});
 try{
 while(true){const{done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>AI_LIMITS.bodyBytes){await reader.cancel();throw new HttpError(413,'AI Designer request is too large.');}chunks.push(value);}
 if(signal.aborted)throw new HttpError(504,'AI Designer timed out.');
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'AI Designer request could not be read.');}
 }finally{signal.removeEventListener('abort',abort);}
}
type Config={enabled:boolean;key:string;model:string};
/** Best-effort per-instance IP/global limits; no remote projects, accounts or logs. */
export function createAIDesignEndpoint(options:{config?:()=>Config;provider?:(c:Config)=>AIProvider;now?:()=>number;timeoutMs?:number}={}){
 const config=options.config??(()=>({enabled:process.env.AI_DESIGN_ENABLED==='true',key:process.env.OPENAI_API_KEY??'',model:process.env.OPENAI_MODEL??''}));
 const now=options.now??Date.now,attempts=new Map<string,{count:number;until:number}>();let global={count:0,until:0},active=0;
 return (request:Request)=>endpoint(async()=>{
  if(request.method!=='POST')return json({error:'Method not allowed.'},405,{Allow:'POST'});
  sameOrigin(request);
  const c=config();if(!c.enabled||!c.key||!c.model||!(/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(c.model))||c.model.startsWith('sk-'))throw new HttpError(503,'AI Designer unavailable. Use Auto Design instead.');
  const time=now();for(const[k,v]of attempts)if(v.until<time)attempts.delete(k);
  if(global.until<time)global={count:0,until:time+3_600_000};
  const ip=createHash('sha256').update(request.headers.get('x-forwarded-for')?.split(',')[0].trim()??'local').digest('hex');const a=attempts.get(ip)??{count:0,until:time+600_000};
  if(a.count>=5||global.count>=30||active>=2||attempts.size>=512&&!attempts.has(ip))return json({error:'AI Designer is busy. Please wait before trying again.'},429,{'Retry-After':'600'});
  a.count++;attempts.set(ip,a);global.count++;active++;
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),options.timeoutMs??AI_SERVER_TIMEOUT_MS);
  const aborted=()=>controller.abort();if(request.signal.aborted)controller.abort();request.signal.addEventListener('abort',aborted,{once:true});
  try{
   let input;try{input=parseAIRequest(await readBody(request,controller.signal));for(const image of input.images)validateAnalysisJPEG(image.dataUrl);}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Check the AI Designer request and selected materials.');}
   const provider=options.provider?.(c)??new OpenAIResponsesProvider(c.key,c.model);
   // Race also bounds a failed/stuck adapter; production fetch observes the abort signal.
   const stopped=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new HttpError(504,'AI Designer timed out. Try again or use Auto Design instead.')),{once:true}));
   if(controller.signal.aborted)throw new HttpError(504,'AI Designer timed out.');
   const result=await Promise.race([provider.propose(input,controller.signal),stopped]);
   return json({...parseAIResult(result,input.candidates),provider:'openai',model:c.model,plannerVersion:1});
  }catch(e){if(e instanceof HttpError)throw e;if(controller.signal.aborted)throw new HttpError(504,'AI Designer timed out. Try again or use Auto Design instead.');if(e instanceof ProviderFailure)throw new HttpError(e.status,e.status===422?UNSAFE_AI_MESSAGE:e.status===429?'AI Designer rate limit reached. Please wait and retry.':'AI Designer unavailable. Use Auto Design instead.');throw new HttpError(503,'AI Designer unavailable. Use Auto Design instead.');}
  finally{clearTimeout(timer);request.signal.removeEventListener('abort',aborted);active--;}
 });
}
export const aiDesign=createAIDesignEndpoint();
