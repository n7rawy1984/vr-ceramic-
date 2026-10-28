import { materialUsageTracker } from './materialUsage.ts';
import { layoutAsset } from '../layout/assets.ts';
import { defaultInstallation } from '../layout/model.ts';
import { FLOOR_SURFACE } from '../layout/floorSurface.ts';
import { architectureErrors } from '../layout/roomArchitecture.ts';
import { LIGHT_COLORS } from '../lighting/model.ts';
import { wallSurface } from '../surfaces/compiler.ts';
import { defaultWalls, WALL_IDS, type WallId } from '../surfaces/model.ts';
import { effectiveSize, validPhysicalSize, type PhysicalAssignment } from '../tiles/physicalSize.ts';
import { imageQuality } from '../tiles/variantModel.ts';
import type { MaterialProduct } from '../catalog/types.ts';
import { DEFAULT_GUIDANCE, type DesignDecision, type DesignPlanner, type PlannerInput, type MaterialRole } from './model.ts';
import { multiSizeModule } from '../layout/modules.ts';
import { preserveLockedSystems } from './locks.ts';

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
    const g = { ...DEFAULT_GUIDANCE, ...intent.guidance, locks: intent.guidance?.locks ?? {} };
    const facts: Partial<Record<MaterialRole, ReturnType<typeof materialFacts>>> = {};
    for (const role of ['primary', 'secondary', 'accent', 'feature'] as const) {
      const a = intent.materials[role]; if (a) facts[role] = materialFacts(a, products);
    }
    const usage = materialUsageTracker(intent.materials);
    const record = (fact: typeof facts.primary, destination: string, outcome: 'used' | 'constrained' = 'used', reason?: string) => usage.record((Object.keys(facts) as MaterialRole[]).find(role=>facts[role]===fact),destination,outcome,reason);
    const current = state.floorDesign.enabled ? state.floorDesign.installation.field : { tileAssetId: state.materialState.selectedFloorId, physicalOverride: state.materialState.physicalOverride };
    const primary = facts.primary ?? facts.secondary ?? facts.accent ?? facts.feature ?? (g.locks.floor ? materialFacts(current, products) : undefined);
    if (!primary) throw Error('Choose at least one material.');
    const i = defaultInstallation(FLOOR_SURFACE.id, primary.product.id, primary.product.id, primary.product.id);
    Object.assign(i.field, primary.assignment);
    if (!g.locks.floor) record(primary, 'Floor');
    const walls = defaultWalls();
    for (const wall of Object.values(walls)) Object.assign(wall, primary.assignment);
    const warnings: string[] = [], reasons: string[] = ['Supplied physical bodies are preserved; no size variants are created.'];
    const warn = (system: 'floor' | 'walls' | 'ceiling', text: string) => { if (!g.locks[system]) warnings.push(text); };
    if (!g.locks.floor && g.floorPattern !== 'auto') {
      let valid = true;
      const secondary = facts.secondary;
      i.field.pattern = g.floorPattern;
      if (g.floorPattern !== 'straight' && primary.size.productKind === 'slab') valid = false;
      if (g.floorPattern === 'checker') {
        valid = valid && !!secondary && secondary.size.productKind !== 'slab' && Math.abs(primary.size.widthMm-secondary.size.widthMm)<1e-6 && Math.abs(primary.size.heightMm-secondary.size.heightMm)<1e-6;
        if (valid && secondary) {
          record(secondary, 'Checker Floor');
          i.field.secondaryTileAssetId = secondary.assignment.tileAssetId;
          i.field.secondaryPhysicalOverride = secondary.assignment.physicalOverride;
        }
      }
      if (g.floorPattern === 'modular') {
        const small = facts.accent;
        i.jointWidthMm = state.floorDesign.installation.jointWidthMm;
        if (secondary && small) {
          const upright = Math.abs(secondary.size.widthMm-primary.size.heightMm)<1e-6 ? 90 : 0;
          i.field.modular = { preset: 'multi-size', b: { ...secondary.assignment, orientation: upright }, c: { ...small.assignment, orientation: 0 } };
          valid = valid && secondary.size.productKind !== 'slab' && small.size.productKind !== 'slab' && multiSizeModule(i.field, i.jointWidthMm, new Map(products.map(p => [p.id, layoutAsset(p)]))).errors.length === 0;
        } else valid = false;
      }
      if (valid && g.floorPattern === 'modular') { record(secondary, 'Modular Floor B'); record(facts.accent, 'Modular Floor C'); }
      if (!valid) {
        if (g.floorPattern === 'checker' || g.floorPattern === 'modular') record(secondary, 'Floor', 'constrained', 'Requested floor pattern is incompatible with the supplied sizes or Slab assignments; Straight is used.');
        if (g.floorPattern === 'modular') record(facts.accent, 'Floor', 'constrained', 'Modular sizes and joints do not fit; Straight is used.');
        warnings.push(`${g.floorPattern === 'checker' ? 'Checker' : g.floorPattern === 'modular' ? 'Modular' : 'Running Bond'} cannot be used with the current material sizes or Slab assignments. Fallback: Straight. No material is stretched.`);
        i.field.pattern = 'straight'; delete i.field.secondaryTileAssetId; delete i.field.secondaryPhysicalOverride; delete i.field.modular;
      }
    }
    const dramatic = g.strength === 'dramatic', subtle = g.strength === 'subtle';
    const minRoom = Math.min(state.roomSize.widthMm, state.roomSize.lengthMm);
    const center = intent.style === 'bold' ? facts.accent ?? facts.secondary : facts.secondary ?? (dramatic ? facts.accent : undefined);
    const wantCenter = g.center === 'on' || (g.center === 'auto' && (g.centerFrame === 'on' || (!subtle && (intent.style !== 'minimal' || dramatic))));
    if (!g.locks.floor && wantCenter) {
      const fraction = dramatic ? .5 : .4;
      const width = Math.floor(state.roomSize.widthMm * fraction), height = Math.floor(state.roomSize.lengthMm * fraction);
      if (center && center !== primary && minRoom >= 2000 && center.size.widthMm <= width && center.size.heightMm <= height) {
        record(center, 'Center');
        Object.assign(i.center, center.assignment, { enabled: true, widthMm: width, heightMm: height });
      } else {
        record(center, 'Center', 'constrained', 'Center requires a separate material body that fits the available center and room dimensions.');
        if (g.center === 'on') warn('floor', 'Center On cannot be satisfied: choose a separate Secondary or Accent material whose physical body fits the center. Center remains Off.');
      else reasons.push('Center omitted: no separate fitting body is available.');
      }
    }
    const frame = intent.style === 'bold' ? facts.secondary : facts.accent;
    const wantFrame = g.centerFrame === 'on' || (g.centerFrame === 'auto' && !subtle && (intent.style !== 'minimal' || dramatic));
    if (!g.locks.floor && wantFrame) {
      const band = Math.min(dramatic ? 200 : 150, Math.floor(minRoom * (dramatic ? .05 : .04)));
      if (i.center.enabled && frame && frame !== center && frame.size.productKind !== 'slab' && Math.min(frame.size.widthMm, frame.size.heightMm) <= band*4) {
        record(frame, 'Center Frame');
        Object.assign(i.centerFrame, frame.assignment, { enabled: true, widthMm: band });
      } else {
        record(frame, 'Center Frame', 'constrained', 'Center Frame requires an enabled Center and a separate suitably sized Tile; Slabs cannot form this frame.');
        if (g.centerFrame === 'on') warn('floor', 'Center Frame On cannot be satisfied without an enabled Center and a separate suitably sized Tile. Frame remains Off.');
      else reasons.push('Center frame omitted: no enabled center or suitable separate Tile.');
      }
    }
    let featureWall: WallId | null = null;
    const explicitWall = WALL_IDS.includes(g.featureWall as WallId);
    const wantFeature = g.featureWall !== 'none' && (explicitWall || g.wallCoverage === 'multiple' || dramatic || (!subtle && intent.style !== 'minimal'));
    if (!g.locks.walls && wantFeature) {
      const candidates = [facts.secondary, facts.accent].filter((f): f is NonNullable<typeof f> => !!f);
      const feature = facts.feature ?? (intent.style === 'bold' || dramatic ? facts.accent : undefined) ?? candidates.map((f, rank) => ({ f, rank })).sort((a,b) =>
        (intent.style === 'luxury' ? Number(b.f.size.productKind==='slab')-Number(a.f.size.productKind==='slab') : 0) || (b.f.quality.pixelsPerMm??0)-(a.f.quality.pixelsPerMm??0) || a.rank-b.rank)[0]?.f ?? (explicitWall || g.wallCoverage === 'multiple' ? primary : undefined);
      if (feature) {
        featureWall = explicitWall ? g.featureWall as WallId : featureWallFor(state);
        record(feature, `${featureWall[0].toUpperCase()+featureWall.slice(1)} Wall`);
        Object.assign(walls[featureWall], feature.assignment, { enabled: true });
        const surface = wallSurface(featureWall,state.roomSize,state.architecture);
        if (explicitWall && surface.openings.length) warn('walls', `The ${featureWall} wall has a door or window. The finish will be clipped around the real opening.`);
        reasons.push(`${featureWall} wall: ${explicitWall ? 'your selected wall' : 'unbroken surfaces first, then usable area, width; ties back, left, right, front'}.`);
        if (g.wallCoverage === 'multiple') {
          const additional = (['back','left','right','front'] as const).filter(id=>id!==featureWall).sort((a,b)=>{
            const x=wallSurface(a,state.roomSize,state.architecture),y=wallSurface(b,state.roomSize,state.architecture);
            return x.openings.length-y.openings.length || y.widthMm-x.widthMm;
          })[0];
          record(primary, `${additional[0].toUpperCase()+additional.slice(1)} Wall`);
          Object.assign(walls[additional],primary.assignment,{enabled:true});
          reasons.push(`Multiple Walls adds only ${additional} in Primary; remaining walls stay neutral.`);
        }
      }
    }
    const ceiling = { ...state.architecture.ceiling, style: g.ceiling !== 'auto' ? g.ceiling : intent.style === 'luxury' ? 'gypsum' as const : 'simple' as const };
    if (!g.locks.ceiling && architectureErrors(state.roomSize,{...state.architecture,ceiling}).length && ceiling.style==='gypsum') {
      ceiling.style='simple'; warn('ceiling','Gypsum cannot fit the current inset/drop and room dimensions. Fallback: Simple.');
    }
    const family = g.lighting !== 'auto' ? g.lighting : intent.style === 'luxury' ? 'warm' : intent.style === 'bold' ? 'cool' : 'neutral';
    const brightness = (intent.style === 'luxury' ? 85 : intent.style === 'bold' ? 115 : 90) + (subtle ? -15 : dramatic ? 15 : 0);
    const decision = preserveLockedSystems(state, {
      version:1,style:intent.style,strength:g.strength,floor:{enabled:true,started:true,installation:i},walls,featureWall,ceiling,
      lighting:{lightingEnabled:true,lightFixtureVisible:false,lightingColor:LIGHT_COLORS[family],lightingBrightness:brightness},
      furnitureVisible:g.furniture==='show',warnings,reasons,
    },g.locks);
    // Quality is advisory for actual unlocked placements, not discarded candidates.
    const assignments = [ ...(!g.locks.floor ? [i.field,...(i.center.enabled?[i.center]:[]),...(i.centerFrame.enabled?[i.centerFrame]:[]),...(i.field.pattern==='checker'&&facts.secondary?[facts.secondary.assignment]:[]),...(i.field.pattern==='modular'&&i.field.modular?[i.field.modular.b,i.field.modular.c]:[])] : []), ...(!g.locks.walls ? Object.values(walls).filter(w=>w.enabled) : []) ];
    for (const a of assignments) { const f=materialFacts(a,products); if(f.quality.warning) decision.warnings.push(`${f.product.name}: ${f.quality.warning}`); }
    decision.materialUsage = usage.finish(g.locks);
    decision.warnings=[...new Set(decision.warnings)];
    return decision;
  }
}
