import { LightingControls } from './LightingControls';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { useFloorDesign } from '../layout/useFloorDesign';
import { mToMm, mmToM } from '../utils/units';
function RoomSettingsDialog() {
  const s=useFloorDesignStore();
  const {applyRoom}=useFloorDesign();
  const dialog=useRef<HTMLDialogElement>(null);
  const snapshot=()=>({width:String(mmToM(s.roomSize.widthMm)),length:String(mmToM(s.roomSize.lengthMm)),height:String(mmToM(s.architecture.heightMm)),furniture:s.architecture.furnitureVisible,window:s.architecture.window.enabled,windowWidth:String(mmToM(s.architecture.window.widthMm)),windowHeight:String(mmToM(s.architecture.window.heightMm)),sill:String(mmToM(s.architecture.window.sillMm)),offset:String(mmToM(s.architecture.window.offsetMm)),ceiling:s.architecture.ceiling.style,inset:String(mmToM(s.architecture.ceiling.insetMm)),drop:String(mmToM(s.architecture.ceiling.dropMm))});
  const [draft,setDraft]=useState(snapshot);
  const [errors,setErrors]=useState<string[]>([]);
  useEffect(()=>{const e=dialog.current;e?.showModal();return()=>e?.close();},[]);
  const close=()=>s.setRoomSettingsOpen(false);
  const update=(change:Partial<typeof draft>)=>{setDraft(v=>({...v,...change}));setErrors([]);};
  const number=(key:'width'|'length'|'height'|'windowWidth'|'windowHeight'|'sill'|'offset'|'inset'|'drop',label:string)=> <label>{label}<input aria-label={label} type="number" step=".01" value={draft[key]} onChange={e=>update({[key]:e.target.value})}/></label>;
  const mm=(value:string)=>value.trim()?mToMm(Number(value)):NaN;
  const dirty=JSON.stringify(draft)!==JSON.stringify(snapshot());
  function apply() {
    const architecture={heightMm:mm(draft.height),furnitureVisible:draft.furniture,window:{enabled:draft.window,widthMm:mm(draft.windowWidth),heightMm:mm(draft.windowHeight),sillMm:mm(draft.sill),offsetMm:mm(draft.offset)},ceiling:{style:draft.ceiling,insetMm:mm(draft.inset),dropMm:mm(draft.drop)}};
    setErrors(applyRoom({widthMm:mm(draft.width),lengthMm:mm(draft.length)},architecture));
  }
  return createPortal(<dialog ref={dialog} className="room-settings-dialog" aria-labelledby="room-settings-title" onCancel={e=>{e.preventDefault();close();}}>
    <div className="floor-design-panel"><header><h2 id="room-settings-title">Room / Space</h2><button className="hud-button" onClick={close}>Close</button></header>
      <div className="design-draft"><div className="design-fields">
        <fieldset><legend>Room</legend>{number('width','Room width (m)')}{number('length','Room length (m)')}{number('height','Room height (m)')}<p className="design-hint">Real dimensions. Tile sizes stay unchanged. Very large layouts may need larger tiles.</p></fieldset>
        <LightingControls/>
        <fieldset><legend>Furniture</legend><label>Furniture<select value={draft.furniture?'show':'hide'} onChange={e=>update({furniture:e.target.value==='show'})}><option value="hide">Hide</option><option value="show">Show</option></select></label></fieldset>
        <fieldset><legend>Window · right wall</legend><label className="design-toggle"><input type="checkbox" checked={draft.window} onChange={e=>update({window:e.target.checked})}/>Window enabled</label>
          {draft.window&&<>{number('windowWidth','Window width (m)')}{number('windowHeight','Window height (m)')}{number('sill','Sill height (m)')}{number('offset','Horizontal offset (m)')}<p className="design-hint">Offset from the wall center. Positive moves toward the back of the room. The opening and frame must fit inside the wall.</p></>}
        </fieldset>
        <fieldset><legend>Ceiling</legend><label>Ceiling style<select value={draft.ceiling} onChange={e=>update({ceiling:e.target.value as typeof draft.ceiling})}><option value="simple">Simple</option><option value="gypsum">Gypsum / Coffer</option></select></label>
          {draft.ceiling==='gypsum'&&<>{number('inset','Gypsum inset (m)')}{number('drop','Gypsum drop (m)')}<p className="design-hint">Inset sets the perimeter band width; drop is measured below the ceiling.</p></>}
        </fieldset>
      </div><footer className="design-action-footer">{errors.length>0&&<div role="alert" className="design-error">{errors.map(e=><p key={e}>{e}</p>)}</div>}<span role="status">{dirty?'Unsaved changes':'Room applied'}</span><div><button className="hud-button hud-button-primary" disabled={!dirty} onClick={apply}>Apply Room</button></div></footer></div>
    </div>
  </dialog>,document.body);
}
export function RoomSettings() {return useFloorDesignStore(s=>s.roomSettingsOpen)?<RoomSettingsDialog/>:null;}
