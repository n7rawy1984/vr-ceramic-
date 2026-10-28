import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { useFloorDesign } from '../layout/useFloorDesign';
import { useProjects } from '../projects/context';
import { captureAppliedProject } from '../projects/runtime';
import { createAutoDesignSession } from '../autoDesign/session';
import { LocalRulePlanner } from '../autoDesign/planner';
import { DESIGN_STYLES, type DesignDecision, type DesignMaterials, type DesignStyle } from '../autoDesign/model';
import type { PhysicalAssignment } from '../tiles/physicalSize';
import { layoutAsset } from '../layout/assets';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { xrStore } from '../xr/store';
import { useConfiguratorStore } from '../state/useConfiguratorStore';

type Choice = { label: string; assignment: PhysicalAssignment };
export function AutoDesign() {
  const { products, restoreProject } = useFloorDesign(), projects = useProjects();
  const project = useStore(projects.store);
  const inXR = useStore(xrStore, s => s.session != null);
  // Re-render availability on semantic edits, without compiling or changing stores.
  useFloorDesignStore(s => s);
  useConfiguratorStore(s => s);
  const live = useRef({ products, restoreProject, project }); live.current = { products, restoreProject, project };
  const [session] = useState(() => createAutoDesignSession({ capture: captureAppliedProject, products: () => live.current.products,
    projectKey: () => live.current.project.active?.id ?? 'unsaved', publish: p => live.current.restoreProject(p) }, new LocalRulePlanner()));
  const [open, setOpen] = useState(false), [error, setError] = useState(''), [, refresh] = useState(0);
  useEffect(() => projects.store.subscribe((s, p) => { if (s.active?.id !== p.active?.id) { session.invalidate(); setOpen(false); refresh(n => n + 1); } }), [projects, session]);
  if (inXR) return null;
  return <>
    <div className="auto-design-entry">
      <button className="hud-button" disabled={project.busy || project.status !== 'ready'} onClick={() => { setError(''); setOpen(true); }}>✨ Auto Design</button>
      {session.canUndo() && <button className="hud-button" disabled={project.busy} onClick={() => { try { session.undo(); setError(''); } catch (e) { setError((e as Error).message); } refresh(n => n + 1); }}>Undo Auto Design</button>}
      {error && <span role="alert">{error}</span>}
    </div>
    {open && <AutoDesignDialog products={products} session={session} busy={project.busy} close={() => { session.cancel(); setOpen(false); refresh(n => n + 1); }} />}
  </>;
}

function AutoDesignDialog({ products, session, close, busy }: {
  products: ReturnType<typeof useFloorDesign>['products']; session: ReturnType<typeof createAutoDesignSession>; close(): void; busy: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [choices] = useState<Choice[]>(() => {
    const state = captureAppliedProject(), i = state.floorDesign.installation;
    const assigned: [string, PhysicalAssignment][] = [ ['Current simple floor', { tileAssetId: state.materialState.selectedFloorId, physicalOverride: state.materialState.physicalOverride }],
      ['Current field', i.field], ['Current center', i.center], ['Current frame', i.centerFrame], ...Object.entries(state.walls).map(([id, w]) => [`Current ${id} wall`, w] as [string, PhysicalAssignment]) ];
    return [...assigned.filter(([, a]) => a.physicalOverride).map(([label, a]) => ({ label: `${label} · ${products.find(p => p.id === a.tileAssetId)?.name ?? 'Unavailable material'} · project size ${a.physicalOverride!.widthMm} × ${a.physicalOverride!.heightMm} mm`, assignment: structuredClone({ tileAssetId: a.tileAssetId, physicalOverride: a.physicalOverride }) })),
      ...products.map(p => { const a = layoutAsset(p); return { label: `${p.name} · ${a.productKind} · ${a.widthMm} × ${a.heightMm} mm`, assignment: { tileAssetId: p.id } }; })];
  });
  const [roles, setRoles] = useState(() => {
    const state = captureAppliedProject();
    const current = state.floorDesign.enabled ? state.floorDesign.installation.field : { tileAssetId: state.materialState.selectedFloorId, physicalOverride: state.materialState.physicalOverride };
    const index = choices.findIndex(c => c.assignment.tileAssetId === current.tileAssetId && c.assignment.physicalOverride?.widthMm === current.physicalOverride?.widthMm && c.assignment.physicalOverride?.heightMm === current.physicalOverride?.heightMm);
    return { primary: String(Math.max(0, index)), secondary: '', accent: '' };
  });
  const [style, setStyle] = useState<DesignStyle>('minimal'), [proposal, setProposal] = useState<DesignDecision | null>(null), [error, setError] = useState(''), [working, setWorking] = useState(false);
  useEffect(() => { const d = dialog.current; d?.showModal(); return () => { session.cancel(); d?.close(); }; }, [session]);
  const reset = () => { session.cancel(); setProposal(null); setError(''); };
  async function generate(next = style) {
    setStyle(next); setError(''); setWorking(true); setProposal(null);
    const materials: DesignMaterials = {};
    for (const role of ['primary', 'secondary', 'accent'] as const) if (roles[role] !== '') materials[role] = choices[Number(roles[role])]?.assignment;
    try { setProposal(await session.generate({ style: next, materials })); } catch (e) { setError((e as Error).message); } finally { setWorking(false); }
  }
  const name = (a: PhysicalAssignment) => `${products.find(p => p.id === a.tileAssetId)?.name ?? 'Unavailable material'}${a.physicalOverride ? ` (${a.physicalOverride.widthMm} × ${a.physicalOverride.heightMm} mm project size)` : ''}`;
  return createPortal(<dialog ref={dialog} className="room-settings-dialog auto-design-dialog" aria-labelledby="auto-design-title" onCancel={e => { e.preventDefault(); close(); }}>
    <div className="floor-design-panel"><header><h2 id="auto-design-title">✨ Auto Design</h2><button className="hud-button" onClick={close}>Cancel</button></header>
      <div className="design-draft"><p>Choose materials for a local design proposal. Your room changes only when you apply.</p>
        <div className="auto-design-inputs">
          <label>Style<select value={style} disabled={working} onChange={e => { reset(); setStyle(e.target.value as DesignStyle); }}>{DESIGN_STYLES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label>
          {(['primary', 'secondary', 'accent'] as const).map(role => <label key={role}>{role[0].toUpperCase() + role.slice(1)} material<select aria-label={`${role} material`} value={roles[role]} disabled={working} onChange={e => { reset(); setRoles(r => ({ ...r, [role]: e.target.value })); }}><option value="">None</option>{choices.map((c, index) => <option key={index} value={index}>{c.label}</option>)}</select></label>)}
        </div>
        {!proposal && <button className="hud-button hud-button-primary" disabled={working || busy} onClick={() => void generate()}>{working ? 'Generating…' : 'Generate Proposal'}</button>}
        {proposal && <section className="auto-design-proposal" aria-label="Design proposal"><h3>{proposal.style[0].toUpperCase() + proposal.style.slice(1)} Concept</h3><dl>
          <dt>Floor</dt><dd>{name(proposal.floor.installation.field)} · Straight</dd>
          <dt>Center</dt><dd>{proposal.floor.installation.center.enabled ? name(proposal.floor.installation.center) : 'Off'}</dd>
          <dt>Center frame</dt><dd>{proposal.floor.installation.centerFrame.enabled ? name(proposal.floor.installation.centerFrame) : 'Off'}</dd>
          <dt>Feature wall</dt><dd>{proposal.featureWall ? `${proposal.featureWall} wall · ${name(proposal.walls[proposal.featureWall])}` : 'None'}</dd>
          <dt>Other walls</dt><dd>Neutral</dd><dt>Ceiling</dt><dd>{proposal.ceiling.style}</dd><dt>Lighting</dt><dd>{proposal.style === 'luxury' ? 'Warm' : proposal.style === 'bold' ? 'Cool' : 'Neutral'} · {proposal.lighting.lightingBrightness}%</dd><dt>Furniture</dt><dd>Hidden</dd>
        </dl>{proposal.warnings.map(w => <p className="design-hint" key={w}>{w}</p>)}<details><summary>Design choices</summary>{proposal.reasons.map(r => <p key={r}>{r}</p>)}</details>
          <div className="auto-design-actions"><button className="hud-button hud-button-primary" disabled={busy || working} onClick={() => { try { session.apply(); close(); } catch (e) { setError((e as Error).message); } }}>Apply Design</button><button className="hud-button" disabled={working || busy} onClick={() => void generate(DESIGN_STYLES[(DESIGN_STYLES.indexOf(style) + 1) % DESIGN_STYLES.length])}>Try Another Style</button></div>
        </section>}
        {error && <p className="design-error" role="alert">{error}</p>}
      </div>
    </div>
  </dialog>, document.body);
}
