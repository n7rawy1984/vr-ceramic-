import type { MaterialProduct } from '../catalog/types.ts';
import { assetReferences, normalizeAppliedState, stateFingerprint, type AppliedProjectState } from '../projects/model.ts';
import { prepareProjectState } from '../projects/resolve.ts';
import type { DesignDecision, DesignIntent, DesignPlanner } from './model.ts';

/** Strict Auto Design preparation: project Open's missing-material fallback is never used. */
export function prepareAutoDesign(state: AppliedProjectState, products: MaterialProduct[]) {
  const parsed = normalizeAppliedState(state);
  const missing = assetReferences(parsed).filter(id => !products.some(p => p.id === id));
  if (missing.length) throw Error('A design material was deleted or is unavailable. Choose materials again.');
  return prepareProjectState(parsed, products, {});
}
export function decisionState(before: AppliedProjectState, decision: DesignDecision): AppliedProjectState {
  if (decision.version !== 1) throw Error('Unsupported Auto Design decision version.');
  return normalizeAppliedState({ ...before, floorDesign: decision.floor, walls: decision.walls,
    architecture: { ...before.architecture, ceiling: decision.ceiling, furnitureVisible: decision.furnitureVisible },
    lighting: decision.lighting, materialState: { ...before.materialState, compareActive: false } });
}
type Prepared = ReturnType<typeof prepareAutoDesign>;
type Runtime = {
  capture(): AppliedProjectState;
  projectKey(): string;
  products(): MaterialProduct[];
  publish(prepared: Prepared): void;
  prepare?: typeof prepareAutoDesign;
};
/** Ephemeral one-level transaction; no project schema or persistence dependency. */
export function createAutoDesignSession(runtime: Runtime, planner: DesignPlanner) {
  let serial = 0;
  let proposal: { decision: DesignDecision; before: AppliedProjectState; key: string; fingerprint: string; products: string } | null = null;
  let undo: { state: AppliedProjectState; key: string; applied: string } | null = null;
  const productKey = () => JSON.stringify(runtime.products().map(p => ({ id: p.id, size: p.physicalSizeMm, w: p.tileWidth, h: p.tileHeight, kind: p.productKind, source: p.sourceId, transform: p.imageTransform, texture: p.texture })).sort((a, b) => a.id.localeCompare(b.id)));
  const prepare = runtime.prepare ?? prepareAutoDesign;
  const current = () => stateFingerprint(runtime.capture());
  return {
    async generate(intent: DesignIntent) {
      const request = ++serial, before = normalizeAppliedState(runtime.capture()), key = runtime.projectKey(), fingerprint = stateFingerprint(before), products = productKey();
      proposal = null;
      const decision = await planner.generate({ intent: structuredClone(intent), state: structuredClone(before), products: runtime.products() });
      if (request !== serial || key !== runtime.projectKey() || fingerprint !== current() || products !== productKey()) throw Error('The project or material library changed. Generate a new proposal.');
      proposal = { decision: structuredClone(decision), before, key, fingerprint, products };
      return structuredClone(decision);
    },
    cancel() { ++serial; proposal = null; },
    invalidate() { ++serial; proposal = null; undo = null; },
    apply() {
      const p = proposal;
      if (!p || p.key !== runtime.projectKey() || p.fingerprint !== current() || p.products !== productKey()) throw Error('The project or material library changed. Generate a new proposal.');
      // All throwing work completes before a synchronous publication.
      const prepared = prepare(decisionState(p.before, p.decision), runtime.products());
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
