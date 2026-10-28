import type { MaterialProduct } from '../catalog/types.ts';
import type { AppliedProjectState } from '../projects/model.ts';
import type { PhysicalAssignment } from '../tiles/physicalSize.ts';
import type { WallId } from '../surfaces/model.ts';
import type { LayoutPattern } from '../layout/model.ts';

export const DESIGN_STYLES = ['minimal', 'luxury', 'bold'] as const;
export type DesignStyle = typeof DESIGN_STYLES[number];
export type MaterialRole = 'primary' | 'secondary' | 'accent' | 'feature';
export type DesignMaterials = Partial<Record<MaterialRole, PhysicalAssignment>>;
export const DESIGN_SYSTEMS = ['floor', 'walls', 'ceiling', 'lighting', 'furniture'] as const;
export type DesignSystem = typeof DESIGN_SYSTEMS[number];
export type DesignLocks = Partial<Record<DesignSystem, boolean>>;
export type DesignStrength = 'subtle' | 'balanced' | 'dramatic';
export type DesignGuidance = {
  strength: DesignStrength;
  floorPattern: 'auto' | LayoutPattern;
  center: 'auto' | 'on' | 'off';
  centerFrame: 'auto' | 'on' | 'off';
  featureWall: 'auto' | 'none' | WallId;
  wallCoverage: 'auto' | 'feature-only' | 'multiple';
  ceiling: 'auto' | 'simple' | 'gypsum';
  lighting: 'auto' | 'warm' | 'neutral' | 'cool';
  furniture: 'auto' | 'show' | 'hide';
  locks: DesignLocks;
};
export const DEFAULT_GUIDANCE: DesignGuidance = {
  strength: 'balanced', floorPattern: 'auto', center: 'auto', centerFrame: 'auto', featureWall: 'auto',
  wallCoverage: 'auto', ceiling: 'auto', lighting: 'auto', furniture: 'auto', locks: {},
};
/** Future local references only. No transport, image upload or AI service exists. */
export type DesignIntent = {
  startingPoint?: 'current-room';
  style: DesignStyle;
  materials: DesignMaterials;
  guidance?: Partial<DesignGuidance>;
  prompt?: string;
  images?: { localReference: string; purpose: 'reference' | 'moodboard' | 'material' }[];
};
export type PlannerInput = { intent: DesignIntent; state: AppliedProjectState; products: MaterialProduct[] };
export type MaterialRoleUsage = {
  role: MaterialRole;
  assignment: PhysicalAssignment;
  status: 'used' | 'unused' | 'constrained';
  destinations: string[];
  reasons: string[];
};
/** Semantic commands only; never pixels, meshes, compiled placements or architectural changes. */
export type DesignDecision = {
  version: 1;
  style: DesignStyle;
  strength?: DesignStrength;
  preserved?: DesignSystem[];
  materialUsage?: MaterialRoleUsage[];
  materialState?: AppliedProjectState['materialState'];
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
