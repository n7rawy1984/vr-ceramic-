import { validCrop, validDimensionMm, validImage, FINISHES, MATERIAL_TYPES, type CropData, type TileAsset, type TileFinish } from '../../shared/tileAsset.ts';
export type ProductKind='tile'|'slab';
export type ImageTransform={mirrorX:boolean;mirrorY:boolean;rotation:0|90|180|270};
export const IDENTITY_TRANSFORM:ImageTransform={mirrorX:false,mirrorY:false,rotation:0};
export type MaterialSource={
  id:string;name:string;blob?:Blob;builtinProductId?:string;sourceFilename:string|null;
  mimeType:string;pixelWidth:number|null;pixelHeight:number|null;
  crop:CropData|null;rotation:number;materialType:string;finish:TileFinish;createdAt:string;updatedAt:string;
};
export type PhysicalVariant={deleted?:boolean;id:string;sourceId:string;name:string;widthMm:number;heightMm:number;productKind:ProductKind;defaultOrientation:0|90;transform:ImageTransform;createdAt:string;updatedAt:string};
/** Linked identities support two photographed faces or one simulated mirrored face; no composition UI. */
export type SlabPair={id:string;aVariantId:string;bVariantId:string;relationship:'normal'|'mirrored';mode:'two-images'|'mirrored-source'};
export type VariantInput={name:string;widthMm:number;heightMm:number;productKind:ProductKind};
export function validVariant(v:unknown):v is PhysicalVariant {
  if(!v||typeof v!=='object')return false;const r=v as PhysicalVariant;
  return (r.deleted===undefined||typeof r.deleted==='boolean')&&typeof r.id==='string'&&!!r.id&&r.id.length<=128&&typeof r.sourceId==='string'&&!!r.sourceId&&r.sourceId.length<=160&&typeof r.name==='string'&&!!r.name.trim()&&r.name.length<=120&&validDimensionMm(r.widthMm)&&validDimensionMm(r.heightMm)&&['tile','slab'].includes(r.productKind)&&[0,90].includes(r.defaultOrientation)&&!!r.transform&&typeof r.transform.mirrorX==='boolean'&&typeof r.transform.mirrorY==='boolean'&&[0,90,180,270].includes(r.transform.rotation)&&typeof r.createdAt==='string'&&typeof r.updatedAt==='string';
}
export function validSource(v:unknown):v is MaterialSource {
  if(!v||typeof v!=='object')return false;const r=v as MaterialSource;
  const pixels=(n:number|null)=>n===null||Number.isInteger(n)&&Number(n)>0&&Number(n)<=16384;
  return typeof r.id==='string'&&!!r.id&&typeof r.name==='string'&&!!r.name.trim()&&r.name.length<=120&&((!!r.builtinProductId&&!r.blob)||(r.blob instanceof Blob&&validImage(r.blob.type,r.blob.size)&&r.mimeType===r.blob.type))&&pixels(r.pixelWidth)&&pixels(r.pixelHeight)&&validCrop(r.crop)&&[0,90,180,270].includes(r.rotation)&&MATERIAL_TYPES.includes(r.materialType as typeof MATERIAL_TYPES[number])&&FINISHES.includes(r.finish)&&typeof r.createdAt==='string'&&typeof r.updatedAt==='string';
}
export function migrateLegacyTile(value:unknown):{source:MaterialSource;variant:PhysicalVariant}|null {
  if(!value||typeof value!=='object')return null;const t=value as TileAsset&{blob:Blob};
  const source:MaterialSource={id:`source:${t.id}`,name:t.name,blob:t.blob,sourceFilename:t.source_filename,mimeType:t.mime_type,pixelWidth:null,pixelHeight:null,crop:t.crop_data,rotation:t.image_rotation,materialType:t.material_type??'Ceramic',finish:t.finish,createdAt:t.created_at,updatedAt:t.updated_at};
  const variant:PhysicalVariant={id:t.id,sourceId:source.id,name:t.name,widthMm:t.width_mm,heightMm:t.height_mm,productKind:'tile',defaultOrientation:0,transform:{...IDENTITY_TRANSFORM},createdAt:t.created_at,updatedAt:t.updated_at};
  return validSource(source)&&validVariant(variant)?{source,variant}:null;
}
/** Effective image detail, not printer DPI. Orientation rotates physical and pixel axes together. */
export function imageQuality(source:Pick<MaterialSource,'pixelWidth'|'pixelHeight'>,variant:Pick<PhysicalVariant,'widthMm'|'heightMm'>&Partial<Pick<PhysicalVariant,'transform'>>,orientation:0|90=0){
  if(!source.pixelWidth||!source.pixelHeight)return {pixelsPerMm:null,label:'Resolution unavailable',warning:''};
  let pw=source.pixelWidth,ph=source.pixelHeight,w=variant.widthMm,h=variant.heightMm;
  if(variant.transform?.rotation===90||variant.transform?.rotation===270)[pw,ph]=[ph,pw];
  if(orientation===90){[pw,ph]=[ph,pw];[w,h]=[h,w];}
  const pixelsPerMm=Math.min(pw/w,ph/h);
  return {pixelsPerMm,label:pixelsPerMm>=2?'Excellent':pixelsPerMm>=.75?'Good':'Low for close-up',warning:pixelsPerMm<.75?'This image may appear soft in close-up views at this physical size.':''};
}

/** Tombstones retain source ownership for saved references to a deliberately deleted size. */
export function sourceDeletionError(sourceId:string,variants:PhysicalVariant[],projects:unknown[]):string|null {
  const owned=variants.filter(v=>v.sourceId===sourceId);
  if(owned.some(v=>!v.deleted))return 'Delete the material’s sizes first. Other sizes still use this image.';
  const ids=new Set(owned.map(v=>v.id));
  const referenced=(value:unknown):boolean=>typeof value==='string'?ids.has(value):Array.isArray(value)?value.some(referenced):!!value&&typeof value==='object'?Object.values(value).some(referenced):false;
  if(projects.some(p=>!p||typeof p!=='object'||!('projectDocument' in p)))return 'Some saved projects could not be checked. Keep this image until those projects can be reviewed.';
  if(projects.some(referenced))return 'Saved projects still reference this material. Keep its image or delete those projects first.';
  return null;
}
