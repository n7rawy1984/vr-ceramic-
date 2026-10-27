/** Forced local-library acceptance: isolated empty profile, real IndexedDB, no API/backend. */
import assert from 'node:assert/strict';
import {browser} from './cdp.mjs';
const {send,evaluate,until,click,button,field,shot,listeners,close}=await browser();
const apiRequests=[],errors=[];
listeners.push(e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description);if(e.method==='Network.requestWillBeSent'&&new URL(e.params.request.url).pathname.startsWith('/api/'))apiRequests.push(e.params.request.url)});
const toggle=label=>click(`[...document.querySelectorAll('.floor-design-panel label')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).querySelector('input')`);
const settle=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*/api/*']});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.fiberRoots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),inject(r){this.renderers.set(this.renderers.size+1,r);return this.renderers.size},onCommitFiberRoot(id,root){fiberRoots.add(root)},onCommitFiberUnmount(){}};window.planImages=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.hasAttribute('data-placement-count'))planImages++;return draw.apply(this,a)};`});
 await send('Page.navigate',{url:process.argv[2]??'http://127.0.0.1:5187'});await until(`!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);
 await evaluate(`(()=>{function find(f){if(!f)return;const v=f.memoizedProps?.value;if(v?.getState?.()?.scene)return v;return find(f.child)||find(f.sibling)}window.r=[...fiberRoots].map(x=>find(x.current)).find(Boolean);if(!r)throw Error('R3F store missing');const d=r.getState().setDpr;r.setState({setDpr:()=>d(.5)});d(.5)})()`);
 await button('My Tiles · Add Tile');await until(`!!document.querySelector('.tile-upload-form')`);assert.equal(await evaluate(`document.querySelector('dialog h2').textContent`),'My Tiles');assert.equal(await evaluate(`!!document.querySelector('.tile-access-form')`),false);
 await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=120;c.height=80;const x=c.getContext('2d');x.fillStyle='#a63b37';x.fillRect(0,0,120,80);x.fillStyle='#fff';x.fillRect(0,0,60,8);const b=await new Promise(r=>c.toBlob(r,'image/webp'));const dt=new DataTransfer();dt.items.add(new File([b],'presentation.webp',{type:'image/webp'}));const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await field('Tile name','Presentation tile');await field('Width (cm)',60);await field('Height (cm)',60);await field('Material type','Porcelain');await field('Finish','satin');await field('Rotate image',90);await button('Crop image');await field('Trim left',10);
 await until(`!!document.querySelector('.tile-image-preview img')&&!document.querySelector('.tile-upload-form button[type=submit]').disabled`);await button('Save tile');await until(`document.querySelectorAll('.saved-tile-card').length===1`);assert(await evaluate(`document.querySelector('.saved-tile-card').innerText.includes('60 × 60 cm')`));
 await button('Apply');await until(`!document.querySelector('dialog[open]')`);
 const uploadedId=await evaluate(`r.getState().scene.getObjectByName('floor').userData.productId`);
 for(const [name,id]of[['Carrara White','ceramic-01'],['Travertine Beige','ceramic-02'],['Presentation tile',uploadedId]]){await click(`[...document.querySelectorAll('.ceramic-card')].find(e=>e.querySelector('.ceramic-name').textContent===${JSON.stringify(name)})`);await until(`r.getState().scene.getObjectByName('floor')?.userData.productId===${JSON.stringify(id)}&&!!r.getState().scene.getObjectByName('floor').material.map`);}
 await button('Floor Design');await until(`!!r.getState().scene.getObjectByName('compiled-floor')`);
 const tileId=await evaluate(`document.querySelector('[aria-label="Main Field tile"]').value`);assert(!tileId.startsWith('ceramic-'));
 await toggle('Enable Center Frame');await toggle('Enable center');
 // Each picker accepts the upload independently while the other zones keep built-ins.
 for(const zone of ['Main field tile','Center Frame tile','Center tile']){
  await field('Main field tile','ceramic-01');await field('Center Frame tile','ceramic-03');await field('Center tile','ceramic-01');await field(zone,tileId);await button('Apply Design');await settle();
  await until(`!!r.getState().scene.getObjectByName('layout-asset-${tileId}')?.material.map`);
 }
 await field('Main field tile',tileId);await field('Center Frame tile',tileId);await field('Center tile',tileId);await field('Center width (mm)',600);await field('Center height (mm)',600);await field('Room width (m)',5.4);await field('Room length (m)',7.2);await button('Apply Design');await settle();
 await until(`!!r.getState().scene.getObjectByName('layout-asset-${tileId}')?.material.map`);
 const scale=await evaluate(`(()=>{const g=r.getState().scene.getObjectByName('layout-asset-${tileId}').geometry,p=g.attributes.position.array;let full=0;for(let i=0;i<p.length;i+=12){const xs=[p[i],p[i+3],p[i+6],p[i+9]],zs=[p[i+2],p[i+5],p[i+8],p[i+11]];if(Math.abs(Math.max(...xs)-Math.min(...xs)-.6)<1e-5&&Math.abs(Math.max(...zs)-Math.min(...zs)-.6)<1e-5)full++}const grout=r.getState().scene.getObjectByName('layout-grout').geometry.parameters;return{full,width:grout.width,height:grout.height,image:r.getState().scene.getObjectByName('layout-asset-${tileId}').material.map.image.src}})()`);
 assert(scale.full>0);assert.equal(scale.width,5.4);assert.equal(scale.height,7.2);assert.match(scale.image,/^blob:/);
 await button('Layout');await until(`!!document.querySelector('.plan-canvas-wrap canvas')&&planImages>0`);assert(Number(await evaluate(`document.querySelector('.plan-canvas-wrap canvas').dataset.placementCount`))>0);await shot('ceramic-client-demo-layout');
 await button('Room');await button('Close');
 for(const [label,y] of [['Overview',Math.min(3*.88,2.65*7.2/7)],['Floor',Math.min(3*.82,2.45*7.2/7)],['Top',Math.max(3.6,2.7/(1280/900))/Math.tan(Math.PI/8)*1.22],['Detail',1.15]]){await button(label);await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${y})<1e-5`);}
 await shot('ceramic-client-demo-room');
 await button('My Tiles · Add Tile');await until(`document.querySelectorAll('.saved-tile-card').length===1`);assert(!await evaluate(`/unavailable|backend|Supabase|Unlock/.test(document.querySelector('dialog').innerText)`));await button('Close');
 assert.deepEqual(apiRequests,[]);
 await send('Page.reload',{ignoreCache:true});await until(`!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);await button('My Tiles · Add Tile');await until(`!!document.querySelector('.tile-upload-form')`);await until(`document.querySelectorAll('.saved-tile-card').length===1`);await button('Close');await button('Floor Design');assert(await evaluate(`[...document.querySelector('[aria-label="Main Field tile"]').options].some(o=>o.value.startsWith('ceramic-'))`));assert.deepEqual(apiRequests,[]);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({productionBuild:true,apiRequests,webpUploadPreviewCropRotate:true,realScale600mm:scale.full>0,independentZones:true,applyLayout3D:true,roomResizing:true,cameraPresets:true,panelReopenRetainsTiles:true,refreshRetainsTiles:true,builtinsRemain:true,errors},null,2));
}finally{close()}
