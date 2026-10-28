import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {wallBlocksInterior} from '../src/scene/cutaway.ts';
import {createSideCutaway} from '../src/scene/sideCutaway.ts';
import {DEFAULT_LIGHTING,LIGHT_COLORS,normalizeLighting,lightingContributions} from '../src/lighting/model.ts';
import {defaultProjectState,normalizeProjectDocument} from '../src/projects/model.ts';
import {captureAppliedProject,publishAppliedProject,createProjectRuntime} from '../src/projects/runtime.ts';
import {useFloorDesignStore} from '../src/state/useFloorDesignStore.ts';
import {useConfiguratorStore} from '../src/state/useConfiguratorStore.ts';
import {createProjectRepository} from '../src/projects/repository.ts';
import type {ProjectStorage} from '../src/projects/storage.ts';
import type {ProjectDocument} from '../src/projects/model.ts';
const room={width:6,length:7,height:3},target={x:0,y:1,z:0};
const cameras={front:{x:0,y:1,z:5},back:{x:0,y:1,z:-5},left:{x:-5,y:1,z:0},right:{x:5,y:1,z:0}};
for(const id of ['front','back','left','right'] as const)test(`${id} cutaway: actual obstruction, restoration, bounded hysteresis and looking away`,()=>{
  assert(wallBlocksInterior(id,cameras[id],target,room));
  const near={x:cameras[id].x*.99,y:1,z:cameras[id].z*.99};assert(wallBlocksInterior(id,cameras[id],near,room));
  assert(!wallBlocksInterior(id,target,target,room,true));
  assert(!wallBlocksInterior(id,cameras[id],{...cameras[id],y:2},room));
  const x=id==='left'||id==='right',sign=id==='right'||id==='front'?1:-1,half=x?3:3.5;
  const at=(distance:number)=>({x:x?sign*(half+distance):0,y:1,z:x?0:sign*(half+distance)});
  assert(!wallBlocksInterior(id,at(.03),target,room,false));assert(wallBlocksInterior(id,at(.03),target,room,true));
  for(const delta of [.005,-.005,.01,-.01])assert(wallBlocksInterior(id,at(delta),target,room,true));
  assert(!wallBlocksInterior(id,at(-.07),target,room,true));
  const inside=at(-.03),short={...inside,[x?'x':'z']:(x?inside.x:inside.z)-sign*.1};assert(wallBlocksInterior(id,inside,short,room,true));
});
test('above-wall sightlines and Top keep sensible visibility; corner obstructions and tiny rooms remain bounded',()=>{
  assert(!wallBlocksInterior('right',{x:5,y:20,z:0},{x:0,y:0,z:0},room));
  assert(!wallBlocksInterior('front',{x:0,y:20,z:.001},{x:0,y:0,z:0},room));
  assert(wallBlocksInterior('right',{x:5,y:1,z:5},{x:0,y:1,z:0},{width:6,length:6,height:3}));
  assert(wallBlocksInterior('front',{x:5,y:1,z:5},{x:0,y:1,z:0},{width:6,length:6,height:3}));
  assert(wallBlocksInterior('right',{x:.001,y:.0005,z:0},{x:0,y:.0005,z:0},{width:.001,length:.001,height:.001}));
});
test('cutaway suppresses camera color/depth only; original materials, geometry, shadow flags and texture identity restore exactly',()=>{
  const controller=createSideCutaway(),group=new THREE.Group(),texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture}),geometry=new THREE.BoxGeometry(),mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;group.add(mesh);
  controller.update(group,true);assert(group.userData.cutawayHidden);assert(mesh.visible);assert(mesh.castShadow);assert.strictEqual(mesh.geometry,geometry);assert.notStrictEqual(mesh.material,material);const hidden=mesh.material as THREE.MeshStandardMaterial;
  assert(!hidden.colorWrite&&!hidden.depthWrite);assert(hidden.visible);assert.equal(hidden.opacity,material.opacity);assert.strictEqual(hidden.map,texture);assert(material.colorWrite&&material.depthWrite);
  controller.update(group,true);assert.strictEqual(mesh.material,hidden);
  controller.update(group,false);assert.strictEqual(mesh.material,material);assert(!group.userData.cutawayHidden);
  controller.dispose();geometry.dispose();material.dispose();texture.dispose();
});
test('cutaway handles dynamic mesh/material replacement, array materials and disposal while hidden',()=>{
  const c=createSideCutaway(),g=new THREE.Group(),a=new THREE.MeshStandardMaterial(),b=new THREE.MeshStandardMaterial(),mesh=new THREE.Mesh(new THREE.BoxGeometry(),[a,b]);g.add(mesh);
  c.update(g,true);const copies=mesh.material as THREE.Material[];let disposed=0;copies.forEach(m=>m.addEventListener('dispose',()=>disposed++));
  const replacement=new THREE.MeshStandardMaterial();mesh.material=[replacement];c.update(g,true);assert.equal(disposed,2);assert.notStrictEqual(mesh.material[0],replacement);c.dispose();assert.strictEqual(mesh.material[0],replacement);mesh.geometry.dispose();a.dispose();b.dispose();replacement.dispose();
});
test('100 percent matches the validated four contributions; 25/50/150/200 scale proportionally and Off/0 retain only safety fill',()=>{
  assert.deepEqual(lightingContributions(DEFAULT_LIGHTING),{ambient:.75,hemisphere:.65,key:1.6,point:.85});
  for(const percent of [25,50,100,150,200]){const p=lightingContributions({...DEFAULT_LIGHTING,lightingBrightness:percent});assert(Math.abs(p.key-1.6*percent/100)<1e-12);assert(Math.abs(p.point-.85*percent/100)<1e-12);assert(Math.abs(p.hemisphere-.65*percent/100)<1e-12);assert(Math.abs(p.ambient-.75*percent/100)<1e-12);}
  for(const l of [{...DEFAULT_LIGHTING,lightingEnabled:false},{...DEFAULT_LIGHTING,lightingBrightness:0}])assert.deepEqual(lightingContributions(l),{ambient:.08,hemisphere:0,key:0,point:0});
  assert.deepEqual(lightingContributions({...DEFAULT_LIGHTING,lightFixtureVisible:true}),lightingContributions(DEFAULT_LIGHTING));
});
test('lighting normalization preserves exact RGB and safe field defaults without accepting unsafe numbers or colors',()=>{
  for(const color of [...Object.values(LIGHT_COLORS),'#12ABef'])assert.equal(normalizeLighting({lightingColor:color}).lightingColor,color.toLowerCase());
  assert.deepEqual(normalizeLighting(undefined),DEFAULT_LIGHTING);assert.deepEqual(normalizeLighting({lightingColor:'javascript:evil',lightingEnabled:1,lightFixtureVisible:'yes',lightingBrightness:NaN}),DEFAULT_LIGHTING);
  assert.equal(normalizeLighting({lightingBrightness:201}).lightingBrightness,200);assert.equal(normalizeLighting({lightingBrightness:-10}).lightingBrightness,0);
});
test('M5 v1 and M6 v2 without lighting migrate safely to schema 3 while preserving floor, walls and architecture',()=>{
  const state=defaultProjectState();state.walls.right.enabled=true;const {lighting:_removed,...legacy}=state;
  for(const schemaVersion of [1,2]){const raw={id:'legacy',schemaVersion,name:'Legacy',createdAt:'2026-10-27',updatedAt:'2026-10-27',projectDocument:legacy};const p=normalizeProjectDocument(raw);assert.equal(p.schemaVersion,6);assert.deepEqual(p.projectDocument.lighting,DEFAULT_LIGHTING);assert.deepEqual(p.projectDocument.floorDesign,state.floorDesign);assert.deepEqual(p.projectDocument.architecture,state.architecture);if(schemaVersion===2)assert.deepEqual(p.projectDocument.walls,state.walls);else assert(!p.projectDocument.walls.right.enabled);}
});
test('real lighting application marks projects dirty, saves current lighting, and restores without replacing geometry state on a lighting-only edit',async()=>{
  const oldD=useFloorDesignStore.getState(),oldC=useConfiguratorStore.getState(),records=new Map<string,ProjectDocument>();let last:string|null=null;
  const storage:ProjectStorage={list:async()=>[...records.values()],read:async id=>records.get(id),readLast:async()=>last,remember:async id=>{last=id;},write:async(p,active)=>{records.set(p.id,structuredClone(p));if(active)last=p.id;},remove:async id=>{records.delete(id);}};
  const rt=createProjectRuntime(p=>publishAppliedProject(p.state));rt.prepare=async state=>({state,warnings:[],commit:()=>publishAppliedProject(state)});
  const repo=createProjectRepository(storage,rt);
  try{
    publishAppliedProject(defaultProjectState());await repo.hydrate();const record=await repo.save('Lighting');const before=useFloorDesignStore.getState();
    const lighting={lightingEnabled:true,lightFixtureVisible:false,lightingColor:'#f8d69b',lightingBrightness:150};before.setLighting(lighting);assert(repo.store.getState().dirty);
    const after=useFloorDesignStore.getState();assert.strictEqual(after.roomSize,before.roomSize);assert.strictEqual(after.architecture,before.architecture);assert.strictEqual(after.installation,before.installation);assert.strictEqual(after.walls,before.walls);
    await repo.save();assert(!repo.store.getState().dirty);assert.deepEqual(records.get(record.id)?.projectDocument.lighting,lighting);
    after.setLighting({...DEFAULT_LIGHTING});await repo.open(record.id,true);assert.deepEqual(captureAppliedProject().lighting,lighting);assert(!repo.store.getState().dirty);
  }finally{repo.dispose();useFloorDesignStore.setState(oldD,true);useConfiguratorStore.setState(oldC,true);}
});
