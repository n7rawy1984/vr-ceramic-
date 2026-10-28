import { validPhysicalSize, type PhysicalSize } from '../tiles/physicalSize.ts';
export type PointMm = {x:number;y:number};
export type PanelShape = 'rectangle'|'circle'|'ellipse';
export type ArtworkTransform = {fit:'fit'|'fill'|'manual';scale:number;offsetXmm:number;offsetYmm:number;rotationDeg:number};
export type DecorativePanel = {
  version:1;id:string;revision:number;name:string;shape:PanelShape;widthMm:number;heightMm:number;
  artworkSourceId:string;tileVariantId:string;tileSize:PhysicalSize;tileOrientation:0|90;jointWidthMm:number;
  artworkTransform:ArtworkTransform;
};
export type ArtworkSource={id:string;name:string;blob:Blob;pixelWidth:number;pixelHeight:number;mimeType:string};
export const DEFAULT_ARTWORK_TRANSFORM:ArtworkTransform={fit:'fill',scale:1,offsetXmm:0,offsetYmm:0,rotationDeg:0};
export function normalizePanel(value:unknown):DecorativePanel {
  if(!value||typeof value!=='object')throw Error('Panel definition is unavailable.');
  const p=value as DecorativePanel,t=p.artworkTransform;
  const id=(s:unknown)=>typeof s==='string'&&s.length>0&&s.length<=128;
  if(p.version!==1||!id(p.id)||!id(p.artworkSourceId)||!id(p.tileVariantId)||!Number.isInteger(p.revision)||p.revision<1||typeof p.name!=='string'||!p.name.trim()||p.name.length>120)throw Error('Panel identity or revision is invalid.');
  if(!['rectangle','circle','ellipse'].includes(p.shape)||!validPhysicalSize({widthMm:p.widthMm,heightMm:p.heightMm})||!validPhysicalSize(p.tileSize))throw Error('Panel and tile sizes must be positive mm dimensions, up to 100000 mm and 3 decimal places.');
  if(p.shape==='circle'&&p.widthMm!==p.heightMm)throw Error('Circle width and height must equal its diameter.');
  if(![0,90].includes(p.tileOrientation)||!Number.isFinite(p.jointWidthMm)||p.jointWidthMm<0||p.jointWidthMm>100)throw Error('Choose a tile orientation and a joint from 0 to 100 mm.');
  if(!t||!['fit','fill','manual'].includes(t.fit)||![t.scale,t.offsetXmm,t.offsetYmm,t.rotationDeg].every(Number.isFinite)||t.scale<.01||t.scale>100||Math.abs(t.offsetXmm)>100000||Math.abs(t.offsetYmm)>100000||Math.abs(t.rotationDeg)>36000)throw Error('Artwork transform is invalid. Scale must be 1–10000%.');
  return {version:1,id:p.id,revision:p.revision,name:p.name.trim(),shape:p.shape,widthMm:p.widthMm,heightMm:p.heightMm,artworkSourceId:p.artworkSourceId,tileVariantId:p.tileVariantId,tileSize:{widthMm:p.tileSize.widthMm,heightMm:p.tileSize.heightMm},tileOrientation:p.tileOrientation,jointWidthMm:p.jointWidthMm,artworkTransform:{fit:t.fit,scale:t.scale,offsetXmm:t.offsetXmm,offsetYmm:t.offsetYmm,rotationDeg:t.rotationDeg}};
}
