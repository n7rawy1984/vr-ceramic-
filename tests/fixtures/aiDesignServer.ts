/** Isolated M10 provider fixture. Never contacts OpenAI; not imported by deployed code. */
import {createServer} from 'node:http';
import {createAIDesignEndpoint} from '../../server/aiDesign.ts';
import {OpenAIResponsesProvider} from '../../server/ai/openai.ts';
import type {AIRequest,AIResult} from '../../src/aiDesign/protocol.ts';
const stats:{requests:number;providers:number;images:number;materialImages:number;references:number;maxImageBytes:number;invalid:number;cancelled:number;last?:unknown}={requests:0,providers:0,images:0,materialImages:0,references:0,maxImageBytes:0,invalid:0,cancelled:0};
function plan(r:AIRequest):AIResult{const light=r.candidates.find(c=>c.variantId==='ceramic-01')??r.candidates[0],dark=r.candidates.find(c=>c.kind==='slab')??r.candidates.find(c=>c.variantId==='ceramic-03')??r.candidates.at(-1)!;return {version:1,summary:'Controlled fixture: light floor and a dark feature wall.',rationale:['This is a controlled provider fixture, not live AI quality acceptance.'],warnings:[],plan:{style:'luxury',primary:light.id,secondary:dark.id,accent:null,feature:dark.id,strength:'balanced',floorPattern:'straight',center:'off',centerFrame:'off',featureWall:'back',wallCoverage:'feature-only',ceiling:'gypsum',lighting:'warm',furniture:'hide'}};}
createServer(async(req,res)=>{
 if(req.url==='/__ai_fixture'){res.setHeader('content-type','application/json');res.end(JSON.stringify(stats));return;}
 if(req.url!=='/api/ai-design'){res.writeHead(404);res.end();return;}
 stats.requests++;const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 const controller=new AbortController();req.once('aborted',()=>controller.abort());res.once('close',()=>{if(!res.writableEnded){stats.cancelled++;controller.abort();}});
 const web=new Request(`http://${req.headers.host}${req.url}`,{method:req.method,headers,body:req as unknown as ReadableStream,duplex:'half',signal:controller.signal} as RequestInit);
 // Independent cases get a fresh limiter; production limiter behavior is covered in native tests.
 const handler=createAIDesignEndpoint({config:()=>({enabled:true,key:'M10_SECRET_SENTINEL_DO_NOT_SHIP',model:'fixture-vision'}),timeoutMs:2000,provider:c=>new OpenAIResponsesProvider(c.key,c.model,async(_url,init)=>{
  stats.providers++;const body=JSON.parse(init!.body as string),r=JSON.parse(body.input[0].content[0].text) as AIRequest;
  const visual=body.input[0].content.filter((c:{type:string})=>c.type==='input_image');stats.images=visual.length;stats.maxImageBytes=Math.max(0,...visual.map((v:{image_url:string})=>Buffer.from(v.image_url.split(',')[1],'base64').length));
  const captions=body.input[0].content.filter((c:{type:string})=>c.type==='input_text').slice(1).map((v:{text:string})=>JSON.parse(v.text));stats.materialImages=captions.filter((v:{purpose:string})=>v.purpose==='material').length;stats.references=captions.filter((v:{purpose:string})=>v.purpose==='reference').length;stats.last={request:r.request,room:r.room,panel:r.panel,candidates:r.candidates,preferences:r.preferences,store:body.store,model:body.model};
  if(r.request.includes('fixture:rate'))return new Response('private-upstream-detail',{status:429});
  if(r.request.includes('fixture:error'))return new Response('private-upstream-detail',{status:500});
  if(r.request.includes('fixture:timeout')||r.request.includes('fixture:cancel'))await new Promise((_resolve,reject)=>{init!.signal?.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});
  const result=plan(r);if(r.request.includes('fixture:unknown')){result.plan.primary='invented';stats.invalid++;}if(r.request.includes('fixture:checker'))result.plan.floorPattern='checker';
  const output=r.request.includes('fixture:malformed')?'not json':JSON.stringify(r.request.includes('fixture:unsupported')?{...result,newWindows:2}:result);
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:output}]}]});})});
 try{const response=await handler(web);if(!res.destroyed){res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}}catch{if(!res.destroyed){res.writeHead(500);res.end('{}');}}
}).listen(5411,'127.0.0.1',()=>console.log('M10 controlled provider fixture only: port 5411'));
