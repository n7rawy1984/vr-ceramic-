import { AIPlanner } from '../aiDesign/planner';
import { aiDesignEnabled } from '../aiDesign/capability';
import { AI_STYLES, AI_LIMITS, type AIStyle } from '../aiDesign/protocol';
import { prepareAIImages } from '../aiDesign/images';
import { localTileLibrary } from '../tiles/demoLibrary';
import { adjustmentLocks, changedSystems, manuallyModified } from '../autoDesign/provenance';
import { MATCHING_ROOM_MESSAGE, decisionState } from '../autoDesign/session';
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { useFloorDesign } from '../layout/useFloorDesign';
import { useProjects } from '../projects/context';
import { captureAppliedProject, captureAppliedProjectReferences } from '../projects/runtime';
import { prepareAutoDesign } from '../autoDesign/prepare';
import { createAutoDesignSession } from '../autoDesign/session';
import { LocalRulePlanner } from '../autoDesign/planner';
import { DESIGN_STYLES, DEFAULT_GUIDANCE, DESIGN_SYSTEMS, type DesignGuidance, type DesignDecision, type DesignMaterials, type DesignStyle } from '../autoDesign/model';
import type { PhysicalAssignment } from '../tiles/physicalSize';
import { layoutAsset } from '../layout/assets';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { xrStore } from '../xr/store';
import { useConfiguratorStore } from '../state/useConfiguratorStore';

type Choice = { label: string; assignment: PhysicalAssignment };
export function AutoDesign() {
  const { products, restoreProject, result } = useFloorDesign(), projects = useProjects();
  const project = useStore(projects.store);
  const inXR = useStore(xrStore, s => s.session != null);
  // Re-render availability on semantic edits, without compiling or changing stores.
  useFloorDesignStore(s => s);
  useConfiguratorStore(s => s);
  const live = useRef({ products, restoreProject, result, project }); live.current = { products, restoreProject, result, project };
  const [aiPlanner] = useState(() => new AIPlanner());
  const [ai, setAI] = useState(false);
  const aiMode = useRef(ai); aiMode.current = ai;
  const [session] = useState(() => createAutoDesignSession({ capture: captureAppliedProject, products: () => live.current.products,
    projectKey: () => live.current.project.active?.id ?? 'unsaved', prepare: (state, products) => prepareAutoDesign(state, products, { state: captureAppliedProjectReferences(), result: live.current.result }), publish: p => live.current.restoreProject(p) }, {generate: input => aiMode.current ? aiPlanner.generate(input) : new LocalRulePlanner().generate(input)}));
  const [adjust, setAdjust] = useState(false);
  const [open, setOpen] = useState(false), [error, setError] = useState(''), [, refresh] = useState(0);
  useEffect(() => projects.store.subscribe((s, p) => { if (s.active?.id !== p.active?.id) { aiPlanner.cancel(); session.invalidate(); setOpen(false); refresh(n => n + 1); } }), [projects, session, aiPlanner]);
  if (inXR) return null;
  return <>
    <div className="auto-design-entry">
      <button className="hud-button" disabled={project.busy || project.status !== 'ready'} onClick={() => { setError(''); setAI(false); setAdjust(false); setOpen(true); }}>✨ Auto Design</button>
      <button className="hud-button" disabled={project.busy || project.status !== 'ready'} onClick={() => { setError(''); setAI(false); setAdjust(true); setOpen(true); }}>Adjust Design</button>
      <button className="hud-button" disabled={!aiDesignEnabled || project.busy || project.status !== 'ready'} title={aiDesignEnabled ? 'Optional online design proposal' : 'AI Designer unavailable · not enabled'} onClick={() => { setError(''); setAI(true); setAdjust(false); setOpen(true); }}>🤖 AI Designer</button>
      {useFloorDesignStore.getState().autoDesign && <button className="hud-button" disabled={project.busy} onClick={() => { setError(''); setAI(false); setAdjust(false); setOpen(true); }}>Start New Auto Design</button>}
      {session.canUndo() && <button className="hud-button" disabled={project.busy} onClick={() => { try { session.undo(); setError(''); } catch (e) { setError((e as Error).message); } refresh(n => n + 1); }}>Undo Auto Design</button>}
      {error && <span role="alert">{error}</span>}
    </div>
    {open && <AutoDesignDialog key={ai?'ai':adjust?'adjust':'new'} ai={ai} aiPlanner={aiPlanner} useLocal={() => {aiPlanner.cancel();session.cancel();setAI(false);setAdjust(false);}} adjust={adjust} products={products} session={session} busy={project.busy} close={() => { aiPlanner.cancel(); session.cancel(); setOpen(false); refresh(n => n + 1); }} />}
  </>;
}

function AutoDesignDialog({ products, session, close, busy, adjust, ai, aiPlanner, useLocal }: {
  ai: boolean; aiPlanner: AIPlanner; useLocal():void;
  adjust: boolean;
  products: ReturnType<typeof useFloorDesign>['products']; session: ReturnType<typeof createAutoDesignSession>; close(): void; busy: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const referenceInput=useRef<HTMLInputElement>(null);
  const [choices] = useState<Choice[]>(() => {
    const state = captureAppliedProject(), i = state.floorDesign.installation;
    const assigned: [string, PhysicalAssignment][] = [ ['Current simple floor', { tileAssetId: state.materialState.selectedFloorId, physicalOverride: state.materialState.physicalOverride }],
      ['Current field', i.field], ['Current center', i.center], ['Current frame', i.centerFrame], ...Object.entries(adjust ? state.autoDesign?.intent.materials ?? {} : {}).map(([id,a]) => [`Previous ${id}`, a] as [string, PhysicalAssignment]), ...Object.entries(state.walls).map(([id, w]) => [`Current ${id} wall`, w] as [string, PhysicalAssignment]) ];
    return [...assigned.filter(([, a]) => a.physicalOverride && products.some(p=>p.id===a.tileAssetId)).map(([label, a]) => ({ label: `${label} · ${products.find(p => p.id === a.tileAssetId)?.name ?? 'Unavailable material'} · project size ${a.physicalOverride!.widthMm} × ${a.physicalOverride!.heightMm} mm`, assignment: structuredClone({ tileAssetId: a.tileAssetId, physicalOverride: a.physicalOverride }) })),
      ...products.map(p => { const a = layoutAsset(p); return { label: `${p.name} · ${a.productKind} · ${a.widthMm} × ${a.heightMm} mm`, assignment: { tileAssetId: p.id } }; })];
  });
  const [before] = useState(captureAppliedProject);
  const initialRoles = () => {
    const state = captureAppliedProject();
    const current = state.floorDesign.enabled ? state.floorDesign.installation.field : { tileAssetId: state.materialState.selectedFloorId, physicalOverride: state.materialState.physicalOverride };
    const index = choices.findIndex(c => c.assignment.tileAssetId === current.tileAssetId && c.assignment.physicalOverride?.widthMm === current.physicalOverride?.widthMm && c.assignment.physicalOverride?.heightMm === current.physicalOverride?.heightMm);
    const roles = { primary: String(Math.max(0, index)), secondary: '', accent: '', feature: '' };
    if(adjust) for(const role of ['primary','secondary','accent','feature'] as const){
      const a=state.autoDesign?.intent.materials[role];
      const found=a?choices.findIndex(c=>JSON.stringify(c.assignment)===JSON.stringify(a)):-1;
      if(found>=0)roles[role]=String(found);
    }
    return roles;
  };
  const [roles, setRoles] = useState(initialRoles);
  const initialGuidance = ():DesignGuidance => ({...structuredClone(DEFAULT_GUIDANCE), ...(adjust ? structuredClone(before.autoDesign?.intent.guidance ?? {}) : {}), locks: adjust ? adjustmentLocks(before) : ai ? Object.fromEntries(DESIGN_SYSTEMS.map(s=>[s,manuallyModified(before).includes(s) || s==='floor' && !!before.floorDesign.installation.center.panel])) : {}});
  const modified = manuallyModified(before);
  const [guidance, setGuidance] = useState<DesignGuidance>(initialGuidance);
  const [style, setStyle] = useState<DesignStyle | ''>(() => adjust ? (before.autoDesign?.intent.startingPoint ? '' : before.autoDesign?.intent.style ?? '') : 'minimal'), [proposal, setProposal] = useState<DesignDecision | null>(null), [error, setError] = useState(''), [working, setWorking] = useState(false);
  const [requestText,setRequestText] = useState(''),[aiStyle,setAIStyle]=useState<AIStyle>('auto');
  const [variantIds,setVariantIds]=useState(()=>[...new Set([before.floorDesign.enabled?before.floorDesign.installation.field.tileAssetId:before.materialState.selectedFloorId,...Object.values(before.walls).filter(w=>w.enabled).map(w=>w.tileAssetId),...products.slice(0,3).map(p=>p.id)])].filter(id=>products.some(p=>p.id===id)));
  const [references,setReferences]=useState<File[]>([]),[includeMaterials,setIncludeMaterials]=useState(false),[imageConsent,setImageConsent]=useState(false);
  const usesImages=includeMaterials || references.length>0;
  const [guidanceChanged, setGuidanceChanged] = useState(false);
  const changes = proposal ? changedSystems(before, decisionState(before, proposal)) : [];
  const proposalElement = useRef<HTMLElement>(null);
  useEffect(() => { if (proposal) { proposalElement.current?.scrollIntoView({ block: 'start' }); proposalElement.current?.focus({ preventScroll: true }); } }, [proposal]);
  useEffect(() => { const d = dialog.current; d?.showModal(); return () => { if(ai)aiPlanner.cancel();session.cancel(); d?.close(); }; }, [session, ai, aiPlanner]);
  const reset = () => { session.guidanceChanged(); setGuidanceChanged(previous => previous || proposal !== null); setProposal(null); setError(''); };
  async function generate(next = style) {
    if(ai && usesImages && !imageConsent){setError('Confirm that the selected images may be sent for this proposal.');return;}
    setGuidanceChanged(false); setStyle(next); setError(''); setWorking(true); setProposal(null);
    const materials: DesignMaterials = {};
    for (const role of ['primary', 'secondary', 'accent', 'feature'] as const) if (roles[role] !== '') materials[role] = choices[Number(roles[role])]?.assignment;
    if(ai) aiPlanner.configure({request:requestText,style:aiStyle,variantIds,makeImages:usesImages?(candidates,signal)=>prepareAIImages({references:[...references],includeMaterials,candidates,products,source:p=>localTileLibrary.useLibrary.getState().sources.find(s=>s.id===p.sourceId)?.blob,signal}):undefined});
    try { setProposal(await session.generate({ style: next || 'minimal', ...(next === '' ? {startingPoint:'current-room' as const} : {}), materials, guidance })); } catch (e) { setError((e as Error).message); } finally { setWorking(false);if(ai)setImageConsent(false); }
  }
  const name = (a: PhysicalAssignment) => `${products.find(p => p.id === a.tileAssetId)?.name ?? 'Unavailable material'}${a.physicalOverride ? ` (${a.physicalOverride.widthMm} × ${a.physicalOverride.heightMm} mm project size)` : ''}`;
  const systemName = { floor: 'Floor design', walls: 'Walls', ceiling: 'Ceiling', lighting: 'Lighting', furniture: 'Furniture' };
  const patterns = [['auto','Auto'],['straight','Straight'],['running-bond-50','Running Bond 50'],['running-bond-33','Running Bond 33'],['checker','Checker'],['modular','Modular']] as const;
  const patternName = (value: string) => patterns.find(([id])=>id===value)?.[1] ?? value;
  const lightingName = (color:string) => color==='#fff0d6'?'Warm':color==='#ffffff'?'Neutral':color==='#dceaff'?'Cool':'Custom';
  function preference<K extends Exclude<keyof DesignGuidance,'locks'>>(key:K,label:string,options:readonly (readonly [string,string])[],system?:keyof DesignGuidance['locks']) {
    return <label>{label}<select aria-label={label} value={guidance[key]} disabled={working || !!(system && guidance.locks[system])} onChange={e=>{reset();setGuidance(g=>({...g,[key]:e.target.value}));}}>{options.map(([id,title])=><option key={id} value={id}>{title}</option>)}</select></label>;
  }
  const toggleOptions = [['auto','Auto'],['on','On'],['off','Off']] as const;
  const resetGuidance = () => { reset();setGuidance(initialGuidance());setStyle(adjust ? (before.autoDesign?.intent.startingPoint ? '' : before.autoDesign?.intent.style ?? '') : 'minimal');setRoles(initialRoles());if(ai){if(referenceInput.current)referenceInput.current.value='';setAIStyle('auto');setRequestText('');setReferences([]);setIncludeMaterials(false);setImageConsent(false);} };
  return createPortal(<dialog ref={dialog} className="room-settings-dialog auto-design-dialog" aria-labelledby="auto-design-title" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="floor-design-panel"><header><h2 id="auto-design-title">{ai ? '🤖 AI Designer' : adjust ? 'Adjust Design' : '✨ Auto Design'}</h2><button className="hud-button" onClick={close}>Cancel</button></header>
      <div className="design-draft"><p>{ai ? 'Optional online proposal from the current applied room. AI selects supported finishes; the existing engines build the room.' : adjust ? 'Starting Point: Current Room. Unlock only the systems you want to update. All other choices stay as applied.' : 'Guide a local design proposal. Your room changes only when you apply.'}</p>{adjust && !before.autoDesign && <p>No saved Auto Design history. Guidance starts at Auto; the current room is preserved.</p>}{(adjust || ai) && before.floorDesign.installation.center.panel && <p>Decorative panel preserved with Floor. Unlocking Floor permits replacing its center and panel.</p>}
        {ai && <div className="ai-design-context">
          <label>Design Request<textarea maxLength={AI_LIMITS.prompt} value={requestText} disabled={working} placeholder="Optional: keep the floor light and use the dark slab as a feature wall" onChange={e=>{reset();setRequestText(e.target.value);}}/></label>
          <label>Style Intent<select value={aiStyle} disabled={working} onChange={e=>{reset();setAIStyle(e.target.value as AIStyle);}}>{AI_STYLES.map(s=><option key={s} value={s}>{s[0].toUpperCase()+s.slice(1)}</option>)}</select></label>
          <details open className="auto-design-section"><summary>Selected materials · include project physical sizes</summary><div className="auto-design-locks">{products.map(p=><label className="design-toggle" key={p.id}><input type="checkbox" checked={variantIds.includes(p.id)} disabled={working} onChange={e=>{reset();setImageConsent(false);setVariantIds(ids=>e.target.checked?[...ids,p.id]:ids.filter(id=>id!==p.id));}}/>{p.name}</label>)}</div><p className="design-hint">Up to 12 candidates including project overrides. Material names, sizes, finishes and quality are sent with the current room dimensions and openings.</p></details>
          <label>Reference / moodboard images (up to 3)<input ref={referenceInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={working} onChange={e=>{reset();setImageConsent(false);const files=[...e.target.files??[]];if(files.length>3||files.some(f=>f.size>5_000_000||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('Choose up to 3 JPG, PNG or WebP images, each up to 5 MB.');e.target.value='';setReferences([]);}else setReferences(files);}}/></label>
          {!!references.length && <p className="design-hint">{references.length} reference image(s) · temporary context, not geometry</p>}
          <label className="design-toggle"><input type="checkbox" checked={includeMaterials} disabled={working} onChange={e=>{reset();setIncludeMaterials(e.target.checked);setImageConsent(false);}}/>Include selected material images (up to 6 variants)</label>
          {usesImages && <p className="design-hint">Selected images will be sent to the AI service to generate this design proposal. Temporary analysis copies are used; original library images stay unchanged. Built-in fallback swatches are procedural, not product photographs.</p>}
          {usesImages && <label className="design-toggle"><input type="checkbox" checked={imageConsent} disabled={working} onChange={e=>setImageConsent(e.target.checked)}/>Send the selected images for this proposal</label>}
        </div>}
        <div className="auto-design-inputs">
          {!ai && <label>Style<select value={style} disabled={working} onChange={e => { reset(); setStyle(e.target.value as DesignStyle); }}>{adjust && <option value="">Current Room (no historical style)</option>}{DESIGN_STYLES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label>}
          {preference('strength','Design Strength',[['subtle','Subtle'],['balanced','Balanced'],['dramatic','Dramatic']])}
        </div>
        {!ai && <details className="auto-design-section" open><summary>Materials</summary><div className="auto-design-inputs">
          {(['primary', 'secondary', 'accent', 'feature'] as const).map(role => <label key={role}>{role[0].toUpperCase() + role.slice(1)} material<select aria-label={`${role} material`} value={roles[role]} disabled={working} onChange={e => { reset(); setRoles(r => ({ ...r, [role]: e.target.value })); }}><option value="">None</option>{choices.map((c, index) => <option key={index} value={index}>{c.label}</option>)}</select></label>)}
        </div></details>}
        <details className="auto-design-section"><summary>Surfaces &amp; room</summary><div className="auto-design-inputs">
          {preference('floorPattern','Floor Pattern',patterns,'floor')}
          {preference('center','Center',toggleOptions,'floor')}
          {preference('centerFrame','Center Frame',toggleOptions,'floor')}
          {preference('featureWall','Feature Wall',[['auto','Auto'],['front','Front'],['back','Back'],['left','Left'],['right','Right'],['none','None']],'walls')}
          {preference('wallCoverage','Wall Coverage',[['auto','Auto'],['feature-only','Feature Wall Only'],['multiple','Multiple Walls']],'walls')}
          {preference('ceiling','Ceiling',[['auto','Auto'],['simple','Simple'],['gypsum','Gypsum']],'ceiling')}
          {preference('lighting','Lighting',[['auto','Auto'],['warm','Warm'],['neutral','Neutral'],['cool','Cool']],'lighting')}
          {preference('furniture','Furniture',[['auto','Auto'],['show','Show'],['hide','Hide']],'furniture')}
        </div></details>
        <details className="auto-design-section" open><summary>Preserve current choices</summary><div className="auto-design-locks">
          {DESIGN_SYSTEMS.map(key=><label className="design-toggle" key={key}><input type="checkbox" checked={!!guidance.locks[key]} disabled={working} onChange={e=>{reset();setGuidance(g=>({...g,locks:{...g.locks,[key]:e.target.checked}}));}}/>Keep Current {key[0].toUpperCase()+key.slice(1)}{(adjust || ai) && modified.includes(key) ? ' · Modified manually' : ''}</label>)}
        </div></details>
        {guidanceChanged && <p role="status" className="auto-design-stale"><strong>Guidance changed.</strong> Preview the updated design before applying.</p>}
        <div className="auto-design-actions"><button className="hud-button" disabled={working} onClick={resetGuidance}>Reset Guidance</button>
        {!proposal && <button className="hud-button hud-button-primary" disabled={working || busy || ai && usesImages && !imageConsent} onClick={() => void generate()}>{working ? ai ? 'Designing…' : 'Generating…' : ai ? 'Generate AI Proposal' : adjust ? 'Preview Changes' : 'Generate Proposal'}</button>}</div>
        {proposal && <section ref={proposalElement} tabIndex={-1} className="auto-design-proposal" aria-label="Design proposal"><h3>{ai ? 'AI Design Proposal · ' : adjust ? 'Design Changes · ' : ''}{adjust && !style ? 'Current Room' : proposal.style[0].toUpperCase() + proposal.style.slice(1) + ' Concept'} — {proposal.strength?.[0].toUpperCase()}{proposal.strength?.slice(1)}</h3>
          {ai && proposal.summary && <p>{proposal.summary}</p>}
          <p role="status">{changes.length ? `Changed: ${changes.map(s=>systemName[s]).join(', ')}` : MATCHING_ROOM_MESSAGE}</p>
          {!!proposal.materialUsage?.length && <dl aria-label="Material role usage">{proposal.materialUsage.map(u=><Fragment key={u.role}><dt>{u.role[0].toUpperCase()+u.role.slice(1)}</dt><dd data-material-role={u.role} data-role-status={u.status}>{name(u.assignment)} → {u.status==='used' ? u.destinations.join(', ') : u.status==='constrained' ? 'Unable to place with current constraints' : 'Not assigned by this proposal'}{u.reasons.map(reason=><p className="design-hint" key={reason}>{reason}</p>)}</dd></Fragment>)}</dl>}
          {!!proposal.preserved?.length && <p className="auto-design-preserved"><strong>Preserved:</strong> {proposal.preserved.map(s=>s==='floor' && adjust ? 'Floor design (including Center / Frame / Panel)' : systemName[s]).join(', ')}</p>}
          {proposal.warnings.some(w=>w.includes('Fallback:')||w.includes('cannot be satisfied'))&&<p role="status">Can apply with adjustments. Review the choices below.</p>}
          <dl>
          <dt>Floor</dt><dd>{proposal.preserved?.includes('floor')?'Preserved · ':''}{proposal.floor.enabled ? `${name(proposal.floor.installation.field)} · ${patternName(proposal.floor.installation.field.pattern)}` : `Simple · ${name({tileAssetId:before.materialState.selectedFloorId,physicalOverride:before.materialState.physicalOverride})}`}</dd>
          <dt>Center</dt><dd>{proposal.floor.enabled && proposal.floor.installation.center.enabled ? proposal.floor.installation.center.panel ? `Decorative Panel · ${proposal.floor.installation.center.panel.name} · revision ${proposal.floor.installation.center.panel.revision}` : name(proposal.floor.installation.center) : 'Off'}</dd>
          <dt>Center frame</dt><dd>{proposal.floor.enabled && proposal.floor.installation.centerFrame.enabled ? name(proposal.floor.installation.centerFrame) : 'Off'}</dd>
          <dt>Feature wall</dt><dd>{proposal.preserved?.includes('walls')?'Preserved':proposal.featureWall ? `${proposal.featureWall} wall · ${name(proposal.walls[proposal.featureWall])}` : 'None'}</dd>
          {adjust && Object.entries(proposal.walls).filter(([id,w])=>JSON.stringify(w)!==JSON.stringify(before.walls[id as keyof typeof before.walls])).map(([id,w])=><Fragment key={id}><dt>{id} wall</dt><dd>{before.walls[id as keyof typeof before.walls].enabled ? name(before.walls[id as keyof typeof before.walls]) : 'Neutral'} → {w.enabled ? name(w) : 'Neutral'}</dd></Fragment>)}
          <dt>Other walls</dt><dd>{Object.entries(proposal.walls).filter(([id,w])=>w.enabled&&id!==proposal.featureWall).map(([id,w])=>`${id}: ${name(w)}`).join('; ')||'Neutral'}</dd>
          <dt>Ceiling</dt><dd>{proposal.preserved?.includes('ceiling')?'Preserved · ':`${before.architecture.ceiling.style} → `}{proposal.ceiling.style}</dd>
          <dt>Lighting</dt><dd>{proposal.preserved?.includes('lighting')?'Preserved · ':`${lightingName(before.lighting.lightingColor)} ${before.lighting.lightingBrightness}% → `}{proposal.lighting.lightingEnabled?`${lightingName(proposal.lighting.lightingColor)} · ${proposal.lighting.lightingBrightness}%`:'Off'}</dd>
          <dt>Furniture</dt><dd>{proposal.preserved?.includes('furniture')?'Preserved · ':''}{proposal.furnitureVisible?'Shown':'Hidden'}</dd>
        </dl>{proposal.warnings.map(w => <p className="design-hint" key={w}>{w}</p>)}<details open={ai}><summary>{ai?'AI rationale and validated design choices':'Design choices'}</summary>{proposal.reasons.map(r => <p key={r}>{r}</p>)}</details>
          <div className="auto-design-actions"><button className="hud-button hud-button-primary" disabled={busy || working || !changes.length} onClick={() => { try { session.apply(); close(); } catch (e) { setError((e as Error).message); } }}>{ai ? 'Apply AI Proposal' : adjust ? 'Update Design' : 'Apply Design'}</button>{!ai && <button className="hud-button" disabled={working || busy} onClick={() => void generate(DESIGN_STYLES[(DESIGN_STYLES.indexOf(style || 'minimal') + 1) % DESIGN_STYLES.length])}>Try Another Style</button>}</div>
        </section>}
        {error && <p className="design-error" role="alert">{error}</p>}{ai && <button className="hud-button" disabled={working} onClick={useLocal}>Use Auto Design instead</button>}
      </div>
    </div>
  </dialog>, document.body);
}
