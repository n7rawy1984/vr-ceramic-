/** Tiny native CDP helper for isolated, opt-in browser checks. */
import {writeFile} from 'node:fs/promises';
export async function browser() {
  const tabs=await(await fetch(`http://127.0.0.1:${process.env.CDP_PORT??9337}/json`)).json();
  const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
  let id=0;const pending=new Map(),listeners=[];
  ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){const p=pending.get(v.id);pending.delete(v.id);if(v.error)p.reject(Error(JSON.stringify(v.error)));else p.resolve(v.result);}else listeners.forEach(f=>f(v));};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,includeCommandLineAPI:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const until=async(expression,label=expression)=>{for(let i=0;i<180;i++){if(await evaluate(expression))return;await sleep(250);}throw Error('Timeout '+label);};
  const click=async selector=>{
    const point=await evaluate(`(()=>{const e=${selector};if(!e)throw Error('Missing click target: '+${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;if(e.disabled||!e.contains(document.elementFromPoint(x,y)))throw Error('Disabled or intercepted: '+e.textContent);return{x,y}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
  };
  const button=text=>click(`[...(document.querySelector('dialog[open]')??document).querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(text)})`);
  const field=(label,value)=>evaluate(`(()=>{const root=document.querySelector('dialog[open]')??document.querySelector('.floor-design-panel')??document;const e=[...root.querySelectorAll('label')].find(e=>e.textContent.trim().startsWith(${JSON.stringify(label)})).querySelector('input,select');Object.getOwnPropertyDescriptor(e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/${name}.png`,Buffer.from(r.data,'base64'));};
  return {send,evaluate,sleep,until,click,button,field,shot,listeners,close:()=>ws.close()};
}
