import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalTileRepository } from '../src/tiles/localTileRepository.ts';
import type { StoredTile, TileStorage } from '../src/tiles/localTileStorage.ts';
import { useFloorDesignStore } from '../src/state/useFloorDesignStore.ts';
import { useConfiguratorStore } from '../src/state/useConfiguratorStore.ts';
import { selectSimpleMaterial } from '../src/state/selectSimpleMaterial.ts';
const input={blob:new Blob(['prepared pixels'],{type:'image/png'}),name:'Tile A',filename:'tile.png',widthMm:600,heightMm:600,materialType:'Porcelain',finish:'satin' as const,rotation:90,crop:{x:.1,y:0,width:.9,height:1}};
function storage() {
  const rows=new Map<string,unknown>();let reads=0;
  const api:TileStorage={list:async()=>{reads++;return [...rows.values()];},put:async(t:StoredTile)=>{rows.set(t.id,structuredClone(t));},remove:async id=>{rows.delete(id);}};
  return {api,rows,reads:()=>reads};
}
test('local save → discard runtime → hydrate preserves blobs/metadata and recreates URLs, with one startup read',async()=>{
  const disk=storage(),repo=createLocalTileRepository(disk.api);
  await Promise.all([repo.hydrate(),repo.hydrate()]);assert.equal(disk.reads(),1);
  const tile=await repo.save(input);const product=repo.useLibrary.getState().products[0];
  assert.deepEqual(product.physicalSizeMm,{width:600,height:600});assert.equal(product.textureRotationDeg,0);
  assert(!('imageUrl' in (disk.rows.get(tile.id) as StoredTile)), 'object URL is never persisted');
  const url=tile.imageUrl!;repo.dispose();await assert.rejects(fetch(url));
  const reloaded=createLocalTileRepository(disk.api);await reloaded.hydrate();
  const restored=reloaded.useLibrary.getState().tiles[0];assert.equal(restored.id,tile.id);assert.notEqual(restored.imageUrl,url);assert.match(restored.imageUrl!,/^blob:/);assert.equal(await (await fetch(restored.imageUrl!)).text(),'prepared pixels');
  assert.equal(restored.width_mm,600);assert.equal(restored.finish,'satin');assert.equal(restored.image_rotation,90);assert.deepEqual(restored.crop_data,input.crop);
  await reloaded.remove(tile.id);assert.equal(disk.rows.size,0);assert.equal(reloaded.useLibrary.getState().tiles.length,0);await assert.rejects(fetch(restored.imageUrl!));reloaded.dispose();
});
test('invalid records are skipped; invalid saves and quota failure cannot publish a fake saved tile',async()=>{
  const disk=storage();disk.rows.set('broken',{id:'broken',blob:'missing'});const repo=createLocalTileRepository(disk.api);await repo.hydrate();assert.equal(repo.useLibrary.getState().status,'ready');assert.match(repo.useLibrary.getState().error,/could not be opened/);
  for(const changes of [{widthMm:0},{heightMm:NaN},{name:' '},{rotation:45},{blob:new Blob(['bad'],{type:'text/html'})}])await assert.rejects(repo.save({...input,...changes}));
  assert.equal(repo.useLibrary.getState().tiles.length,0);
  const failed=createLocalTileRepository({...disk.api,put:async()=>{throw Error('quota');}});await assert.rejects(failed.save(input),/Could not save/);assert.equal(failed.useLibrary.getState().tiles.length,0);
  repo.dispose();failed.dispose();
});
test('serialized saves wait for hydration; delete failure preserves the usable tile; opening storage can be retried',async()=>{
  const disk=storage();let fail=true;const repo=createLocalTileRepository({...disk.api,list:async()=>{if(fail)throw Error('unavailable');return disk.api.list();},remove:async()=>{throw Error('delete failed');}});
  await repo.hydrate();assert.equal(repo.useLibrary.getState().status,'error');fail=false;
  const [a,b]=await Promise.all([repo.save(input),repo.save({...input,name:'Tile B'})]);assert.equal(repo.useLibrary.getState().tiles.length,2);assert.notEqual(a.id,b.id);
  await assert.rejects(repo.remove(a.id),/Could not delete/);assert(repo.useLibrary.getState().tiles.some(t=>t.id===a.id));repo.dispose();
});
test('deletion reconciles Simple, Compare and all installation references; selection exits Layout immediately',()=>{
  const d=useFloorDesignStore,c=useConfiguratorStore;
  const installation=structuredClone(d.getState().installation);
  for(const zone of ['field','centerFrame','center','border'] as const)installation[zone].tileAssetId='removed';
  d.setState({installation,enabled:true,presentation:'layout',panelOpen:true});c.setState({selectedFloorId:'removed',previousFloorId:'removed',compareActive:true});
  const ids=new Set(['ceramic-01','ceramic-02','ceramic-03']);d.getState().reconcileAssets(ids);c.getState().reconcileAssetIds(ids);
  assert.equal(c.getState().selectedFloorId,'ceramic-01');assert.equal(c.getState().previousFloorId,null);assert.equal(c.getState().compareActive,false);
  for(const zone of ['field','centerFrame','center','border'] as const)assert(ids.has(d.getState().installation[zone].tileAssetId));
  selectSimpleMaterial('ceramic-02');assert.equal(d.getState().enabled,false);assert.equal(d.getState().presentation,'room');assert.equal(d.getState().panelOpen,false);assert.equal(c.getState().selectedFloorId,'ceramic-02');
  c.setState({compareActive:true});selectSimpleMaterial('ceramic-02');assert.equal(c.getState().compareActive,false);
});
