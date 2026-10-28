/** Final default build: persisted AI room restores with AI disabled and all API paths blocked. */
import assert from 'node:assert/strict';
import{projectBrowser}from'./projects-fixture.mjs';
const b=await projectBrowser(process.argv[2]??'http://127.0.0.1:5397'),{evaluate,button,until,send}=b;
try{
 await evaluate(`r.getState().setFrameloop('demand')`);assert(await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent==='🤖 AI Designer').disabled`));assert.equal(await evaluate('record().projectDocument.autoDesign.generatedBy'),'ai');const before=await evaluate('JSON.stringify(record().projectDocument)');assert(await evaluate('!!ctx().result.layout.decorative'));assert(!await evaluate('p.store.getState().dirty'));
 await send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});await button('Adjust Design');await button('Preview Changes');await until(`!!document.querySelector('.auto-design-proposal')`);await button('Cancel');assert.equal(await evaluate('JSON.stringify(record().projectDocument)'),before);assert(!await evaluate('p.store.getState().dirty'));await b.shot('m10-default-ai-disabled');await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});b.check();console.log(JSON.stringify({defaultDisabled:true,AIProjectReopensOffline:true,panelRestored:true,localAdjustOffline:true,zeroAPI:true,errors:b.errors}));
}finally{b.close()}
