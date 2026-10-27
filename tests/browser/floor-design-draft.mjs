/** Explicit Apply acceptance and compiler-call instrumentation; isolated fixture only. */
import assert from 'node:assert/strict';
import {browser} from './cdp.mjs';
const {send,evaluate,until,click,button,field,shot,listeners,close}=await browser();
let compilerCalls=0;const errors=[];
listeners.push(e=>{if(e.method==='Runtime.exceptionThrown')errors.push(e.params.exceptionDetails.exception?.description)});
const toggle=label=>click(`[...document.querySelectorAll('.floor-design-panel label')].find(e=>e.textContent.trim()===${JSON.stringify(label)}).querySelector('input')`);
const settle=()=>evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
const countCompiles=async()=>{const {result}=await send('Profiler.takePreciseCoverage');compilerCalls+=result.filter(s=>s.url.includes('/src/layout/compiler.ts')).flatMap(s=>s.functions).filter(f=>f.functionName==='compileLayout').reduce((sum,f)=>sum+f.ranges[0].count,0);return compilerCalls;};
const applyDisabled=()=>evaluate(`document.querySelector('.design-action-footer button').disabled`);
try{
 await send('Page.enable');await send('Runtime.enable');await send('Page.bringToFront');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.planDraws=0;const clear=CanvasRenderingContext2D.prototype.clearRect;CanvasRenderingContext2D.prototype.clearRect=function(...args){if(this.canvas.hasAttribute('data-placement-count'))planDraws++;return clear.apply(this,args)};`});
 await evaluate(`window.__navigation=true`);await send('Page.navigate',{url:process.argv[2]??'http://localhost:5187'});await until(`!window.__navigation&&!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')`);
 await evaluate(`(async()=>{const es=performance.getEntriesByType('resource'),mod=async n=>import(es.find(e=>e.name.includes(n)).name);window.r=[...(await mod('/@react-three_fiber.js?'))._roots.values()][0].store;window.design=(await mod('/src/state/useFloorDesignStore.ts')).useFloorDesignStore;window.legacy=(await mod('/src/state/useConfiguratorStore.ts')).useConfiguratorStore;window.compile=(await mod('/src/layout/compiler.ts')).compileLayout;const setDpr=r.getState().setDpr;r.setState({setDpr:()=>setDpr(.5)});r.getState().setDpr(.5);window.publications=[];design.subscribe((a,b)=>{if(a.roomSize!==b.roomSize||a.installation!==b.installation)publications.push(JSON.stringify({room:a.roomSize,installation:a.installation}))});window.snapshot=()=>JSON.stringify({room:design.getState().roomSize,installation:design.getState().installation,geometry:r.getState().scene.getObjectByName('compiled-floor')?.children.filter(c=>c.geometry).map(c=>c.geometry.uuid)})})()`);
 await button('My Tiles · Add Tile');await settle();await until(`!!document.querySelector('dialog[open]')&&!document.body.innerText.includes('Opening your library')`);
 if(await evaluate(`!!document.querySelector('.tile-access-form')`)){await field('Access code','fixture-access-code-please-do-not-use');await button('Unlock library');}
 await until(`document.querySelectorAll('.saved-tile-card').length>=3`);
 const tiles=await evaluate(`fetch('/api/tile-assets').then(r=>r.json()).then(v=>v.tiles)`);assert(tiles.every(t=>t.imageUrl.startsWith('http://127.0.0.1:54329/')),'fixture only');const prestige=tiles.find(t=>t.name==='Prestige');assert(prestige);
 await button('Close');await button('Floor Design');await until(`!!r.getState().scene.getObjectByName('compiled-floor')`);await settle();assert(await applyDisabled());
 await send('Profiler.enable');await send('Profiler.startPreciseCoverage',{callCount:true,detailed:false});
 const baseline=await evaluate('snapshot()');const calls=await countCompiles();const pubs=await evaluate('publications.length');
 for(const value of ['','5','5.4','5.40'])await field('Room width (m)',value);await field('Room length (m)',7.2);
 await field('Main field tile',prestige.id);await field('Field orientation',90);await field('Field orientation',0);
 await toggle('Enable Center Frame');await field('Center Frame tile',prestige.id);await field('Center Frame tile','ceramic-03');
 for(const value of [1,10,100])await field('Center Frame width (mm)',value);
 await toggle('Enable center');await field('Center tile',prestige.id);await field('Center tile','ceramic-01');
 for(const value of [1,12,120,1200])await field('Center width (mm)',value);await field('Center height (mm)',1200);await field('Center orientation',90);await field('Center orientation',0);await field('Full joint width (mm)',4);await field('Full joint width (mm)',3);
 await settle();assert.equal(await evaluate('snapshot()'),baseline);assert.equal(await countCompiles(),calls);assert.equal(await evaluate('publications.length'),pubs);assert.equal(await applyDisabled(),false);
 await button('Apply Design');await until(`design.getState().roomSize.widthMm===5400&&design.getState().installation.field.tileAssetId===${JSON.stringify(prestige.id)}&&r.getState().scene.getObjectByName('compiled-floor').userData.placementCount===120`);await settle();
 assert.equal(await countCompiles()-calls,1,'one compilation, reused at publication');assert.equal(await evaluate('publications.length'),pubs+1,'one atomic publication');assert(await applyDisabled());
 await until(`r.getState().scene.getObjectByName('compiled-floor').children.filter(m=>m.name.startsWith('layout-asset-')).every(m=>!!m.material.map)`);
 const centerSize=()=>evaluate(`(()=>{const g=r.getState().scene.getObjectByName('layout-asset-ceramic-01').geometry;g.computeBoundingBox();return[g.boundingBox.max.x-g.boundingBox.min.x,g.boundingBox.max.z-g.boundingBox.min.z]})()`);
 assert((await centerSize()).every(n=>Math.abs(n-1.2)<1e-5));

 await button('Layout');await until(`!!document.querySelector('.plan-canvas-wrap canvas')&&planDraws>0`);await settle();
 const planBaseline=await evaluate('snapshot()'),draws=await evaluate('planDraws'),planCalls=await countCompiles(),planPubs=await evaluate('publications.length');
 for(const v of [1,18,180,1800])await field('Center width (mm)',v);await field('Center height (mm)',1800);await settle();
 assert.equal(await evaluate('snapshot()'),planBaseline);assert.equal(await evaluate('planDraws'),draws);assert.equal(await countCompiles(),planCalls);assert((await centerSize()).every(n=>Math.abs(n-1.2)<1e-5));
 await button('Apply Design');await until(`design.getState().installation.center.widthMm===1800&&design.getState().installation.center.heightMm===1800&&planDraws>${draws}`);await settle();assert.equal(await countCompiles()-planCalls,1);assert.equal(await evaluate('publications.length'),planPubs+1);assert(await applyDisabled());assert((await centerSize()).every(n=>Math.abs(n-1.8)<1e-5));
 await shot('ceramic-m3-draft-plan');
 // Invalid drafts never publish or replace the applied geometry.
 const valid=await evaluate('snapshot()');const invalidPubs=await evaluate('publications.length');
 for(const [label,value,restore]of [['Room width (m)','',5.4],['Room width (m)',3,5.4],['Center width (mm)',12000,1800],['Center Frame width (mm)',0,100],['Full joint width (mm)',-1,3]]){
  await field(label,value);await button('Apply Design');await until(`!!document.querySelector('.floor-design-panel [role=alert]')`);assert.equal(await evaluate('snapshot()'),valid);assert.equal(await evaluate('publications.length'),invalidPubs);await field(label,restore);
 }
 assert(await applyDisabled());
 // Room/Layout switches retain the open draft; Close/reopen discards it.
 await field('Center width (mm)',1900);await button('Room');assert.equal(await evaluate(`document.querySelector('[aria-label="Center width (mm)"]').value`),'1900');await button('Close');await button('Floor Design');assert.equal(await evaluate(`document.querySelector('[aria-label="Center width (mm)"]').value`),'1800');assert(await applyDisabled());
 await field('Center width (mm)',1900);await button('Reset Design');await until(`!design.getState().installation.center.enabled&&!design.getState().installation.centerFrame.enabled`);await settle();assert(await applyDisabled());assert.equal(await evaluate('design.getState().roomSize.widthMm'),5400);
 await send('Profiler.stopPreciseCoverage');await send('Profiler.disable');
 // Actual hit testing proves the sticky actions remain reachable at either scroll end.
 const responsive=[];
 for(const[width,height]of[[1280,900],[820,1180],[390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await button('Layout');await until(`!!document.querySelector('.plan-canvas-wrap canvas')`);
  for(const scroll of [0,100000]){await evaluate(`document.querySelector('.design-fields').scrollTop=${scroll}`);await settle();const visible=await evaluate(`[...document.querySelectorAll('.design-action-footer button')].every(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})`);assert(visible,`Actions visible ${width}/${scroll}`);}
  await shot(`ceramic-m3-draft-${width}`);responsive.push(width);await button('Room');
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
 for(const[label,y]of[['Overview',2.65*7.2/7],['Floor',2.45*7.2/7],['Top',Math.max(3.6,2.7/(1280/900))/Math.tan(Math.PI/8)*1.22],['Detail',1.15]]){await button(label);await until(`r.getState().controls.enabled&&Math.abs(r.getState().camera.position.y-${y})<1e-5`);}
 assert.deepEqual(errors,[]);console.log(JSON.stringify({draftCompilerCalls:0,validApplyCompilerCalls:1,validApplyPublications:1,planDraftDraws:0,center1200to1800:true,invalidDraftHeld:true,closeDiscards:true,resetSynced:true,responsive,errors},null,2));
}finally{close();}
