import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {defaultProjectState,normalizeAppliedState,normalizeProjectDocument,stateFingerprint,type AppliedProjectState} from '../src/projects/model.ts';
import {createAutoDesignSession,prepareAutoDesign,decisionState} from '../src/autoDesign/session.ts';
import {LocalRulePlanner} from '../src/autoDesign/planner.ts';
import {adjustmentLocks,changedSystems,manuallyModified,normalizeProvenance} from '../src/autoDesign/provenance.ts';
import {DESIGN_SYSTEMS,type DesignIntent,type DesignLocks} from '../src/autoDesign/model.ts';
const products=FLOOR_CERAMICS,planner=new LocalRulePlanner();
const initial:DesignIntent={style:'luxury',materials:{primary:{tileAssetId:products[0].id},secondary:{tileAssetId:products[1].id},accent:{tileAssetId:products[2].id}},guidance:{featureWall:'back',lighting:'warm'}};
function fixture(){let applied=prepareAutoDesign(defaultProjectState(),products),pubs=0,preps=0,key='one';const session=createAutoDesignSession({capture:()=>applied.state,products:()=>products,projectKey:()=>key,prepare:(s,p)=>{preps++;return prepareAutoDesign(s,p,applied);},publish:p=>{pubs++;applied=p;}},planner);return {session,get state(){return applied.state;},set state(s:AppliedProjectState){applied={...applied,state:s};},get result(){return applied.result;},get pubs(){return pubs;},get preps(){return preps;},set key(s:string){key=s;}};}
function adjust(state:AppliedProjectState,system?:typeof DESIGN_SYSTEMS[number]):DesignIntent{return {...structuredClone(state.autoDesign?.intent??initial),guidance:{...state.autoDesign?.intent.guidance,locks:Object.fromEntries(DESIGN_SYSTEMS.map(s=>[s,s!==system]))}};}
test('known guidance, independent provenance clone, older schemas and damaged optional history',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();assert.deepEqual(f.state.autoDesign?.intent.guidance?.featureWall,'back');assert.deepEqual(manuallyModified(f.state),[]);
 const raw={schemaVersion:6,id:'one',name:'Saved',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:f.state};const opened=normalizeProjectDocument(JSON.parse(JSON.stringify(raw)));assert.deepEqual(opened.projectDocument,f.state);opened.projectDocument.autoDesign!.intent.materials.primary!.tileAssetId='different';assert.equal(f.state.autoDesign!.intent.materials.primary!.tileAssetId,products[0].id);
 for(const version of [1,2,3,4,5,6])assert.equal(normalizeProjectDocument({...raw,schemaVersion:version,projectDocument:defaultProjectState()}).projectDocument.autoDesign,undefined);
 assert.equal(normalizeAppliedState({...f.state,autoDesign:{version:99}}).autoDesign,undefined);assert.equal(normalizeProvenance({...f.state.autoDesign,intent:{...initial,guidance:{floorPattern:'invalid'}}}),undefined);
});
test('feature-wall-only adjust leaves floor center frame ceiling light furniture exact; undo includes provenance',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();const before=structuredClone(f.state),floor=f.result;const i=adjust(f.state,'walls');i.guidance!.featureWall='left';const d=await f.session.generate(i);assert.deepEqual(changedSystems(f.state,decisionState(f.state,d)),['walls']);f.session.apply();assert.strictEqual(f.result,floor);assert.deepEqual(f.state.floorDesign,before.floorDesign);assert.deepEqual(f.state.architecture,before.architecture);assert.deepEqual(f.state.lighting,before.lighting);assert(f.state.walls.left.enabled);assert(!f.state.walls.back.enabled);f.session.undo();assert.deepEqual(f.state,before);
});
test('manual floor effective size, panel snapshot and cool55 lighting survive wall update; manual label survives subsequent update',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();const s=structuredClone(f.state);s.floorDesign.installation.field.physicalOverride={widthMm:750,heightMm:850};s.floorDesign.installation.center={...s.floorDesign.installation.center,enabled:true,widthMm:1200,heightMm:1200,panel:{version:1,id:'panel',revision:2,name:'Snapshot',shape:'circle',widthMm:1200,heightMm:1200,artworkSourceId:'source',tileVariantId:products[0].id,tileSize:{widthMm:600,heightMm:600},tileOrientation:0,jointWidthMm:3,artworkTransform:{fit:'fill',scale:1,offsetXmm:40,offsetYmm:-20,rotationDeg:25}}};s.lighting={lightingEnabled:true,lightFixtureVisible:true,lightingColor:'#dceaff',lightingBrightness:55};f.state=s;assert.deepEqual(manuallyModified(s),['floor','lighting']);assert.equal(adjustmentLocks(s).floor,true);
 const before=stateFingerprint(s),i=adjust(s,'walls');i.guidance!.featureWall='left';await f.session.generate(i);f.session.apply();assert.deepEqual(f.state.floorDesign,s.floorDesign);assert.deepEqual(f.state.lighting,s.lighting);assert.deepEqual(manuallyModified(f.state),['floor','lighting']);f.session.undo();assert.equal(stateFingerprint(f.state),before);
});
test('manual floor survives light update without floor result replacement; unlocked floor intentionally redesigns',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();const s=structuredClone(f.state);s.floorDesign.installation.field.physicalOverride={widthMm:555,heightMm:777};f.state=s;const result=f.result,i=adjust(s,'lighting');i.guidance!.lighting='cool';await f.session.generate(i);f.session.apply();assert.strictEqual(f.result,result);assert.deepEqual(f.state.floorDesign,s.floorDesign);assert.equal(f.state.lighting.lightingColor,'#dceaff');
 const floorIntent=adjust(f.state,'floor');floorIntent.guidance!.floorPattern='running-bond-50';await f.session.generate(floorIntent);f.session.apply();assert.equal(f.state.floorDesign.installation.field.pattern,'running-bond-50');assert.deepEqual(manuallyModified(f.state),[]);
});
test('all-preserved and semantic no-op preview never prepares or publishes; cancel leaves current manual work/history exact',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();const before=stateFingerprint(f.state),pubs=f.pubs,preps=f.preps;const d=await f.session.generate(adjust(f.state));assert.deepEqual(changedSystems(f.state,decisionState(f.state,d)),[]);assert.throws(()=>f.session.apply(),/This proposal matches the current room/);assert.equal(f.pubs,pubs);assert.equal(f.preps,preps);f.session.cancel();assert.equal(stateFingerprint(f.state),before);
});
test('stale manual edit or project switch after preview cannot publish adjustment',async()=>{
 for(const reason of ['manual','project']){const f=fixture();await f.session.generate(initial);f.session.apply();const i=adjust(f.state,'lighting');i.guidance!.lighting='cool';await f.session.generate(i);if(reason==='manual')f.state.lighting.lightingBrightness=55;else f.key='two';assert.throws(()=>f.session.apply(),/changed/);assert.equal(f.pubs,1);}
});
test('manual detection compares every major semantic subsystem, including architecture and fixture visibility',async()=>{
 const f=fixture();await f.session.generate(initial);f.session.apply();const s=structuredClone(f.state);s.floorDesign.installation.jointWidthMm=5;s.walls.front.orientation=90;s.architecture.ceiling.insetMm+=10;s.lighting.lightFixtureVisible=!s.lighting.lightFixtureVisible;s.architecture.furnitureVisible=!s.architecture.furnitureVisible;assert.deepEqual(manuallyModified(s),DESIGN_SYSTEMS);
});
test('unknown current-room adjustment preserves unknown provenance marker rather than claiming historical style',async()=>{
 const f=fixture(),before=structuredClone(f.state),i=adjust(f.state,'lighting');i.startingPoint='current-room';i.guidance!.lighting='cool';await f.session.generate(i);f.session.apply();assert.equal(f.state.autoDesign!.intent.startingPoint,'current-room');assert.deepEqual(f.state.floorDesign,before.floorDesign);assert.deepEqual(f.state.walls,before.walls);assert.deepEqual(f.state.architecture,before.architecture);
});

const remembered={floor:true,walls:false,ceiling:true,lighting:false,furniture:true};
const unlockedFloor={...remembered,floor:false};
async function applyRemembered(f:ReturnType<typeof fixture>,locks:DesignLocks=remembered){
 const i=structuredClone(initial);i.guidance={...i.guidance,locks};await f.session.generate(i);f.session.apply();
}
test('re-entry restores applied locks, including explicit and implicit unlocks; missing history defaults safe',async()=>{
 const f=fixture();assert.deepEqual(adjustmentLocks(f.state),Object.fromEntries(DESIGN_SYSTEMS.map(k=>[k,true])));
 await applyRemembered(f);assert.deepEqual(adjustmentLocks(f.state),remembered);
 const saved=normalizeAppliedState(JSON.parse(JSON.stringify(f.state)));assert.deepEqual(adjustmentLocks(saved),remembered);
 const noGuidance=structuredClone(saved);delete noGuidance.autoDesign!.intent.guidance;assert(Object.values(adjustmentLocks(normalizeAppliedState(noGuidance))).every(Boolean));
 const legacy=structuredClone(saved);legacy.autoDesign!.intent.guidance!.locks={floor:true,ceiling:true,furniture:true};assert.deepEqual(adjustmentLocks(normalizeAppliedState(legacy)),remembered);
 const damaged=JSON.parse(JSON.stringify(saved));damaged.autoDesign.intent.guidance.locks.floor='false';assert.equal(adjustmentLocks(normalizeAppliedState(damaged)).floor,true);
});
test('manual modification independently overrides each saved unlock; panel and physical-size work remains authoritative',async()=>{
 for(const system of DESIGN_SYSTEMS){
  const f=fixture();await applyRemembered(f,Object.fromEntries(DESIGN_SYSTEMS.map(k=>[k,false])));const s=structuredClone(f.state);
  if(system==='floor')s.floorDesign.installation.field.physicalOverride={widthMm:555,heightMm:777};
  if(system==='walls')s.walls.front.orientation=90;
  if(system==='ceiling')s.architecture.ceiling.insetMm+=10;
  if(system==='lighting')s.lighting.lightingBrightness=55;
  if(system==='furniture')s.architecture.furnitureVisible=!s.architecture.furnitureVisible;
  f.state=s;const before=stateFingerprint(s),preps=f.preps;
  assert.deepEqual(manuallyModified(s),[system]);assert.deepEqual(adjustmentLocks(s),Object.fromEntries(DESIGN_SYSTEMS.map(k=>[k,k===system])));assert.equal(stateFingerprint(s),before);assert.equal(f.preps,preps);
 }
});
test('draft and preview do not overwrite applied guidance; only successful apply persists, and Undo restores it',async()=>{
 const f=fixture();await applyRemembered(f);const before=structuredClone(f.state),preps=f.preps;
 const draft=adjust(f.state,'lighting');draft.guidance!.lighting='cool';
 f.session.guidanceChanged();f.session.cancel();assert.deepEqual(adjustmentLocks(f.state),remembered);
 await f.session.generate(draft);assert.deepEqual(adjustmentLocks(f.state),remembered);assert.equal(f.preps,preps);f.session.cancel();assert.deepEqual(f.state,before);
 await f.session.generate(draft);f.session.apply();assert.deepEqual(adjustmentLocks(f.state),draft.guidance!.locks);f.session.undo();assert.deepEqual(f.state,before);assert.deepEqual(adjustmentLocks(f.state),remembered);
});
test('project-specific intent survives save/reload and duplication, and does not leak between projects or planner sources',async()=>{
 const a=fixture(),b=fixture();await applyRemembered(a);await applyRemembered(b,unlockedFloor);
 const roundTrip=(s:AppliedProjectState,id:string)=>normalizeProjectDocument({schemaVersion:6,id,name:id,createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:JSON.parse(JSON.stringify(s))}).projectDocument;
 for(const source of ['local-auto','ai'] as const){
  const saved=structuredClone(a.state);saved.autoDesign!.generatedBy=source;if(source==='ai')saved.autoDesign!.ai={provider:'openai',model:'fixture',plannerVersion:1};
  assert.deepEqual(adjustmentLocks(roundTrip(saved,'a')),remembered);assert.deepEqual(adjustmentLocks(roundTrip(saved,'copy')),remembered);assert.deepEqual(adjustmentLocks(roundTrip(b.state,'b')),unlockedFloor);
 }
});
