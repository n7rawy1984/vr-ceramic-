import type { MaterialProduct } from '../catalog/types.ts';
import type { AppliedProjectState } from '../projects/model.ts';
import type { PhysicalAssignment } from '../tiles/physicalSize.ts';
import type { WallId } from '../surfaces/model.ts';

export const DESIGN_STYLES = ['minimal', 'luxury', 'bold'] as const;
export type DesignStyle = typeof DESIGN_STYLES[number];
export type MaterialRole = 'primary' | 'secondary' | 'accent' | 'feature';
export type DesignMaterials = Partial<Record<MaterialRole, PhysicalAssignment>>;
/** Future local references only. No transport, image upload or AI service exists. */
export type DesignIntent = {
  style: DesignStyle;
  materials: DesignMaterials;
  prompt?: string;
  images?: { localReference: string; purpose: 'reference' | 'moodboard' | 'material' }[];
};
export type PlannerInput = { intent: DesignIntent; state: AppliedProjectState; products: MaterialProduct[] };
/** Semantic commands only; never pixels, meshes, compiled placements or architectural changes. */
export type DesignDecision = {
  version: 1;
  style: DesignStyle;
  floor: AppliedProjectState['floorDesign'];
  walls: AppliedProjectState['walls'];
  featureWall: WallId | null;
  ceiling: AppliedProjectState['architecture']['ceiling'];
  lighting: AppliedProjectState['lighting'];
  furnitureVisible: boolean;
  warnings: string[];
  reasons: string[];
};
/** LocalRulePlanner and a future AIPlanner share this boundary. Validate either on Apply. */
export interface DesignPlanner { generate(input: PlannerInput): Promise<DesignDecision> }
export type DesignConcepts = { concepts: DesignDecision[] };
