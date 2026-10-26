/** Native Node/CDP browser regression. See docs/XR_LIFECYCLE.md. No browser dependency. */
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const url = process.argv[2] ?? 'http://localhost:5173';
const emulated = process.argv.includes('--emulator');
const fixture = process.argv.includes('--fixture');
const tileName = `XR recovery ${Date.now()}`;
const tabs = await (await fetch(`http://127.0.0.1:${process.env.CDP_PORT ?? 9335}/json`)).json();
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let sequence = 0;
const pending = new Map();
const errors = [];
ws.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const task = pending.get(message.id); pending.delete(message.id);
    if (message.error) task.reject(new Error(JSON.stringify(message.error))); else task.resolve(message.result);
  } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++sequence, { resolve, reject }); ws.send(JSON.stringify({ id: sequence, method, params }));
});
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, includeCommandLineAPI: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const until = async (expression, label) => {
  for (let i = 0; i < 180; i++) { if (await evaluate(expression)) return; await sleep(300); }
  throw new Error(`Timeout: ${label}`);
};
// Use real browser mouse events and hit testing, so invisible overlays fail tests.
const click = async selector => {
  const point = await evaluate(`(()=>{const e=${selector};if(!e)throw Error('Missing button');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;if(!e.contains(document.elementFromPoint(x,y)))throw Error('Pointer intercepted: '+e.textContent);return {x,y}})()`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
};
const button = async text => {await click(`[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)})`);if(text==='My Tiles · Add Tile')await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');};
const field = (label, value) => evaluate(`(()=>{const e=[...document.querySelectorAll('label')].find(l=>l.textContent.trim().startsWith(${JSON.stringify(label)})).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
const idle = () => until(`r.getState().controls?.enabled&&!r.getState().camera.isArrayCamera`, 'desktop controls');
const stats = () => evaluate(`(()=>{const s=r.getState();const counts=t=>Object.fromEntries(Object.entries(getEventListeners(t)).map(([k,v])=>[k,v.length]));return {dpr:s.viewport.dpr,camera:s.camera.uuid,arrayCamera:!!s.camera.isArrayCamera,presenting:s.gl.xr.isPresenting,session:!!x.getState().session,inputs:x.getState().inputSourceStates.length,subscribers:s.internal.subscribers.length,canvas:document.querySelectorAll('canvas').length,runtimeOverlays:document.querySelectorAll('[data-webxr_runtime]').length,pointerLock:!!document.pointerLockElement,captured:s.internal.capturedMap.size,window:counts(window),document:counts(document),controls:counts(s.controls.domElement),rafPending:window.rafPending.size,intervals:window.intervalIds.size}})()`);
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 850, deviceScaleFactor: 1, mobile: false });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    ${emulated ? "Object.defineProperty(navigator,'xr',{value:undefined,writable:true,configurable:true});" : ''}
    window.rafPending=new Map();const raf=window.requestAnimationFrame.bind(window),caf=window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame=fn=>{const id=raf(t=>{rafPending.delete(id);fn(t)});rafPending.set(id,fn.name);return id};
    window.cancelAnimationFrame=id=>{rafPending.delete(id);caf(id)};
    window.intervalIds=new Set();const si=window.setInterval.bind(window),ci=window.clearInterval.bind(window);
    window.setInterval=(...args)=>{const id=si(...args);intervalIds.add(id);return id};window.clearInterval=id=>{intervalIds.delete(id);ci(id)};
  ` });
  await send('Page.navigate', { url });
  await until(`!!document.querySelector('canvas')&&!document.body.innerText.includes('Preparing')`, 'scene');
  await evaluate(`(async()=>{const es=performance.getEntriesByType('resource');window.x=(await import(es.find(e=>e.name.includes('/src/xr/store.ts')).name)).xrStore;window.r=[...(await import(es.find(e=>e.name.includes('/@react-three_fiber.js?')).name))._roots.values()][0].store;})()`);
  await idle();
  if(process.argv.includes('--software'))await evaluate('(()=>{const setDpr=r.getState().setDpr;r.setState({setDpr:()=>setDpr(0.5)});r.getState().setDpr(0.5)})()');
  if (emulated) await until(`!!x.getState().emulator`, 'emulator ready');
  else {
    assert.equal(await evaluate(`!!x.getState().emulator`), false);
    assert.deepEqual(await evaluate(`performance.getEntriesByType('resource').filter(e=>/emulate-|office_small|iwer/.test(e.name)).map(e=>e.name)`), []);
  }
  if (fixture) {
    await button('My Tiles · Add Tile');
    await until(`!!document.querySelector('.tile-access-form')||!!document.querySelector('.tile-upload-form')`, 'library');
    if (await evaluate(`!!document.querySelector('.tile-access-form')`)) {
      await field('Access code', 'fixture-access-code-please-do-not-use'); await button('Unlock library');
    }
    await until(`!!document.querySelector('.tile-upload-form')&&!document.querySelector('.tile-upload-form fieldset').disabled`, 'upload form');
    await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#a8b5bd';ctx.fillRect(0,0,128,128);ctx.fillStyle='#65747d';ctx.fillRect(0,0,20,128);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));const dt=new DataTransfer();dt.items.add(new File([blob],'XR recovery.png',{type:'image/png'}));const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await field('Tile name', tileName); await field('Width (cm)', '60'); await field('Height (cm)', '60');
    await until(`!!document.querySelector('.tile-image-preview img')&&!document.querySelector('.tile-upload-form button[type=submit]').disabled`, 'image ready');
    await button('Save tile'); await until(`!![...document.querySelectorAll('.saved-tile-card h4')].find(e=>e.textContent===${JSON.stringify(tileName)})`, 'saved upload');
    await button('Close');
  }
  const desktop = async () => {
    console.error('Checking desktop interaction');
    for (const [label, y] of [['Overview',2.65],['Floor',2.45],['Top',Math.max(3.5,3/(1100/850))/Math.tan(Math.PI/8)*1.22],['Detail',1.15],['Reset',2.65]]) {
      await button(label); await until(`r.getState().controls?.enabled&&Math.abs(r.getState().camera.position.y-${y})<1e-5`, label);
      assert(await evaluate(`r.getState().camera.position.distanceTo(r.getState().controls.target)>1`));
      if (label==='Top') assert(await evaluate(`!r.getState().scene.getObjectByName('overhead').visible&&!r.getState().scene.getObjectByName('furniture').visible`));
    }
    for (const name of ['Travertine Beige','Dark Stone','Carrara White']) {
      await click(`[...document.querySelectorAll('.ceramic-card')].find(e=>e.textContent.includes(${JSON.stringify(name)}))`);
      await until(`document.querySelector('.selected-name').textContent===${JSON.stringify(name)}&&!!r.getState().scene.getObjectByName('floor')?.material.map`, name);
    }
    await click(`document.querySelector('.compare-button')`);
    await until(`document.querySelector('.selected-name').textContent==='Dark Stone'`, 'Compare');
    await click(`document.querySelector('.compare-button')`);
    await button('My Tiles · Add Tile'); await until(`!!document.querySelector('dialog[open]')`, 'My Tiles');
    if (fixture) {
      await until(`!![...document.querySelectorAll('.saved-tile-card h4')].find(e=>e.textContent===${JSON.stringify(tileName)})&&!document.body.innerText.includes('Opening your library')`, 'saved library');
      await click(`[...document.querySelectorAll('.saved-tile-card')].find(e=>e.querySelector('h4').textContent===${JSON.stringify(tileName)}).querySelector('button')`);
      await until(`!document.querySelector('dialog[open]')&&document.querySelector('.selected-name').textContent===${JSON.stringify(tileName)}&&r.getState().scene.getObjectByName('floor')?.material.map?.repeat.x===10`, 'uploaded Apply');
      await click(`document.querySelector('.compare-button')`);
      await until(`document.querySelector('.selected-name').textContent==='Carrara White'`, 'uploaded Compare');
      await click(`document.querySelector('.compare-button')`);
    } else await button('Close');
    await button('Reset'); await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-2.65)<1e-5`, 'Reset');
    for (const code of ['KeyW','ArrowRight']) {
      const before=await evaluate(`r.getState().camera.position.toArray()`);
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:code==='KeyW'?'w':'ArrowRight',code,windowsVirtualKeyCode:code==='KeyW'?87:39});
      try { await until(`r.getState().camera.position.distanceTo({x:${before[0]},y:${before[1]},z:${before[2]}})>0.01`,code); }
      finally { await send('Input.dispatchKeyEvent',{type:'keyUp',key:code==='KeyW'?'w':'ArrowRight',code,windowsVirtualKeyCode:code==='KeyW'?87:39}); }
    }
    // Drag over the unobstructed center of the canvas.
    const q=await evaluate(`r.getState().camera.quaternion.toArray()`);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:560,y:340});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:560,y:340,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:650,y:365,buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:650,y:365,button:'left',clickCount:1});
    await until(`JSON.stringify(r.getState().camera.quaternion.toArray())!==${JSON.stringify(JSON.stringify(q))}`,'drag look');
    const fov=await evaluate(`r.getState().camera.fov`);
    await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:560,y:340,deltaY:100,deltaX:0});
    await until(`Math.abs(r.getState().camera.fov-${fov})>0.1`,'wheel/FOV');
    await button('Reset');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-2.65)<1e-5`, 'reset after input');
  };
  await desktop();
  const baseline=await stats();const cycles=[];
  if(emulated) for(let cycle=1;cycle<=2;cycle++) {
    console.error('XR cycle',cycle);
    await evaluate(`x.enterVR().then(()=>true)`);
    await until(`!!x.getState().session&&r.getState().gl.xr.isPresenting&&r.getState().camera.isArrayCamera&&!r.getState().controls&&x.getState().inputSourceStates.length===2`,'XR active');
    // Exercise VR panel text loading too, which caused the surrounding XR suspension.
    await evaluate(`(async()=>{const es=performance.getEntriesByType('resource');const s=(await import(es.find(e=>e.name.includes('/src/state/useConfiguratorStore.ts')).name)).useConfiguratorStore;s.setState({vrPanelOpen:true});})()`);
    await sleep(1500);
    if(cycle===2){
      const locked=await send('Runtime.evaluate',{expression:`document.querySelector('[data-webxr_runtime] canvas').requestPointerLock()`,awaitPromise:true,userGesture:true,returnByValue:true});
      assert.equal(locked.exceptionDetails,undefined,'emulator pointer lock');
      await until(`!!document.pointerLockElement`,'pointer lock active');
    }
    await evaluate(`x.getState().session.end()`);await idle();
    assert.equal((await stats()).camera,baseline.camera,'original desktop camera restored');
    await desktop();const after=await stats();
    for(const key of ['inputs','subscribers','canvas','runtimeOverlays','pointerLock','captured'])assert.deepEqual(after[key],baseline[key],key);
    for(const target of ['window','document','controls'])for(const event of ['keydown','keyup','blur','wheel','pointerdown','pointerup','pointermove','pointerlockchange','gotpointercapture','lostpointercapture'])assert.equal(after[target][event],baseline[target][event],`${target}/${event}`);
    cycles.push(after);
  }
  assert.deepEqual(errors,[],'uncaught runtime errors');
  const screenshot=await send('Page.captureScreenshot',{format:'png'});
  await writeFile(`/tmp/ceramic-${emulated?'xr':'desktop'}-recovery.png`,Buffer.from(screenshot.data,'base64'));
  console.log(JSON.stringify({mode:emulated?'emulator':'desktop',fixture,baseline,cycles,errors},null,2));
} finally { ws.close(); }
