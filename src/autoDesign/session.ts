import { changedSystems, provenanceFor, normalizeProvenance } from './provenance.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import { assetReferences, normalizeAppliedState, stateFingerprint, type AppliedProjectState } from '../projects/model.ts';
import { prepareAutoDesign } from './prepare.ts';
export { prepareAutoDesign } from './prepare.ts';
import { preserveLockedSystems } from './locks.ts';
import type { DesignDecision, DesignIntent, DesignPlanner } from './model.ts';

export function decisionState(before: AppliedProjectState, decision: DesignDecision): AppliedProjectState {
  if (decision.version !== 1) throw Error('Unsupported Auto Design decision version.');
  return normalizeAppliedState({ ...before, floorDesign: decision.floor, walls: decision.walls,
    architecture: { ...before.architecture, ceiling: decision.ceiling, furnitureVisible: decision.furnitureVisible },
    lighting: decision.lighting, materialState: decision.materialState ?? { ...before.materialState, compareActive: false } });
}
export const MATCHING_ROOM_MESSAGE = 'This proposal matches the current room. No room changes will be applied.';
type Prepared = ReturnType<typeof prepareAutoDesign>;
type Runtime = {
  capture(): AppliedProjectState;
  projectKey(): string;
  products(): MaterialProduct[];
  publish(prepared: Prepared): void;
  prepare?: typeof prepareAutoDesign;
};
/** Project-bound preview and one-level atomic transaction. */
export function createAutoDesignSession(runtime: Runtime, planner: DesignPlanner) {
  let serial = 0, guidanceChanged = false;
  let proposal: { intent: DesignIntent; decision: DesignDecision; before: AppliedProjectState; key: string; fingerprint: string; products: string; prepared?: Prepared } | null = null;
  let undo: { state: AppliedProjectState; key: string; applied: string } | null = null;
  const productKey = () => JSON.stringify(runtime.products().map(p => ({ id: p.id, name:p.name,finish:p.finish,color:p.baseColor,roughness:p.roughnessValue,procedural:p.proceduralStyle,aspect:p.sourceAspect,normal:p.normalTexture,roughnessTexture:p.roughnessTexture,size: p.physicalSizeMm, w: p.tileWidth, h: p.tileHeight, kind: p.productKind, source: p.sourceId, transform: p.imageTransform, texture: p.texture, pixels: [p.pixelWidth,p.pixelHeight] })).sort((a, b) => a.id.localeCompare(b.id)));
  const prepare = runtime.prepare ?? prepareAutoDesign;
  const current = () => stateFingerprint(runtime.capture());
  return {
    async generate(intent: DesignIntent) {
      const request = ++serial, before = normalizeAppliedState(runtime.capture()), key = runtime.projectKey(), fingerprint = stateFingerprint(before), products = productKey();
      proposal = null;
      const requested = structuredClone(intent);
      const generated = await planner.generate({ intent: structuredClone(requested), state: structuredClone(before), products: runtime.products() });
      const decision = preserveLockedSystems(before, generated, requested.guidance?.locks ?? {});
      const target = decisionState(before, decision);
      const ids = new Set(runtime.products().map(p => p.id));
      if (assetReferences(target).some(id => !ids.has(id))) throw Error('A design material is no longer available. Choose materials again.');
      if (request !== serial || key !== runtime.projectKey() || fingerprint !== current() || products !== productKey()) throw Error('The project or material library changed. Generate a new proposal.');
      // AI validates geometry before review. Local metadata-only previews retain zero compilation.
      let prepared: Prepared | undefined;
      if(decision.plannerInfo)try{prepared=prepare(target,runtime.products());}catch{throw Error('The AI proposal could not be applied safely. Try again or adjust the request.');}
      if (request !== serial || key !== runtime.projectKey() || fingerprint !== current() || products !== productKey()) throw Error('The project or material library changed. Generate a new proposal.');
      guidanceChanged = false;
      proposal = { intent: requested, decision: structuredClone(decision), before, key, fingerprint, products, prepared };
      return structuredClone(decision);
    },
    guidanceChanged() { ++serial; proposal = null; guidanceChanged = true; },
    cancel() { ++serial; proposal = null; },
    invalidate() { ++serial; proposal = null; undo = null; },
    apply() {
      if (guidanceChanged) throw Error('Guidance changed. Preview the updated design before applying.');
      const p = proposal;
      if (!p || p.key !== runtime.projectKey() || p.fingerprint !== current() || p.products !== productKey()) throw Error('The project or material library changed. Generate a new proposal.');
      // All throwing work completes before a synchronous publication.
      const target = p.prepared ? {...p.prepared.state} : decisionState(p.before, p.decision);
      if (!changedSystems(p.before, target).length) throw Error(MATCHING_ROOM_MESSAGE);
      target.autoDesign = normalizeProvenance(provenanceFor(target, p.decision.appliedIntent ?? p.intent, p.before, p.decision.preserved ?? [], p.decision.plannerInfo));
      const prepared = p.prepared ? {...p.prepared,state:target} : prepare(target, runtime.products());
      runtime.publish(prepared);
      undo = { state: p.before, key: p.key, applied: stateFingerprint(prepared.state) };
      proposal = null;
    },
    undo() {
      const u = undo;
      if (!u || u.key !== runtime.projectKey() || u.applied !== current()) throw Error('The project changed after Auto Design. Undo is no longer available.');
      const prepared = prepare(u.state, runtime.products());
      runtime.publish(prepared); undo = null;
    },
    canUndo() { return !!undo && undo.key === runtime.projectKey() && undo.applied === current(); },
  };
}
