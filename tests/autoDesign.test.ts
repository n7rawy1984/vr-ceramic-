import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLOOR_CERAMICS } from '../src/catalog/materials.ts';
import { defaultProjectState, stateFingerprint, normalizeProjectDocument } from '../src/projects/model.ts';
import { LocalRulePlanner, featureWallFor } from '../src/autoDesign/planner.ts';
import { createAutoDesignSession, decisionState, prepareAutoDesign } from '../src/autoDesign/session.ts';
import { DESIGN_STYLES, type DesignIntent, type DesignPlanner } from '../src/autoDesign/model.ts';
import { compileWall, wallSurface } from '../src/surfaces/compiler.ts';
import { layoutAsset } from '../src/layout/assets.ts';
import type { MaterialProduct } from '../src/catalog/types.ts';

const slab: MaterialProduct = { ...FLOOR_CERAMICS[2], id:'slab', name:'Dark slab', productKind:'slab', physicalSizeMm:{width:1200,height:2600}, pixelWidth:2400,pixelHeight:5200 };
const products = [...FLOOR_CERAMICS, slab];
const planner = new LocalRulePlanner();
const intent = (style:DesignIntent['style'], n=3):DesignIntent => ({style,materials:{ primary:{tileAssetId:products[0].id}, ...(n>1?{secondary:{tileAssetId:'slab'}}:{}), ...(n>2?{accent:{tileAssetId:products[2].id}}:{}) }});
for (const style of DESIGN_STYLES) for (const n of [1,2,3]) test(`${style}: ${n} material inputs are deterministic, geometry-valid, non-mutating`,async()=>{
 const state=defaultProjectState(),before=structuredClone(state),input={state,products,intent:intent(style,n)};
 const a=await planner.generate(input),b=await planner.generate(input);assert.deepEqual(a,b);assert.deepEqual(state,before);
 const prepared=prepareAutoDesign(decisionState(state,a),products);assert.equal(prepared.result.ok,true);
 assert.deepEqual(prepared.state.roomSize,before.roomSize);assert.equal(prepared.state.architecture.heightMm,before.architecture.heightMm);assert.deepEqual(prepared.state.architecture.window,before.architecture.window);
 assert.equal(a.floor.installation.field.pattern,'straight');assert.equal(a.floor.installation.border.enabled,false);
 if(style==='minimal'){assert.equal(a.featureWall,null);assert.equal(a.floor.installation.center.enabled,false);assert.equal(a.ceiling.style,'simple');}
 if(style==='luxury'&&n>1){assert.equal(a.walls[a.featureWall!].tileAssetId,'slab');assert.equal(a.ceiling.style,'gypsum');assert.equal(a.lighting.lightingBrightness,85);}
 if(style==='bold'&&n===3)assert.equal(a.walls[a.featureWall!].tileAssetId,products[2].id);
});
test('tile secondary and accent enable real center/frame; huge Slab frame omitted',async()=>{
 const state=defaultProjectState(),materials={primary:{tileAssetId:products[0].id},secondary:{tileAssetId:products[1].id},accent:{tileAssetId:products[1].id}};
 const d=await planner.generate({state,products,intent:{style:'luxury',materials}});assert.equal(d.floor.installation.center.enabled,true);assert.equal(d.floor.installation.centerFrame.enabled,true);
 const p=prepareAutoDesign(decisionState(state,d),products);assert(p.result.ok);assert(p.result.layout.placements.some(p=>p.zoneId==='center'));assert(p.result.layout.placements.some(p=>p.zoneId==='centerFrame'));
 materials.accent.tileAssetId='slab';const b=await planner.generate({state,products,intent:{style:'luxury',materials}});assert.equal(b.floor.installation.centerFrame.enabled,false);
});
test('feature ranking accounts for openings, usable area, width and fixed ties',()=>{
 const s=defaultProjectState();assert.equal(featureWallFor(s),'left');s.roomSize.lengthMm=s.roomSize.widthMm;assert.equal(featureWallFor(s),'back');s.roomSize.widthMm=8000;assert.equal(featureWallFor(s),'back');
 const wall={enabled:true,tileAssetId:'slab',physicalOverride:{widthMm:1000,heightMm:2700},orientation:0 as const,jointWidthMm:3};
 for(const id of ['front','right'] as const){const surface=wallSurface(id,s.roomSize,s.architecture),r=compileWall(surface,wall,products.map(layoutAsset));assert(r.ok);assert(r.layout.placements.every(p=>surface.openings.every(o=>p.xMm+p.widthMm<=o.xMm+1e-6||p.xMm>=o.xMm+o.widthMm-1e-6||p.yMm+p.heightMm<=o.yMm+1e-6||p.yMm>=o.yMm+o.heightMm-1e-6)));assert(r.layout.placements.every(p=>p.tileBounds.widthMm===1000&&p.tileBounds.heightMm===2700));}
});
test('effective body overrides retained in field/center/frame/wall; quality advisory only',async()=>{
 const s=defaultProjectState();const d=await planner.generate({state:s,products,intent:{style:'luxury',materials:{primary:{tileAssetId:products[0].id,physicalOverride:{widthMm:850,heightMm:975}},secondary:{tileAssetId:products[1].id,physicalOverride:{widthMm:900,heightMm:1000}},accent:{tileAssetId:products[2].id,physicalOverride:{widthMm:100,heightMm:600}}}}});
 assert.deepEqual(d.floor.installation.field.physicalOverride,{widthMm:850,heightMm:975});assert.deepEqual(d.floor.installation.center.physicalOverride,{widthMm:900,heightMm:1000});assert.deepEqual(d.floor.installation.centerFrame.physicalOverride,{widthMm:100,heightMm:600});
 const p=prepareAutoDesign(decisionState(s,d),products);assert(p.result.ok);assert(p.result.layout.placements.filter(p=>p.zoneId==='field').every(p=>p.tileBounds.widthMm===850&&p.tileBounds.heightMm===975));assert(d.warnings.length>0);
});
test('one accent-only input, no inputs, invalid size, missing input and small gypsum adaptation',async()=>{
 const state=defaultProjectState();const a=await planner.generate({state,products,intent:{style:'minimal',materials:{accent:{tileAssetId:'slab'}}}});assert.equal(a.floor.installation.field.tileAssetId,'slab');
 await assert.rejects(planner.generate({state,products,intent:{style:'minimal',materials:{}}}),/at least one/);
 await assert.rejects(planner.generate({state,products,intent:{style:'minimal',materials:{primary:{tileAssetId:'gone'}}}}),/no longer/);
 await assert.rejects(planner.generate({state,products,intent:{style:'minimal',materials:{primary:{tileAssetId:'slab',physicalOverride:{widthMm:0,heightMm:1}}}}}),/physical size/);
 state.roomSize={widthMm:1000,lengthMm:1000};state.architecture.window.enabled=false;
 const d=await planner.generate({state,products,intent:intent('luxury')});assert.equal(d.ceiling.style,'simple');assert.equal(d.floor.installation.center.enabled,false);assert(prepareAutoDesign(decisionState(state,d),products).result.ok);
});
function fixture(custom:DesignPlanner=planner){let state=defaultProjectState(),library=products,key='a',publications=0,preparations=0;const session=createAutoDesignSession({capture:()=>state,projectKey:()=>key,products:()=>library,prepare:(s,p)=>{preparations++;return prepareAutoDesign(s,p);},publish:p=>{publications++;state=p.state;}},custom);return {session,get state(){return state;},set state(s){state=s;},get publications(){return publications;},get preparations(){return preparations;},set library(p:MaterialProduct[]){library=p;},set key(k:string){key=k;}};}
test('Generate/Cancel zero prepare/publication; Apply once; full one-level rollback',async()=>{
 const f=fixture();f.state.materialState.physicalOverride={widthMm:555,heightMm:777};f.state.materialState.previousFloorId=products[1].id;f.state.materialState.previousPhysicalOverride={widthMm:555,heightMm:666};f.state.materialState.compareActive=true;f.state.architecture.furnitureVisible=true;
 const before=stateFingerprint(f.state);await f.session.generate(intent('luxury'));assert.equal(f.preparations,0);assert.equal(f.publications,0);assert.equal(stateFingerprint(f.state),before);f.session.cancel();assert.throws(()=>f.session.apply(),/changed/);assert.equal(f.publications,0);
 await f.session.generate(intent('luxury'));f.session.apply();assert.equal(f.preparations,1);assert.equal(f.publications,1);assert(f.session.canUndo());f.session.undo();assert.equal(f.publications,2);assert.equal(stateFingerprint(f.state),before);assert.equal(f.session.canUndo(),false);
});
test('stale architecture/design/project/library proposals and stale undo cannot publish',async()=>{
 for(const change of ['architecture','design','project','library']){const f=fixture();await f.session.generate(intent('luxury'));if(change==='architecture')f.state.architecture.heightMm+=100;if(change==='design')f.state.lighting.lightingBrightness=20;if(change==='project')f.key='b';if(change==='library')f.library=FLOOR_CERAMICS;assert.throws(()=>f.session.apply(),/changed/);assert.equal(f.publications,0);}
 const f=fixture();await f.session.generate(intent('luxury'));f.session.apply();f.state.lighting.lightingBrightness=120;assert(!f.session.canUndo());assert.throws(()=>f.session.undo(),/changed/);assert.equal(f.publications,1);
});
test('invalid decisions and failed compilation publish nothing; missing restore references reject',async()=>{
 const bad:DesignPlanner={generate:async i=>{const d=await planner.generate(i);d.floor.installation.field.pattern='checker';d.floor.installation.field.secondaryTileAssetId='slab';return d;}};
 const f=fixture(bad),before=stateFingerprint(f.state);await f.session.generate(intent('luxury'));assert.throws(()=>f.session.apply(),/could not be opened/);assert.equal(f.publications,0);assert.equal(stateFingerprint(f.state),before);
 const s=defaultProjectState();s.walls.back.enabled=true;s.walls.back.tileAssetId='deleted';assert.throws(()=>prepareAutoDesign(s,products),/deleted/);
});
test('cancel invalidates pending asynchronous planner response',async()=>{
 let release!:()=>void;const wait=new Promise<void>(r=>release=r);const f=fixture({generate:async input=>{await wait;return planner.generate(input);}});const generating=f.session.generate(intent('minimal'));f.session.cancel();release();await assert.rejects(generating,/changed/);assert.equal(f.publications,0);
});
test('applied semantic document roundtrip needs no planner or schema change',async()=>{
 const f=fixture();await f.session.generate(intent('luxury'));f.session.apply();const raw={schemaVersion:5,id:'x',name:'Luxury',createdAt:'2026-10-28',updatedAt:'2026-10-28',assetNames:{},projectDocument:f.state};const opened=normalizeProjectDocument(JSON.parse(JSON.stringify(raw)));const p=prepareAutoDesign(opened.projectDocument,products);assert.equal(stateFingerprint(p.state),stateFingerprint(f.state));
});
