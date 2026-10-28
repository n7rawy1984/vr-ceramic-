import { LocalRulePlanner } from '../autoDesign/planner.ts';
import type { DesignPlanner, PlannerInput, DesignDecision, DesignIntent } from '../autoDesign/model.ts';
import { candidateAssignment, makeAIRequest, parseAIRequest, parseAIResult, record, text, UNSAFE_AI_MESSAGE, type AIRequest, type AIResponse, type AIStyle, type AICandidate, type AIImage } from './protocol.ts';
export interface AIProposalProvider { propose(request:AIRequest,signal:AbortSignal):Promise<unknown> }
export class HTTPAIProvider implements AIProposalProvider {
 private transport:typeof fetch;
 constructor(transport:typeof fetch=fetch){this.transport=(input,init)=>transport.call(globalThis,input,init);}
 async propose(request:AIRequest,signal:AbortSignal){
  let response:Response;try{response=await this.transport('/api/ai-design',{method:'POST',credentials:'same-origin',cache:'no-store',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});}catch{signal.throwIfAborted();throw Error('AI Designer unavailable. Check your connection or use Auto Design instead.');}
  if(!response.ok){await response.body?.cancel();throw Error(response.status===429?'AI Designer rate limit reached. Please wait and retry.':response.status===422?UNSAFE_AI_MESSAGE:response.status===504?'AI Designer timed out. Try again or use Auto Design instead.':'AI Designer unavailable. Use Auto Design instead.');}
  const raw=await response.text();if(raw.length>256_000)throw Error(UNSAFE_AI_MESSAGE);try{return JSON.parse(raw);}catch{throw Error(UNSAFE_AI_MESSAGE);}
 }
}
export type AIOptions={request:string;style:AIStyle;variantIds:string[];makeImages?:(candidates:AICandidate[],signal:AbortSignal)=>Promise<AIImage[]>};
/** One optional online request, then the existing deterministic resolution and transaction. */
export class AIPlanner implements DesignPlanner {
 private provider:AIProposalProvider;private options:AIOptions|null=null;private controller:AbortController|null=null;
 constructor(provider:AIProposalProvider=new HTTPAIProvider()){this.provider=provider;}
 configure(options:AIOptions){this.options={...options,variantIds:[...options.variantIds]};}
 cancel(){this.controller?.abort();}
 async generate(input:PlannerInput):Promise<DesignDecision>{
  this.cancel();if(!this.options)throw Error('Open AI Designer and choose materials first.');const options={...this.options,variantIds:[...this.options.variantIds]},controller=new AbortController();this.controller=controller;
  const timer=setTimeout(()=>controller.abort(new DOMException('AI Designer timed out. Try again or use Auto Design instead.','TimeoutError')),55_000);
  try{
   let request=makeAIRequest(input,options);if(options.makeImages)request.images=await options.makeImages(request.candidates,controller.signal);request=parseAIRequest(request);controller.signal.throwIfAborted();
   const response=record(await this.provider.propose(request,controller.signal));controller.signal.throwIfAborted();
   const {provider,model,plannerVersion,...raw}=response;if(provider!=='openai'||plannerVersion!==1||!validModel(model))throw Error(UNSAFE_AI_MESSAGE);const result=parseAIResult(raw,request.candidates),plan=result.plan;
   const materials:DesignIntent['materials']={};for(const role of ['primary','secondary','accent','feature'] as const){const id=plan[role];if(id!==null)materials[role]=candidateAssignment(request.candidates.find(c=>c.id===id)!);}
   const {style,primary:_p,secondary:_s,accent:_a,feature:_f,...planned}=plan;
   const guidance={...planned,locks:{...request.preferences.locks}};
   for(const [key,value]of Object.entries(request.preferences))if(key!=='locks'&&value!=='auto')Object.assign(guidance,{[key]:value});
   const explicitStyle=['minimal','luxury','bold'].includes(options.style)?options.style as DesignIntent['style']:style;
   const overrides=Object.entries(request.preferences).filter(([key,value])=>key!=='locks'&&value!=='auto'&&value!==planned[key as keyof typeof planned]).map(([key])=>key);
   const intent:DesignIntent={style:explicitStyle,materials,guidance};
   const decision=await new LocalRulePlanner().generate({...input,intent});
   decision.summary=result.summary;decision.reasons=[...result.rationale,...decision.reasons];decision.warnings=[...new Set([...result.warnings,...decision.warnings,...(overrides.length?[`Your explicit preferences override AI suggestions: ${overrides.join(', ')}.`]:[]),...(explicitStyle!==style?['Your selected style overrides the AI rule family.']:[])])];
   decision.appliedIntent=intent;decision.plannerInfo={generatedBy:'ai',provider:'openai',model:text(model,120),plannerVersion:1};return decision;
  }catch(e){if(controller.signal.aborted)throw Error(controller.signal.reason?.name==='TimeoutError'?'AI Designer timed out. Try again or use Auto Design instead.':'AI request cancelled.');throw e instanceof Error?e:Error(UNSAFE_AI_MESSAGE);}
  finally{clearTimeout(timer);if(this.controller===controller){this.controller=null;this.options=null;}}
 }
}
export function validModel(value:unknown):value is AIResponse['model']{return typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(value)&&!value.startsWith('sk-');}
