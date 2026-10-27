import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { useProjects } from '../projects/context';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import type { ProjectDocument } from '../projects/model';
type Action={kind:'open';id:string;name:string}|{kind:'new';name:string};
export function Projects(){
  const repository=useProjects(),s=useStore(repository.store),plan=useFloorDesignStore(s=>s.presentation==='layout');
  const [naming,setNaming]=useState<{kind:'save'|'new'|'rename';id?:string}|null>(null),[name,setName]=useState('');
  const [pending,setPending]=useState<Action|null>(null),[remove,setRemove]=useState<ProjectDocument|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const visible=s.open||!!naming||!!pending||!!remove;
  useEffect(()=>{const e=dialog.current;if(visible&&!e?.open)e?.showModal();if(!visible)e?.close();},[visible]);
  useEffect(()=>{if(!s.dirty)return;const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[s.dirty]);
  useEffect(()=>{if(!s.notice)return;const timer=setTimeout(()=>repository.store.setState({notice:''}),2500);return()=>clearTimeout(timer);},[repository,s.notice]);
  const run=async(action:()=>Promise<unknown>)=>{try{await action();return true;}catch{return false;}};
  const close=()=>{if(s.busy)return;repository.close();setNaming(null);setPending(null);setRemove(null);};
  const askName=(kind:'save'|'new'|'rename',value:string,id?:string)=>{setName(value);setNaming({kind,id});repository.show();};
  const execute=async(action:Action,discard=false)=>{const ok=await run(()=>action.kind==='open'?repository.open(action.id,discard):repository.create(action.name,discard));if(ok){setPending(null);setNaming(null);}};
  const switchTo=(action:Action)=>{if(s.dirty)setPending(action);else void execute(action);};
  const save=async()=>{if(!s.active){askName('save','Untitled project');return;}await run(()=>repository.save());};
  const submitName=async()=>{
    if(!naming)return;
    if(naming.kind==='new'){const action:Action={kind:'new',name};if(s.dirty){setPending(action);setNaming(null);}else await execute(action);}
    else if(await run(()=>naming.kind==='rename'?repository.rename(naming.id!,name):repository.save(name))){setNaming(null);if(pending){await execute(pending);}}
  };
  const saveSwitch=async()=>{if(!s.active){askName('save','Untitled project');return;}if(await run(()=>repository.save()))await execute(pending!);};
  return <>
    <div role="group" aria-label="Project controls" className={`project-toolbar${plan?' in-plan':''}`}>
      <span className="project-active-name" title={s.active?.name??'Untitled project'}>{s.active?.name??'Untitled project'} <small>{s.dirty?'• Unsaved':s.active?'• Saved':''}</small></span>
      <button className="hud-button" disabled={s.busy||s.status==='loading'} onClick={()=>{repository.show();setNaming(null);}}>Projects</button>
      <button className="hud-button" disabled={s.busy||s.status!=='ready'} onClick={()=>void save()}>Save Project</button>
      <span className="project-feedback" role="status">{s.notice}</span>
      {!visible&&s.error&&<button className="project-warning" onClick={()=>repository.show()}>Projects need attention</button>}
      {!visible&&s.warnings.length>0&&<button className="project-warning" onClick={()=>repository.show()}>Saved tile missing · Review</button>}
    </div>
    {s.status==='loading'&&<div className="project-startup" role="status">Opening your projects…</div>}
    {createPortal(<dialog ref={dialog} className="projects-dialog" aria-labelledby="projects-title" onCancel={event=>{event.preventDefault();close();}}>
      <header className="tile-library-header"><div><span className="tile-eyebrow">Saved on this device</span><h2 id="projects-title">Projects</h2></div><button className="hud-button" disabled={s.busy} onClick={close}>Close</button></header>
      <p className="tile-help">Save applied room and floor settings. Unapplied edits are not saved. Materials stay in your shared My Tiles library.</p>
      {s.error&&<p className="tile-error" role="alert">{s.error}</p>}
      {s.warnings.length>0&&<div className="project-notice" role="status">{s.warnings.map((w,i)=><p key={i}>{w}</p>)}</div>}
      {s.status==='error'&&<button className="hud-button" onClick={()=>void repository.hydrate()}>Retry Projects</button>}
      {naming?<form className="project-name-form" onSubmit={e=>{e.preventDefault();void submitName();}}><label>Project name<input aria-label="Project name" value={name} maxLength={120} autoFocus onChange={e=>setName(e.target.value)}/></label><div><button className="hud-button hud-button-primary" disabled={s.busy||!name.trim()} type="submit">{naming.kind==='rename'?'Rename':naming.kind==='new'?'Create Project':'Save Project'}</button><button className="hud-button" disabled={s.busy} type="button" onClick={()=>setNaming(null)}>Cancel</button></div></form>
      :pending?<section className="project-confirm" aria-label="Unsaved project"><h3>Save your changes first?</h3><p>You have unsaved applied changes. Save them before {pending.kind==='open'?`opening “${pending.name}”`:'creating a new project'}.</p><div><button className="hud-button hud-button-primary" disabled={s.busy} onClick={()=>void saveSwitch()}>{pending.kind==='open'?'Save & Open':'Save & Create'}</button><button className="hud-button" disabled={s.busy} onClick={()=>void execute(pending,true)}>{pending.kind==='open'?'Discard & Open':'Discard & Create'}</button><button className="hud-button" disabled={s.busy} onClick={()=>setPending(null)}>Cancel</button></div></section>
      :remove?<section className="project-confirm"><h3>Delete “{remove.name}”?</h3><p>This deletes the saved project. Shared tiles remain in My Tiles.{remove.id===s.active?.id&&s.dirty?' Unsaved changes in this project will also be discarded.':''}</p><div><button className="hud-button" disabled={s.busy} onClick={async()=>{if(await run(()=>repository.remove(remove.id,true)))setRemove(null);}}>Delete Project</button><button className="hud-button" disabled={s.busy} onClick={()=>setRemove(null)}>Cancel</button></div></section>
      :<><div className="project-library-actions"><button className="hud-button hud-button-primary" disabled={s.busy||s.status!=='ready'} onClick={()=>askName('new','Untitled project')}>+ New Project</button><button className="hud-button" disabled={s.busy||s.status!=='ready'} onClick={()=>void save()}>Save Project</button></div>
      {!s.projects.length&&s.status==='ready'&&<p className="tile-library-empty">Design first, then save your first project.</p>}
      <div className="project-list">{s.projects.map(project=><article className="project-card" key={project.id}><div><h3>{project.name}{project.id===s.active?.id&&<small> · Open</small>}</h3><p>Modified {new Date(project.updatedAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</p></div><div className="project-card-actions"><button className="hud-button" disabled={s.busy} onClick={()=>switchTo({kind:'open',id:project.id,name:project.name})}>Open</button><button className="hud-button" disabled={s.busy} onClick={()=>askName('rename',project.name,project.id)}>Rename</button><button className="hud-button" disabled={s.busy} title="Duplicate saved version" onClick={()=>void run(()=>repository.duplicate(project.id))}>Duplicate</button><button className="hud-button" disabled={s.busy} onClick={()=>setRemove(project)}>Delete</button></div></article>)}</div></>}
    </dialog>,document.body)}
  </>;
}
