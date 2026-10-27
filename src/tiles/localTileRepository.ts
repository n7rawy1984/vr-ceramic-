import { create } from 'zustand';
import type { TileAssetView, TileFinish, CropData } from '../../shared/tileAsset.ts';
import { tileToProduct } from './materialAdapter.ts';
import { FLOOR_CERAMICS } from '../catalog/materials.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import type { TileStorage } from './localTileStorage.ts';
import { IDENTITY_TRANSFORM, validSource, validVariant, type MaterialSource, type PhysicalVariant, type VariantInput, type ImageTransform } from './variantModel.ts';
import { imageDimensions } from './imageDimensions.ts';
export type LocalTileInput={productKind?:'tile'|'slab';blob:Blob;name:string;filename:string;widthMm:number;heightMm:number;materialType:string;finish:TileFinish;rotation:number;crop:CropData|null};
export function builtinSources():MaterialSource[]{return FLOOR_CERAMICS.map(p=>({id:`builtin:${p.id}`,name:p.name,builtinProductId:p.id,sourceFilename:null,mimeType:'procedural',pixelWidth:p.tileWidth>=p.tileHeight?768:Math.round(768*p.tileWidth/p.tileHeight),pixelHeight:p.tileHeight>=p.tileWidth?768:Math.round(768*p.tileHeight/p.tileWidth),crop:null,rotation:0,materialType:'Ceramic',finish:p.finish??'matte',createdAt:'',updatedAt:''}));}
export function builtinVariants():PhysicalVariant[]{return FLOOR_CERAMICS.map(p=>({id:p.id,sourceId:`builtin:${p.id}`,name:p.name,widthMm:p.tileWidth*10,heightMm:p.tileHeight*10,productKind:'tile',defaultOrientation:0,transform:{...IDENTITY_TRANSFORM},createdAt:'',updatedAt:''}));}
/** One source owns one Blob URL, regardless of size count. Physical variants own metadata only. */
export function createLocalTileRepository(storage:TileStorage,changed:(tiles:TileAssetView[])=>void=()=>{}){
  const useLibrary=create<{sources:MaterialSource[];variants:PhysicalVariant[];tiles:TileAssetView[];products:MaterialProduct[];status:'idle'|'loading'|'ready'|'error';error:string}>(()=>({sources:[],variants:[],tiles:[],products:[],status:'idle',error:''}));
  let hydration:Promise<void>|null=null,queue:Promise<unknown>=Promise.resolve();
  const urls=new Map<string,string>();
  const publish=(sources:MaterialSource[],variants:PhysicalVariant[])=>{
    const tiles=variants.filter(v=>!v.deleted).flatMap(v=>{
      const s=sources.find(s=>s.id===v.sourceId);if(!s)return [];
      return [{id:v.id,name:v.name,width_mm:v.widthMm,height_mm:v.heightMm,storage_path:'',source_filename:s.sourceFilename,mime_type:s.mimeType as TileAssetView['mime_type'],file_size:s.blob?.size??0,material_type:s.materialType,finish:s.finish,image_rotation:s.rotation,crop_data:s.crop,created_at:v.createdAt,updated_at:v.updatedAt,imageUrl:urls.get(s.id)??null,imageUrlExpiresAt:null} as TileAssetView];
    });
    const previous=useLibrary.getState().products;
    const products=tiles.map(t=>{
      const v=variants.find(v=>v.id===t.id)!,s=sources.find(s=>s.id===v.sourceId)!,base=s.builtinProductId?FLOOR_CERAMICS.find(p=>p.id===s.builtinProductId):null;
      const product:MaterialProduct={...(base?{...base,id:v.id,name:v.name,tileWidth:v.widthMm/10,tileHeight:v.heightMm/10,physicalSizeMm:{width:v.widthMm,height:v.heightMm}}:tileToProduct(t)),sourceId:s.id,productKind:v.productKind,pixelWidth:s.pixelWidth,pixelHeight:s.pixelHeight,imageTransform:v.transform,sourceAspect:base?{width:base.tileWidth,height:base.tileHeight}:undefined};
      const old=previous.find(p=>p.id===product.id);return old&&JSON.stringify(old)===JSON.stringify(product)?old:product;
    });
    changed(tiles);useLibrary.setState({sources,variants,tiles,products});
  };
  const serialize=<T>(operation:()=>Promise<T>)=>{const result=queue.then(operation);queue=result.catch(()=>{});return result;};
  function hydrate(){
    if(hydration)return hydration;useLibrary.setState({status:'loading',error:''});
    hydration=storage.list().then(async rows=>{
      const sources=rows.sources.filter(validSource),variants=rows.variants.filter(validVariant);let skipped=rows.sources.length-sources.length+rows.variants.length-variants.length+(rows.unmigrated??0);
      for(const source of sources){if(source.blob){
        if(!source.pixelWidth||!source.pixelHeight){const size=await imageDimensions(source.blob);if(size){Object.assign(source,size);await storage.putSource(source);}}
        urls.set(source.id,URL.createObjectURL(source.blob));
      }}
      const allSources=[...builtinSources(),...sources];
      const valid=variants.filter(v=>{if(allSources.some(s=>s.id===v.sourceId))return true;skipped++;return false;});
      publish(allSources,valid);useLibrary.setState({status:'ready',error:skipped?'Some saved materials or sizes could not be opened. Other materials are ready.':''});
    }).catch(()=>{for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();hydration=null;useLibrary.setState({status:'error',error:'Could not open your saved tiles on this device. Retry My Tiles.'});});return hydration;
  }
  async function ready(){await hydrate();if(useLibrary.getState().status!=='ready')throw Error('Could not open device storage. Please retry.');}
  function save(input:LocalTileInput){return serialize(async()=>{
    await ready();const now=new Date().toISOString(),id=crypto.randomUUID();
    const source:MaterialSource={id:`source:${id}`,name:input.name.trim(),blob:input.blob,sourceFilename:input.filename,mimeType:input.blob.type,pixelWidth:null,pixelHeight:null,crop:input.crop,rotation:input.rotation,materialType:input.materialType,finish:input.finish,createdAt:now,updatedAt:now};
    const variant:PhysicalVariant={id,sourceId:source.id,name:input.name.trim(),widthMm:input.widthMm,heightMm:input.heightMm,productKind:input.productKind??'tile',defaultOrientation:0,transform:{...IDENTITY_TRANSFORM},createdAt:now,updatedAt:now};
    if(!validSource(source)||!validVariant(variant))throw Error('Check the image, tile details and dimensions.');
    Object.assign(source,await imageDimensions(input.blob)??{});
    try{await storage.put(source,variant);}catch{throw Error('Could not save on this device. Free some browser storage and retry.');}
    urls.set(source.id,URL.createObjectURL(input.blob));const state=useLibrary.getState();publish([...state.sources,source],[variant,...state.variants]);return useLibrary.getState().tiles.find(t=>t.id===id)!;
  });}
  function createVariant(sourceId:string,input:VariantInput,transform:ImageTransform=IDENTITY_TRANSFORM){return serialize(async()=>{
    await ready();const s=useLibrary.getState();if(!s.sources.some(s=>s.id===sourceId))throw Error('This material is unavailable.');
    const now=new Date().toISOString(),variant:PhysicalVariant={id:crypto.randomUUID(),sourceId,...input,name:input.name.trim(),defaultOrientation:0,transform:{...transform},createdAt:now,updatedAt:now};
    if(!validVariant(variant))throw Error('Enter a name and physical dimensions from 0.001 to 100000 mm (up to 3 decimal places).');
    await storage.putVariant(variant);publish(s.sources,[variant,...s.variants]);return variant;
  });}
  function renameVariant(id:string,name:string){return serialize(async()=>{await ready();const s=useLibrary.getState(),v=s.variants.find(v=>v.id===id&&!v.deleted);if(!v)throw Error('This size is unavailable.');const next={...v,name:name.trim(),updatedAt:new Date().toISOString()};if(!validVariant(next))throw Error('Enter a name from 1 to 120 characters.');await storage.putVariant(next);publish(s.sources,s.variants.map(v=>v.id===id?next:v));});}
  function remove(id:string){return serialize(async()=>{await ready();const s=useLibrary.getState();try{await storage.remove(id);}catch{throw Error('Could not delete this size on this device. Please retry.');}publish(s.sources,s.variants.map(v=>v.id===id?{...v,deleted:true}:v));});}
  function removeSource(id:string){return serialize(async()=>{await ready();const s=useLibrary.getState(),source=s.sources.find(s=>s.id===id);if(source?.builtinProductId)throw Error('Built-in materials are retained by the catalog.');await storage.removeSource(id);publish(s.sources.filter(s=>s.id!==id),s.variants.filter(v=>v.sourceId!==id));const url=urls.get(id);if(url)URL.revokeObjectURL(url);urls.delete(id);});}
  function dispose(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();publish([],[]);hydration=null;useLibrary.setState({status:'idle',error:''});}
  return {useLibrary,hydrate,save,createVariant,renameVariant,remove,removeSource,dispose};
}
