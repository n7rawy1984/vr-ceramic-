/** Applied M8 design follows the existing scene through two XR/plan cycles. */
import assert from 'node:assert/strict';
import { projectBrowser } from './projects-fixture.mjs';
import { browser } from './cdp.mjs';
const setup=await browser();await setup.send('Page.enable');const injected=await setup.send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(navigator,'xr',{value:undefined,writable:true,configurable:true});"});
const b=await projectBrowser(process.argv[2]??'http://127.0.0.1:5362',true),{evaluate,until,button,field}=b;
await setup.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});setup.close();
const notices=[];
// Existing emulator offer supersession is SDK-specific, not an application exception.
try{
 await evaluate(`(async()=>{const es=performance.getEntriesByType('resource'),mod=async n=>import(es.find(e=>e.name.includes(n)).name);window.x=(await mod('/src/xr/store.ts')).xrStore;window.capture=(await mod('/src/projects/runtime.ts')).captureAppliedProject;const lib=(await mod('/src/tiles/demoLibrary.ts')).localTileLibrary;await lib.createVariant('source:vintage-a',{name:'M8 XR slab',widthMm:1200,heightMm:2400,productKind:'slab'});r.getState().gl.xr.setFramebufferScaleFactor(.25);})()`);
 await until(`!!x.getState().emulator&&ctx().products.some(p=>p.name==='M8 XR slab')`);
 await button('✨ Auto Design');await field('Style','luxury');if(process.argv.includes('--guided')){await field('Design Strength','dramatic');await b.click(`[...document.querySelectorAll('.auto-design-section')].find(e=>e.querySelector('summary').textContent==='Surfaces & room').querySelector('summary')`);await field('Feature Wall','left');await field('Center Frame','off');await field('Lighting','warm');}const slabChoice=await evaluate(`(()=>{const s=document.querySelector('select[aria-label="secondary material"]');return [...s.options].find(o=>o.textContent.includes('M8 XR slab')).value})()`);await field('Secondary material',slabChoice);await button('Generate Proposal');await until(`!!document.querySelector('.auto-design-proposal')`);await button('Apply Design');await until(`!document.querySelector('dialog[open]')&&!!r.getState().scene.getObjectByName('wall-tiles-left')`);
 const state=await evaluate('JSON.stringify(capture())'),floor=await evaluate('JSON.stringify(ctx().result)'),wall=await evaluate(`JSON.stringify([...r.getState().scene.getObjectByName('wall-tiles-left').geometry.attributes.position.array])`),camera=await evaluate('r.getState().camera.uuid');
 const cycles=[];
 for(let cycle=1;cycle<=2;cycle++){
  await button('Layout');await until(`r.getState().frameloop==='demand'&&!!document.querySelector('.plan-canvas-wrap canvas')`);
  await evaluate('x.enterVR().then(()=>true)');await until(`!!x.getState().session&&r.getState().gl.xr.isPresenting&&r.getState().camera.isArrayCamera&&r.getState().frameloop==='always'`);
  assert(!await evaluate(`!!document.querySelector('.auto-design-entry')`));assert(await evaluate(`['front','back','left','right'].every(id=>!r.getState().scene.getObjectByName('room-side-'+id).userData.cutawayHidden)`));
  await evaluate('x.getState().session.end()');await until(`!x.getState().session&&!r.getState().gl.xr.isPresenting&&!r.getState().camera.isArrayCamera&&r.getState().frameloop==='demand'`);
  assert.equal(await evaluate('JSON.stringify(capture())'),state);assert.equal(await evaluate('JSON.stringify(ctx().result)'),floor);assert.equal(await evaluate(`JSON.stringify([...r.getState().scene.getObjectByName('wall-tiles-left').geometry.attributes.position.array])`),wall);assert.equal(await evaluate('r.getState().camera.uuid'),camera);
  await button('Room');await button('Close');await until(`r.getState().frameloop==='always'&&r.getState().controls?.enabled`);await button('Floor');await button('Reset');cycles.push(await evaluate(`({subscribers:r.getState().internal.subscribers.length,inputs:x.getState().inputSourceStates.length,canvases:document.querySelectorAll('canvas').length,placements:ctx().result.layout.placements.length})`));console.log(JSON.stringify({cycle,...cycles.at(-1)}));
 }
 assert.deepEqual(cycles[0],cycles[1]);
 for(let i=b.errors.length-1;i>=0;i--)if(b.errors[i]?.includes('Offer superseded by a new offerSession call.')&&/emulate-|iwer/.test(b.errors[i]))notices.push(...b.errors.splice(i,1));
 b.check();console.log(JSON.stringify({appliedLuxuryPreserved:true,guided:process.argv.includes('--guided'),slabBuffersUnchanged:true,planDemandAndXRContinuous:true,noAutoDesignXRUI:true,cycles,zeroAPI:true,sdkNotices:notices.length,errors:b.errors}));
}finally{b.close()}
