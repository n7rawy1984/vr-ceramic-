import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {defaultProjectState,stateFingerprint,normalizeProjectDocument} from '../src/projects/model.ts';
import {LocalRulePlanner} from '../src/autoDesign/planner.ts';
import {createAutoDesignSession,decisionState,prepareAutoDesign} from '../src/autoDesign/session.ts';
import {DESIGN_STYLES,DESIGN_SYSTEMS,type DesignGuidance,type DesignStyle,type DesignMaterials} from '../src/autoDesign/model.ts';
import type {MaterialProduct} from '../src/catalog/types.ts';
const tile=(id:string,w:number,h=w):MaterialProduct=>({...FLOOR_CERAMICS[1],id,name:id,physicalSizeMm:{width:w,height:h}});
const products=[...FLOOR_CERAMICS,tile('B',600,299),tile('C',299),{...tile('slab',1200,2400),productKind:'slab' as const}];
const planner=new LocalRulePlanner(),materials:DesignMaterials={primary:{tileAssetId:'ceramic-02'},secondary:{tileAssetId:'B'},accent:{tileAssetId:'C'}};
const generate=(g:Partial<DesignGuidance>={},style:DesignStyle='luxury',state=defaultProjectState(),m=materials)=>planner.generate({state,products,intent:{style,materials:m,guidance:g}});
function complex(){const s=defaultProjectState();s.floorDesign.enabled=true;s.floorDesign.started=true;s.floorDesign.installation.jointWidthMm=2;s.floorDesign.installation.field={tileAssetId:'ceramic-02',physicalOverride:{widthMm:900,heightMm:900},orientation:90,pattern:'modular',modular:{preset:'multi-size',b:{tileAssetId:'B',physicalOverride:{widthMm:449,heightMm:900},orientation:0},c:{tileAssetId:'C',physicalOverride:{widthMm:449,heightMm:449},orientation:90}}};for(const [index,id]of ['front','back','left','right'].entries())s.walls[id as keyof typeof s.walls]={enabled:true,tileAssetId:products[index].id,physicalOverride:{widthMm:700+index*50,heightMm:900+index*100},orientation:index%2?90:0,jointWidthMm:index+1};s.lighting={lightingEnabled:false,lightingColor:'#b27c44',lightingBrightness:55,lightFixtureVisible:true};s.architecture.furnitureVisible=true;s.materialState.physicalOverride={widthMm:450,heightMm:800};s.materialState.previousFloorId='ceramic-03';s.materialState.previousPhysicalOverride={widthMm:800,heightMm:900};return s;}
for(const style of ['minimal','luxury'] as const)test(`${style}: strengths are deterministic, meaningfully distinct, and valid`,async()=>{
 const list=[];for(const strength of ['subtle','balanced','dramatic'] as const){const a=await generate({strength},style),b=await generate({strength},style);assert.deepEqual(a,b);assert(prepareAutoDesign(decisionState(defaultProjectState(),a),products).result.ok);list.push(a);}
 assert(list[0].lighting.lightingBrightness<list[1].lighting.lightingBrightness);assert(list[1].lighting.lightingBrightness<list[2].lighting.lightingBrightness);assert.equal(list[0].floor.installation.center.enabled,false);assert.equal(list[2].floor.installation.center.enabled,true);assert.notDeepEqual(list[0].walls,list[2].walls);
});
test('locks override all conflicting guidance; Modular, Simple material, sizes, walls and lighting exact',async()=>{
 const state=complex(),before=structuredClone(state),d=await generate({strength:'dramatic',floorPattern:'checker',center:'off',centerFrame:'off',featureWall:'none',wallCoverage:'multiple',ceiling:'gypsum',lighting:'cool',furniture:'hide',locks:Object.fromEntries(DESIGN_SYSTEMS.map(k=>[k,true]))},'luxury',state);
 assert.deepEqual(d.preserved,DESIGN_SYSTEMS);assert.equal(stateFingerprint(decisionState(state,d)),stateFingerprint(before));assert.deepEqual(state,before);assert.equal(d.warnings.length,0);
 state.floorDesign.enabled=false;state.materialState.compareActive=true;const simple=await generate({locks:{floor:true}},'bold',state);assert.deepEqual(simple.floor,state.floorDesign);assert.deepEqual(simple.materialState,state.materialState);assert(prepareAutoDesign(decisionState(state,simple),products).result.ok);
});
for(const style of DESIGN_STYLES)test(`${style}: explicit Left and None win over automatic style/strength`,async()=>{
 const a=await generate({featureWall:'left',strength:'subtle'},style);assert.equal(a.featureWall,'left');assert(a.walls.left.enabled);
 const b=await generate({featureWall:'none',strength:'dramatic',wallCoverage:'multiple'},style);assert.equal(b.featureWall,null);assert(Object.values(b.walls).every(w=>!w.enabled));
});
test('specific door/window walls keep real Slab body and warn about clipping; quality stays advisory',async()=>{
 for(const featureWall of ['front','right'] as const){const d=await generate({featureWall},'minimal',defaultProjectState(),{primary:materials.primary,secondary:{tileAssetId:'slab',physicalOverride:{widthMm:1300,heightMm:2600}}});assert.equal(d.featureWall,featureWall);assert.deepEqual(d.walls[featureWall].physicalOverride,{widthMm:1300,heightMm:2600});assert(d.warnings.some(w=>w.includes('opening')));assert(d.warnings.some(w=>w.includes('soft')));assert(prepareAutoDesign(decisionState(defaultProjectState(),d),products).result.ok);}
});
test('Multiple Walls adds only one Primary companion wall; explicit feature-only and None remain restrained',async()=>{
 const d=await generate({featureWall:'right',wallCoverage:'multiple'});assert.equal(Object.values(d.walls).filter(w=>w.enabled).length,2);assert.equal(d.walls.right.tileAssetId,'C');assert(Object.entries(d.walls).some(([id,w])=>id!=='right'&&w.enabled&&w.tileAssetId==='ceramic-02'));
 const one=await generate({featureWall:'right',wallCoverage:'feature-only'});assert.equal(Object.values(one.walls).filter(w=>w.enabled).length,1);
});
test('explicit Running Bond 50/33 and Straight override styles without swapping Primary',async()=>{
 for(const floorPattern of ['running-bond-50','running-bond-33','straight'] as const){const d=await generate({floorPattern,center:'off',centerFrame:'off'},'bold');assert.equal(d.floor.installation.field.pattern,floorPattern);assert.equal(d.floor.installation.field.tileAssetId,'ceramic-02');assert(prepareAutoDesign(decisionState(defaultProjectState(),d),products).result.ok);}
});
test('Checker mismatch gives visible fallback; matching effective dimensions keep all role identities',async()=>{
 const d=await generate({floorPattern:'checker'});assert.equal(d.floor.installation.field.pattern,'straight');assert(d.warnings.some(w=>w.includes('Checker')&&w.includes('Fallback: Straight')));
 const overrides={primary:{tileAssetId:'ceramic-01',physicalOverride:{widthMm:900,heightMm:900}},secondary:{tileAssetId:'B',physicalOverride:{widthMm:900,heightMm:900}},accent:materials.accent};const valid=await generate({floorPattern:'checker'},'luxury',defaultProjectState(),overrides);assert.equal(valid.floor.installation.field.pattern,'checker');assert.equal(valid.floor.installation.field.tileAssetId,'ceramic-01');assert.equal(valid.floor.installation.field.secondaryTileAssetId,'B');assert.deepEqual(valid.floor.installation.field.secondaryPhysicalOverride,overrides.secondary.physicalOverride);assert(prepareAutoDesign(decisionState(defaultProjectState(),valid),products).result.ok);
});
test('Modular uses exact A/B/C, current joint and orientation; missing or incompatible role falls back',async()=>{
 const state=defaultProjectState();state.floorDesign.installation.jointWidthMm=2;const d=await generate({floorPattern:'modular'},'minimal',state);assert.equal(d.floor.installation.field.pattern,'modular');assert.equal(d.floor.installation.field.modular!.b.tileAssetId,'B');assert.equal(d.floor.installation.field.modular!.b.orientation,90);assert.equal(d.floor.installation.field.modular!.c.tileAssetId,'C');assert(prepareAutoDesign(decisionState(state,d),products).result.ok);
 const bad=await generate({floorPattern:'modular'},'minimal',state,{primary:materials.primary,secondary:materials.secondary});assert.equal(bad.floor.installation.field.pattern,'straight');assert(bad.warnings.some(w=>w.includes('Modular')&&w.includes('Fallback: Straight')));
});
test('Slab cannot enter a non-Straight field or small frame; impossible explicit center/frame is explained',async()=>{
 const d=await generate({floorPattern:'running-bond-50',center:'on',centerFrame:'on'},'luxury',defaultProjectState(),{primary:{tileAssetId:'slab'}});assert.equal(d.floor.installation.field.pattern,'straight');assert(d.warnings.some(w=>w.includes('Center On')));assert(d.warnings.some(w=>w.includes('Center Frame On')));
 const slabFrame=await generate({center:'on',centerFrame:'on'},'luxury',defaultProjectState(),{primary:materials.primary,secondary:materials.secondary,accent:{tileAssetId:'slab'}});assert.equal(slabFrame.floor.installation.centerFrame.enabled,false);
});
test('explicit Off never overridden; Frame On can request its center when Center is Auto',async()=>{
 for(const style of DESIGN_STYLES){const d=await generate({center:'off',centerFrame:'off',strength:'dramatic'},style);assert(!d.floor.installation.center.enabled);assert(!d.floor.installation.centerFrame.enabled);}
 const d=await generate({centerFrame:'on',strength:'subtle'},'minimal');assert(d.floor.installation.center.enabled);assert(d.floor.installation.centerFrame.enabled);
 const blocked=await generate({center:'off',centerFrame:'on'},'luxury');assert(!blocked.floor.installation.centerFrame.enabled);assert(blocked.warnings.some(w=>w.includes('Frame On')));
});
test('explicit ceiling/lighting/furniture override style; ceiling lock wins; invalid gypsum warns',async()=>{
 const d=await generate({ceiling:'gypsum',lighting:'warm',furniture:'show'},'minimal');assert.equal(d.ceiling.style,'gypsum');assert.equal(d.lighting.lightingColor,'#fff0d6');assert(d.furnitureVisible);
 const locked=await generate({ceiling:'gypsum',lighting:'cool',locks:{ceiling:true,lighting:true}},'luxury',complex());assert.deepEqual(locked.ceiling,complex().architecture.ceiling);assert.deepEqual(locked.lighting,complex().lighting);
 const state=defaultProjectState();state.roomSize={widthMm:1000,lengthMm:1000};state.architecture.window.enabled=false;const tiny=await generate({ceiling:'gypsum'},'minimal',state);assert.equal(tiny.ceiling.style,'simple');assert(tiny.warnings.some(w=>w.includes('Gypsum')&&w.includes('Fallback: Simple')));
});
test('one/two/three supplied roles remain usable with guidance and no library mutation',async()=>{
 for(const m of [{primary:materials.primary},{primary:materials.primary,secondary:materials.secondary},materials])for(const style of DESIGN_STYLES){const before=JSON.stringify(products);const d=await generate({strength:'dramatic',featureWall:'left'},style,defaultProjectState(),m);assert.equal(d.floor.installation.field.tileAssetId,'ceramic-02');assert(prepareAutoDesign(decisionState(defaultProjectState(),d),products).result.ok);assert.equal(JSON.stringify(products),before);}
});
test('lighting-only preparation reuses floor output and every geometry-bearing reference, including Undo',async()=>{
 const state=complex(),prepared=prepareAutoDesign(state,products),before=prepared.state;
 const d=await generate({lighting:'neutral',locks:{floor:true,walls:true,ceiling:true,furniture:true}},'luxury',before);
 const next=prepareAutoDesign(decisionState(before,d),products,prepared);assert.strictEqual(next.result,prepared.result);assert.strictEqual(next.state.floorDesign,before.floorDesign);assert.strictEqual(next.state.roomSize,before.roomSize);assert.strictEqual(next.state.walls,before.walls);assert.strictEqual(next.state.architecture,before.architecture);assert.notDeepEqual(next.state.lighting,before.lighting);
 const undone=prepareAutoDesign(before,products,next);assert.strictEqual(undone.result,next.result);assert.strictEqual(undone.state.floorDesign,next.state.floorDesign);assert.strictEqual(undone.state.architecture,next.state.architecture);assert.equal(stateFingerprint(undone.state),stateFingerprint(before));
});
test('selective wall preparation retains unrelated wall, architecture and floor references',()=>{
 const previous=prepareAutoDesign(complex(),products),target=structuredClone(previous.state);target.walls.left.tileAssetId='slab';const next=prepareAutoDesign(target,products,previous);assert.strictEqual(next.result,previous.result);assert.strictEqual(next.state.walls.right,previous.state.walls.right);assert.strictEqual(next.state.walls.front,previous.state.walls.front);assert.strictEqual(next.state.walls.back,previous.state.walls.back);assert.notStrictEqual(next.state.walls.left,previous.state.walls.left);assert.strictEqual(next.state.architecture,previous.state.architecture);
});
test('transaction enforces input locks for future planners and restores complete state; Cancel and stale checks survive',async()=>{
 let applied=prepareAutoDesign(complex(),products),publications=0;const before=stateFingerprint(applied.state);
 const session=createAutoDesignSession({capture:()=>applied.state,projectKey:()=> 'p',products:()=>products,prepare:(s,p)=>prepareAutoDesign(s,p,applied),publish:p=>{applied=p;publications++;}}, {generate:input=>planner.generate({...input,intent:{...input.intent,guidance:{strength:'dramatic'}}})});
 const intent={style:'luxury' as const,materials,guidance:{locks:{floor:true,walls:true,ceiling:true,furniture:true},lighting:'neutral' as const}};
 await session.generate(intent);assert.equal(publications,0);session.cancel();assert.equal(stateFingerprint(applied.state),before);assert.throws(()=>session.apply(),/changed/);
 await session.generate(intent);session.apply();assert.equal(publications,1);assert.deepEqual(applied.state.floorDesign,complex().floorDesign);assert.deepEqual(applied.state.walls,complex().walls);session.undo();assert.equal(stateFingerprint(applied.state),before);assert.equal(publications,2);
 await session.generate(intent);applied.state.lighting.lightingBrightness=33;assert.throws(()=>session.apply(),/changed/);assert.equal(publications,2);
});
test('guided applied state round-trips as normal schema 5 with no guidance persisted',async()=>{
 const state=defaultProjectState(),d=await generate({strength:'dramatic',featureWall:'back',furniture:'show'},'luxury',state),next=decisionState(state,d);const doc=normalizeProjectDocument(JSON.parse(JSON.stringify({schemaVersion:5,id:'guided',name:'Guided',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:next})));assert.equal(stateFingerprint(prepareAutoDesign(doc.projectDocument,products).state),stateFingerprint(next));assert(!JSON.stringify(doc).includes('guidance'));
});
test('Floor-only lock survives a full Luxury redesign; Walls-only lock survives independent Bold changes',async()=>{
 const previous=prepareAutoDesign(complex(),products);
 const floor=await generate({strength:'dramatic',locks:{floor:true}},'luxury',previous.state);
 const a=prepareAutoDesign(decisionState(previous.state,floor),products,previous);
 assert.strictEqual(a.result,previous.result);assert.strictEqual(a.state.floorDesign.installation,previous.state.floorDesign.installation);assert.deepEqual(a.state.materialState,previous.state.materialState);assert.notDeepEqual(a.state.walls,previous.state.walls);assert.notDeepEqual(a.state.lighting,previous.state.lighting);assert.equal(a.state.architecture.ceiling.style,'gypsum');
 const walls=await generate({strength:'dramatic',locks:{walls:true}},'bold',previous.state);
 const b=prepareAutoDesign(decisionState(previous.state,walls),products,previous);
 assert.strictEqual(b.state.walls,previous.state.walls);assert.notDeepEqual(b.state.floorDesign,previous.state.floorDesign);assert.notDeepEqual(b.state.lighting,previous.state.lighting);
});
