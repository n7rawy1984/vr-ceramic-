import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {defaultProjectState,stateFingerprint} from '../src/projects/model.ts';
import {LocalRulePlanner} from '../src/autoDesign/planner.ts';
import {createAutoDesignSession,decisionState,prepareAutoDesign,MATCHING_ROOM_MESSAGE} from '../src/autoDesign/session.ts';
import {changedSystems} from '../src/autoDesign/provenance.ts';
import {DESIGN_SYSTEMS,type DesignIntent,type MaterialRole} from '../src/autoDesign/model.ts';
const products=FLOOR_CERAMICS,planner=new LocalRulePlanner();
const intent=(style:DesignIntent['style']='minimal'):DesignIntent=>({style,materials:{primary:{tileAssetId:products[0].id},secondary:{tileAssetId:products[1].id},accent:{tileAssetId:products[2].id}},guidance:{center:'off',centerFrame:'off',featureWall:'none'}});
const usage=async(i:DesignIntent,role:MaterialRole)=>(await planner.generate({intent:i,state:defaultProjectState(),products})).materialUsage!.find(u=>u.role===role)!;
function fixture(){let applied=prepareAutoDesign(defaultProjectState(),products),pubs=0,preps=0;const session=createAutoDesignSession({capture:()=>applied.state,projectKey:()=> 'project',products:()=>products,prepare:(s,p)=>{preps++;return prepareAutoDesign(s,p,applied);},publish:p=>{pubs++;applied=p;}},planner);return {session,get state(){return applied.state;},get pubs(){return pubs;},get preps(){return preps;}};}
test('used Accent follows actual Center/wall selection; changing guidance invalidates the transaction before compilation',async()=>{
 const f=fixture(),i=intent('bold');i.guidance!.center='on';i.guidance!.featureWall='back';const a=await f.session.generate(i);assert.deepEqual(a.materialUsage!.find(u=>u.role==='accent')!.destinations,['Center','Back Wall']);const before=stateFingerprint(f.state);f.session.guidanceChanged();assert.throws(()=>f.session.apply(),/Guidance changed.*Preview/);assert.equal(f.pubs,0);assert.equal(f.preps,0);assert.equal(stateFingerprint(f.state),before);
 i.materials.accent={tileAssetId:products[1].id};const b=await f.session.generate(i);assert.equal(b.floor.installation.center.tileAssetId,products[1].id);assert.equal(b.walls.back.tileAssetId,products[1].id);assert.equal(b.materialUsage!.find(u=>u.role==='accent')!.status,'used');f.session.apply();assert.equal(f.pubs,1);f.session.undo();assert.equal(stateFingerprint(f.state),before);
});
test('unused Accent produces a fresh matching-room result with role explanation, rather than treating guidance as unchanged',async()=>{
 const f=fixture(),i=intent();await f.session.generate(i);f.session.apply();const before=stateFingerprint(f.state),preps=f.preps;i.materials.accent={tileAssetId:products[1].id};f.session.guidanceChanged();const d=await f.session.generate(i),u=d.materialUsage!.find(u=>u.role==='accent')!;assert.equal(u.status,'unused');assert.equal(u.destinations.length,0);assert(u.reasons[0].includes('Center'));assert.deepEqual(changedSystems(f.state,decisionState(f.state,d)),[]);assert.throws(()=>f.session.apply(),{message:MATCHING_ROOM_MESSAGE});assert.equal(f.preps,preps);assert.equal(stateFingerprint(f.state),before);
});
test('role identity distinguishes identical physical assignments and ignores disabled zones',async()=>{
 const i=intent();i.materials.accent=structuredClone(i.materials.primary);assert.equal((await usage(i,'primary')).status,'used');assert.equal((await usage(i,'accent')).status,'unused');assert.equal((await usage(i,'secondary')).status,'unused');
});
test('omitted roles and locked floor/walls never claim the current room was assigned by new roles',async()=>{
 const i=intent('bold');i.guidance={...i.guidance,center:'on',featureWall:'back',locks:{floor:true,walls:true}};const d=await planner.generate({intent:i,state:defaultProjectState(),products});assert(d.materialUsage!.every(u=>u.status==='unused'&&u.reasons[0].includes('preserved')));delete i.materials.accent;assert(!(await planner.generate({intent:i,state:defaultProjectState(),products})).materialUsage!.some(u=>u.role==='accent'));
});
test('actual body, frame and pattern constraints are reported distinctly from unused roles',async()=>{
 const center=intent('bold');center.guidance!.center='on';center.materials.accent!.physicalOverride={widthMm:9000,heightMm:9000};assert.equal((await usage(center,'accent')).status,'constrained');
 const frame=intent('luxury');frame.guidance!.center='on';frame.guidance!.centerFrame='on';frame.materials.accent!.physicalOverride={widthMm:9000,heightMm:9000};assert.equal((await usage(frame,'accent')).status,'constrained');
 const checker=intent();checker.guidance!.floorPattern='checker';assert.equal((await usage(checker,'secondary')).status,'constrained');
 const modular=intent();modular.guidance!.floorPattern='modular';assert.equal((await usage(modular,'accent')).status,'constrained');
});
test('Adjust role changes obey preserve locks and fresh previews report actual use deterministically',async()=>{
 const f=fixture(),i=intent('bold');i.guidance!.center='on';await f.session.generate(i);f.session.apply();i.guidance!.locks=Object.fromEntries(DESIGN_SYSTEMS.map(s=>[s,true]));const locked=await f.session.generate(i);assert(locked.materialUsage!.every(u=>u.status==='unused'));f.session.guidanceChanged();assert.throws(()=>f.session.apply(),/Guidance changed/);i.guidance!.locks.floor=false;i.materials.accent={tileAssetId:products[1].id};const a=await f.session.generate(i),b=await f.session.generate(i);assert.deepEqual(a,b);assert.equal(a.materialUsage!.find(u=>u.role==='accent')!.status,'used');assert.deepEqual(changedSystems(f.state,decisionState(f.state,a)),['floor']);
});
test('guidance invalidation rejects a pending planner response and cannot resurrect an old proposal',async()=>{
 let release!:()=>void;const wait=new Promise<void>(r=>release=r);const f=fixture();const session=createAutoDesignSession({capture:()=>f.state,projectKey:()=> 'p',products:()=>products,publish:()=>assert.fail('must not publish')},{generate:async input=>{await wait;return planner.generate(input);}});const response=session.generate(intent());session.guidanceChanged();release();await assert.rejects(response,/changed/);assert.throws(()=>session.apply(),/Guidance changed/);
});
