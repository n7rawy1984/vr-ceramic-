import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLocalTileRepository} from '../src/tiles/localTileRepository.ts';
import type {TileStorage} from '../src/tiles/localTileStorage.ts';
import {IDENTITY_TRANSFORM,imageQuality,migrateLegacyTile,sourceDeletionError,type MaterialSource,type PhysicalVariant,type SlabPair} from '../src/tiles/variantModel.ts';
import {imageDimensions} from '../src/tiles/imageDimensions.ts';
import {transformUv} from '../src/tiles/imageTransform.ts';
import {layoutAsset,installationAssetKey} from '../src/layout/assets.ts';
import {compileLayout,intersectRects} from '../src/layout/compiler.ts';
import {compileWall,wallSurface} from '../src/surfaces/compiler.ts';
import {floorBatchBuffers} from '../src/layout/renderGeometry.ts';
import {wallBatchBuffers} from '../src/surfaces/renderGeometry.ts';
import {defaultProjectState,normalizeProjectDocument} from '../src/projects/model.ts';
import {prepareProjectState} from '../src/projects/resolve.ts';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
export function memoryMaterials(){
  const sources=new Map<string,MaterialSource>(),variants=new Map<string,PhysicalVariant>(),projects:unknown[]=[];let sourceWrites=0,variantWrites=0;
  const storage:TileStorage={list:async()=>({sources:[...sources.values()],variants:[...variants.values()]}),put:async(s,v)=>{sourceWrites++;variantWrites++;sources.set(s.id,structuredClone(s));variants.set(v.id,structuredClone(v));},putSource:async s=>{sourceWrites++;sources.set(s.id,structuredClone(s));},putVariant:async v=>{variantWrites++;variants.set(v.id,structuredClone(v));},remove:async id=>{const v=variants.get(id);if(v)variants.set(id,{...v,deleted:true});},removeSource:async id=>{const reason=sourceDeletionError(id,[...variants.values()],projects);if(reason)throw Error(reason);sources.delete(id);for(const [key,v] of variants)if(v.sourceId===id)variants.delete(key);}};
  return {sources,variants,projects,storage,writes:()=>({sourceWrites,variantWrites})};
}
function png(w:number,h:number){const a=new Uint8Array(32),v=new DataView(a.buffer);v.setUint32(0,0x89504e47);v.setUint32(4,0x0d0a1a0a);v.setUint32(16,w);v.setUint32(20,h);return new Blob([a],{type:'image/png'});}
const input={blob:png(2400,1200),name:'Shared stone',filename:'stone.png',widthMm:600,heightMm:600,materialType:'Marble',finish:'honed' as const,rotation:0,crop:null};
test('one original source, three explicit physical records, one URL, unchanged bytes and no source writes for size/rename operations',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage);const a=await repo.save(input),sourceId=repo.useLibrary.getState().variants[0].sourceId;
  const b=await repo.createVariant(sourceId,{name:'800 square',widthMm:800,heightMm:800,productKind:'tile'}),slab=await repo.createVariant(sourceId,{name:'Large slab',widthMm:1200,heightMm:2400,productKind:'slab'});
  assert.equal(db.sources.size,1);assert.equal(db.variants.size,3);assert.deepEqual(db.writes(),{sourceWrites:1,variantWrites:3});assert.equal(repo.useLibrary.getState().tiles.filter(t=>t.imageUrl===a.imageUrl).length,3);assert.deepEqual(await db.sources.get(sourceId)!.blob!.arrayBuffer(),await input.blob.arrayBuffer());
  await repo.renameVariant(b.id,'Renamed size');assert.equal(db.writes().sourceWrites,1);assert.equal(repo.useLibrary.getState().products.find(p=>p.id===slab.id)?.productKind,'slab');assert.equal(db.sources.get(sourceId)?.pixelWidth,2400);repo.dispose();
});
test('deleting a size retains shared image, surviving sizes render; source deletion blocks live variants and saved tombstone references',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage),a=await repo.save(input),sourceId=repo.useLibrary.getState().variants[0].sourceId,b=await repo.createVariant(sourceId,{name:'Slab',widthMm:1200,heightMm:2400,productKind:'slab'});await assert.rejects(repo.removeSource(sourceId),/sizes/);await repo.remove(a.id);assert(repo.useLibrary.getState().products.some(p=>p.id===b.id));assert.equal((await fetch(repo.useLibrary.getState().tiles[0].imageUrl!)).status,200);await repo.remove(b.id);db.projects.push({projectDocument:{floorDesign:{installation:{field:{tileAssetId:a.id}}}}});await assert.rejects(repo.removeSource(sourceId),/Saved projects/);assert.equal(db.sources.size,1);db.projects.length=0;await repo.removeSource(sourceId);assert.equal(db.sources.size,0);repo.dispose();
});
test('builtin variants reference the original procedural source without introducing a Blob',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage);const v=await repo.createVariant('builtin:ceramic-03',{name:'Dark Stone 600',widthMm:600,heightMm:600,productKind:'tile'});assert.equal(db.sources.size,0);assert.equal(db.variants.size,1);const p=repo.useLibrary.getState().products.find(p=>p.id===v.id)!;assert.equal(p.texture,FLOOR_CERAMICS[2].texture);assert.deepEqual(p.sourceAspect,{width:80,height:80});assert.equal(p.pixelWidth,768);assert.deepEqual(layoutAsset(p),{id:v.id,widthMm:600,heightMm:600,productKind:'tile'});repo.dispose();
});
test('Checker rejects original mismatch and accepts only the explicitly created matching size',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage),s=defaultProjectState(),i=s.floorDesign.installation;i.field={tileAssetId:'ceramic-02',secondaryTileAssetId:'ceramic-03',orientation:0,pattern:'checker'};const surface={id:i.surfaceId,widthMm:2000,heightMm:2000};assert(!compileLayout(surface,i,FLOOR_CERAMICS.map(layoutAsset)).ok);const v=await repo.createVariant('builtin:ceramic-03',{name:'Matching 600',widthMm:600,heightMm:600,productKind:'tile'});i.field.secondaryTileAssetId=v.id;const products=[...FLOOR_CERAMICS,...repo.useLibrary.getState().products],r=compileLayout(surface,i,products.map(layoutAsset));assert(r.ok);assert(r.layout.placements.some(p=>p.tileAssetId===v.id));assert.equal(FLOOR_CERAMICS[2].tileWidth,80);assert.equal(db.sources.size,0);repo.dispose();
});
test('quality uses effective prepared pixels and weakest axis, never a physical upscaler; orientation of installation preserves density',()=>{
  const source={pixelWidth:2400,pixelHeight:1200};assert.equal(imageQuality(source,{widthMm:1200,heightMm:600},90).pixelsPerMm,2);assert.equal(imageQuality(source,{widthMm:600,heightMm:600}).label,'Excellent');assert.equal(imageQuality(source,{widthMm:1200,heightMm:1200}).label,'Good');assert.equal(imageQuality(source,{widthMm:3000,heightMm:3000}).label,'Low for close-up');assert(imageQuality(source,{widthMm:3000,heightMm:3000}).warning);assert.equal(imageQuality({pixelWidth:1200,pixelHeight:2400},{widthMm:600,heightMm:1200}).pixelsPerMm,2);assert.equal(imageQuality({pixelWidth:null,pixelHeight:null},{widthMm:1,heightMm:1}).label,'Resolution unavailable');
});
test('encoded PNG/JPEG/WebP dimensions need no image decode; prepared rotations/crops are read from final bytes',async()=>{
  assert.deepEqual(await imageDimensions(png(512,2048)),{pixelWidth:512,pixelHeight:2048});const jpeg=new Uint8Array([255,216,255,192,0,11,8,1,0,2,0,0,0,0,0]);assert.deepEqual(await imageDimensions(new Blob([jpeg])),{pixelWidth:512,pixelHeight:256});const webp=new Uint8Array(30);webp.set([...Buffer.from('RIFF')],0);webp.set([...Buffer.from('WEBPVP8X')],8);webp[24]=255;webp[27]=127;assert.deepEqual(await imageDimensions(new Blob([webp])),{pixelWidth:256,pixelHeight:128});assert.equal(await imageDimensions(new Blob(['bad'])),null);
});
test('legacy migration keeps old project IDs, physical dimensions, source pixels/metadata and creates one default Tile variant',()=>{
  const legacy={id:'old-id',name:'Legacy',blob:input.blob,source_filename:'old.png',mime_type:'image/png',file_size:input.blob.size,width_mm:299,height_mm:600,material_type:'Marble',finish:'honed',image_rotation:90,crop_data:{x:.1,y:.1,width:.8,height:.8},created_at:'2026-10-27',updated_at:'2026-10-27'};const m=migrateLegacyTile(legacy)!;assert(m);assert.equal(m.variant.id,'old-id');assert.equal(m.variant.widthMm,299);assert.equal(m.variant.heightMm,600);assert.strictEqual(m.source.blob,input.blob);assert.deepEqual(m.source.crop,legacy.crop_data);assert.equal(m.source.rotation,90);assert.equal(m.variant.productKind,'tile');assert.equal(migrateLegacyTile({...legacy,width_mm:0}),null);
});
for(const orientation of [0,90] as const)test(`1200×2400 Slab uses real floor/wall placements, joints, edge/window cuts and source UV parity at ${orientation}°`,()=>{
  const state=defaultProjectState(),surface=wallSurface('right',state.roomSize,state.architecture),design={enabled:true,tileAssetId:'slab',orientation,jointWidthMm:3},asset={id:'slab',widthMm:1200,heightMm:2400,productKind:'slab' as const},r=compileWall(surface,design,[asset]);assert(r.ok);for(const p of r.layout.placements){assert.equal(p.tileBounds.widthMm,orientation===90?2400:1200);assert.equal(p.tileBounds.heightMm,orientation===90?1200:2400);for(const opening of surface.openings)assert.equal(intersectRects(p,opening),null);}const b=wallBatchBuffers(surface,state.roomSize,r.layout.placements);assert.equal(b.positions.length,r.layout.placements.length*12);
  const i=state.floorDesign.installation;i.field={tileAssetId:'slab',orientation,pattern:'straight'};const floor=compileLayout({id:i.surfaceId,widthMm:6000,heightMm:7000},i,[asset]);assert(floor.ok);assert.equal(floorBatchBuffers(floor.layout.surface,floor.layout.placements).uv.length,floor.layout.placements.length*8);
  for(const pattern of ['checker','running-bond-50','running-bond-33','modular'] as const){i.field.pattern=pattern;i.field.secondaryTileAssetId='slab';assert.equal(compileLayout({id:i.surfaceId,widthMm:6000,heightMm:7000},i,[asset]).ok,false);}
});
test('low quality is advisory; millimeter and kind guards remain authoritative',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage),a=await repo.save(input),sourceId=repo.useLibrary.getState().variants[0].sourceId;const v=await repo.createVariant(sourceId,{name:'Huge',widthMm:100000,heightMm:100000,productKind:'slab'});assert(v);assert.equal(imageQuality(repo.useLibrary.getState().sources.find(s=>s.id===sourceId)!,v).label,'Low for close-up');for(const widthMm of [0,NaN,100001,.0001])await assert.rejects(repo.createVariant(sourceId,{name:'Bad',widthMm,heightMm:600,productKind:'tile'}));assert(repo.useLibrary.getState().tiles.some(t=>t.id===a.id));repo.dispose();
});
test('unrelated variants do not change geometry keys or selected product identities',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage),a=await repo.save(input),p=repo.useLibrary.getState().products[0],i=defaultProjectState().floorDesign.installation;i.field.tileAssetId=a.id;const before=installationAssetKey(i,[...FLOOR_CERAMICS,p]);await repo.createVariant(p.sourceId!,{name:'Unrelated',widthMm:800,heightMm:800,productKind:'tile'});assert.strictEqual(repo.useLibrary.getState().products.find(v=>v.id===a.id),p);assert.equal(installationAssetKey(i,[...FLOOR_CERAMICS,...repo.useLibrary.getState().products]),before);repo.dispose();
});
test('schema 3 migrates to schema 4 with identical semantic floor/walls/lighting and legacy default-variant references',async()=>{
  const db=memoryMaterials(),repo=createLocalTileRepository(db.storage),tile=await repo.save(input),state=defaultProjectState();state.floorDesign.enabled=true;state.floorDesign.started=true;state.floorDesign.installation.field.tileAssetId=tile.id;state.walls.right={enabled:true,tileAssetId:tile.id,jointWidthMm:2,orientation:90};state.lighting.lightingBrightness=150;const old={schemaVersion:3,id:'old-project',name:'Old',createdAt:'2026-10-27',updatedAt:'2026-10-27',projectDocument:state};const migrated=normalizeProjectDocument(old);assert.equal(migrated.schemaVersion,4);const prepared=prepareProjectState(migrated.projectDocument,[...FLOOR_CERAMICS,...repo.useLibrary.getState().products],{});assert.deepEqual(prepared.state,state);assert.equal(prepared.warnings.length,0);repo.dispose();
});
test('mirror foundation transforms UVs, never physical vertices, and supports both pair relationship modes',()=>{
  assert.deepEqual(transformUv(.2,.3,{...IDENTITY_TRANSFORM,mirrorX:true}),[.8,.3]);assert.deepEqual(transformUv(.2,.3,{...IDENTITY_TRANSFORM,rotation:90}),[.3,.8]);const pairs:SlabPair[]=[{id:'pair-1',aVariantId:'a',bVariantId:'b',relationship:'normal',mode:'two-images'},{id:'pair-2',aVariantId:'a',bVariantId:'a-mirror',relationship:'mirrored',mode:'mirrored-source'}];assert.equal(pairs.length,2);
});

test('Canvas image mapping is the inverse of compiled floor/wall UVs for cuts, rotations and mirrors',async()=>{
  const {drawPlacementImage}=await import('../src/layout/drawPlacementImage.ts');
  const {imagePoint}=await import('../src/layout/compiler.ts');
  const state=defaultProjectState(),surface=wallSurface('right',state.roomSize,state.architecture);
  for(const orientation of [0,90] as const){
    const result=compileWall(surface,{enabled:true,tileAssetId:'slab',orientation,jointWidthMm:3},[{id:'slab',widthMm:1200,heightMm:2400,productKind:'slab'}]);assert(result.ok);
    for(const rotation of [0,90,180,270] as const)for(const mirrorX of [false,true])for(const mirrorY of [false,true]){
      const transform={rotation,mirrorX,mirrorY};
      for(const p of result.layout.placements){
        let matrix:number[]=[];
        const context={save(){},restore(){},drawImage(){},transform(...values:number[]){matrix=values;}} as unknown as CanvasRenderingContext2D;
        drawPlacementImage(context,{} as CanvasImageSource,p,transform);
        const [a,b,c,d,e,f]=matrix;
        for(const [x,y]of [[p.xMm,p.yMm],[p.xMm+p.widthMm,p.yMm+p.heightMm]]){
          const [u,v]=transformUv(...imagePoint(p,x,y),transform);
          assert(Math.abs(a*u+c*v+e-x)<1e-7);assert(Math.abs(b*u+d*v+f-y)<1e-7);
        }
      }
    }
  }
});
