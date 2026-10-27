import {test} from 'node:test';
import assert from 'node:assert/strict';
import {effectiveSize,effectiveProduct,validPhysicalSize} from '../src/tiles/physicalSize.ts';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {layoutAsset} from '../src/layout/assets.ts';
import {compileLayout,intersectRects} from '../src/layout/compiler.ts';
import {wallSurface,compileWall,createWallCompilerCache} from '../src/surfaces/compiler.ts';
import {floorBatchBuffers} from '../src/layout/renderGeometry.ts';
import {wallBatchBuffers} from '../src/surfaces/renderGeometry.ts';
import {defaultProjectState,normalizeProjectDocument,normalizeAppliedState,stateFingerprint} from '../src/projects/model.ts';
import {prepareProjectState} from '../src/projects/resolve.ts';
import {imageQuality} from '../src/tiles/variantModel.ts';
import {createLocalTileRepository} from '../src/tiles/localTileRepository.ts';
import type {TileStorage} from '../src/tiles/localTileStorage.ts';
const assets=FLOOR_CERAMICS.map(layoutAsset),surface={id:'floor',widthMm:6000,heightMm:7000};
const size=(widthMm:number,heightMm=widthMm)=>({widthMm,heightMm});
const state=()=>{const s=defaultProjectState();s.floorDesign.enabled=true;s.floorDesign.started=true;return s;};
const compile=(s:ReturnType<typeof state>)=>compileLayout({...surface,id:s.floorDesign.installation.surfaceId},s.floorDesign.installation,assets);
test('shared resolution preserves library identity, kind, mirrors and pixels; sizes validate broad technical guards',()=>{
 const p={...FLOOR_CERAMICS[1],productKind:'slab' as const,imageTransform:{mirrorX:true,mirrorY:false,rotation:90 as const}},original=structuredClone(p),effective=effectiveProduct(p,size(1000,2200));
 assert.deepEqual(layoutAsset(effective),{...layoutAsset(p),...size(1000,2200)});assert.equal(effective.sourceId,p.sourceId);assert.strictEqual(effective.imageTransform,p.imageTransform);assert.equal(effective.productKind,'slab');assert.deepEqual(p,original);assert.strictEqual(effectiveProduct(p),p);assert.deepEqual(effectiveSize(size(600),size(900)),size(900));
 for(const n of [0,NaN,Infinity,.0001,100001,1.2345])assert(!validPhysicalSize(size(n)));assert(validPhysicalSize(size(.001,100000)));
});
test('Checker validates effective sizes without creating a variant and restores identical placements',()=>{
 const s=state(),i=s.floorDesign.installation;i.field={tileAssetId:'ceramic-02',secondaryTileAssetId:'ceramic-03',orientation:90,pattern:'checker'};assert(!compile(s).ok);i.field.secondaryPhysicalOverride=size(600);const result=compile(s);assert(result.ok);assert(result.layout.placements.some(p=>p.tileAssetId==='ceramic-03'));assert(result.layout.placements.every(p=>p.tileBounds.widthMm===600&&p.tileBounds.heightMm===600));
 const saved=normalizeProjectDocument({schemaVersion:5,id:'checker',name:'Checker',createdAt:'2026-10-27',updatedAt:'2026-10-27',projectDocument:s});assert.deepEqual(compile(saved.projectDocument),result);assert.equal(FLOOR_CERAMICS[2].tileWidth,80);
});
test('one library variant has independent field/frame/center sizes and batched UVs map each entire body',()=>{
 const s=state(),i=s.floorDesign.installation;for(const z of [i.field,i.centerFrame,i.center])z.tileAssetId='ceramic-02';i.field.physicalOverride=size(900);i.centerFrame.enabled=true;i.centerFrame.physicalOverride=size(400,200);i.center.enabled=true;i.center.physicalOverride=size(1200);const r=compile(s);assert(r.ok);
 for(const [zone,w,h]of [['field',900,900],['center',1200,1200]] as const){const piece:import('../src/layout/model.ts').CompiledTilePlacement=r.layout.placements.find(piece=>piece.zoneId===zone)!;assert.equal(piece.tileBounds.widthMm,w);assert.equal(piece.tileBounds.heightMm,h);}
 const frame=r.layout.placements.filter(p=>p.zoneId==='centerFrame');assert(frame.length);assert(frame.every(p=>[200,400].includes(p.tileBounds.widthMm)&&[200,400].includes(p.tileBounds.heightMm)));const b=floorBatchBuffers(r.layout.surface,r.layout.placements);assert(b.uv.every(n=>n>=-1e-6&&n<=1+1e-6));assert.equal(FLOOR_CERAMICS[1].tileWidth,60);
});
test('Modular overrides, including the same ID in A/B/C/D, match equivalent permanent sizes at 0/90 degrees',()=>{
 for(const orientation of [0,90] as const){const s=state(),i=s.floorDesign.installation;i.jointWidthMm=2;i.field={tileAssetId:'ceramic-02',orientation:0,physicalOverride:size(600),pattern:'modular',modular:{preset:'multi-size',b:{tileAssetId:'ceramic-02',orientation,physicalOverride:orientation===90?size(600,299):size(299,600)},c:{tileAssetId:'ceramic-02',orientation:90,physicalOverride:size(299)},d:{tileAssetId:'ceramic-02',orientation:0,physicalOverride:size(299)}}};const r=compile(s);assert(r.ok);
 const permanent=structuredClone(i),m=permanent.field.modular!;permanent.field.physicalOverride=undefined;m.b.tileAssetId='B';m.c.tileAssetId='C';m.d!.tileAssetId='C';m.b.physicalOverride=m.c.physicalOverride=m.d!.physicalOverride=undefined;
 const equivalent=compileLayout({...surface,id:i.surfaceId},permanent,[...assets,{id:'B',...(orientation===90?size(600,299):size(299,600))},{id:'C',...size(299)}]);assert(equivalent.ok);const strip=(r:typeof equivalent)=>r.ok?{...r,layout:{...r.layout,placements:r.layout.placements.map(p=>({...p,tileAssetId:'same'}))}}:r;assert.deepEqual(strip(r),strip(equivalent));
 }
});
for(const orientation of [0,90] as const)test(`wall override uses actual 1200×2600 Slab with opening cuts and effective source rects at ${orientation}°`,()=>{
 const s=state(),asset={id:'slab',...size(1200,2400),productKind:'slab' as const};for(const id of ['front','back','left','right'] as const){const surface=wallSurface(id,s.roomSize,s.architecture),design={enabled:true,tileAssetId:'slab',orientation,jointWidthMm:3,physicalOverride:size(1200,2600)},r=compileWall(surface,design,[asset]),equivalent=compileWall(surface,{...design,physicalOverride:undefined},[{...asset,...size(1200,2600)}]);assert(r.ok&&equivalent.ok);assert.deepEqual(r,equivalent);assert.deepEqual(wallBatchBuffers(surface,s.roomSize,r.layout.placements),wallBatchBuffers(surface,s.roomSize,equivalent.layout.placements));for(const p of r.layout.placements)for(const opening of surface.openings)assert.equal(intersectRects(p,opening),null);}
});
test('quality uses effective dimensions, stays advisory, and does not touch source pixels',()=>{
 const source={pixelWidth:2400,pixelHeight:2400};assert.deepEqual([600,1200,2400,4000].map(w=>imageQuality(source,effectiveSize(size(600),size(w))).label),['Excellent','Excellent','Good','Low for close-up']);const s=state();s.floorDesign.installation.field.physicalOverride=size(4000);assert(compile(s).ok);assert.deepEqual(source,{pixelWidth:2400,pixelHeight:2400});
});
test('schema 4 defaults omit overrides; schema 5 roundtrips all independent assignments and rejects invalid sizes',()=>{
 const s=state(),old={schemaVersion:4,id:'m7',name:'M7',createdAt:'2026-10-27',updatedAt:'2026-10-27',projectDocument:s},m=normalizeProjectDocument(old);assert.equal(m.schemaVersion,5);assert.deepEqual(m.projectDocument,s);assert(!JSON.stringify(m.projectDocument).includes('physicalOverride'));
 const i=s.floorDesign.installation;i.field.physicalOverride=size(900);i.field.secondaryPhysicalOverride=size(900);i.centerFrame.physicalOverride=size(300,600);i.center.physicalOverride=size(1200);s.walls.right.physicalOverride=size(1200,2600);s.materialState.physicalOverride=size(1800);s.materialState.previousPhysicalOverride=size(300);const normalized=normalizeAppliedState(s);assert.deepEqual(normalized,s);assert.notStrictEqual(normalized.materialState.physicalOverride,s.materialState.physicalOverride);for(const bad of [null,size(0),size(NaN),size(1.2345)])assert.throws(()=>normalizeAppliedState({...s,materialState:{...s.materialState,physicalOverride:bad}}));
});
test('two projects share a variant with independent dimensions; duplicate snapshots preserve overrides and fallback removes invalid ownership',()=>{
 const a=state(),b=state();a.materialState.selectedFloorId=b.materialState.selectedFloorId='ceramic-02';a.materialState.physicalOverride=size(900);a.floorDesign.installation.field.tileAssetId='ceramic-02';a.floorDesign.installation.field.physicalOverride=size(900);const before=stateFingerprint(b),copy=normalizeAppliedState(a);a.materialState.physicalOverride.widthMm=1200;assert.deepEqual(copy.materialState.physicalOverride,size(900));assert.equal(stateFingerprint(b),before);assert.equal(layoutAsset(effectiveProduct(FLOOR_CERAMICS[1],b.materialState.physicalOverride)).widthMm,600);
 a.floorDesign.installation.field.tileAssetId='deleted';a.walls.right={enabled:true,tileAssetId:'deleted',orientation:90,jointWidthMm:3,physicalOverride:size(1200,2600)};const recovered=prepareProjectState(a,FLOOR_CERAMICS,{deleted:'Deleted size'});assert(recovered.warnings.length);assert.equal(recovered.state.floorDesign.installation.field.physicalOverride,undefined);assert.equal(recovered.state.walls.right.physicalOverride,undefined);assert(!recovered.state.walls.right.enabled);
});
test('save as a new size writes variant metadata only and leaves the original source/variant unchanged',async()=>{
 const sources=new Map(),variants=new Map();let sourceWrites=0;const db:TileStorage={list:async()=>({sources:[...sources.values()],variants:[...variants.values()]}),put:async(s,v)=>{sourceWrites++;sources.set(s.id,s);variants.set(v.id,v);},putSource:async s=>{sourceWrites++;sources.set(s.id,s);},putVariant:async v=>{variants.set(v.id,v);},remove:async()=>{},removeSource:async()=>{}};
 const repo=createLocalTileRepository(db);await repo.hydrate();const original=structuredClone(FLOOR_CERAMICS[1]),p=effectiveProduct(FLOOR_CERAMICS[1],size(900)),v=await repo.createVariant(p.sourceId!,{name:'Travertine Beige 900×900',...size(900),productKind:p.productKind??'tile'});assert.equal(sourceWrites,0);assert.equal(sources.size,0);assert.equal(variants.size,1);assert.equal(v.sourceId,p.sourceId);assert.deepEqual(FLOOR_CERAMICS[1],original);const mirror={mirrorX:true,mirrorY:false,rotation:90 as const},pairSize=await repo.createVariant(p.sourceId!,{name:'Mirrored slab size',...size(1000,2200),productKind:'slab'},mirror);assert.deepEqual(pairSize.transform,mirror);assert.notStrictEqual(pairSize.transform,mirror);assert.equal(pairSize.productKind,'slab');assert.equal(sourceWrites,0);repo.dispose();
});
test('wall semantic cache recompiles only the wall with an applied size change; invalid or missing references stay invalid',()=>{
 const s=state(),cache=createWallCompilerCache(),right=wallSurface('right',s.roomSize,s.architecture),left=wallSurface('left',s.roomSize,s.architecture),design={enabled:true,tileAssetId:'ceramic-02',orientation:0 as const,jointWidthMm:3},r=cache(right,design,assets),l=cache(left,design,assets);assert.notStrictEqual(cache(right,{...design,physicalOverride:size(900)},assets),r);assert.strictEqual(cache(left,design,assets),l);assert(!compileWall(right,{...design,physicalOverride:size(0)},assets).ok);assert(!compileWall(right,{...design,tileAssetId:'missing',physicalOverride:size(900)},assets).ok);
});
