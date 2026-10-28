import { layoutAsset } from '../layout/assets.ts';
import { defaultInstallation } from '../layout/model.ts';
import { FLOOR_SURFACE } from '../layout/floorSurface.ts';
import { architectureErrors } from '../layout/roomArchitecture.ts';
import { LIGHT_COLORS } from '../lighting/model.ts';
import { wallSurface } from '../surfaces/compiler.ts';
import { defaultWalls, type WallId } from '../surfaces/model.ts';
import { effectiveSize, validPhysicalSize, type PhysicalAssignment } from '../tiles/physicalSize.ts';
import { imageQuality } from '../tiles/variantModel.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import type { DesignDecision, DesignPlanner, PlannerInput } from './model.ts';

/** Metadata only: explicit roles win; uploaded baseColor is a display tint, not measured color. */
export function materialFacts(assignment: PhysicalAssignment, products: MaterialProduct[]) {
  const product = products.find(p => p.id === assignment.tileAssetId);
  if (!product) throw Error('A selected material is no longer available. Choose another material.');
  if (assignment.physicalOverride && !validPhysicalSize(assignment.physicalOverride)) throw Error('The supplied project physical size is invalid.');
  const size = effectiveSize(layoutAsset(product), assignment.physicalOverride);
  const quality = imageQuality({ pixelWidth: product.pixelWidth ?? null, pixelHeight: product.pixelHeight ?? null }, { ...size, transform: product.imageTransform });
  return { assignment: structuredClone(assignment), product, size, quality };
}
/** Prefer unbroken walls, then usable area, width, then back/left/right/front. */
export function featureWallFor(state: PlannerInput['state']): WallId {
  const order: WallId[] = ['back', 'left', 'right', 'front'];
  return order.map(id => {
    const s = wallSurface(id, state.roomSize, state.architecture);
    return { id, broken: s.openings.length, area: s.widthMm * s.heightMm - s.openings.reduce((n, o) => n + o.widthMm * o.heightMm, 0), width: s.widthMm };
  }).sort((a, b) => a.broken - b.broken || b.area - a.area || b.width - a.width || order.indexOf(a.id) - order.indexOf(b.id))[0].id;
}

export class LocalRulePlanner implements DesignPlanner {
  async generate({ intent, state, products }: PlannerInput): Promise<DesignDecision> {
    if (!['minimal', 'luxury', 'bold'].includes(intent.style)) throw Error('Choose Minimal, Luxury or Bold.');
    const facts = Object.fromEntries(Object.entries(intent.materials).filter(([, a]) => a).map(([role, a]) => [role, materialFacts(a!, products)]));
    // A secondary/accent-only selection is still a usable one-material input.
    const primary = facts.primary ?? facts.secondary ?? facts.accent ?? facts.feature;
    if (!primary) throw Error('Choose at least one material.');
    const i = defaultInstallation(FLOOR_SURFACE.id, primary.product.id, primary.product.id, primary.product.id);
    Object.assign(i.field, primary.assignment);
    const walls = defaultWalls();
    // Keep disabled references within the supplied set as well.
    for (const wall of Object.values(walls)) Object.assign(wall, primary.assignment);
    const warnings: string[] = [], reasons: string[] = ['Straight uses supplied physical bodies; no size variants are created.'];
    const used = [primary];
    const minRoom = Math.min(state.roomSize.widthMm, state.roomSize.lengthMm);
    const center = intent.style === 'luxury' ? facts.secondary : intent.style === 'bold' ? facts.accent ?? facts.secondary : undefined;
    if (center && center !== primary && minRoom >= 2000) {
      const width = Math.floor(state.roomSize.widthMm * .4), height = Math.floor(state.roomSize.lengthMm * .4);
      // A center should contain a body rather than a tiny crop from a huge slab.
      if (center.size.widthMm <= width && center.size.heightMm <= height) {
        Object.assign(i.center, center.assignment, { enabled: true, widthMm: width, heightMm: height });
        used.push(center);
        const frame = intent.style === 'luxury' ? facts.accent : facts.secondary;
        const band = Math.min(150, Math.floor(minRoom * .04));
        if (frame && frame !== center && frame.size.productKind !== 'slab' && Math.min(frame.size.widthMm, frame.size.heightMm) <= band * 4) {
          Object.assign(i.centerFrame, frame.assignment, { enabled: true, widthMm: band });
          used.push(frame);
        } else if (frame) reasons.push('Center frame omitted: material is a Slab or too large for the narrow band.');
      } else reasons.push('Center omitted: the supplied physical body is larger than the restrained center area.');
    }
    let featureWall: WallId | null = null;
    if (intent.style !== 'minimal') {
      const candidates = (intent.style === 'luxury' ? [facts.feature, facts.secondary, facts.accent] : [facts.feature, facts.accent, facts.secondary]).filter(Boolean);
      // Preserve explicit feature, otherwise prefer Slab for Luxury, then better image quality.
      const feature = facts.feature ?? (intent.style === 'bold' ? facts.accent ?? facts.secondary : undefined) ?? candidates.map((f, rank) => ({ f, rank })).sort((a, b) =>
        (intent.style === 'luxury' ? Number(b.f.size.productKind === 'slab') - Number(a.f.size.productKind === 'slab') : 0) ||
        (b.f.quality.pixelsPerMm ?? 0) - (a.f.quality.pixelsPerMm ?? 0) || a.rank - b.rank)[0]?.f;
      if (feature) {
        featureWall = featureWallFor(state);
        Object.assign(walls[featureWall], feature.assignment, { enabled: true });
        used.push(feature);
        reasons.push(`${featureWall} wall: unbroken surfaces first, then usable area and width; ties back, left, right, front.`);
      }
    }
    const ceiling = { ...state.architecture.ceiling, style: intent.style === 'luxury' ? 'gypsum' as const : 'simple' as const };
    if (architectureErrors(state.roomSize, { ...state.architecture, ceiling }).length && ceiling.style === 'gypsum') {
      ceiling.style = 'simple'; reasons.push('Simple ceiling retained because the existing gypsum inset/drop does not fit.');
    }
    for (const f of used) if (f?.quality.warning) warnings.push(`${f.product.name}: ${f.quality.warning}`);
    return {
      version: 1, style: intent.style, floor: { enabled: true, started: true, installation: i }, walls, featureWall, ceiling,
      lighting: { lightingEnabled: true, lightFixtureVisible: false, lightingColor: LIGHT_COLORS[intent.style === 'luxury' ? 'warm' : intent.style === 'bold' ? 'cool' : 'neutral'], lightingBrightness: intent.style === 'luxury' ? 85 : intent.style === 'bold' ? 115 : 90 },
      furnitureVisible: false, warnings: [...new Set(warnings)], reasons,
    };
  }
}
