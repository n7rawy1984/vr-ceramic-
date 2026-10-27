/** Presentation settings, independent of architectural geometry and tile compilation. */
export type RoomLighting = {
  lightingEnabled: boolean;
  lightFixtureVisible: boolean;
  lightingColor: string;
  /** Percent of the validated showroom illumination. */
  lightingBrightness: number;
};
export const LIGHT_COLORS = { warm: '#fff0d6', neutral: '#ffffff', cool: '#dceaff' } as const;
export const DEFAULT_LIGHTING: RoomLighting = {
  lightingEnabled: true, lightFixtureVisible: false,
  lightingColor: LIGHT_COLORS.neutral, lightingBrightness: 100,
};
/** Missing/unsafe visual settings fall back independently, without discarding a project. */
export function normalizeLighting(value: unknown): RoomLighting {
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    lightingEnabled: typeof v.lightingEnabled === 'boolean' ? v.lightingEnabled : DEFAULT_LIGHTING.lightingEnabled,
    lightFixtureVisible: typeof v.lightFixtureVisible === 'boolean' ? v.lightFixtureVisible : DEFAULT_LIGHTING.lightFixtureVisible,
    lightingColor: typeof v.lightingColor === 'string' && /^#[0-9a-f]{6}$/i.test(v.lightingColor) ? v.lightingColor.toLowerCase() : DEFAULT_LIGHTING.lightingColor,
    lightingBrightness: typeof v.lightingBrightness === 'number' && Number.isFinite(v.lightingBrightness) ? Math.max(0, Math.min(200, v.lightingBrightness)) : DEFAULT_LIGHTING.lightingBrightness,
  };
}
export function lightingContributions(lighting: RoomLighting) {
  const scale = lighting.lightingEnabled ? lighting.lightingBrightness / 100 : 0;
  return { ambient: Math.max(.08, .75 * scale), hemisphere: .65 * scale, key: 1.6 * scale, point: .85 * scale };
}
