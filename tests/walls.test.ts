import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileWall,createWallCompilerCache,wallSurface} from '../src/surfaces/compiler.ts';
import {defaultWalls,WALL_IDS} from '../src/surfaces/model.ts';
import {wallBatchBuffers,wallWorldPoint} from '../src/surfaces/renderGeometry.ts';
import {intersectRects,rectArea,imagePoint} from '../src/layout/compiler.ts';
import {defaultProjectState,normalizeProjectDocument,normalizeAppliedState,assetReferences,stateFingerprint} from '../src/projects/model.ts';
import {prepareProjectState} from '../src/projects/resolve.ts';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {layoutAsset} from '../src/layout/assets.ts';
import {captureAppliedProject,publishAppliedProject} from '../src/projects/runtime.ts';
import {useFloorDesignStore} from '../src/state/useFloorDesignStore.ts';
import {useConfiguratorStore} from '../src/state/useConfiguratorStore.ts';
const assets=FLOOR_CERAMICS.map(layoutAsset);
for(const id of WALL_IDS)for(const orientation of [0,90] as const)test(`${id} ${orientation}: area conservation, openings, physical bodies, crop UV and inward winding`,()=>{
  const s=defaultProjectState(),surface=wallSurface(id,s.roomSize,s.architecture),d={...s.walls[id],enabled:true,orientation,tileAssetId:'ceramic-03',jointWidthMm:2};
  const r=compileWall(surface,d,assets);assert(r.ok);const l=r.layout;
  assert(Math.abs(l.tileAreaMm2+l.jointAreaMm2-surface.widthMm*surface.heightMm+surface.openings.reduce((n,o)=>n+rectArea(o),0))<.01);
  const asset=assets.find(a=>a.id===d.tileAssetId)!;
  for(const p of l.placements){assert.equal(p.tileBounds.widthMm,orientation===0?asset.widthMm:asset.heightMm);assert.equal(p.tileBounds.heightMm,orientation===0?asset.heightMm:asset.widthMm);assert(p.xMm>=0&&p.yMm>=0);assert(p.xMm+p.widthMm<=surface.widthMm+1e-6);assert(p.yMm+p.heightMm<=surface.heightMm+1e-6);for(const o of surface.openings)assert.equal(intersectRects(p,o),null);const [u,v]=imagePoint(p,p.xMm,p.yMm);assert(u>=-1e-6&&u<=1+1e-6&&v>=-1e-6&&v<=1+1e-6);assert(p.sourceRect.xMm>=-1e-6&&p.sourceRect.yMm>=-1e-6);assert(p.sourceRect.xMm+p.sourceRect.widthMm<=asset.widthMm+1e-6);assert(p.sourceRect.yMm+p.sourceRect.heightMm<=asset.heightMm+1e-6);}
  for(const j of l.joints)for(const o of surface.openings)assert.equal(intersectRects(j,o),null);
  const b=wallBatchBuffers(surface,s.roomSize,l.placements);assert.equal(b.positions.length,l.placements.length*12);
  const [a,c,e]=b.indices.slice(0,3).map(i=>b.positions.slice(i*3,i*3+3)),ab=c.map((v,i)=>v-a[i]),ac=e.map((v,i)=>v-a[i]);const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];assert(cross.reduce((n,v,i)=>n+v*b.normals[i],0)>0);
  l.placements.forEach((p,i)=>{assert.deepEqual(b.positions.slice(i*12,i*12+3),wallWorldPoint(surface,s.roomSize,p.xMm,p.yMm));const uv=imagePoint(p,p.xMm,p.yMm);assert.deepEqual(b.uv.slice(i*8,i*8+2),[uv[0],1-uv[1]]);});
});
test('window geometry changes affect only right wall cache; draft/same inputs/unrelated assets reuse geometry',()=>{
  const s=defaultProjectState(),cache=createWallCompilerCache(),d={...defaultWalls().right,enabled:true};
  const before=Object.fromEntries(WALL_IDS.map(id=>[id,cache(wallSurface(id,s.roomSize,s.architecture),d,assets)]));
  for(const key of ['widthMm','heightMm','sillMm','offsetMm'] as const){const a=structuredClone(s.architecture);a.window[key]+=100;for(const id of WALL_IDS){const r=cache(wallSurface(id,s.roomSize,a),d,[...assets,{id:'unrelated',widthMm:1,heightMm:1}]);assert(r.ok);if(id==='right')assert.notStrictEqual(r,before[id]);else assert.strictEqual(r,before[id]);}}
  const surface=wallSurface('back',s.roomSize,s.architecture),first=cache(surface,d,assets);const draft={...d,jointWidthMm:7};assert.equal(draft.jointWidthMm,7);assert.strictEqual(cache(surface,d,assets),first);assert.notStrictEqual(cache(surface,draft,assets),first);
});
test('disabled window fills the wall; real front door stays open, tiny rooms omit the door',()=>{const s=defaultProjectState();s.architecture.window.enabled=false;const r=compileWall(wallSurface('right',s.roomSize,s.architecture),s.walls.right,assets);assert(r.ok);assert.equal(r.layout.tileAreaMm2+r.layout.jointAreaMm2,7000*3000);assert.equal(wallSurface('front',{widthMm:100,lengthMm:100},s.architecture).openings.length,0);});
test('invalid joints, orientations, unavailable assets, malformed openings and excessive grids reject safely',()=>{const s=defaultProjectState(),surface=wallSurface('right',s.roomSize,s.architecture),d=s.walls.right;for(const jointWidthMm of [-1,NaN,101])assert.equal(compileWall(surface,{...d,jointWidthMm},assets).ok,false);assert.equal(compileWall(surface,{...d,orientation:45 as 0},assets).ok,false);assert.equal(compileWall(surface,{...d,tileAssetId:'missing'},assets).ok,false);assert.equal(compileWall({...surface,openings:[{xMm:-1,yMm:0,widthMm:10,heightMm:10}]},d,assets).ok,false);assert.equal(compileWall(surface,d,[{id:d.tileAssetId,widthMm:1,heightMm:1}]).ok,false);});
test('v1 migration preserves all floor semantics and supplies neutral walls; v2 requires valid complete wall data',()=>{
  const s=defaultProjectState();s.floorDesign.enabled=true;s.floorDesign.started=true;s.floorDesign.installation.field.pattern='running-bond-33';const {walls:_removed,...legacy}=s;
  const record={schemaVersion:1,id:'old',name:'M5',createdAt:'2026-10-27',updatedAt:'2026-10-27',projectDocument:legacy};
  const migrated=normalizeProjectDocument(record);assert.equal(migrated.schemaVersion,2);assert.deepEqual(migrated.projectDocument.walls,defaultWalls());assert.deepEqual(migrated.projectDocument.floorDesign,s.floorDesign);assert.throws(()=>normalizeProjectDocument({...record,schemaVersion:2}));assert.throws(()=>normalizeAppliedState({...s,walls:{}}));assert.throws(()=>normalizeAppliedState({...s,walls:{...s.walls,right:{...s.walls.right,orientation:45}}}));
});
test('independent wall states persist, reference shared assets, restore immediately and missing wall assets affect only that wall',()=>{
  const s=defaultProjectState();s.walls.right={enabled:true,tileAssetId:'upload',orientation:90,jointWidthMm:2};s.walls.back={enabled:true,tileAssetId:'ceramic-03',orientation:0,jointWidthMm:4};
  const upload={...FLOOR_CERAMICS[0],id:'upload',physicalSizeMm:{width:321,height:654}},products=[...FLOOR_CERAMICS,upload];
  const prepared=prepareProjectState(s,products,{});assert.deepEqual(prepared.state,s);assert(assetReferences(s).includes('upload'));
  const missing=prepareProjectState(s,[...FLOOR_CERAMICS],{upload:'Custom slab'});assert(!missing.state.walls.right.enabled);assert.deepEqual(missing.state.walls.back,s.walls.back);assert.deepEqual(missing.state.floorDesign,s.floorDesign);assert.deepEqual(missing.state.architecture,s.architecture);assert(missing.warnings.join(' ').includes('Custom slab'));assert.notEqual(stateFingerprint(s),stateFingerprint(missing.state));
  const oldD=useFloorDesignStore.getState(),oldC=useConfiguratorStore.getState();try{publishAppliedProject(s);assert.deepEqual(captureAppliedProject(),s);assert(!useFloorDesignStore.getState().wallPanelOpen);}finally{useFloorDesignStore.setState(oldD,true);useConfiguratorStore.setState(oldC,true);}
});
