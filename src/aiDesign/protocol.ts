import { normalizeAppliedState, type AppliedProjectState } from '../projects/model.ts';
import { DEFAULT_GUIDANCE, DESIGN_SYSTEMS, type DesignGuidance, type DesignIntent, type PlannerInput } from '../autoDesign/model.ts';
import { layoutAsset } from '../layout/assets.ts';
import { effectiveSize, validPhysicalSize, type PhysicalAssignment } from '../tiles/physicalSize.ts';
import { imageQuality } from '../tiles/variantModel.ts';
import { WALL_IDS } from '../surfaces/model.ts';
import { wallSurface } from '../surfaces/compiler.ts';
export const AI_STYLES=['auto','minimal','luxury','bold','modern','contemporary'] as const;
export type AIStyle=typeof AI_STYLES[number];
export const AI_LIMITS={bodyBytes:2_500_000,candidates:12,materialImages:6,references:3,imageBytes:180_000,imageEdge:1024,prompt:2000} as const;
export type AICandidate={id:string;variantId:string;name:string;kind:'tile'|'slab';widthMm:number;heightMm:number;physicalOverride:{widthMm:number;heightMm:number}|null;finish:string;quality:string};
export type AIImage={purpose:'reference'|'material';candidateIds:string[];dataUrl:string};
export type AIRequest={version:1;request:string;style:AIStyle;room:AppliedProjectState;panel:{name:string;shape:string;widthMm:number;heightMm:number}|null;preferences:DesignGuidance;candidates:AICandidate[];images:AIImage[]};
export const choices={style:['minimal','luxury','bold'],strength:['subtle','balanced','dramatic'],floorPattern:['auto','straight','running-bond-50','running-bond-33','checker','modular'],center:['auto','on','off'],centerFrame:['auto','on','off'],featureWall:['auto','none',...WALL_IDS],wallCoverage:['auto','feature-only','multiple'],ceiling:['auto','simple','gypsum'],lighting:['auto','warm','neutral','cool'],furniture:['auto','show','hide']} as const;
export type AIPlan={style:DesignIntent['style'];primary:string;secondary:string|null;accent:string|null;feature:string|null}&Omit<DesignGuidance,'locks'>;
export type AIResult={version:1;summary:string;rationale:string[];warnings:string[];plan:AIPlan};
export type AIResponse=AIResult&{provider:'openai';model:string;plannerVersion:1};
export const UNSAFE_AI_MESSAGE='The AI proposal could not be applied safely. Try again or adjust the request.';
export function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error(UNSAFE_AI_MESSAGE);return value as Record<string,unknown>;}
export function keys(value:Record<string,unknown>,allowed:string[]){if(Object.keys(value).some(k=>!allowed.includes(k)))throw Error(UNSAFE_AI_MESSAGE);}
export function text(value:unknown,max:number):string{if(typeof value!=='string'||value.length>max)throw Error(UNSAFE_AI_MESSAGE);return value;}
function strings(value:unknown,max:number){if(!Array.isArray(value)||value.length>8)throw Error(UNSAFE_AI_MESSAGE);return value.map(v=>text(v,max));}
export function candidateAssignment(c:AICandidate):PhysicalAssignment{return {tileAssetId:c.variantId,...(c.physicalOverride?{physicalOverride:{...c.physicalOverride}}:{})};}
/** Strip provenance/history and artwork ownership; only the applied semantic room travels. */
export function roomContext(state:AppliedProjectState){const room=normalizeAppliedState(state);delete room.autoDesign;room.materialState={selectedFloorId:room.materialState.selectedFloorId,previousFloorId:null,compareActive:false,...(room.materialState.physicalOverride?{physicalOverride:room.materialState.physicalOverride}:{})};const p=room.floorDesign.installation.center.panel;delete room.floorDesign.installation.center.panel;return {room,panel:p?{name:p.name,shape:p.shape,widthMm:p.widthMm,heightMm:p.heightMm}:null};}
export function makeAIRequest(input:PlannerInput,options:{request:string;style:AIStyle;variantIds:string[]}):AIRequest{
 const context=roomContext(input.state),assigned:PhysicalAssignment[]=[];
 const i=input.state.floorDesign.installation;
 assigned.push({tileAssetId:input.state.materialState.selectedFloorId,physicalOverride:input.state.materialState.physicalOverride},i.field,i.center,i.centerFrame,i.border,...Object.values(input.state.walls));
 if(i.field.secondaryTileAssetId)assigned.push({tileAssetId:i.field.secondaryTileAssetId,physicalOverride:i.field.secondaryPhysicalOverride});if(i.field.modular)assigned.push(i.field.modular.b,i.field.modular.c,...(i.field.modular.d?[i.field.modular.d]:[]));
 const candidates:AICandidate[]=[];
 for(const p of input.products.filter(p=>options.variantIds.includes(p.id))){const overrides=[undefined,...assigned.filter(a=>a.tileAssetId===p.id).map(a=>a.physicalOverride).filter(a=>!!a)];const seen=new Set<string>();for(const override of overrides){const key=JSON.stringify(override??null);if(seen.has(key))continue;seen.add(key);const size=effectiveSize(layoutAsset(p),override);candidates.push({id:`m${candidates.length}`,variantId:p.id,name:p.name,kind:size.productKind??'tile',widthMm:size.widthMm,heightMm:size.heightMm,physicalOverride:override?{...override}:null,finish:p.finish??'unspecified',quality:imageQuality({pixelWidth:p.pixelWidth??null,pixelHeight:p.pixelHeight??null},{...size,transform:p.imageTransform}).label});}}
 if(!candidates.length||candidates.length>AI_LIMITS.candidates)throw Error(`Choose materials producing 1–${AI_LIMITS.candidates} candidates, including project sizes.`);
 return {version:1,request:options.request.trim(),style:options.style,...context,preferences:{...structuredClone(DEFAULT_GUIDANCE),...structuredClone(input.intent.guidance),locks:{...input.intent.guidance?.locks}},candidates,images:[]};
}
/** Provider sees dimensions/openings computed from project data, not measurements inferred from pixels. */
export function providerContext(r:AIRequest){return {...r,images:undefined,openings:WALL_IDS.map(id=>{const w=wallSurface(id,r.room.roomSize,r.room.architecture);return {wall:id,widthMm:w.widthMm,heightMm:w.heightMm,openings:w.openings};})};}
export function parseAIResult(value:unknown,candidates:AICandidate[]):AIResult{
 const v=record(value);keys(v,['version','summary','rationale','warnings','plan']);if(v.version!==1)throw Error(UNSAFE_AI_MESSAGE);const p=record(v.plan);keys(p,['primary','secondary','accent','feature',...Object.keys(choices)]);const ids=new Set(candidates.map(c=>c.id));
 for(const role of ['primary','secondary','accent','feature'])if(!(role!=='primary'&&p[role]===null)&&!ids.has(p[role] as string))throw Error(UNSAFE_AI_MESSAGE);
 for(const [key,values]of Object.entries(choices))if(!(values as readonly unknown[]).includes(p[key]))throw Error(UNSAFE_AI_MESSAGE);
 return {version:1,summary:text(v.summary,600),rationale:strings(v.rationale,500),warnings:strings(v.warnings,500),plan:structuredClone(p) as AIPlan};
}
export function resultSchema(candidates:AICandidate[]){const str={type:'string'},list={type:'array',items:str,maxItems:8};const properties:Record<string,unknown>={};for(const[key,values]of Object.entries(choices))properties[key]={type:'string',enum:values};for(const role of ['primary','secondary','accent','feature'])properties[role]={type:role==='primary'?'string':['string','null'],enum:[...candidates.map(c=>c.id),...(role==='primary'?[]:[null])]};return {type:'object',additionalProperties:false,properties:{version:{type:'integer',enum:[1]},summary:str,rationale:list,warnings:list,plan:{type:'object',additionalProperties:false,properties,required:Object.keys(properties)}},required:['version','summary','rationale','warnings','plan']};}
/** Bound the defined payload again on the server. Never forward arbitrary client fields. */
export function parseAIRequest(value:unknown):AIRequest{
 const v=record(value);keys(v,['version','request','style','room','panel','preferences','candidates','images']);if(v.version!==1||!AI_STYLES.includes(v.style as AIStyle))throw Error(UNSAFE_AI_MESSAGE);const request=text(v.request,AI_LIMITS.prompt);
 const raw=record(v.room);if(raw.autoDesign!==undefined)throw Error(UNSAFE_AI_MESSAGE);const room=normalizeAppliedState(raw);const safe=roomContext(room).room;
 const sameKeys=(a:unknown,b:unknown)=>{if(a&&b&&typeof a==='object'&&typeof b==='object'){const aa=record(a),bb=record(b);keys(aa,Object.keys(bb));if(Object.keys(aa).length!==Object.keys(bb).filter(k=>bb[k]!==undefined).length)throw Error(UNSAFE_AI_MESSAGE);for(const k of Object.keys(aa))sameKeys(aa[k],bb[k]);}else if(a!==b)throw Error(UNSAFE_AI_MESSAGE);};sameKeys(raw,safe);
 if(room.floorDesign.installation.center.panel||room.materialState.previousFloorId!==null||room.materialState.compareActive||room.materialState.previousPhysicalOverride)throw Error(UNSAFE_AI_MESSAGE);
 let panel:AIRequest['panel']=null;if(v.panel!==null){const p=record(v.panel);keys(p,['name','shape','widthMm','heightMm']);if(!['rectangle','circle','ellipse'].includes(p.shape as string)||!validPhysicalSize({widthMm:p.widthMm,heightMm:p.heightMm}))throw Error(UNSAFE_AI_MESSAGE);panel={name:text(p.name,120),shape:p.shape as string,widthMm:p.widthMm as number,heightMm:p.heightMm as number};}
 const g=record(v.preferences);keys(g,[...Object.keys(DEFAULT_GUIDANCE)]);for(const [key,values]of Object.entries(choices))if(key!=='style'&&!(values as readonly unknown[]).includes(g[key]))throw Error(UNSAFE_AI_MESSAGE);const locks=record(g.locks);keys(locks,[...DESIGN_SYSTEMS]);for(const l of Object.values(locks))if(typeof l!=='boolean')throw Error(UNSAFE_AI_MESSAGE);
 if(!Array.isArray(v.candidates)||!v.candidates.length||v.candidates.length>AI_LIMITS.candidates)throw Error(UNSAFE_AI_MESSAGE);
 const candidates=v.candidates.map(value=>{const c=record(value);keys(c,['id','variantId','name','kind','widthMm','heightMm','physicalOverride','finish','quality']);if(!validPhysicalSize({widthMm:c.widthMm,heightMm:c.heightMm})||!['tile','slab'].includes(c.kind as string)||c.physicalOverride!==null&&!validPhysicalSize(c.physicalOverride))throw Error(UNSAFE_AI_MESSAGE);const id=text(c.id,32),variantId=text(c.variantId,128);if(!id||!variantId)throw Error(UNSAFE_AI_MESSAGE);return {id,variantId,name:text(c.name,120),kind:c.kind as AICandidate['kind'],widthMm:c.widthMm as number,heightMm:c.heightMm as number,physicalOverride:c.physicalOverride?{widthMm:(c.physicalOverride as AICandidate['physicalOverride'])!.widthMm,heightMm:(c.physicalOverride as AICandidate['physicalOverride'])!.heightMm}:null,finish:text(c.finish,40),quality:text(c.quality,80)};});if(new Set(candidates.map(c=>c.id)).size!==candidates.length)throw Error(UNSAFE_AI_MESSAGE);
 if(!Array.isArray(v.images)||v.images.length>AI_LIMITS.materialImages+AI_LIMITS.references)throw Error(UNSAFE_AI_MESSAGE);let references=0,materials=0;
 const images=v.images.map(value=>{const im=record(value);keys(im,['purpose','candidateIds','dataUrl']);if(im.purpose==='reference')references++;else if(im.purpose==='material')materials++;else throw Error(UNSAFE_AI_MESSAGE);if(!Array.isArray(im.candidateIds)||im.candidateIds.length>AI_LIMITS.candidates||im.candidateIds.some(id=>!candidates.some(c=>c.id===id))||im.purpose==='reference'&&im.candidateIds.length||im.purpose==='material'&&!im.candidateIds.length)throw Error(UNSAFE_AI_MESSAGE);const dataUrl=text(im.dataUrl,Math.ceil(AI_LIMITS.imageBytes*4/3)+30);if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl))throw Error(UNSAFE_AI_MESSAGE);return {purpose:im.purpose,candidateIds:[...im.candidateIds],dataUrl} as AIImage;});if(references>AI_LIMITS.references||materials>AI_LIMITS.materialImages)throw Error(UNSAFE_AI_MESSAGE);
 return {version:1,request,style:v.style as AIStyle,room:safe,panel,preferences:structuredClone(g) as DesignGuidance,candidates,images};
}
