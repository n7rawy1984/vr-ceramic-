/** Production preview, isolated CDP profile, generated local tiles; never a live backend. */
import assert from 'node:assert/strict';
import {browser} from './cdp.mjs';
const {send,evaluate,until,click,button,field,shot,listeners,close}=await browser();
const url=process.argv[2]??'http://127.0.0.1:5187';assert(['localhost','127.0.0.1'].includes(new URL(url).hostname));
const api=[],errors=[],matrix=[];
listeners.push(e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description);if(e.method==='Network.requestWillBeSent'&&new URL(e.params.request.url).pathname.startsWith('/api/'))api.push(e.params.request.url);if(e.method==='Page.javascriptDialogOpening')void send('Page.handleJavaScriptDialog',{accept:true});});
const settle=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
const toggle=label=>click(`[...(document.querySelector('dialog[open]')??document).querySelectorAll('label')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).querySelector('input')`);
const snapshot=()=>evaluate(`JSON.stringify({layout:ctx().result,geometry:r.getState().scene.getObjectByName('compiled-floor')?.children.map(m=>m.geometry?.uuid)})`);
async function upload(name,cm,color,height=cm){
 await evaluate(`(async()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle=${JSON.stringify(color)};x.fillRect(0,0,64,64);x.fillStyle='#fff';x.fillRect(0,0,32,4);const b=await new Promise(r=>c.toBlob(r));const dt=new DataTransfer();dt.items.add(new File([b],'pattern.png',{type:'image/png'}));const e=document.querySelector('input[type=file]');e.files=dt.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await field('Tile name',name);await field('Width (cm)',cm);await field('Height (cm)',height);await until(`!!document.querySelector('.tile-image-preview img')&&!document.querySelector('.tile-upload-form button[type=submit]').disabled`);await button('Save tile');await until(`[...document.querySelectorAll('.saved-tile-card h4')].some(e=>e.textContent===${JSON.stringify(name)})`);
}
async function parity(){
 const v=await evaluate(`(()=>{const l=ctx().result.layout,g=r.getState().scene.getObjectByName('compiled-floor');let errorMm=0,uvError=0;for(const mesh of g.children.filter(m=>m.name.startsWith('layout-asset-'))){const id=mesh.name.slice('layout-asset-'.length),ps=l.placements.filter(p=>p.tileAssetId===id),a=mesh.geometry.attributes.position.array,uv=mesh.geometry.attributes.uv.array;if(a.length!==ps.length*12)throw Error('Vertex count differs');if(JSON.stringify(mesh.userData.placementIds)!==JSON.stringify(ps.map(p=>p.id)))throw Error('Placement identity differs');ps.forEach((p,i)=>{const corners=[[p.xMm,p.yMm],[p.xMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm+p.heightMm],[p.xMm+p.widthMm,p.yMm]];corners.forEach(([x,y],n)=>{const k=i*12+n*3;errorMm=Math.max(errorMm,Math.abs(a[k]*1000-(x-l.surface.widthMm/2)),Math.abs(a[k+2]*1000-(y-l.surface.heightMm/2)));const tx=(x-p.tileBounds.xMm)/p.tileBounds.widthMm,ty=(y-p.tileBounds.yMm)/p.tileBounds.heightMm;const u=p.rotationDeg===90?ty:tx,v=p.rotationDeg===90?tx:1-ty;uvError=Math.max(uvError,Math.abs(uv[i*8+n*2]-u),Math.abs(uv[i*8+n*2+1]-v))})})}return{errorMm,uvError,placements:l.placements.length,meshes:g.children.filter(m=>m.isMesh).length,batches:new Set(l.placements.map(p=>p.tileAssetId)).size}})()`);
 assert(v.errorMm<.001);assert(v.uvError<1e-6);assert.equal(v.meshes,v.batches+1);return v;
}
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*/api/*']});await send('Storage.clearDataForOrigin',{origin:new URL(url).origin,storageTypes:'indexeddb'});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.roots=new Set();window.__REACT_DEVTOOLS_GLOBAL_HOOK__={supportsFiber:true,renderers:new Map(),inject(v){this.renderers.set(this.renderers.size+1,v);return this.renderers.size},onCommitFiberRoot(i,r){roots.add(r)},onCommitFiberUnmount(){}};window.planRects=[];window.planImages=0;const clear=CanvasRenderingContext2D.prototype.clearRect,rect=CanvasRenderingContext2D.prototype.rect,draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.clearRect=function(...a){if(this.canvas.hasAttribute('data-placement-count'))planRects=[];return clear.apply(this,a)};CanvasRenderingContext2D.prototype.rect=function(...a){if(this.canvas.hasAttribute('data-placement-count'))planRects.push(a);return rect.apply(this,a)};CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.hasAttribute('data-placement-count'))planImages++;return draw.apply(this,a)};`});
 await send('Page.navigate',{url});await until(`!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);
 await evaluate(`(()=>{function find(f,p){if(!f)return;const v=f.memoizedProps?.value;if(v&&p(v))return v;return find(f.child,p)||find(f.sibling,p)}window.ctx=()=>[...roots].map(x=>find(x.current,v=>v.result&&v.products&&v.applyDraft)).find(Boolean);window.r=[...roots].map(x=>find(x.current,v=>!!v.getState?.()?.scene)).find(Boolean);if(!r||!ctx())throw Error('Scene/context missing');const d=r.getState().setDpr;r.setState({setDpr:()=>d(.5)});d(.5)})()`);
 await button('My Tiles · Add Tile');await until(`!!document.querySelector('.tile-upload-form')`);
 await upload('M4B Large',60,'#a68450');await upload('M4B Medium rotated',60,'#2e80b5',29.9);await upload('M4B Small',29.9,'#cfb66f');await upload('M4B Accent',29.9,'#a53930');await button('Close');
 const products=await evaluate('ctx().products.map(p=>({id:p.id,name:p.name}))');const id=name=>products.find(p=>p.name===name).id;
 const a=id('M4B Large'),b=id('M4B Medium rotated'),c=id('M4B Small'),d=id('M4B Accent');
 await button('Floor Design');await button('Layout 2D');await until(`!!document.querySelector('.plan-canvas-wrap canvas')`);
 await field('Room width (m)',5.4);await field('Room length (m)',7.2);await field('Main field tile','ceramic-02');await field('Full joint width (mm)',2);await field('Pattern','modular');
 await field('Modular Tile A','ceramic-02');await field('Modular Tile B',b);await field('Tile B orientation',90);await field('Modular Tile C',c);await toggle('Use Tile D');await field('Modular Tile D',d);
 await toggle('Enable Center Frame');await field('Center Frame tile','ceramic-03');await toggle('Enable center');await field('Center tile',a);
 const before=await snapshot();await settle();assert.equal(await snapshot(),before);await button('Apply Design');await settle();
 await until(`ctx().result.ok&&ctx().result.layout.placements.some(p=>p.segment==='modular')`);
 async function verify(name){
  await until(`r.getState().scene.getObjectByName('compiled-floor').children.filter(m=>m.name.startsWith('layout-asset-')).every(m=>!!m.material.map)`);
  const v=await parity();await until(`planImages>0&&JSON.stringify(planRects)===JSON.stringify(ctx().result.layout.placements.map(p=>[p.xMm,p.yMm,p.widthMm,p.heightMm]))`);assert.equal(await evaluate(`r.getState().frameloop`),'demand');
  assert(await evaluate(`(()=>{const l=ctx().result.layout;return Math.abs(l.tileAreaMm2+l.jointAreaMm2-l.surface.widthMm*l.surface.heightMm)<.1})()`));
  matrix.push({name,...v});console.log(JSON.stringify({stage:name,...v}));return v;
 }
 const mixed=await verify('mixed built-in/local with Center Frame + Center');assert.equal(mixed.batches,6);await shot('ceramic-m4b-layout');
 // Actual images at different physical sizes and a rotated medium all use shared source UVs.
 assert(await evaluate(`ctx().result.layout.placements.some(p=>p.rotationDeg===90&&p.segment==='modular'&&!p.fullTile)`));
 const valid=await snapshot();await field('Modular Tile C','ceramic-02');await button('Apply Design');await until(`!!document.querySelector('.design-action-footer [role=alert]')`);assert.equal(await snapshot(),valid);assert(await evaluate(`document.querySelector('.design-action-footer [role=alert]').innerText.includes('299 × 299')`));await field('Modular Tile C',c);
 await field('Modular Tile A',a);await toggle('Use Tile D');await button('Apply Design');const local=await verify('all local three-slot family');assert.equal(local.batches,4); // A also fills center, frame is fourth asset.
 // Partial repeats resize and keep real 600/299 mm bodies.
 await field('Room width (m)',3);await field('Room length (m)',4);await button('Apply Design');await verify('3×4 m clipped room');
 assert(await evaluate(`ctx().result.layout.placements.filter(p=>p.segment==='modular').every(p=>[299,600].includes(p.tileBounds.widthMm)&&[299,600].includes(p.tileBounds.heightMm))`));
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({production:true,matrix,invalidHeld:true,roomResize:true,zeroAPI:true,errors},null,2));
}finally{close()}
