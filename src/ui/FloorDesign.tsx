import { useEffect, useState } from "react";
import { mToMm, mmToM } from "../utils/units";
import { useFloorDesign } from "../layout/useFloorDesign";
import { layoutAsset } from "../layout/assets";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { LayoutPlan } from "./LayoutPlan";
import type { ZoneId } from "../layout/model";
function AssetPicker({zone,value,onChange}:{zone:ZoneId;value:string;onChange:(id:string)=>void}) {
  const {products}=useFloorDesign();
  const chosen=products.find(p=>p.id===value);
  const size=chosen?layoutAsset(chosen):null;
  return <label>{zone==='field'?'Main field tile':zone==='centerFrame'?'Center Frame tile':'Center tile'}<select aria-label={`${zone==='centerFrame'?'Center Frame':zone==='field'?'Main Field':'Center'} tile`} value={value} onChange={e=>onChange(e.target.value)}>
    {!products.some(p=>p.id===value)&&<option value={value}>Unavailable asset · open My Tiles</option>}
    {products.map(p=>{const a=layoutAsset(p);return <option key={p.id} value={p.id}>{p.name} · {a.widthMm} × {a.heightMm} mm{p.source==='upload'?' · My Tiles':''}</option>;})}
  </select>{size&&<small className="design-asset-size">{size.widthMm} × {size.heightMm} mm tile body</small>}</label>;
}
function Length({label,value,onChange,min=0,step=1}:{label:string;value:number;onChange:(n:number)=>void;min?:number;step?:number}) {
  return <label>{label}<input aria-label={label} type="number" min={min} step={step} value={Number.isFinite(value)?value:''} onChange={e=>onChange(e.target.value===''?NaN:Number(e.target.value))}/></label>;
}
/** Local edits never publish room/installation changes or rerender preview siblings. */
function DraftControls() {
  const s=useFloorDesignStore();
  const selectedFloorId=useConfiguratorStore(v=>v.selectedFloorId);
  const {result,applyDraft}=useFloorDesign();
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
        <p className="design-hint">Rectangular room · each side 4–12 m. Edit the composition, then Apply Design. Tile bodies keep their physical sizes.</p>
      </fieldset>
      <fieldset><legend>Main Field</legend>
        <AssetPicker zone="field" value={i.field.tileAssetId} onChange={id=>update(v=>({...v,field:{...v.field,tileAssetId:id}}))}/>
        <label>Field orientation<select aria-label="Field orientation" value={i.field.orientation} onChange={e=>update(v=>({...v,field:{...v.field,orientation:Number(e.target.value) as 0|90}}))}><option value={0}>0°</option><option value={90}>90°</option></select></label><p className="design-hint">Straight · tile body + one full joint</p>
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
      <div className="design-mode-actions"><button className={`hud-button${s.enabled?' active':''}`} onClick={()=>s.setEnabled(!s.enabled)}>{s.enabled?'Use simple material':'Use floor design'}</button><button className="hud-button" onClick={()=>s.setPresentation(plan?'room':'layout')}>{plan?'Room':'Layout 2D'}</button></div>
      {!s.enabled&&<p className="design-hint">Simple material preview is active. Apply Design enables the prepared composition.</p>}
      <DraftControls/>
    </aside>
    {plan&&<LayoutPlan/>}
  </div>;
}
