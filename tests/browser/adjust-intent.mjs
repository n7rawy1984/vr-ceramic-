/** Applied preserve intent re-entry: real controls, persistence, manual safety and zero-work opening. */
import assert from 'node:assert/strict';
import {projectBrowser} from './projects-fixture.mjs';
const url=process.argv[2]??'http://127.0.0.1:5420',profile=process.argv.includes('--profile');
const b=await projectBrowser(url,true),{evaluate,until,button,field,send,settled}=b;
const systems=['Floor','Walls','Ceiling','Lighting','Furniture'];
const remembered=[true,false,true,false,true],other=[false,true,true,false,true];
const input=name=>`[...document.querySelectorAll('.auto-design-locks label')].find(e=>e.textContent.startsWith('Keep Current ${name}')).querySelector('input')`;
const locks=()=>evaluate(`Array.from(document.querySelectorAll('.auto-design-locks input'),e=>e.checked)`);
async function setLocks(values){for(let i=0;i<5;i++)if(await evaluate(`${input(systems[i])}.checked`)!==values[i]){await b.click(input(systems[i]));await settled();}}
async function surfaces(){await b.click(`[...document.querySelectorAll('.auto-design-section')].find(e=>e.querySelector('summary').textContent==='Surfaces & room').querySelector('summary')`);}
async function preview(){await button('Preview Changes');await until(`!!document.querySelector('.auto-design-proposal')`);}
async function update(){await preview();await button('Update Design');await until(`!document.querySelector('dialog[open]')`);await settled();}
const save=()=>evaluate(`p.save('Intent room').then(()=>record().id)`);
let opening;
try{
 await evaluate(`r.getState().setFrameloop('demand')`);await save();
 await button('Adjust Design');assert.deepEqual(await locks(),[true,true,true,true,true]);await setLocks(remembered);await surfaces();await field('Feature Wall','back');await field('Lighting','warm');await settled();await update();const idA=await save();
 if(profile){await send('Profiler.enable');await send('Profiler.startPreciseCoverage',{callCount:true,detailed:false});}
 await button('Adjust Design');assert.deepEqual(await locks(),remembered);assert(!await evaluate('p.store.getState().dirty'));
 if(profile){const {result}=await send('Profiler.takePreciseCoverage');const names=['compileLayout','compileFloor','compileWall','compilePanelGeometry','compileDecorativePanel','floorBatchBuffers','wallBatchBuffers','panelBuffers','prepareImage','generateCeramicCanvas'];opening=Object.fromEntries(names.map(n=>[n,result.filter(s=>s.url.includes('/src/')).flatMap(s=>s.functions).filter(f=>f.functionName===n).reduce((a,f)=>a+f.ranges[0].count,0)]));assert(Object.values(opening).every(n=>n===0));await send('Profiler.stopPreciseCoverage');}
 // Canceled clicks and preview-only drafts must not replace successful history or dirty the project.
 await setLocks(other);await button('Cancel');await button('Adjust Design');assert.deepEqual(await locks(),remembered);await setLocks(other);await surfaces();await field('Lighting','cool');await settled();await preview();assert(!await evaluate('p.store.getState().dirty'));await button('Cancel');await button('Adjust Design');assert.deepEqual(await locks(),remembered);await button('Cancel');
 // A duplicate begins with identical intent, then independently applies a different one.
 const idB=await evaluate(`p.duplicate(record().id).then(p=>p.id)`);await evaluate(`p.open(${JSON.stringify(idB)},true).then(()=>true)`);await button('Adjust Design');assert.deepEqual(await locks(),remembered);await setLocks(other);await surfaces();await field('Lighting','cool');await settled();await update();await save();
 await evaluate(`p.open(${JSON.stringify(idA)},true).then(()=>true)`);await button('Adjust Design');assert.deepEqual(await locks(),remembered);await button('Cancel');await evaluate(`p.open(${JSON.stringify(idB)},true).then(()=>true)`);await button('Adjust Design');assert.deepEqual(await locks(),other);await button('Cancel');
 // An unlocked floor subsequently edited manually is protected without changing other saved choices.
 assert.deepEqual(await evaluate(`(()=>{const s=record().projectDocument,i=structuredClone(s.floorDesign.installation);i.field.physicalOverride={widthMm:555,heightMm:777};return ctx().applyDraft({roomSize:s.roomSize,installation:i})})()`),[]);await settled();await save();
 await button('Adjust Design');assert.deepEqual(await locks(),[true,true,true,false,true]);assert(await evaluate(`document.querySelector('.auto-design-locks').textContent.includes('Floor · Modified manually')`));await button('Cancel');
 const time=await evaluate('performance.timeOrigin');await send('Page.reload');await until(`performance.timeOrigin>${time}&&!!document.querySelector('.hud')&&!document.querySelector('.loading-screen')&&!document.querySelector('.project-startup')`);await b.bootstrap();
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});await button('Adjust Design');assert.deepEqual(await locks(),[true,true,true,false,true]);assert(await evaluate(`document.querySelector('.auto-design-locks').textContent.includes('Floor · Modified manually')`));assert(!await evaluate('p.store.getState().dirty'));await button('Cancel');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});b.check();
 console.log(JSON.stringify({profile,opening,restoreExact:true,cancel:true,previewOnly:true,duplicateAndProjectIsolation:true,manualFloorProtected:true,saveReloadOffline:true,zeroAPI:true,errors:b.errors}));
}finally{b.close();}
