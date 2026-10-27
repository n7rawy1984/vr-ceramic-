import { createStore } from 'zustand/vanilla';
import { defaultProjectState, normalizeAppliedState, normalizeProjectDocument, projectName, stateFingerprint, type AppliedProjectState, type ProjectDocument } from './model.ts';
import type { ProjectStorage } from './storage.ts';
export interface ProjectRuntime {capture():AppliedProjectState;prepare(state:AppliedProjectState,names:Record<string,string>):Promise<{state:AppliedProjectState;warnings:string[];commit():void}>;names(state:AppliedProjectState):Record<string,string>;subscribe(changed:()=>void):()=>void}
type State={projects:ProjectDocument[];active:ProjectDocument|null;dirty:boolean;busy:boolean;status:'loading'|'ready'|'error';error:string;notice:string;warnings:string[];open:boolean};
const sorted=(rows:ProjectDocument[])=>rows.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
const stamp=(previous?:string)=>new Date(Math.max(Date.now(),previous?Date.parse(previous)+1:0)).toISOString();
export function createProjectRepository(storage:ProjectStorage,runtime:ProjectRuntime){
  const store=createStore<State>(()=>({projects:[],active:null,dirty:false,busy:false,status:'loading',error:'',notice:'',warnings:[],open:false}));
  let baseline=stateFingerprint(defaultProjectState()),restoring=false,hydration:Promise<void>|null=null,unsubscribe:(()=>void)|null=null;
  const changed=()=>{if(restoring||store.getState().status==='loading')return;try{const dirty=stateFingerprint(runtime.capture())!==baseline;store.setState({dirty,...(dirty?{notice:''}:{})});}catch{store.setState({dirty:true});}};
  const begin=()=>{unsubscribe??=runtime.subscribe(changed);};
  const publish=(record:ProjectDocument|null,prepared:Awaited<ReturnType<ProjectRuntime['prepare']>>,saved:AppliedProjectState)=>{
    restoring=true;
    try{baseline=stateFingerprint(saved);prepared.commit();store.setState({active:record,dirty:stateFingerprint(prepared.state)!==baseline,warnings:prepared.warnings,error:''});}finally{restoring=false;}
    changed();
  };
  const guard=(discard:boolean)=>{if(store.getState().dirty&&!discard)throw Error('Save or discard your unsaved changes before switching projects.');};
  const updateRow=(record:ProjectDocument)=>store.setState(s=>({projects:sorted([...s.projects.filter(p=>p.id!==record.id),record])}));
  async function perform<T>(action:()=>Promise<T>):Promise<T>{
    if(store.getState().busy)throw Error('Please wait for the current project action.');
    store.setState({busy:true,error:'',notice:''});
    try{return await action();}catch(reason){const error=reason instanceof Error?reason.message:'Could not save projects on this device.';store.setState({error});throw Error(error);}finally{store.setState({busy:false});}
  }
  async function restore(record:ProjectDocument,remember:boolean){const prepared=await runtime.prepare(record.projectDocument,record.assetNames);if(remember)await storage.remember(record.id);publish(record,prepared,record.projectDocument);}
  function hydrate(){
    begin();if(hydration)return hydration;
    store.setState({status:'loading',error:''});
    hydration=(async()=>{
      try{
        const [rows,last]=await Promise.all([storage.list(),storage.readLast()]);const projects:ProjectDocument[]=[];let skipped=0;
        for(const row of rows)try{projects.push(normalizeProjectDocument(row));}catch{skipped++;}
        store.setState({projects:sorted(projects)});
        const active=last?projects.find(p=>p.id===last):null;
        if(active&&!store.getState().dirty)try{await restore(active,false);}catch{await storage.remember(null);store.setState({error:'The last saved project could not be opened. Your other projects are still available.'});}
        else if(last&&!store.getState().dirty)await storage.remember(null);
        store.setState({status:'ready',...(skipped?{error:'Some saved projects could not be read. Other projects are ready.'}:{})});changed();
      }catch{hydration=null;store.setState({status:'error',error:'Projects could not be opened on this device. Your showroom is still available. Retry Projects.'});}
    })();return hydration;
  }
  async function save(name?:string){return perform(async()=>{
    const active=store.getState().active,state=normalizeAppliedState(runtime.capture()),now=stamp(active?.updatedAt);
    const record:ProjectDocument={schemaVersion:4,id:active?.id??crypto.randomUUID(),name:projectName(name??active?.name),createdAt:active?.createdAt??now,updatedAt:now,projectDocument:state,assetNames:runtime.names(state)};
    await storage.write(record,true);baseline=stateFingerprint(state);updateRow(record);store.setState({active:record,notice:'Project saved',warnings:[]});changed();return record;
  });}
  async function open(id:string,discard=false){return perform(async()=>{guard(discard);const raw=await storage.read(id);if(!raw)throw Error('This project is no longer saved on this device.');const record=normalizeProjectDocument(raw);await restore(record,true);updateRow(record);store.setState({open:false});});}
  async function create(name:string,discard=false){return perform(async()=>{
    guard(discard);const state=defaultProjectState(),prepared=await runtime.prepare(state,{}),now=stamp();
    const record:ProjectDocument={schemaVersion:4,id:crypto.randomUUID(),name:projectName(name),createdAt:now,updatedAt:now,projectDocument:state,assetNames:runtime.names(state)};
    await storage.write(record,true);updateRow(record);publish(record,prepared,state);store.setState({open:false,notice:'Project created'});return record;
  });}
  async function rename(id:string,name:string){return perform(async()=>{const record=normalizeProjectDocument(await storage.read(id));const next={...record,name:projectName(name),updatedAt:stamp(record.updatedAt)};await storage.write(next,false);updateRow(next);if(store.getState().active?.id===id)store.setState({active:next});return next;});}
  async function duplicate(id:string,name?:string){return perform(async()=>{const record=normalizeProjectDocument(await storage.read(id)),now=stamp(record.updatedAt);const next={...record,id:crypto.randomUUID(),name:projectName(name??`${record.name.slice(0,115)} Copy`),createdAt:now,updatedAt:now};await storage.write(next,false);updateRow(next);store.setState({notice:'Project duplicated'});return next;});}
  async function remove(id:string,discard=false){return perform(async()=>{
    const active=store.getState().active?.id===id;if(active)guard(discard);
    const defaults=active?defaultProjectState():null,prepared=defaults?await runtime.prepare(defaults,{}):null;
    await storage.remove(id,active);store.setState(s=>({projects:s.projects.filter(p=>p.id!==id)}));if(prepared&&defaults)publish(null,prepared,defaults);store.setState({notice:'Project deleted'});
  });}
  return {store,hydrate,save,open,create,rename,duplicate,remove,show:()=>store.setState({open:true,notice:''}),close:()=>store.setState({open:false}),dispose:()=>{unsubscribe?.();unsubscribe=null;}};
}
export type ProjectRepository=ReturnType<typeof createProjectRepository>;
