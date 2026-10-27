/** Dev-only compatibility: normal dev stays emulator-free; opt-in XR retains shared geometry. */
import assert from 'node:assert/strict';import{browser}from'./cdp.mjs';
const{send,evaluate,until,button,listeners,close}=await browser();const api=[],errors=[],sdkNotices=[];
listeners.push(e=>{if(e.method==='Network.requestWillBeSent'&&new URL(e.params.request.url).pathname.startsWith('/api/'))api.push(e.params.request.url);if(e.method==='Runtime.exceptionThrown'){const t=e.params.exceptionDetails.exception?.description??e.params.exceptionDetails.text;if(t.includes('Offer superseded by a new offerSession call.')&&/emulate-|iwer/.test(t))sdkNotices.push(t);else errors.push(t)}});
async function boot(url){await send('Page.navigate',{url});await until(`!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);await evaluate(`(async()=>{const es=performance.getEntriesByType('resource'),mod=async n=>import(es.find(e=>e.name.includes(n)).name);window.r=[...(await mod('/@react-three_fiber.js?'))._roots.values()][0].store;window.d=(await mod('/src/state/useFloorDesignStore.ts')).useFloorDesignStore;window.x=(await mod('/src/xr/store.ts')).xrStore;const set=r.getState().setDpr;r.setState({setDpr:()=>set(.5)});set(.5)})()`);}
try{
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['*/api/*']});await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'xr',{value:undefined,writable:true,configurable:true});"});
 await boot('http://127.0.0.1:5188');assert.equal(await evaluate('!!x.getState().emulator'),false);
 await boot('http://127.0.0.1:5189');await until(`!!x.getState().emulator&&r.getState().controls?.enabled`);
 const states=[];
 for(const [width,length,height]of[[2.8,3.5,2.4],[15,20,4.5]]){
  await evaluate(`(()=>{const s=d.getState();s.applyRoom({widthMm:${width*1000},lengthMm:${length*1000}},{...s.architecture,heightMm:${height*1000}});s.openDesigner('ceramic-01');s.closePanel()})()`);await until(`r.getState().scene.getObjectByName('compiled-floor')?.userData.placementCount>0&&r.getState().controls?.enabled`);
  const camera=await evaluate('r.getState().camera.uuid');await evaluate('x.enterVR().then(()=>true)');await until(`!!x.getState().session&&r.getState().gl.xr.isPresenting&&r.getState().camera.isArrayCamera`);
  await until(`!!r.getState().camera.parent`, 'asynchronously loaded XR origin mounted');
  assert.deepEqual(await evaluate('r.getState().camera.parent.position.toArray()'),[0,0,length/2-Math.min(.9,length*.2)]);
  assert(await evaluate(`(()=>{let found=false;r.getState().scene.traverse(m=>{if(m.visible===false&&m.geometry?.type==='PlaneGeometry'&&m.geometry.parameters.width===${width}&&m.geometry.parameters.height===${length})found=true});return found})()`));assert.equal(await evaluate(`r.getState().scene.getObjectByName('wall-right').userData.height`),height);
  await evaluate('x.getState().session.end()');await until(`!x.getState().session&&!r.getState().gl.xr.isPresenting&&!r.getState().camera.isArrayCamera&&r.getState().controls?.enabled`);assert.equal(await evaluate('r.getState().camera.uuid'),camera);await button('Floor');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${Math.min(height*.82,2.45*Math.max(width/6,length/7))})<1e-5`);await button('Reset');await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${Math.min(height*.88,2.65*Math.max(width/6,length/7))})<1e-5`);states.push({width,length,height,exited:true});
 }
 assert.deepEqual(api,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({normalDevEmulator:false,xrCycles:states,zeroAPI:true,sdkNotices:sdkNotices.length,errors},null,2));
}finally{close()}
