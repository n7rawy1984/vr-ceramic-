import { useState } from 'react';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { LIGHT_COLORS, type RoomLighting } from '../lighting/model';
type ColorMode=keyof typeof LIGHT_COLORS|'custom';
export function LightingControls(){
  const lighting=useFloorDesignStore(s=>s.lighting),setLighting=useFloorDesignStore(s=>s.setLighting);
  const [mode,setMode]=useState<ColorMode>(()=>(Object.keys(LIGHT_COLORS) as (keyof typeof LIGHT_COLORS)[]).find(key=>LIGHT_COLORS[key]===lighting.lightingColor)??'custom');
  const update=(change:Partial<RoomLighting>)=>setLighting({...lighting,...change});
  return <fieldset><legend>Lighting</legend>
    <label>Room Lighting<select value={lighting.lightingEnabled?'on':'off'} onChange={e=>update({lightingEnabled:e.target.value==='on'})}><option value="on">On</option><option value="off">Off</option></select></label>
    <label>Light Fixture<select value={lighting.lightFixtureVisible?'show':'hide'} onChange={e=>update({lightFixtureVisible:e.target.value==='show'})}><option value="hide">Hide</option><option value="show">Show</option></select></label>
    <label>Light Color<select value={mode} onChange={e=>{const next=e.target.value as ColorMode;setMode(next);if(next!=='custom')update({lightingColor:LIGHT_COLORS[next]});}}><option value="warm">Warm</option><option value="neutral">Neutral</option><option value="cool">Cool</option><option value="custom">Custom</option></select></label>
    {mode==='custom'&&<label>Custom Light Color<input type="color" value={lighting.lightingColor} onChange={e=>update({lightingColor:e.target.value})}/></label>}
    <label>Brightness · {lighting.lightingBrightness}%<input aria-label="Lighting Brightness" type="range" min="0" max="200" step="1" value={lighting.lightingBrightness} onChange={e=>update({lightingBrightness:Number(e.target.value)})}/></label>
    <p className="design-hint">Lighting previews immediately and Save Project keeps the current lighting. Apply Room is only needed for room and architecture edits. The fixture is visual; hiding it keeps the light on.</p>
  </fieldset>;
}
