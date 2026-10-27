import { create } from 'zustand';
import { validImage, validDimensionMm, validCrop, FINISHES, MATERIAL_TYPES, type TileAssetView, type TileFinish, type CropData } from '../../shared/tileAsset.ts';
import { tileToProduct } from './materialAdapter.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import type { StoredTile, TileStorage } from './localTileStorage.ts';
export type LocalTileInput = { blob: Blob; name: string; filename: string; widthMm: number; heightMm: number; materialType: string; finish: TileFinish; rotation: number; crop: CropData | null };
function validRecord(value: unknown): value is StoredTile {
  if (!value || typeof value!=='object') return false;
  const r=value as StoredTile;
  return typeof r.id==='string'&&r.id.length>0&&r.id.length<128&&typeof r.name==='string'&&!!r.name.trim()&&r.name.length<=120&&r.blob instanceof Blob&&validImage(r.blob.type,r.blob.size)&&r.mime_type===r.blob.type&&r.file_size===r.blob.size&&validDimensionMm(r.width_mm)&&validDimensionMm(r.height_mm)&&MATERIAL_TYPES.includes(r.material_type as typeof MATERIAL_TYPES[number])&&FINISHES.includes(r.finish)&&[0,90,180,270].includes(r.image_rotation)&&validCrop(r.crop_data)&&typeof r.created_at==='string'&&typeof r.updated_at==='string';
}
/** One repository owns hydration, durable records, derived products and runtime URLs. */
export function createLocalTileRepository(storage: TileStorage, changed: (tiles: TileAssetView[])=>void = ()=>{}) {
  const useLibrary=create<{tiles:TileAssetView[];products:MaterialProduct[];status:'idle'|'loading'|'ready'|'error';error:string}>(()=>({tiles:[],products:[],status:'idle',error:''}));
  let hydration: Promise<void> | null=null;
  let queue: Promise<unknown>=Promise.resolve();
  const publish=(tiles:TileAssetView[])=>{changed(tiles);useLibrary.setState({tiles,products:tiles.map(tileToProduct)});};
  const runtime=({blob,...tile}:StoredTile):TileAssetView=>({...tile,imageUrl:URL.createObjectURL(blob),imageUrlExpiresAt:null});
  const serialize=<T>(operation:()=>Promise<T>):Promise<T>=>{const result=queue.then(operation);queue=result.catch(()=>{});return result;};
  function hydrate(): Promise<void> {
    if(hydration)return hydration;
    useLibrary.setState({status:'loading',error:''});
    hydration=storage.list().then(rows=>{
      let skipped=0;
      const tiles=rows.flatMap(row=>{if(!validRecord(row)){skipped++;return [];}return [runtime(row)];}).sort((a,b)=>b.created_at.localeCompare(a.created_at));
      publish(tiles);useLibrary.setState({status:'ready',error:skipped?'Some saved tiles could not be opened. Other tiles are ready.':''});
    }).catch(()=>{hydration=null;useLibrary.setState({status:'error',error:'Could not open your saved tiles on this device. Retry My Tiles.'});});
    return hydration;
  }
  async function ready() {await hydrate();if(useLibrary.getState().status!=='ready')throw Error('Could not open device storage. Please retry.');}
  function save(input:LocalTileInput) {return serialize(async()=>{
    await ready();
    const {blob,name,filename,widthMm,heightMm,materialType,finish,rotation,crop}=input;
    const timestamp=new Date().toISOString();
    const record:StoredTile={id:crypto.randomUUID(),name:name.trim(),storage_path:'',source_filename:filename,mime_type:blob.type as StoredTile['mime_type'],file_size:blob.size,width_mm:widthMm,height_mm:heightMm,material_type:materialType,finish,image_rotation:rotation,crop_data:crop,created_at:timestamp,updated_at:timestamp,blob};
    if(!validRecord(record))throw Error('Check the image, tile details and dimensions.');
    try{await storage.put(record);}catch{throw Error('Could not save on this device. Free some browser storage and retry.');}
    const tile=runtime(record);publish([tile,...useLibrary.getState().tiles]);return tile;
  });}
  function remove(id:string) {return serialize(async()=>{
    await ready();const tiles=useLibrary.getState().tiles,tile=tiles.find(t=>t.id===id);
    try{await storage.remove(id);}catch{throw Error('Could not delete this tile on this device. Please retry.');}
    publish(tiles.filter(t=>t.id!==id));if(tile?.imageUrl)URL.revokeObjectURL(tile.imageUrl);
  });}
  /** Used when discarding a document/runtime; durable records are deliberately retained. */
  function dispose() {for(const tile of useLibrary.getState().tiles)if(tile.imageUrl)URL.revokeObjectURL(tile.imageUrl);publish([]);hydration=null;useLibrary.setState({status:'idle',error:''});}
  return {useLibrary,hydrate,save,remove,dispose};
}
