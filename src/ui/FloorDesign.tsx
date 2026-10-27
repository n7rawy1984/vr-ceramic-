import { useEffect, useState } from "react";
import { mToMm, mmToM } from "../utils/units";
import { useFloorDesign } from "../layout/useFloorDesign";
import { layoutAsset } from "../layout/assets";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { LayoutPlan } from "./LayoutPlan";
import type { ZoneId, LayoutPattern, FloorInstallation, Orientation } from "../layout/model";
import { modularSizes } from "../layout/modules";
function AssetPicker({zone,value,onChange,label}:{zone:ZoneId;value:string;label?:string;onChange:(id:string)=>void}) {
  const {products}=useFloorDesign();
  const chosen=products.find(p=>p.id===value);
  const size=chosen?layoutAsset(chosen):null;
  return <label>{label??(zone==='field'?'Main field tile':zone==='centerFrame'?'Center Frame tile':'Center tile')}<select aria-label={label??`${zone==='centerFrame'?'Center Frame':zone==='field'?'Main Field':'Center'} tile`} value={value} onChange={e=>onChange(e.target.value)}>
    {!products.some(p=>p.id===value)&&<option value={value}>Unavailable asset · open My Tiles</option>}
    {products.map(p=>{const a=layoutAsset(p);return <option key={p.id} value={p.id}>{p.name} · {a.widthMm} × {a.heightMm} mm{p.source==='upload'?' · My Tiles':''}</option>;})}
  </select>{size&&<small className="design-asset-size">{size.widthMm} × {size.heightMm} mm tile body</small>}</label>;
}
function Length({label,value,onChange,min=0,step=1}:{label:string;value:number;onChange:(n:number)=>void;min?:number;step?:number}) {
  return <label>{label}<input aria-label={label} type="number" min={min} step={step} value={Number.isFinite(value)?value:''} onChange={e=>onChange(e.target.value===''?NaN:Number(e.target.value))}/></label>;
}
function ModularControls({field,joint,onChange}:{field:FloorInstallation['field'];joint:number;onChange:(field:FloorInstallation['field'])=>void}) {
  const {products}=useFloorDesign();
  const a=products.find(p=>p.id===field.tileAssetId);
  const {largeMm:l,smallMm:s,pitchMm:p}=modularSizes(a?layoutAsset(a).widthMm:NaN,joint);
  const m=field.modular!;
  return <>
    <label>Preset<select aria-label="Modular preset" value={m.preset} onChange={()=>{}}><option value="multi-size">Multi-Size Modular</option></select></label>
    {(['A','B','C','D'] as const).filter(slot=>slot!=='D'||m.d).map(slot=>{
      const key=slot.toLowerCase() as 'b'|'c'|'d';
      const selection=slot==='A'?{tileAssetId:field.tileAssetId,orientation:field.orientation}:m[key]!;
      const change=(tileAssetId:string,orientation:Orientation)=>onChange(slot==='A'?{...field,tileAssetId,orientation}:{...field,modular:{...m,[key]:{tileAssetId,orientation}}});
      return <div key={slot}>
        <AssetPicker zone="field" label={`Modular Tile ${slot}`} value={selection.tileAssetId} onChange={id=>change(id,selection.orientation)}/>
        <small className="design-asset-size">Expected {slot==='A'?l:s} × {slot==='A'||slot==='B'?l:s} mm after orientation</small>
        <label>Tile {slot} orientation<select aria-label={`Tile ${slot} orientation`} value={selection.orientation} onChange={e=>change(selection.tileAssetId,Number(e.target.value) as Orientation)}><option value={0}>0°</option><option value={90}>90°</option></select></label>
      </div>;
    })}
    <label className="design-toggle"><input type="checkbox" checked={!!m.d} onChange={e=>{const {d: _old,...rest}=m;onChange({...field,modular:e.target.checked?{...rest,d:{...m.c}}:rest});}}/>Use Tile D</label>
    <p className="design-hint">Five bodies per {p} × {p} mm repeat: large A, upright B and three small tiles (D replaces the last small tile). A must be square. Small body = (A − full joint) ÷ 2. Exact nominal dimensions required; no stretching. Orientation must match the expected size.</p>
  </>;
}
/** Local edits never publish room/installation changes or rerender preview siblings. */
function DraftControls() {
  const s=useFloorDesignStore();
  const selectedFloorId=useConfiguratorStore(v=>v.selectedFloorId);
  const {result,applyDraft,products}=useFloorDesign();
  const snapshot=()=>({installation:structuredClone(s.installation),width:String(mmToM(s.roomSize.widthMm)),length:String(mmToM(s.roomSize.lengthMm))});
  const [draft,setDraft]=useState(snapshot);
  const [errors,setErrors]=useState<string[]>([]);
  useEffect(()=>{setDraft({installation:structuredClone(s.installation),width:String(mmToM(s.roomSize.widthMm)),length:String(mmToM(s.roomSize.lengthMm))});setErrors([]);},[s.installation,s.roomSize]);
  const update=(change:(value:typeof s.installation)=>typeof s.installation)=>{setDraft(v=>({...v,installation:change(v.installation)}));setErrors([]);};
  const configuration={roomSize:{widthMm:draft.width.trim()?mToMm(Number(draft.width)):NaN,lengthMm:draft.length.trim()?mToMm(Number(draft.length)):NaN},installation:draft.installation};
  const dirty=JSON.stringify(configuration)!==JSON.stringify({roomSize:s.roomSize,installation:s.installation});
  const i=draft.installation;
  return <div className="design-draft"><div className="design-fields">
      <fieldset><legend>Room</legend>
        <label>Room width (m)<input aria-label="Room width (m)" type="number" step=".01" value={draft.width} onChange={e=>{setDraft(v=>({...v,width:e.target.value}));setErrors([]);}}/></label>
        <label>Room length (m)<input aria-label="Room length (m)" type="number" step=".01" value={draft.length} onChange={e=>{setDraft(v=>({...v,length:e.target.value}));setErrors([]);}}/></label>
        <p className="design-hint">Positive physical dimensions. Height, window, ceiling and furniture are in Room Settings. Tile bodies keep their physical sizes.</p>
      </fieldset>
      <fieldset><legend>Main Field</legend>
        <label>Pattern<select aria-label="Pattern" value={i.field.pattern} onChange={e=>update(v=>{
          const pattern=e.target.value as LayoutPattern;
          const a=products.find(p=>p.id===v.field.tileAssetId);
          const size=a?layoutAsset(a):null;
          const compatible=products.find(p=>p.id!==a?.id&&size&&layoutAsset(p).widthMm===size.widthMm&&layoutAsset(p).heightMm===size.heightMm);
          const secondaryTileAssetId=v.field.secondaryTileAssetId??compatible?.id??products.find(p=>p.id!==a?.id)?.id??v.field.tileAssetId;
          const expected=modularSizes(size?.widthMm??600,v.jointWidthMm);
          const choose=(w:number,h:number)=>{for(const p of products)for(const orientation of [0,90] as const){const s=layoutAsset(p);if(Math.abs((orientation===90?s.heightMm:s.widthMm)-w)<1e-6&&Math.abs((orientation===90?s.widthMm:s.heightMm)-h)<1e-6)return {tileAssetId:p.id,orientation};}return {tileAssetId:v.field.tileAssetId,orientation:0 as const};};
          return {...v,field:{...v.field,pattern,...(pattern==='checker'?{secondaryTileAssetId}:{}),...(pattern==='modular'?{modular:v.field.modular??{preset:'multi-size' as const,b:choose(expected.smallMm,expected.largeMm),c:choose(expected.smallMm,expected.smallMm)}}:{})}};
        })}><option value="straight">Straight / Grid</option><option value="running-bond-50">Running Bond 50%</option><option value="running-bond-33">Running Bond 33%</option><option value="checker">Checker</option><option value="modular">Multi-Size Modular</option></select></label>
        {i.field.pattern==='modular'?<ModularControls field={i.field} joint={i.jointWidthMm} onChange={field=>update(v=>({...v,field}))}/>:<>
        <AssetPicker zone="field" label={i.field.pattern==='checker'?'Field Tile A':undefined} value={i.field.tileAssetId} onChange={id=>update(v=>({...v,field:{...v.field,tileAssetId:id}}))}/>
        {i.field.pattern==='checker'&&<><AssetPicker zone="field" label="Field Tile B" value={i.field.secondaryTileAssetId??''} onChange={id=>update(v=>({...v,field:{...v.field,secondaryTileAssetId:id}}))}/><p className="design-hint">Tile A and B must have equal physical body dimensions after orientation. Both use the field orientation.</p></>}
        <label>Field orientation<select aria-label="Field orientation" value={i.field.orientation} onChange={e=>update(v=>({...v,field:{...v.field,orientation:Number(e.target.value) as 0|90}}))}><option value={0}>0°</option><option value={90}>90°</option></select></label><p className="design-hint">Physical tile body + one full joint; pattern applies only to Main Field</p>
        </>}
      </fieldset>
      <fieldset><legend>Center Frame</legend><label className="design-toggle"><input type="checkbox" checked={i.centerFrame.enabled} onChange={e=>update(v=>({...v,centerFrame:{...v.centerFrame,enabled:e.target.checked}}))}/>Enable Center Frame</label>
        {i.centerFrame.enabled&&<><AssetPicker zone="centerFrame" value={i.centerFrame.tileAssetId} onChange={id=>update(v=>({...v,centerFrame:{...v.centerFrame,tileAssetId:id}}))}/><Length label="Center Frame width (mm)" value={i.centerFrame.widthMm} min={.001} onChange={widthMm=>update(v=>({...v,centerFrame:{...v.centerFrame,widthMm}}))}/><p className="design-hint">A tiled frame around the center area, not the room perimeter. Long edge follows each side; butt corners. Width includes the inner joint.</p></>}
      </fieldset>
      <fieldset><legend>Center</legend><label className="design-toggle"><input type="checkbox" checked={i.center.enabled} onChange={e=>update(v=>({...v,center:{...v.center,enabled:e.target.checked}}))}/>Enable center</label>
        {i.center.enabled&&<><AssetPicker zone="center" value={i.center.tileAssetId} onChange={id=>update(v=>({...v,center:{...v.center,tileAssetId:id}}))}/><Length label="Center width (mm)" value={i.center.widthMm} min={.001} onChange={widthMm=>update(v=>({...v,center:{...v.center,widthMm}}))}/><Length label="Center height (mm)" value={i.center.heightMm} min={.001} onChange={heightMm=>update(v=>({...v,center:{...v.center,heightMm}}))}/><label>Center orientation<select aria-label="Center orientation" value={i.center.orientation} onChange={e=>update(v=>({...v,center:{...v.center,orientation:Number(e.target.value) as 0|90}}))}><option value={0}>0°</option><option value={90}>90°</option></select></label><p className="design-hint">Centered in the room. Area size is separate from tile body size. With Center off, Main Field fills the frame opening.</p></>}
      </fieldset>
      <fieldset><legend>Joint</legend><Length label="Full joint width (mm)" value={i.jointWidthMm} step={.1} onChange={jointWidthMm=>update(v=>({...v,jointWidthMm}))}/></fieldset>
      {!result.ok&&<div className="design-error" role="alert">Applied design: {result.errors.join(" ")}</div>}
      {result.ok&&<div className="design-summary"><strong>Applied design · visible pieces</strong>{(['field','centerFrame','center'] as const).map(zone=><span key={zone}>{zone==='centerFrame'?'Center Frame':zone[0].toUpperCase()+zone.slice(1)}: {result.layout.placements.filter(p=>p.zoneId===zone).length}</span>)}<small>Includes cut pieces; not purchasing quantities.</small></div>}
      <p className="design-hint">Load saved assets through My Tiles in Room. Closing Floor Design discards unapplied edits. Designs reset on refresh.</p>
      </div><footer className="design-action-footer">
      {errors.length>0&&<div className="design-error" role="alert">{errors.map(message=><p key={message}>{message}</p>)}</div>}

        <span role="status">{dirty?'Unsaved changes':'Design applied'}</span>
        <div><button type="button" className="hud-button hud-button-primary" disabled={!dirty} onClick={()=>setErrors(applyDraft(configuration))}>Apply Design</button><button type="button" className="hud-button" onClick={()=>{s.resetDesign(selectedFloorId);setErrors([]);}}>Reset Design</button></div>
      </footer>
    </div>;
}
export function FloorDesign() {
  const s=useFloorDesignStore();
  const selectedFloorId=useConfiguratorStore(v=>v.selectedFloorId);
  const {result}=useFloorDesign();
  if(!s.panelOpen&&s.presentation!=='layout')return s.enabled&&!result.ok?<div className="floor-design-status design-error" role="alert">{result.errors[0]} <button className="hud-button" onClick={()=>s.openDesigner(selectedFloorId)}>Edit Floor Design</button></div>:null;
  const plan=s.presentation==='layout';
  return <div className={`floor-design-workspace${plan?' is-plan':''}`}>
    {plan&&<header className="plan-workspace-header"><div><strong>Layout</strong><span>Floor plan · millimeters</span></div><button className="hud-button" onClick={()=>s.setPresentation('room')}>Room</button></header>}
    <aside className="floor-design-panel" aria-label="Floor Design">
      <header><h2>Floor Design</h2><button className="hud-button" onClick={()=>{s.closePanel();if(plan)s.setPresentation('room');}} aria-label="Close Floor Design">Close</button></header>
      <div className="design-mode-actions"><button className={`hud-button${s.enabled?' active':''}`} onClick={()=>{s.setEnabled(!s.enabled);useConfiguratorStore.setState({compareActive:false});}}>{s.enabled?'Use simple material':'Use floor design'}</button><button className="hud-button" onClick={()=>s.setPresentation(plan?'room':'layout')}>{plan?'Room':'Layout 2D'}</button></div>
      {!s.enabled&&<p className="design-hint">Simple material preview is active. Apply Design enables the prepared composition.</p>}
      <DraftControls/>
    </aside>
    {plan&&<LayoutPlan/>}
  </div>;
}
