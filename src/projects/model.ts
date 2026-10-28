import { normalizePanel } from '../panels/model.ts';
import { validPhysicalSize, type PhysicalSize } from '../tiles/physicalSize.ts';
import { DEFAULT_LIGHTING, normalizeLighting, type RoomLighting } from '../lighting/model.ts';
import { defaultWalls, WALL_IDS, type WallDesigns } from '../surfaces/model.ts';
import { defaultInstallation, LAYOUT_PATTERNS, type FloorInstallation } from '../layout/model.ts';
import { DEFAULT_ROOM_SIZE, type RoomSizeMm } from '../layout/roomDimensions.ts';
import { DEFAULT_ARCHITECTURE, architectureErrors, type RoomArchitecture } from '../layout/roomArchitecture.ts';
import { FLOOR_SURFACE } from '../layout/floorSurface.ts';
import { FLOOR_CERAMICS } from '../catalog/materials.ts';
export type AppliedProjectState={lighting:RoomLighting;walls:WallDesigns;roomSize:RoomSizeMm;architecture:RoomArchitecture;floorDesign:{enabled:boolean;started:boolean;installation:FloorInstallation};materialState:{selectedFloorId:string;previousFloorId:string|null;compareActive:boolean;physicalOverride?:PhysicalSize;previousPhysicalOverride?:PhysicalSize}};
export type ProjectDocument={schemaVersion:6;recoveryWarnings?:string[];id:string;name:string;createdAt:string;updatedAt:string;projectDocument:AppliedProjectState;assetNames:Record<string,string>};
export function defaultProjectState():AppliedProjectState{return {lighting:{...DEFAULT_LIGHTING},walls:defaultWalls(),roomSize:{...DEFAULT_ROOM_SIZE},architecture:structuredClone(DEFAULT_ARCHITECTURE),floorDesign:{enabled:false,started:false,installation:defaultInstallation(FLOOR_SURFACE.id,FLOOR_CERAMICS[0].id,FLOOR_CERAMICS[2].id,FLOOR_CERAMICS[0].id)},materialState:{selectedFloorId:FLOOR_CERAMICS[0].id,previousFloorId:null,compareActive:false}};}
const object=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('This saved project could not be read.');return v as Record<string,unknown>;};
const number=(v:unknown)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('This project contains invalid dimensions.');return v;};
const bool=(v:unknown)=>{if(typeof v!=='boolean')throw Error('This project contains an invalid setting.');return v;};
const id=(v:unknown)=>{if(typeof v!=='string'||!v.length||v.length>128)throw Error('This project contains an invalid tile reference.');return v;};
const orientation=(v:unknown):0|90=>{if(v!==0&&v!==90)throw Error('This project contains an invalid orientation.');return v;};
const physical=(v:unknown):{physicalOverride?:PhysicalSize}=>{
  if(v===undefined)return {};if(!validPhysicalSize(v))throw Error('This project contains an invalid physical size.');return {physicalOverride:{widthMm:v.widthMm,heightMm:v.heightMm}};
};
export function projectName(value:unknown):string {if(typeof value!=='string'||!value.trim()||value.trim().length>120)throw Error('Enter a project name from 1 to 120 characters.');return value.trim();}
/** Explicit safe parsing reconstructs only known semantic fields; no blobs, URLs or render output. */
export function normalizeAppliedState(value:unknown):AppliedProjectState{
  const s=object(value),r=object(s.roomSize),a=object(s.architecture),w=object(a.window),c=object(a.ceiling),f=object(s.floorDesign),i=object(f.installation),field=object(i.field),border=object(i.border),frame=object(i.centerFrame),center=object(i.center),m=object(s.materialState);
  const roomSize={widthMm:number(r.widthMm),lengthMm:number(r.lengthMm)};
  const architecture:RoomArchitecture={heightMm:number(a.heightMm),furnitureVisible:bool(a.furnitureVisible),window:{enabled:bool(w.enabled),widthMm:number(w.widthMm),heightMm:number(w.heightMm),sillMm:number(w.sillMm),offsetMm:number(w.offsetMm)},ceiling:{style:c.style as RoomArchitecture['ceiling']['style'],insetMm:number(c.insetMm),dropMm:number(c.dropMm)}};
  if(!['simple','gypsum'].includes(architecture.ceiling.style)||architectureErrors(roomSize,architecture).length)throw Error('This project contains invalid room or architecture settings.');
  if(!LAYOUT_PATTERNS.includes(field.pattern as FloorInstallation['field']['pattern'])||i.surfaceId!==FLOOR_SURFACE.id||border.orientationRule!=='follow-side'||frame.orientationRule!=='follow-side'||center.position!=='center')throw Error('This project uses an unsupported floor configuration.');
  const installation:FloorInstallation={surfaceId:FLOOR_SURFACE.id,jointWidthMm:number(i.jointWidthMm),field:{tileAssetId:id(field.tileAssetId),...physical(field.physicalOverride),orientation:orientation(field.orientation),pattern:field.pattern as FloorInstallation['field']['pattern']},border:{enabled:bool(border.enabled),tileAssetId:id(border.tileAssetId),...physical(border.physicalOverride),widthMm:number(border.widthMm),orientationRule:'follow-side'},centerFrame:{enabled:bool(frame.enabled),tileAssetId:id(frame.tileAssetId),...physical(frame.physicalOverride),widthMm:number(frame.widthMm),orientationRule:'follow-side'},center:{enabled:bool(center.enabled),tileAssetId:id(center.tileAssetId),...physical(center.physicalOverride),widthMm:number(center.widthMm),heightMm:number(center.heightMm),position:'center',orientation:orientation(center.orientation)}};
  if(center.panel!==undefined)installation.center.panel=normalizePanel(center.panel);
  if(installation.jointWidthMm<0||installation.jointWidthMm>100)throw Error('This project contains an invalid joint width.');
  if(field.secondaryPhysicalOverride!==undefined)installation.field.secondaryPhysicalOverride=physical(field.secondaryPhysicalOverride).physicalOverride;
  if(field.secondaryTileAssetId!==undefined)installation.field.secondaryTileAssetId=id(field.secondaryTileAssetId);
  if(field.modular!==undefined){const modular=object(field.modular);if(modular.preset!=='multi-size')throw Error('This project uses an unsupported modular preset.');const slot=(value:unknown)=>{const s=object(value);return {tileAssetId:id(s.tileAssetId),...physical(s.physicalOverride),orientation:orientation(s.orientation)};};installation.field.modular={preset:'multi-size',b:slot(modular.b),c:slot(modular.c),...(modular.d!==undefined?{d:slot(modular.d)}:{})};}
  if(field.pattern==='checker'&&!installation.field.secondaryTileAssetId||field.pattern==='modular'&&!installation.field.modular)throw Error('This project is missing pattern settings.');
  const walls=defaultWalls();
  if(s.walls!==undefined){const values=object(s.walls);for(const key of WALL_IDS){const w=object(values[key]);const jointWidthMm=number(w.jointWidthMm);if(jointWidthMm<0||jointWidthMm>100)throw Error('This project contains an invalid wall joint width.');walls[key]={enabled:bool(w.enabled),tileAssetId:id(w.tileAssetId),...physical(w.physicalOverride),orientation:orientation(w.orientation),jointWidthMm};}}
  return {lighting:normalizeLighting(s.lighting),walls,roomSize,architecture,floorDesign:{enabled:bool(f.enabled),started:bool(f.started)||bool(f.enabled),installation},materialState:{...physical(m.physicalOverride),...(m.previousPhysicalOverride!==undefined?{previousPhysicalOverride:physical(m.previousPhysicalOverride).physicalOverride}:{}),selectedFloorId:id(m.selectedFloorId),previousFloorId:m.previousFloorId===null?null:id(m.previousFloorId),compareActive:bool(m.compareActive)}};
}
export function assetReferences(s:AppliedProjectState):string[]{const i=s.floorDesign.installation,m=i.field.modular;return [...new Set([...WALL_IDS.map(id=>s.walls[id].tileAssetId),s.materialState.selectedFloorId,s.materialState.previousFloorId,i.field.tileAssetId,i.field.secondaryTileAssetId,m?.b.tileAssetId,m?.c.tileAssetId,m?.d?.tileAssetId,i.border.tileAssetId,i.centerFrame.tileAssetId,i.center.tileAssetId].filter((v):v is string=>!!v))];}
/** Future migrations belong in this version switch; unknown future versions never masquerade as v1. */
export function normalizeProjectDocument(value:unknown):ProjectDocument{
  const v=object(value);
  switch(v.schemaVersion){case 1:case 2:case 3:case 4:case 5:case 6:break;default:throw Error('This project version is not supported by this app.');}
  if(v.schemaVersion!==1&&object(v.projectDocument).walls===undefined)throw Error('This project is missing wall settings.');
  const recoveryWarnings:string[]=[];
  const raw=structuredClone(object(v.projectDocument));
  const panel=(raw.floorDesign as AppliedProjectState['floorDesign'])?.installation?.center?.panel;
  if(panel)try{normalizePanel(panel);}catch{delete (raw.floorDesign as AppliedProjectState['floorDesign']).installation.center.panel;recoveryWarnings.push('The saved decorative panel is damaged. Normal Center tiles were restored; other room settings were kept.');}
  const name=projectName(v.name),projectDocument=normalizeAppliedState(v.schemaVersion===1?{...raw,walls:defaultWalls()}:raw),assetNames:Record<string,string>={};
  const names=v.assetNames===undefined?{}:object(v.assetNames);
  for(const key of assetReferences(projectDocument))if(typeof names[key]==='string')assetNames[key]=names[key].slice(0,120);
  const date=(v:unknown)=>{if(typeof v!=='string'||!Number.isFinite(Date.parse(v)))throw Error('This project contains invalid dates.');return new Date(v).toISOString();};
  return {...(recoveryWarnings.length?{recoveryWarnings}:{}),schemaVersion:6,id:id(v.id),name,createdAt:date(v.createdAt),updatedAt:date(v.updatedAt),projectDocument,assetNames};
}
export const stateFingerprint=(s:AppliedProjectState)=>JSON.stringify(normalizeAppliedState(s));
