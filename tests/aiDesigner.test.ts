import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {defaultProjectState,normalizeProjectDocument,stateFingerprint} from '../src/projects/model.ts';
import {AIPlanner,HTTPAIProvider} from '../src/aiDesign/planner.ts';
import {AI_LIMITS,makeAIRequest,parseAIRequest,parseAIResult,resultSchema,providerContext,type AIResult,type AIRequest} from '../src/aiDesign/protocol.ts';
import {createAutoDesignSession,prepareAutoDesign} from '../src/autoDesign/session.ts';
import {adjustmentLocks} from '../src/autoDesign/provenance.ts';
import {DEFAULT_GUIDANCE,type DesignIntent} from '../src/autoDesign/model.ts';
import {OpenAIResponsesProvider,ProviderFailure} from '../server/ai/openai.ts';
import {createAIDesignEndpoint,validateAnalysisJPEG} from '../server/aiDesign.ts';
const products=[...FLOOR_CERAMICS,{...FLOOR_CERAMICS[2],id:'slab',name:'Dark slab',productKind:'slab' as const,physicalSizeMm:{width:1200,height:2400}}];
const intent:DesignIntent={style:'minimal',materials:{primary:{tileAssetId:products[0].id}},guidance:structuredClone(DEFAULT_GUIDANCE)};
const input=()=>({state:defaultProjectState(),products,intent:structuredClone(intent)});
function request(){return makeAIRequest(input(),{request:'Create a calm luxury design using the light tile for the floor and the dark slab as a feature wall.',style:'auto',variantIds:products.map(p=>p.id)});}
export function fixtureResult(r:AIRequest):AIResult{return {version:1,summary:'Light floor and dark slab feature.',rationale:['A calm light field balances the dark feature.'],warnings:[],plan:{style:'luxury',primary:r.candidates[0].id,secondary:r.candidates.at(-1)!.id,accent:null,feature:r.candidates.at(-1)!.id,strength:'balanced',floorPattern:'straight',center:'off',centerFrame:'off',featureWall:'back',wallCoverage:'feature-only',ceiling:'gypsum',lighting:'warm',furniture:'hide'}};}
const response=(r:AIRequest)=>({...fixtureResult(r),provider:'openai',model:'test-vision',plannerVersion:1});
const configured=()=>({enabled:true,key:'server-only-sentinel',model:'test-vision'});
const req=(body:unknown,headers:Record<string,string>={})=>new Request('http://localhost/api/ai-design',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json',...headers},body:JSON.stringify(body)});
test('compact request contains authoritative openings, known effective assignments and no history or images by default',()=>{
 const i=input();i.state.materialState.physicalOverride={widthMm:555,heightMm:777};const r=makeAIRequest(i,{request:'calm',style:'modern',variantIds:[products[0].id]});assert.equal(r.candidates.length,2);assert.equal(r.candidates[1].widthMm,555);assert.deepEqual(r.candidates[1].physicalOverride,{widthMm:555,heightMm:777});assert(!JSON.stringify(r).includes('autoDesign'));assert.equal(r.images.length,0);assert(providerContext(r).openings.some(w=>w.openings.length));assert.deepEqual(parseAIRequest(JSON.parse(JSON.stringify(r))),r);const schema=resultSchema(r.candidates);assert.equal(schema.additionalProperties,false);
});
test('text-only AI uses one request, shared preview/apply/undo and persists offline-restorable AI provenance',async()=>{
 let prepared=prepareAutoDesign(defaultProjectState(),products),publications=0,preps=0,calls=0;const ai=new AIPlanner({propose:async r=>{calls++;return response(r);}});ai.configure({request:request().request,style:'auto',variantIds:products.map(p=>p.id)});
 const session=createAutoDesignSession({capture:()=>prepared.state,products:()=>products,projectKey:()=> 'a',prepare:(s,p)=>{preps++;return prepareAutoDesign(s,p,prepared);},publish:p=>{publications++;prepared=p;}},ai);
 const before=stateFingerprint(prepared.state);const d=await session.generate(intent);assert.equal(calls,1);assert.equal(publications,0);assert.equal(preps,1);assert.equal(d.walls.back.tileAssetId,'slab');assert.equal(stateFingerprint(prepared.state),before);session.apply();assert.equal(publications,1);assert.equal(preps,1);assert.equal(prepared.state.autoDesign?.generatedBy,'ai');assert.equal(prepared.state.autoDesign?.ai?.model,'test-vision');assert.equal(prepared.state.autoDesign?.intent.style,'luxury');
 const record={schemaVersion:6,id:'a',name:'AI',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:prepared.state};const copy=normalizeProjectDocument(JSON.parse(JSON.stringify({...record,id:'copy'})));assert.equal(stateFingerprint(prepareAutoDesign(copy.projectDocument,products).state),stateFingerprint(prepared.state));assert.equal(calls,1);session.undo();assert.equal(stateFingerprint(prepared.state),before);
});
test('complex floor/panel locks and all other locks beat a contrary AI plan; current room remains authoritative',async()=>{
 const i=input();i.state.floorDesign.enabled=true;i.state.floorDesign.started=true;i.state.floorDesign.installation.field.physicalOverride={widthMm:750,heightMm:850};i.state.floorDesign.installation.center.panel={version:1,id:'p',revision:2,name:'Snapshot',shape:'circle',widthMm:1200,heightMm:1200,artworkSourceId:'a',tileVariantId:products[0].id,tileSize:{widthMm:600,heightMm:600},tileOrientation:0,jointWidthMm:2,artworkTransform:{fit:'fill',scale:1,rotationDeg:25,offsetXmm:40,offsetYmm:-20}};i.state.lighting.lightingBrightness=55;i.intent.guidance={...DEFAULT_GUIDANCE,locks:{floor:true,lighting:true,ceiling:true,furniture:true}};
 const ai=new AIPlanner({propose:async r=>response(r)});ai.configure({request:'Replace the floor despite the lock',style:'auto',variantIds:products.map(p=>p.id)});const d=await ai.generate(i);assert.deepEqual(d.floor,i.state.floorDesign);assert.deepEqual(d.lighting,i.state.lighting);assert.deepEqual(d.ceiling,i.state.architecture.ceiling);assert.equal(d.furnitureVisible,i.state.architecture.furnitureVisible);
 const r=makeAIRequest(i,{request:'',style:'auto',variantIds:[products[0].id]});assert(r.panel);assert(!r.room.floorDesign.installation.center.panel);assert(!JSON.stringify(r).includes('artworkSourceId'));
});
test('unknown materials and unsupported fields are hard failures; incompatible Checker repairs visibly',async()=>{
 const r=request(),invalid=fixtureResult(r);invalid.plan.primary='invented';assert.throws(()=>parseAIResult(invalid,r.candidates),/safely/);const unsupported={...fixtureResult(r),curvedWalls:true};assert.throws(()=>parseAIResult(unsupported,r.candidates),/safely/);
 const ai=new AIPlanner({propose:async r=>{const a=response(r);a.plan.floorPattern='checker';return a;}});ai.configure({request:'',style:'auto',variantIds:products.map(p=>p.id)});const d=await ai.generate(input());assert.equal(d.floor.installation.field.pattern,'straight');assert(d.warnings.some(w=>w.includes('Fallback: Straight')));
});
test('stale room/library/project and cancelled pending AI cannot publish',async()=>{
 let release!:()=>void;const wait=new Promise<void>(r=>release=r),i=input(),ai=new AIPlanner({propose:async r=>{await wait;return response(r);}});ai.configure({request:'',style:'auto',variantIds:products.map(p=>p.id)});let pubs=0;const session=createAutoDesignSession({capture:()=>i.state,projectKey:()=> 'a',products:()=>products,publish:()=>pubs++},ai);const pending=session.generate(intent);i.state.lighting.lightingBrightness=55;release();await assert.rejects(pending,/changed/);assert.equal(pubs,0);
 const cancelled=new AIPlanner({propose:async(r,signal)=>{return new Promise((resolve,reject)=>{signal.addEventListener('abort',()=>reject(Error('abort')),{once:true});void r;void resolve;});}});cancelled.configure({request:'',style:'auto',variantIds:products.map(p=>p.id)});const p=cancelled.generate(input());await Promise.resolve();cancelled.cancel();await assert.rejects(p,/cancelled/);
});
test('HTTP client maps offline, rate limit, timeout, disabled and malformed responses without leaking internals or retrying',async()=>{
 for(const status of [429,504,503,422]){let calls=0;const p=new HTTPAIProvider(async()=>{calls++;return new Response('private-provider-detail',{status});});await assert.rejects(p.propose(request(),new AbortController().signal),e=>!String(e).includes('private-provider-detail'));assert.equal(calls,1);}
 await assert.rejects(new HTTPAIProvider(async()=>{throw Error('private-key');}).propose(request(),new AbortController().signal),/unavailable/);await assert.rejects(new HTTPAIProvider(async()=>new Response('broken')).propose(request(),new AbortController().signal),/safely/);
});
test('Responses adapter uses fixed endpoint, strict schema, store:false, visual content and server-only authorization',async()=>{
 const r=request();r.images=[{purpose:'reference',candidateIds:[],dataUrl:'data:image/jpeg;base64,/9j/2Q=='}];let sent:Record<string,any>={};const p=new OpenAIResponsesProvider('secret-sentinel','configured-model',async(url,init)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(new Headers(init!.headers).get('authorization'),'Bearer secret-sentinel');sent=JSON.parse(init!.body as string);return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(fixtureResult(r))}]}]});});assert.equal((await p.propose(r,new AbortController().signal)).version,1);assert.equal(sent.store,false);assert.equal(sent.model,'configured-model');assert.equal(sent.text.format.strict,true);assert.equal(sent.input[0].content.filter((c:any)=>c.type==='input_image').length,1);assert(!JSON.stringify(sent).includes('secret-sentinel'));assert.equal(sent.tools,undefined);
});
test('Responses refusal, incomplete, malformed JSON, unknown IDs and upstream errors never escape as usable plans',async()=>{
 for(const data of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]},{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'bad'}]}]}]){const p=new OpenAIResponsesProvider('x','y',async()=>Response.json(data));await assert.rejects(p.propose(request(),new AbortController().signal),ProviderFailure);}
 const p=new OpenAIResponsesProvider('x','y',async()=>new Response('secret-details',{status:429}));await assert.rejects(p.propose(request(),new AbortController().signal),e=>e instanceof ProviderFailure&&e.status===429&&!e.message.includes('secret-details'));
});
test('isolated endpoint disabled/method/origin/type/payload guards run without contacting a provider',async()=>{
 let calls=0;const disabled=createAIDesignEndpoint({config:()=>({...configured(),enabled:false}),provider:()=>({propose:async r=>{calls++;return fixtureResult(r);}})});assert.equal((await disabled(req(request()))).status,503);assert.equal((await disabled(new Request('http://localhost/api/ai-design'))).status,405);assert.equal(calls,0);
 const handler=createAIDesignEndpoint({config:configured,provider:()=>({propose:async r=>{calls++;return fixtureResult(r);}})});assert.equal((await handler(req(request(),{origin:'https://attacker.example'}))).status,403);assert.equal((await handler(req(request(),{'content-type':'text/plain'}))).status,415);assert.equal((await handler(req({...request(),url:'https://attacker.example'}))).status,400);assert.equal((await handler(req(request(),{'content-length':String(AI_LIMITS.bodyBytes+1)}))).status,413);assert.equal(calls,0);
});
test('endpoint accepts one bounded request, enforces IP throttling, scrubs provider errors and bounds timeouts',async()=>{
 let calls=0;const handler=createAIDesignEndpoint({config:configured,provider:()=>({propose:async r=>{calls++;return fixtureResult(r);}})});for(let n=0;n<5;n++){const response=await handler(req(request()));assert.equal(response.status,200);assert.equal((await response.json()).model,'test-vision');}assert.equal((await handler(req(request()))).status,429);assert.equal(calls,5);
 const timeout=createAIDesignEndpoint({config:configured,timeoutMs:5,provider:()=>({propose:()=>new Promise(()=>{})})});assert.equal((await timeout(req(request()))).status,504);
 const failed=createAIDesignEndpoint({config:configured,provider:()=>({propose:async()=>{throw Error('server-only-sentinel');}})});const error=await failed(req(request()));assert.equal(error.status,503);assert(!(await error.text()).includes('server-only-sentinel'));
});
test('actual JPEG header bounds and request image counts are enforced without accepting remote URLs',()=>{
 const jpeg=Buffer.from([255,216,255,192,0,17,8,0,1,0,1,3,1,17,0,2,17,0,3,17,0,255,217]);validateAnalysisJPEG('data:image/jpeg;base64,'+jpeg.toString('base64'));const huge=Buffer.from(jpeg);huge.writeUInt16BE(2048,7);assert.throws(()=>validateAnalysisJPEG('data:image/jpeg;base64,'+huge.toString('base64')));assert.throws(()=>parseAIRequest({...request(),images:[{purpose:'reference',candidateIds:[],dataUrl:'https://attacker.example/image.jpg'}]}));
 assert.throws(()=>parseAIRequest({...request(),images:Array(4).fill({purpose:'reference',candidateIds:[],dataUrl:'data:image/jpeg;base64,/9j/2Q=='})}));
});
test('slow request bodies time out, streaming size limits hold, and only two provider requests may run concurrently',async()=>{
 const handler=createAIDesignEndpoint({config:configured,timeoutMs:10,provider:()=>({propose:async r=>fixtureResult(r)})});
 const slow=new Request('http://localhost/api/ai-design',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:new ReadableStream({start(){}}),duplex:'half'} as RequestInit);assert.equal((await handler(slow)).status,504);
 const large=createAIDesignEndpoint({config:configured});assert.equal((await large(req({request:'x'.repeat(AI_LIMITS.bodyBytes)}))).status,413);
 let release!:()=>void;const wait=new Promise<void>(r=>release=r);let started=0;const concurrent=createAIDesignEndpoint({config:configured,provider:()=>({propose:async r=>{started++;await wait;return fixtureResult(r);}})});const a=concurrent(req(request())),b=concurrent(req(request()));while(started<2)await new Promise(r=>setTimeout(r,1));assert.equal((await concurrent(req(request()))).status,429);release();assert.equal((await a).status,200);assert.equal((await b).status,200);
});
test('AI previews reject catalog context changes including material names and finishes',async()=>{
 let library=[...products],pubs=0;const state=defaultProjectState(),ai=new AIPlanner({propose:async r=>response(r)});ai.configure({request:'',style:'auto',variantIds:products.map(p=>p.id)});const session=createAutoDesignSession({capture:()=>state,projectKey:()=> 'a',products:()=>library,publish:()=>pubs++},ai);await session.generate(intent);library=library.map((p,index)=>index? p:{...p,name:'Changed after preview',finish:'honed'});assert.throws(()=>session.apply(),/changed/);assert.equal(pubs,0);
});

test('AI-applied preserve intent re-enters Adjust unchanged, with manual work overriding only its subsystem',async()=>{
 const locks={floor:true,walls:false,ceiling:true,lighting:false,furniture:true};
 let prepared=prepareAutoDesign(defaultProjectState(),products);const ai=new AIPlanner({propose:async r=>response(r)});ai.configure({request:'Update walls and lighting',style:'auto',variantIds:products.map(p=>p.id)});
 const session=createAutoDesignSession({capture:()=>prepared.state,products:()=>products,projectKey:()=> 'ai-project',prepare:(s,p)=>prepareAutoDesign(s,p,prepared),publish:p=>{prepared=p;}},ai);
 await session.generate({...structuredClone(intent),guidance:{...DEFAULT_GUIDANCE,locks}});session.apply();assert.equal(prepared.state.autoDesign!.generatedBy,'ai');assert.deepEqual(adjustmentLocks(prepared.state),locks);
 prepared.state.lighting.lightingBrightness=55;assert.deepEqual(adjustmentLocks(prepared.state),{...locks,lighting:true});
});
