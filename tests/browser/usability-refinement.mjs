/** Production preview, isolated browser profile, real IndexedDB, no backend. */
import assert from 'node:assert/strict';
import {browser} from './cdp.mjs';
const {send,evaluate,until,click,button,field,shot,listeners,close}=await browser();
const api=[],errors=[];const restart=process.argv[3]==='restart';
listeners.push(e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description);if(e.method==='Network.requestWillBeSent'&&new URL(e.params.request.url).pathname.startsWith('/api/'))api.push(e.params.request.url);if(e.method==='Page.javascriptDialogOpening')void send('Page.handleJavaScriptDialog',{accept:true});});
const settle=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
const toggle=label=>click(`[...(document.querySelector('dialog[open]')??document).querySelectorAll('label')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).querySelector('input')`);
const catalog=name=>click(`[...document.querySelectorAll('.ceramic-card')].find(e=>e.querySelector('.ceramic-name').textContent===${JSON.stringify(name)})`);
const simple=async(id,url)=>{await until(`!!r.getState().scene.getObjectByName('floor')?.material.map&&r.getState().scene.getObjectByName('floor').userData.productId===${JSON.stringify(id)}&&!r.getState().scene.getObjectByName('compiled-floor')${url?`&&r.getState().scene.getObjectByName('floor').material.map.image.src===${JSON.stringify(url)}`:''}`);};
const snapshot=()=>evaluate(`JSON.stringify({walls:r.getState().scene.getObjectByName('wall-right').children.map(m=>[m.geometry.uuid,m.geometry.parameters]),ceiling:r.getState().scene.getObjectByName('flat-ceiling').position.y,floor:r.getState().scene.getObjectByName('floor')?.geometry.uuid,compiled:r.getState().scene.getObjectByName('compiled-floor')?.children.map(m=>m.geometry?.uuid)})`);
async function upload(name,color,type){
 await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=${JSON.stringify(color)};x.fillRect(0,0,64,64);x.fillStyle='#fff';x.fillRect(0,0,32,4);const b=await new Promise(r=>c.toBlob(r,${JSON.stringify(type)}));const dt=new DataTransfer();dt.items.add(new File([b],'tile.'+${JSON.stringify(type.split('/')[1])},{type:b.type}));const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await field('Tile name',name);await field('Width (cm)',60);await field('Height (cm)',60);await field('Finish','satin');
 if(name==='Tile A'){await field('Rotate image',90);await button('Crop image');await field('Trim left',10);}
 await until(`!!document.querySelector('.tile-image-preview img')&&!document.querySelector('.tile-upload-form button[type=submit]').disabled`);await button('Save tile');await until(`[...document.querySelectorAll('.saved-tile-card h4')].some(e=>e.textContent===${JSON.stringify(name)})`);
}
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*/api/*']});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),inject(v){this.renderers.set(this.renderers.size+1,v);return this.renderers.size},onCommitFiberRoot(i,r){roots.add(r)},onCommitFiberUnmount(){}};window.planImages=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.hasAttribute('data-placement-count'))planImages++;return draw.apply(this,a)};`});
 async function boot(){await until(`!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);await evaluate(`(()=>{function find(f){if(!f)return;const v=f.memoizedProps?.value;if(v?.getState?.()?.scene)return v;return find(f.child)||find(f.sibling)}window.r=[...roots].map(x=>find(x.current)).find(Boolean);if(!r)throw Error('R3F root missing');const d=r.getState().setDpr;r.setState({setDpr:()=>d(.5)});d(.5)})()`);}
 await send('Page.navigate',{url:process.argv[2]??'http://127.0.0.1:5187'});await boot();
 if(!restart){
  assert.equal(await evaluate(`!!r.getState().scene.getObjectByName('furniture')`),false);assert.equal(await evaluate(`!!r.getState().scene.getObjectByName('gypsum-ceiling')`),false);
  await button('My Tiles · Add Tile');await until(`!!document.querySelector('.tile-upload-form')`);await upload('Tile A','#a93930','image/png');await upload('Tile B','#287fb0','image/jpeg');await button('Close');
 }else{
  await until(`document.querySelectorAll('.ceramic-card').length===5`);
  const disk=await evaluate(`new Promise((resolve,reject)=>{const q=indexedDB.open('tile-configurator-local',1);q.onsuccess=()=>{const db=q.result,tx=db.transaction('tile-assets');const r=tx.objectStore('tile-assets').getAll();r.onsuccess=()=>resolve(r.result.map(v=>({id:v.id,blob:v.blob instanceof Blob,width:v.width_mm,hasUrl:'imageUrl' in v})));tx.oncomplete=()=>db.close()};q.onerror=()=>reject(q.error)})`);assert.equal(disk.length,2);assert(disk.every(v=>v.blob&&v.width===600&&!v.hasUrl));
 }
 await until(`document.querySelectorAll('.ceramic-card').length===5`);
 const tiles=await evaluate(`[...document.querySelectorAll('.ceramic-card')].filter(e=>['Tile A','Tile B'].includes(e.querySelector('.ceramic-name').textContent)).map(e=>({name:e.querySelector('.ceramic-name').textContent,url:e.querySelector('img').src}))`);assert.equal(tiles.length,2);
 await catalog('Tile A');const a=await evaluate(`r.getState().scene.getObjectByName('floor').userData.productId`);await simple(a,tiles.find(t=>t.name==='Tile A').url);
 await catalog('Tile B');const b=await evaluate(`r.getState().scene.getObjectByName('floor').userData.productId`);await simple(b,tiles.find(t=>t.name==='Tile B').url);
 await button('Floor Design');await until(`!!r.getState().scene.getObjectByName('compiled-floor')`);await toggle('Enable Center Frame');await toggle('Enable center');await field('Main field tile',b);await field('Center Frame tile','ceramic-03');await field('Center tile',a);await button('Apply Design');await until(`r.getState().scene.getObjectByName('compiled-floor').userData.batchCount===3`);
 await button('Layout');await until(`!!document.querySelector('.plan-canvas-wrap canvas')&&planImages>0`);await shot('ceramic-refinement-layout');await button('Room');await button('Close');
 await catalog('Carrara White');await simple('ceramic-01');await catalog('Tile B');await simple(b,tiles.find(t=>t.name==='Tile B').url);
 await click(`document.querySelector('.compare-button')`);await simple('ceramic-01');await catalog('Tile B');await simple(b,tiles.find(t=>t.name==='Tile B').url);
 await button('Floor Design');await button('Layout 2D');await until(`!!document.querySelector('.plan-canvas-wrap canvas')`);await button('Room');await button('Use simple material');await simple(b);await button('Close');
 console.log(JSON.stringify({stage:'material transitions',restart,apiRequests:api.length}));
 if(restart){
  await catalog('Tile A');await simple(a);await button('Floor Design');await field('Main field tile',a);await field('Center Frame tile',a);await field('Center tile',a);await button('Apply Design');await button('Close');await button('My Tiles · Add Tile');
  await click(`[...document.querySelectorAll('.saved-tile-card')].find(e=>e.querySelector('h4').textContent==='Tile A').querySelector('.tile-delete')`);await until(`document.querySelectorAll('.saved-tile-card').length===1`);await button('Close');await button('Floor Design');
  assert(await evaluate(`[...document.querySelectorAll('.floor-design-panel select[aria-label$="tile"]')].every(e=>e.value!==${JSON.stringify(a)})`));await button('Use simple material');await simple('ceramic-01');await button('Close');
  await button('My Tiles · Add Tile');await click(`document.querySelector('.saved-tile-card .tile-delete')`);await until(`document.querySelectorAll('.saved-tile-card').length===0`);await button('Close');
  await send('Page.reload',{ignoreCache:true});await boot();await until(`document.querySelectorAll('.ceramic-card').length===3`);
 }else{
  await button('Room Settings');const original=await snapshot();
  for(const [label,value]of[['Room width (m)',15],['Room length (m)',20],['Room height (m)',4.5],['Window width (m)',1.2],['Window height (m)',1.5],['Sill height (m)',.9],['Horizontal offset (m)',2]])await field(label,value);
  await field('Furniture','show');await field('Ceiling style','gypsum');await field('Gypsum inset (m)',.4);await field('Gypsum drop (m)',.15);await settle();assert.equal(await snapshot(),original,'draft typing does not replace geometry');await button('Apply Room');await until(`r.getState().scene.getObjectByName('flat-ceiling').position.y===4.5`);
  const geometry=await evaluate(`(()=>{const s=r.getState().scene,w=s.getObjectByName('wall-right'),win=s.getObjectByName('room-window'),f=s.getObjectByName('floor');return{area:w.children.reduce((a,m)=>a+m.geometry.parameters.width*m.geometry.parameters.height,0),opening:w.userData.opening,window:win.position.toArray(),glass:s.getObjectByName('window-glass').geometry.parameters,gypsum:s.getObjectByName('gypsum-ceiling').userData,furniture:s.getObjectByName('furniture').visible,repeat:f.material.map.repeat.toArray(),size:f.geometry.parameters}})()`);
  assert(Math.abs(geometry.area-(20*4.5-1.2*1.5))<1e-9);assert.deepEqual(geometry.window,[7.5,.9,-2]);assert.equal(geometry.glass.width,1.2);assert.equal(geometry.glass.height,1.5);assert.deepEqual(geometry.gypsum,{inset:.4,drop:.15});assert(geometry.furniture);assert.deepEqual(geometry.repeat,[25,20/.6]);assert.equal(geometry.size.width,15);
  const valid=await snapshot();await field('Horizontal offset (m)',100);await button('Apply Room');await until(`!!document.querySelector('dialog [role=alert]')`);assert.equal(await snapshot(),valid);await field('Horizontal offset (m)',0);
  for(const [width,length,height]of[[2.8,3.5,2.4],[5.4,7.2,3],[8,10,4.5]]){
   await field('Room width (m)',width);await field('Room length (m)',length);await field('Room height (m)',height);await field('Window height (m)',1.2);await field('Sill height (m)',.8);await field('Ceiling style','simple');await field('Furniture','hide');await button('Apply Room');await until(`r.getState().scene.getObjectByName('flat-ceiling').position.y===${height}&&r.getState().scene.getObjectByName('floor').geometry.parameters.width===${width}`);
   assert.equal(await evaluate(`!!r.getState().scene.getObjectByName('gypsum-ceiling')`),false);assert.equal(await evaluate(`!!r.getState().scene.getObjectByName('furniture')`),false);assert.equal(await evaluate(`r.getState().scene.getObjectByName('wall-right').userData.height`),height);
  }
  const floorBefore=await evaluate(`r.getState().scene.getObjectByName('floor').geometry.uuid`);await toggle('Window enabled');await field('Furniture','show');await button('Apply Room');await settle();assert.equal(await evaluate(`r.getState().scene.getObjectByName('floor').geometry.uuid`),floorBefore);assert.equal(await evaluate(`!!r.getState().scene.getObjectByName('room-window')`),false);assert.equal(await evaluate(`r.getState().scene.getObjectByName('wall-right').children.length`),1);
  await field('Furniture','hide');await button('Apply Room');await button('Close');
  for(const [label,y]of[['Overview',Math.min(4.5*.88,2.65*10/7)],['Floor',Math.min(4.5*.82,2.45*10/7)],['Top',Math.max(5,4/(1280/900))/Math.tan(Math.PI/8)*1.22],['Detail',1.15]]){await button(label);await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${y})<1e-5`);}
  await button('Overview');await shot('ceramic-refinement-clean-room');await button('Room Settings');await shot('ceramic-refinement-room-settings');await button('Close');
  await send('Page.reload',{ignoreCache:true});await boot();await until(`document.querySelectorAll('.ceramic-card').length===5`);await catalog('Tile A');await until(`r.getState().scene.getObjectByName('floor')?.material.map?.image.src?.startsWith('blob:')`);
 }
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({production:true,restart,persistedTiles:!restart,storageCleanup:restart,materialsSwitch:true,sharedLibrary:true,roomArchitecture:!restart,zeroAPI:true,errors},null,2));
}finally{close()}
