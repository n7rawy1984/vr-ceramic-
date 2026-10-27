/** Fixture-only XR compatibility of shared compiled floor and desktop design state. */
import assert from 'node:assert/strict';import {browser} from './cdp.mjs';
const{send,evaluate,until,click,button,field,listeners,close}=await browser();const errors=[],sdkNotices=[];
// Installed @pmndrs/xr offers on manager setup and emulator injection; IWER
// rejects superseded pending offers. Keep this known dependency rejection
// visible in results, and continue to fail every unrelated exception.
listeners.push(e=>{if(e.method==='Runtime.exceptionThrown'){const text=e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text;if(text.includes('Offer superseded by a new offerSession call.')&&/emulate-[^/]+\.js|iwer/.test(text))sdkNotices.push(text);else errors.push(text);}});
try{
 await send('Page.enable');await send('Runtime.enable');await send('Page.bringToFront');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'xr',{value:undefined,writable:true,configurable:true});"});
 await evaluate(`window.__testNavigationMarker=true`);await send('Page.navigate',{url:process.argv[2]??'http://localhost:5187'});await until(`!window.__testNavigationMarker&&!!document.querySelector('canvas')&&!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);
 await evaluate(`(async()=>{const es=performance.getEntriesByType('resource');const module=async name=>import(es.find(e=>e.name.includes(name)).name);window.r=[...(await module('/@react-three_fiber.js?'))._roots.values()][0].store;window.design=(await module('/src/state/useFloorDesignStore.ts')).useFloorDesignStore;window.x=(await module('/src/xr/store.ts')).xrStore;const dpr=r.getState().setDpr;r.setState({setDpr:()=>dpr(.5)});r.getState().setDpr(.5)})()`);
 await until(`!!x.getState().emulator&&r.getState().controls?.enabled`);
 await button('My Tiles · Add Tile');await evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await until(`!!document.querySelector('dialog[open]')&&!document.body.innerText.includes('Opening your library')`);
 if(await evaluate(`!!document.querySelector('.tile-access-form')`)){await field('Access code','fixture-access-code-please-do-not-use');await button('Unlock library');}
 await until(`document.querySelectorAll('.saved-tile-card').length>=3`);
 const tiles=await evaluate(`fetch('/api/tile-assets').then(r=>r.json()).then(v=>v.tiles)`);assert(tiles.every(t=>t.imageUrl.startsWith('http://127.0.0.1:54329/')),'fixture guard');
 const ids=['M3 field','M3 border','M3 center'].map(prefix=>tiles.find(t=>t.name.startsWith(prefix)||(prefix==='M3 field'&&t.name==='Prestige')).id);
 await click(`[...document.querySelectorAll('.saved-tile-card')].find(e=>e.querySelector('h4').textContent.startsWith('M3 field')||e.querySelector('h4').textContent==='Prestige').querySelector('button')`);await until(`!document.querySelector('dialog[open]')`);await button('Floor Design');
 for(const[label,assetLabel,id]of[['Enable Center Frame','Center Frame tile',ids[1]],['Enable center','Center tile',ids[2]]]){await click(`[...document.querySelectorAll('.floor-design-panel label')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).querySelector('input')`);await field(assetLabel,id);}
 await button('Apply Design');await until(`r.getState().scene.getObjectByName('compiled-floor')?.userData.placementCount===133`);
 const definition=await evaluate(`JSON.stringify(design.getState().installation)`);const camera=await evaluate(`r.getState().camera.uuid`);const states=[];
 for(let cycle=1;cycle<=2;cycle++){
  const scale=cycle===1?1:10/7;
  if(cycle===2){await field('Room width (m)',8);await field('Room length (m)',10);await button('Apply Design');await until(`r.getState().scene.getObjectByName('compiled-floor').userData.placementCount===252`);await button('Layout');await until(`r.getState().frameloop==='demand'&&!!document.querySelector('.plan-canvas-wrap canvas')`);}
  await evaluate(`x.enterVR().then(()=>true)`);await until(`!!x.getState().session&&r.getState().gl.xr.isPresenting&&r.getState().camera.isArrayCamera&&r.getState().frameloop==='always'`);
  assert.equal(await evaluate(`r.getState().scene.getObjectByName('compiled-floor').userData.placementCount`),cycle===1?133:252);
  await until(`(()=>{let found=false;r.getState().scene.traverse(m=>{if(m.visible===false&&m.geometry?.type==='PlaneGeometry'&&m.geometry.parameters.width===${cycle===1?6:8}&&m.geometry.parameters.height===${cycle===1?7:10})found=true});return found})()`, 'Teleport plane matches live room');
  assert.deepEqual(await evaluate(`r.getState().camera.parent.position.toArray()`),[0,0,(cycle===1?7:10)/2-.9]);
  await evaluate(`x.getState().session.end()`);await until(`!x.getState().session&&!r.getState().gl.xr.isPresenting&&!r.getState().camera.isArrayCamera`);
  assert.equal(await evaluate(`r.getState().camera.uuid`),camera);assert.equal(await evaluate(`JSON.stringify(design.getState().installation)`),definition);assert.equal(await evaluate(`design.getState().enabled`),true);
  if(cycle===2){assert.equal(await evaluate(`design.getState().presentation`),'layout');await button('Room');}
  await until(`r.getState().frameloop==='always'&&r.getState().controls?.enabled`);await button('Floor');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${2.45*scale})<1e-5`);await button('Reset');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${2.65*scale})<1e-5`);
  states.push(await evaluate(`({camera:r.getState().camera.uuid,placements:r.getState().scene.getObjectByName('compiled-floor').userData.placementCount,subscribers:r.getState().internal.subscribers.length,canvas:document.querySelectorAll('canvas').length,inputs:x.getState().inputSourceStates.length,overlays:document.querySelectorAll('[data-webxr_runtime]').length})`));
 }
 const before=await evaluate(`r.getState().camera.position.toArray()`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'w',code:'KeyW',windowsVirtualKeyCode:87});try{await until(`r.getState().camera.position.distanceTo({x:${before[0]},y:${before[1]},z:${before[2]}})>.01`);}finally{await send('Input.dispatchKeyEvent',{type:'keyUp',key:'w',code:'KeyW',windowsVirtualKeyCode:87});}
 const fov=await evaluate(`r.getState().camera.fov`);await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:640,y:380,deltaY:100,deltaX:0});await until(`r.getState().camera.fov>${fov}`);
 const q=await evaluate(`JSON.stringify(r.getState().camera.quaternion.toArray())`);for(const params of[{type:'mousePressed',x:640,y:380,button:'left',clickCount:1},{type:'mouseMoved',x:700,y:395,buttons:1},{type:'mouseReleased',x:700,y:395,button:'left',clickCount:1}])await send('Input.dispatchMouseEvent',params);await until(`JSON.stringify(r.getState().camera.quaternion.toArray())!==${JSON.stringify(q)}`);
 await button('Reset');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${2.65*10/7})<1e-5&&r.getState().camera.fov===58`);
 await button('Reset Design');await until(`!design.getState().installation.centerFrame.enabled&&!design.getState().installation.center.enabled&&r.getState().scene.getObjectByName('compiled-floor').userData.placementCount===238`);assert.equal(await evaluate(`design.getState().installation.jointWidthMm`),3);
 for(const key of ['camera','subscribers','canvas','inputs','overlays'])assert.equal(states[0][key],states[1][key]);assert.deepEqual(errors,[]);console.log(JSON.stringify({cycles:states,preservedInstallation:true,preservedPlan:true,postExitInput:true,designReset:true,sdkNotices,errors},null,2));
}finally{close();}
