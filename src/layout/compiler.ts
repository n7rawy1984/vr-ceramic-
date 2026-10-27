import type { CompileResult, CompiledLayout, CompiledTilePlacement, FloorInstallation, LayoutAsset, Orientation, RectMm, Surface, ZoneId } from "./model.ts";

/** 1 nanometer in mm: far below accepted 0.001 mm metadata precision; removes floating slivers only. */
export const GEOMETRY_EPSILON_MM = 1e-6;
export const MAX_GRID_CELLS = 10_000;
const E = GEOMETRY_EPSILON_MM;
const rect = (xMm: number, yMm: number, widthMm: number, heightMm: number): RectMm => ({ xMm, yMm, widthMm, heightMm });
export const rectArea = (r: RectMm) => r.widthMm * r.heightMm;
export function intersectRects(a: RectMm, b: RectMm): RectMm | null {
  const x = Math.max(a.xMm, b.xMm), y = Math.max(a.yMm, b.yMm);
  const w = Math.min(a.xMm + a.widthMm, b.xMm + b.widthMm) - x;
  const h = Math.min(a.yMm + a.heightMm, b.yMm + b.heightMm) - y;
  return w > E && h > E ? rect(x, y, w, h) : null;
}
/** Fixed top, bottom, left, right order; outputs non-overlapping rectangles. */
export function subtractRect(a: RectMm, b: RectMm): RectMm[] {
  const i = intersectRects(a, b);
  if (!i) return [a];
  return [
    rect(a.xMm, a.yMm, a.widthMm, i.yMm - a.yMm),
    rect(a.xMm, i.yMm + i.heightMm, a.widthMm, a.yMm + a.heightMm - i.yMm - i.heightMm),
    rect(a.xMm, i.yMm, i.xMm - a.xMm, i.heightMm),
    rect(i.xMm + i.widthMm, i.yMm, a.xMm + a.widthMm - i.xMm - i.widthMm, i.heightMm),
  ].filter(r => r.widthMm > E && r.heightMm > E);
}
/** Remove subdivision seams that do not represent an actual tile cut. */
function mergeAdjacentRects(input: RectMm[]): RectMm[] {
  const result = [...input];
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i=0;i<result.length;i++) for(let k=i+1;k<result.length;k++) {
      const a=result[i],b=result[k];
      const vertical=Math.abs(a.xMm-b.xMm)<=E&&Math.abs(a.widthMm-b.widthMm)<=E&&
        (Math.abs(a.yMm+a.heightMm-b.yMm)<=E||Math.abs(b.yMm+b.heightMm-a.yMm)<=E);
      const horizontal=Math.abs(a.yMm-b.yMm)<=E&&Math.abs(a.heightMm-b.heightMm)<=E&&
        (Math.abs(a.xMm+a.widthMm-b.xMm)<=E||Math.abs(b.xMm+b.widthMm-a.xMm)<=E);
      if(vertical||horizontal){result[i]=rect(Math.min(a.xMm,b.xMm),Math.min(a.yMm,b.yMm),horizontal?a.widthMm+b.widthMm:a.widthMm,vertical?a.heightMm+b.heightMm:a.heightMm);result.splice(k,1);merged=true;break outer;}
    }
  }
  return result.sort((a,b)=>a.yMm-b.yMm||a.xMm-b.xMm);
}
/** Image coordinates with top-left (0,0), independent of SVG/Three conventions. */
export function imagePoint(p: Pick<CompiledTilePlacement, "tileBounds" | "rotationDeg">, xMm: number, yMm: number): [number, number] {
  const u = (xMm - p.tileBounds.xMm) / p.tileBounds.widthMm;
  const v = (yMm - p.tileBounds.yMm) / p.tileBounds.heightMm;
  return p.rotationDeg === 90 ? [v, 1 - u] : [u, v];
}
const positive = (n: number) => Number.isFinite(n) && n >= 0.001 && n <= 100_000;

export function compileLayout(surface: Surface, installation: FloorInstallation, assets: readonly LayoutAsset[]): CompileResult {
  const errors: string[] = [];
  if (!positive(surface.widthMm) || !positive(surface.heightMm)) errors.push("Floor dimensions must be positive and at most 100000 mm.");
  if (surface.id !== installation.surfaceId) errors.push("The installation refers to a different floor surface.");
  const j = installation.jointWidthMm;
  if (!Number.isFinite(j) || j < 0 || j > 100) errors.push("Joint must be a full gap from 0 to 100 mm.");
  if (installation.field.pattern !== "straight") errors.push("Only Straight is supported.");
  if (![0, 90].includes(installation.field.orientation) || ![0, 90].includes(installation.center.orientation)) errors.push("Tile orientation must be 0° or 90°.");
  if (installation.centerFrame.orientationRule !== "follow-side" || installation.border.orientationRule !== "follow-side" || installation.center.position !== "center") errors.push("Unsupported border or center positioning rule.");
  const assetMap = new Map(assets.map(a => [a.id, a]));
  for (const [zone, enabled, id] of [["Field", true, installation.field.tileAssetId], ["Border", installation.border.enabled, installation.border.tileAssetId], ["Center Frame", installation.centerFrame.enabled, installation.centerFrame.tileAssetId], ["Center", installation.center.enabled, installation.center.tileAssetId]] as const) {
    if (!enabled) continue;
    const a = assetMap.get(id);
    if (!a) errors.push(`${zone} tile is unavailable. Open My Tiles to load saved assets, or choose another tile.`);
    else if (!positive(a.widthMm) || !positive(a.heightMm)) errors.push(`${zone} tile body dimensions are invalid.`);
  }
  const { widthMm: w, heightMm: h } = surface;
  const b = installation.border.enabled ? installation.border.widthMm : 0;
  if (installation.border.enabled && (!positive(b) || b * 2 + j * 2 >= Math.min(w, h) - E)) errors.push("Border is too wide: leave a positive inner field and its joints.");
  const inset = b > 0 ? b + j : 0;
  const usable = rect(inset, inset, w - inset * 2, h - inset * 2);
  const c = installation.center;
  const center = rect((w - c.widthMm) / 2, (h - c.heightMm) / 2, c.widthMm, c.heightMm);
  const centerWithJoint = rect(center.xMm - j, center.yMm - j, c.widthMm + j * 2, c.heightMm + j * 2);
  const f = installation.centerFrame;
  const fw = f.enabled ? f.widthMm : 0;
  const frameOuter = rect(center.xMm-fw, center.yMm-fw, c.widthMm+fw*2, c.heightMm+fw*2);
  const occupied = f.enabled ? frameOuter : center;
  const occupiedWithJoint = rect(occupied.xMm-j, occupied.yMm-j, occupied.widthMm+j*2, occupied.heightMm+j*2);
  if (f.enabled && (!positive(fw) || fw <= j + E)) errors.push("Center Frame width must be positive and greater than the full joint width.");
  if ((c.enabled || f.enabled) && (!positive(c.widthMm) || !positive(c.heightMm) ||
    occupiedWithJoint.xMm < usable.xMm-E || occupiedWithJoint.yMm < usable.yMm-E ||
    occupiedWithJoint.xMm+occupiedWithJoint.widthMm > usable.xMm+usable.widthMm+E ||
    occupiedWithJoint.yMm+occupiedWithJoint.heightMm > usable.yMm+usable.heightMm+E)) errors.push("Center + Center Frame and their outer full joint must fit inside the room field.");
  if (errors.length) return { ok: false, errors };

  const layout: CompiledLayout = { surface: { ...surface }, placements: [], joints: [], zones: [], tileAreaMm2: 0, jointAreaMm2: 0 };
  let cells = 0;
  const grid = (zoneId: ZoneId, segment: string, bounds: RectMm, regions: RectMm[], id: string, rotationDeg: Orientation) => {
    if (!regions.length) return;
    const a = assetMap.get(id)!;
    const tw = rotationDeg === 90 ? a.heightMm : a.widthMm;
    const th = rotationDeg === 90 ? a.widthMm : a.heightMm;
    const px = tw + j, py = th + j;
    const cols = Math.ceil((bounds.widthMm - E) / px), rows = Math.ceil((bounds.heightMm - E) / py);
    cells += rows * cols;
    if (cells > MAX_GRID_CELLS) throw new Error(`Design exceeds ${MAX_GRID_CELLS} grid cells. Choose larger tiles or reduce the composition.`);
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const x = bounds.xMm + col * px, y = bounds.yMm + row * py;
      const tileBounds = rect(x, y, tw, th);
      const sourceTileId = `${surface.id}/${zoneId}/${segment}/r${row}c${col}`;
      const visible = mergeAdjacentRects(regions.flatMap(region => { const clipped=intersectRects(tileBounds,region); return clipped?[clipped]:[]; }));
      visible.forEach((clipped, piece) => {
          const dx = clipped.xMm - x, dy = clipped.yMm - y;
          layout.placements.push({
            ...clipped, id: `${sourceTileId}/p${piece}`, sourceTileId, zoneId, segment, tileAssetId: id, rotationDeg, tileBounds,
            fullTile: Math.abs(clipped.widthMm - tw) <= E && Math.abs(clipped.heightMm - th) <= E,
            sourceRect: rotationDeg === 90
              ? rect(dy, tw - dx - clipped.widthMm, clipped.heightMm, clipped.widthMm)
              : rect(dx, dy, clipped.widthMm, clipped.heightMm),
          });
      });
      regions.forEach(region => {
        // Partition each pitch cell into body, right joint, bottom joint.
        for (const gap of [rect(x + tw, y, j, py), rect(x, y + th, tw, j)]) {
          const part = intersectRects(gap, region);
          if (part) layout.joints.push(part);
        }
      });
    }
    if (layout.placements.length > MAX_GRID_CELLS * 4) throw new Error("Too many clipped pieces. Choose larger tiles.");
  };
  try {
    if (c.enabled) {
      layout.zones.push({ id: "center", bounds: center, regions: [center] });
      if (!f.enabled) layout.joints.push(...subtractRect(centerWithJoint, center));
      grid("center", "center", center, [center], c.tileAssetId, c.orientation);
    }
    if (b > 0) {
      const inner = rect(b, b, w - 2 * b, h - 2 * b);
      layout.joints.push(...subtractRect(inner, usable));
      const a = assetMap.get(installation.border.tileAssetId)!;
      const horizontal: Orientation = a.widthMm >= a.heightMm ? 0 : 90;
      const vertical: Orientation = horizontal === 0 ? 90 : 0;
      const sides: [string, RectMm, RectMm, Orientation][] = [
        ["top", rect(0, 0, w, b), rect(0, 0, w, b), horizontal],
        ["bottom", rect(0, h - b, w, b), rect(0, h - b, w, b), horizontal],
        ["left", rect(0, b, b, h - 2 * b), rect(0, b + j, b, h - 2 * b - 2 * j), vertical],
        ["right", rect(w - b, b, b, h - 2 * b), rect(w - b, b + j, b, h - 2 * b - 2 * j), vertical],
      ];
      layout.zones.push({ id: "border", bounds: rect(0, 0, w, h), regions: sides.map(s => s[2]) });
      for (const [side, nominal, body, rotation] of sides) {
        layout.joints.push(...subtractRect(nominal, body));
        grid("border", side, body, [body], a.id, rotation);
      }
    }
    if (f.enabled) {
      // Exact outer = center + 2*frame width. Inner seam belongs to the frame.
      const a = assetMap.get(f.tileAssetId)!;
      const horizontal: Orientation = a.widthMm >= a.heightMm ? 0 : 90;
      const vertical: Orientation = horizontal === 0 ? 90 : 0;
      const o = frameOuter, q = centerWithJoint;
      const top = rect(o.xMm,o.yMm,o.widthMm,q.yMm-o.yMm);
      const bottom = rect(o.xMm,q.yMm+q.heightMm,o.widthMm,o.yMm+o.heightMm-q.yMm-q.heightMm);
      const left = rect(o.xMm,q.yMm,fw-j,q.heightMm);
      const right = rect(q.xMm+q.widthMm,q.yMm,fw-j,q.heightMm);
      const sides: [string,RectMm,Orientation][] = [["top",top,horizontal],["bottom",bottom,horizontal],
        ["left",rect(left.xMm,left.yMm+j,left.widthMm,left.heightMm-2*j),vertical],
        ["right",rect(right.xMm,right.yMm+j,right.widthMm,right.heightMm-2*j),vertical]];
      layout.zones.push({id:"centerFrame",bounds:frameOuter,regions:sides.map(s=>s[1])});
      layout.joints.push(...subtractRect(centerWithJoint,center),...subtractRect(occupiedWithJoint,frameOuter));
      for(const [nominal,body] of [[left,sides[2][1]],[right,sides[3][1]]]) layout.joints.push(...subtractRect(nominal,body));
      for(const [side,body,rotation] of sides) grid("centerFrame",side,body,[body],a.id,rotation);
    }
    const fieldRegions = (c.enabled || f.enabled) ? subtractRect(usable, occupiedWithJoint) : [usable];
    // A frame may remain enabled with Center off: Main Field fills its opening.
    if(f.enabled && !c.enabled) fieldRegions.push(center);
    layout.zones.push({ id: "field", bounds: b > 0 ? rect(b, b, w - b * 2, h - b * 2) : rect(0, 0, w, h), regions: fieldRegions });
    grid("field", "field", usable, fieldRegions, installation.field.tileAssetId, installation.field.orientation);
  } catch (reason) { return { ok: false, errors: [reason instanceof Error ? reason.message : "Design could not be compiled."] }; }
  layout.tileAreaMm2 = layout.placements.reduce((sum, p) => sum + rectArea(p), 0);
  layout.jointAreaMm2 = layout.joints.reduce((sum, r) => sum + rectArea(r), 0);
  return { ok: true, layout };
}
