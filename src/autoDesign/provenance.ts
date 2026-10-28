import type { AppliedProjectState } from '../projects/model.ts';
import { DEFAULT_GUIDANCE, DESIGN_STYLES, DESIGN_SYSTEMS, type DesignIntent, type DesignSystem, type DesignLocks, type AIPlannerInfo } from './model.ts';
import { validPhysicalSize } from '../tiles/physicalSize.ts';

/** Optional semantic history. Unknown/damaged history never prevents opening a room. */
export type AutoDesignProvenance = {
  generatedBy?:'local-auto'|'ai';
  ai?:Omit<AIPlannerInfo,'generatedBy'>;
  version: 1;
  intent: DesignIntent;
  appliedAt: string;
  appliedDecisionFingerprint: string;
  baselines: Partial<Record<DesignSystem, string>>;
};
export function normalizeProvenance(value: unknown): AutoDesignProvenance | undefined {
  try {
    const p = value as AutoDesignProvenance;
    if (!p || p.version !== 1 || !Number.isFinite(Date.parse(p.appliedAt)) || !DESIGN_STYLES.includes(p.intent.style)) return;
    const materials: DesignIntent['materials'] = {};
    for (const role of ['primary','secondary','accent','feature'] as const) {
      const a=p.intent.materials[role];
      if(a) {
        if(typeof a.tileAssetId!=='string'||!a.tileAssetId.length||a.tileAssetId.length>128||a.physicalOverride&&!validPhysicalSize(a.physicalOverride))return;
        materials[role]={tileAssetId:a.tileAssetId,...(a.physicalOverride?{physicalOverride:{widthMm:a.physicalOverride.widthMm,heightMm:a.physicalOverride.heightMm}}:{})};
      }
    }
    const g={...DEFAULT_GUIDANCE,...p.intent.guidance}, allowed={strength:['subtle','balanced','dramatic'],floorPattern:['auto','straight','running-bond-50','running-bond-33','checker','modular'],center:['auto','on','off'],centerFrame:['auto','on','off'],featureWall:['auto','none','front','back','left','right'],wallCoverage:['auto','feature-only','multiple'],ceiling:['auto','simple','gypsum'],lighting:['auto','warm','neutral','cool'],furniture:['auto','show','hide']};
    for(const [key,values] of Object.entries(allowed))if(!values.includes(g[key as keyof typeof allowed]))return;
    const locks: NonNullable<DesignIntent['guidance']>['locks']={},baselines:AutoDesignProvenance['baselines']={};
    const savedLocks=p.intent.guidance?.locks;
    const hasLocks=!!savedLocks && typeof savedLocks==='object' && !Array.isArray(savedLocks);
    for(const key of DESIGN_SYSTEMS){if(hasLocks)locks[key]=savedLocks[key]===undefined?false:typeof savedLocks[key]==='boolean'?savedLocks[key]:true;const b=p.baselines[key];if(typeof b==='string'&&b.length<100000)baselines[key]=b;}
    if(typeof p.appliedDecisionFingerprint!=='string'||p.appliedDecisionFingerprint.length>500000)return;
    const guidance = Object.fromEntries(Object.keys(allowed).map(key=>[key,g[key as keyof typeof allowed]])) as Omit<typeof DEFAULT_GUIDANCE,'locks'>;
    const origin = p.generatedBy==='ai' && p.ai?.provider==='openai' && p.ai.plannerVersion===1 && typeof p.ai.model==='string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(p.ai.model) && !p.ai.model.startsWith('sk-') ? {generatedBy:'ai' as const,ai:{provider:'openai' as const,model:p.ai.model,plannerVersion:1 as const}} : p.generatedBy==='local-auto'?{generatedBy:'local-auto' as const}:{};
    return {...origin,version:1,intent:{...(p.intent.startingPoint==='current-room'?{startingPoint:'current-room' as const}:{}),style:p.intent.style,materials,guidance:{...guidance,...(hasLocks?{locks}:{})}},appliedAt:new Date(p.appliedAt).toISOString(),appliedDecisionFingerprint:p.appliedDecisionFingerprint,baselines};
  } catch { return; }
}
export function subsystemFingerprints(s:AppliedProjectState):Record<DesignSystem,string>{
  return {floor:JSON.stringify([s.roomSize,s.floorDesign,s.materialState]),walls:JSON.stringify([s.roomSize,s.architecture.heightMm,s.architecture.window,s.walls]),ceiling:JSON.stringify([s.roomSize,s.architecture.heightMm,s.architecture.ceiling]),lighting:JSON.stringify(s.lighting),furniture:JSON.stringify(s.architecture.furnitureVisible)};
}
export function changedSystems(before:AppliedProjectState,after:AppliedProjectState):DesignSystem[]{
  const a=subsystemFingerprints(before),b=subsystemFingerprints(after);
  return DESIGN_SYSTEMS.filter(key=>a[key]!==b[key]);
}
export function manuallyModified(s:AppliedProjectState):DesignSystem[]{
  const current=subsystemFingerprints(s);
  return DESIGN_SYSTEMS.filter(key=>s.autoDesign?.baselines[key]!==undefined&&s.autoDesign.baselines[key]!==current[key]);
}
/** Prefill only: current room stays authoritative; manual work overrides saved unlocks. */
export function adjustmentLocks(state:AppliedProjectState):DesignLocks{
  const modified=manuallyModified(state), saved=state.autoDesign?.intent.guidance?.locks;
  return Object.fromEntries(DESIGN_SYSTEMS.map(key=>[key,modified.includes(key) || (typeof saved?.[key]==='boolean'?saved[key]:true)]));
}
export function provenanceFor(state:AppliedProjectState,intent:DesignIntent,before:AppliedProjectState,preserved:DesignSystem[],plannerInfo?:AIPlannerInfo):AutoDesignProvenance{
  const baselines=subsystemFingerprints(state);
  // A preserved manual edit stays visibly manual after updating a different subsystem.
  for(const key of preserved)if(before.autoDesign?.baselines[key])baselines[key]=before.autoDesign.baselines[key]!;
  return {...(plannerInfo?{generatedBy:'ai' as const,ai:{provider:plannerInfo.provider,model:plannerInfo.model,plannerVersion:plannerInfo.plannerVersion}}:{generatedBy:'local-auto' as const}),version:1,intent:{...structuredClone(intent),guidance:{...structuredClone(intent.guidance),locks:Object.fromEntries(DESIGN_SYSTEMS.map(key=>[key,intent.guidance?.locks?.[key]===true]))}},appliedAt:new Date().toISOString(),appliedDecisionFingerprint:JSON.stringify(subsystemFingerprints(state)),baselines};
}
