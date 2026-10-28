import type { AppliedProjectState } from '../projects/model.ts';
import { DESIGN_SYSTEMS, type DesignDecision, type DesignLocks } from './model.ts';
/** Also enforced by the transaction boundary for any future planner. */
export function preserveLockedSystems(before: AppliedProjectState, decision: DesignDecision, locks: DesignLocks): DesignDecision {
  const d = structuredClone(decision);
  d.preserved = DESIGN_SYSTEMS.filter(key => locks[key]);
  if (locks.floor) { d.floor = structuredClone(before.floorDesign); d.materialState = structuredClone(before.materialState); }
  if (locks.walls) { d.walls = structuredClone(before.walls); d.featureWall = null; }
  if (locks.ceiling) d.ceiling = structuredClone(before.architecture.ceiling);
  if (locks.lighting) d.lighting = structuredClone(before.lighting);
  if (locks.furniture) d.furnitureVisible = before.architecture.furnitureVisible;
  return d;
}
