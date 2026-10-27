import { test } from "node:test";
import assert from "node:assert/strict";
import { compileLayout, imagePoint, GEOMETRY_EPSILON_MM, subtractRect } from "../src/layout/compiler.ts";
import { defaultInstallation, type Surface, type FloorInstallation, type LayoutAsset, type CompiledLayout, type RectMm } from "../src/layout/model.ts";
import { cmToMm, mToMm, mmToM } from "../src/utils/units.ts";
import { layoutAsset } from "../src/layout/assets.ts";
import { floorBatchBuffers, floorWorldPoint } from "../src/layout/renderGeometry.ts";
import { FLOOR_CERAMICS } from "../src/catalog/materials.ts";
const surface: Surface = { id: "floor", widthMm: 6000, heightMm: 7000 };
const assets: LayoutAsset[] = [{ id: "field", widthMm: 600, heightMm: 600 }, { id: "border", widthMm: 100, heightMm: 600 }, { id: "center", widthMm: 1200, heightMm: 1200 }];
const definition = () => defaultInstallation(surface.id, "field", "border", "center");
function compile(s = surface, d = definition(), a = assets): CompiledLayout {
  const result = compileLayout(s, d, a);assert.equal(result.ok,true,JSON.stringify(result));if(!result.ok)throw Error('compile');return result.layout;
}
const area=(r:RectMm)=>r.widthMm*r.heightMm;
function coverage(layout: CompiledLayout) {
  const all=[...layout.placements,...layout.joints];
  for(const r of all){assert(r.widthMm>0&&r.heightMm>0);assert(r.xMm>=-1e-6&&r.yMm>=-1e-6);assert(r.xMm+r.widthMm<=layout.surface.widthMm+1e-6&&r.yMm+r.heightMm<=layout.surface.heightMm+1e-6);}
  // Independent pairwise rectangle test covers tiles AND physical joints.
  for(let i=0;i<all.length;i++)for(let k=i+1;k<all.length;k++){
    const a=all[i],b=all[k];
    const overlapX=Math.min(a.xMm+a.widthMm,b.xMm+b.widthMm)-Math.max(a.xMm,b.xMm);
    const overlapY=Math.min(a.yMm+a.heightMm,b.yMm+b.heightMm)-Math.max(a.yMm,b.yMm);
    assert(!(overlapX>1e-6&&overlapY>1e-6),`Overlap ${i}/${k}`);
  }
  assert(Math.abs(all.reduce((sum,r)=>sum+area(r),0)-layout.surface.widthMm*layout.surface.heightMm)<0.1,'Tiles plus explicit joints cover the surface');
}
test('units and asset boundary: cm/m to canonical mm; uploads keep exact body dimensions',()=>{
  assert.equal(cmToMm(60),600);assert.equal(mToMm(6),6000);assert.equal(mmToM(600),.6);
  assert.equal(layoutAsset(FLOOR_CERAMICS[0]).widthMm,600);
  assert.equal(layoutAsset({...FLOOR_CERAMICS[0],physicalSizeMm:{width:123.456,height:789.123}}).widthMm,123.456);
});
test('Straight exact fit: N bodies plus N-1 full joints, no artificial wall joint',()=>{
  const l=compile({id:'floor',widthMm:1203,heightMm:1203});assert.equal(l.placements.length,4);assert(l.placements.every(p=>p.fullTile));
  assert.deepEqual(l.placements.map(p=>[p.xMm,p.yMm]),[[0,0],[603,0],[0,603],[603,603]]);
  assert.equal(l.tileAreaMm2,4*600*600);assert.equal(l.jointAreaMm2,7209);coverage(l);
});
test('a 3mm joint is one total gap, not 3mm on both sides',()=>{
  const l=compile({id:'floor',widthMm:1203,heightMm:600});assert.equal(l.placements[1].xMm-l.placements[0].xMm-l.placements[0].widthMm,3);assert.equal(l.jointAreaMm2,1800);coverage(l);
});
test('partial fit clips true body rectangles and preserves image source crop',()=>{
  const l=compile({id:'floor',widthMm:1250,heightMm:650});assert.equal(l.placements.length,6);
  const p=l.placements.at(-1)!;assert.equal(p.fullTile,false);assert.equal(p.widthMm,44);assert.equal(p.heightMm,47);assert.deepEqual(p.sourceRect,{xMm:0,yMm:0,widthMm:44,heightMm:47});coverage(l);
});
test('90 degree rectangular body orientation and inverse image UV mapping',()=>{
  const d=definition();d.field.orientation=90;
  const l=compile({id:'floor',widthMm:1200,heightMm:600},d,[{id:'field',widthMm:600,heightMm:1200}]);
  assert.equal(l.placements.length,1);const p=l.placements[0];assert(p.fullTile);assert.deepEqual([p.widthMm,p.heightMm],[1200,600]);
  assert.deepEqual(imagePoint(p,0,0),[0,1]);assert.deepEqual(imagePoint(p,1200,600),[1,0]);coverage(l);
  const clipped=compile({id:'floor',widthMm:400,heightMm:300},d,[{id:'field',widthMm:600,heightMm:1200}]).placements[0];
  assert.deepEqual(clipped.sourceRect,{xMm:0,yMm:800,widthMm:300,heightMm:400});
});
test('zero joint is supported; floor may end inside a final pitch joint without stretching a tile',()=>{
  const d=definition();d.jointWidthMm=0;const l=compile({id:'floor',widthMm:1200,heightMm:1200},d);assert.equal(l.placements.length,4);assert.equal(l.joints.length,0);coverage(l);
  coverage(compile({id:'floor',widthMm:601,heightMm:601}));
});
test('legacy internal perimeter border has 100mm body bands, 5800x6800 nominal inner field, deterministic butt corners',()=>{
  const d=definition();d.border.enabled=true;const l=compile(surface,d);
  assert.deepEqual(l.zones.find(z=>z.id==='field')!.bounds,{xMm:100,yMm:100,widthMm:5800,heightMm:6800});
  const b=l.placements.filter(p=>p.zoneId==='border');assert(b.some(p=>p.segment==='top'&&p.xMm===0&&p.yMm===0));
  assert(b.filter(p=>p.segment==='top').every(p=>p.rotationDeg===90&&p.heightMm===100));
  assert(b.filter(p=>p.segment==='left').every(p=>p.rotationDeg===0&&p.xMm===0&&p.widthMm===100&&p.yMm>=103));coverage(l);
});
test('center uses exact centered area; matching 1200mm asset gives one full tile',()=>{
  const d=definition();d.center.enabled=true;const l=compile(surface,d);const c=l.placements.filter(p=>p.zoneId==='center');assert.equal(c.length,1);assert(c[0].fullTile);assert.deepEqual([c[0].xMm,c[0].yMm,c[0].widthMm,c[0].heightMm],[2400,2900,1200,1200]);coverage(l);
  d.center.tileAssetId='field';const tiled=compile(surface,d);assert.equal(tiled.placements.filter(p=>p.zoneId==='center').length,4);assert(tiled.placements.filter(p=>p.zoneId==='center').some(p=>!p.fullTile));coverage(tiled);
});
test('precedence removes field bodies AND joints under center and border; complete area partition',()=>{
  const d=definition();d.border.enabled=true;d.center.enabled=true;const l=compile(surface,d);coverage(l);
  for(const p of l.placements.filter(p=>p.zoneId==='field')){
    assert(p.xMm>=103-1e-6&&p.yMm>=103-1e-6);
    const hitsCenter=p.xMm<3603&&p.xMm+p.widthMm>2397&&p.yMm<4103&&p.yMm+p.heightMm>2897;assert(!hitsCenter);
  }
  const multiPieces=new Map<string,number>();for(const p of l.placements)multiPieces.set(p.sourceTileId,(multiPieces.get(p.sourceTileId)??0)+1);
  assert([...multiPieces.values()].some(v=>v>1),'Center boundary splits some original field tile bodies');
});
test('deterministic output, IDs, order and no mutation of caller input',()=>{
  const d=definition();d.border.enabled=d.center.enabled=true;const before=JSON.stringify(d);const a=compile(surface,d),b=compile(surface,d);assert.deepEqual(a,b);assert.equal(new Set(a.placements.map(p=>p.id)).size,a.placements.length);assert.equal(JSON.stringify(d),before);
});
test('invalid assets, dimensions, patterns, joints, border/center collisions and dense designs fail safely',()=>{
  const invalid=(change:(d:FloorInstallation)=>void)=>{const d=definition();change(d);const r=compileLayout(surface,d,assets);assert.equal(r.ok,false,JSON.stringify(d));};
  invalid(d=>{d.field.pattern='running-bond' as 'straight'});invalid(d=>{d.field.orientation=45 as 0});invalid(d=>{d.border.enabled=true;d.border.widthMm=0});
  invalid(d=>{d.field.tileAssetId='missing'});invalid(d=>{d.jointWidthMm=-1});invalid(d=>{d.jointWidthMm=NaN});invalid(d=>{d.border.enabled=true;d.border.widthMm=3000});invalid(d=>{d.center.enabled=true;d.center.widthMm=0});invalid(d=>{d.center.enabled=true;d.center.widthMm=7000});invalid(d=>{d.border.enabled=true;d.center.enabled=true;d.center.widthMm=5800});
  assert.equal(compileLayout({...surface,widthMm:0},definition(),assets).ok,false);
  assert.equal(compileLayout(surface,definition(),[{id:'field',widthMm:-1,heightMm:600}]).ok,false);
  assert.equal(compileLayout(surface,definition(),[{id:'field',widthMm:.001,heightMm:.001}]).ok,false);
});
test('sub-millimeter metadata and narrow cuts retain precision without epsilon slivers',()=>{
  assert.equal(GEOMETRY_EPSILON_MM,1e-6);const d=definition();d.jointWidthMm=.125;
  const l=compile({id:'floor',widthMm:1000.001,heightMm:999.999},d,[{id:'field',widthMm:123.456,heightMm:234.567}]);coverage(l);
  const pieces=subtractRect({xMm:0,yMm:0,widthMm:100,heightMm:100},{xMm:20,yMm:30,widthMm:40,heightMm:50});assert.equal(pieces.reduce((s,p)=>s+area(p),0),8000);
});
test('legacy internal perimeter 6x7m composition is bounded and all pieces/crops are physically valid',()=>{
  const d=definition();d.border.enabled=d.center.enabled=true;const l=compile(surface,d);coverage(l);
  for(const p of l.placements){const a=assets.find(a=>a.id===p.tileAssetId)!;assert(p.sourceRect.xMm>=-1e-6&&p.sourceRect.yMm>=-1e-6);assert(p.sourceRect.xMm+p.sourceRect.widthMm<=a.widthMm+1e-6);assert(p.sourceRect.yMm+p.sourceRect.heightMm<=a.heightMm+1e-6);}
  console.log('6x7m representative counts',Object.fromEntries(['field','border','center'].map(z=>[z,l.placements.filter(p=>p.zoneId===z).length])),{tileAreaMm2:l.tileAreaMm2,jointAreaMm2:l.jointAreaMm2});
});

test('render boundary maps compiler rectangles/crops to exact 3D quads and image UVs',()=>{
  assert.deepEqual(floorWorldPoint(surface,0,0),[-3,.002,-3.5]);
  assert.deepEqual(floorWorldPoint(surface,6000,7000),[3,.002,3.5]);
  const d=definition();d.field.orientation=90;
  const l=compile({id:'floor',widthMm:400,heightMm:300},d,[{id:'field',widthMm:600,heightMm:1200}]);
  const b=floorBatchBuffers(l.surface,l.placements);
  assert.deepEqual(b.indices,[0,1,2,0,2,3]);assert.deepEqual(b.positions,[-.2,.002,-.15,-.2,.002,.15,.2,.002,.15,.2,.002,-.15]);
  b.uv.forEach((v,i)=>assert(Math.abs(v-[0,0,.5,0,.5,1/3,0,1/3][i])<1e-12));
});

test('region subtraction does not invent cuts in unaffected whole field tile bodies',()=>{
  const d=definition();d.border.enabled=d.center.enabled=true;const l=compile(surface,d);
  const unaffected=l.placements.filter(p=>p.zoneId==='field'&&p.sourceTileId.endsWith('/r4c0'));
  assert.equal(unaffected.length,1);assert(unaffected[0].fullTile);assert.equal(unaffected[0].heightMm,600);
});

test('an entirely occupied center does not generate or budget hidden field cells',()=>{
 const d=definition();d.jointWidthMm=0;d.center.enabled=true;const l=compile({id:'floor',widthMm:1200,heightMm:1200},d,[{id:'field',widthMm:.001,heightMm:.001},...assets.filter(a=>a.id!=='field')]);
 assert.equal(l.placements.length,1);assert.equal(l.placements[0].zoneId,'center');coverage(l);
});

function framed() {const d=definition();d.centerFrame.enabled=d.center.enabled=true;return d;}
test('Center Frame outer is exactly 1400x1400, centered; independent asset and butt-side orientations',()=>{
 const d=framed(),l=compile(surface,d);
 assert.deepEqual(l.zones.find(z=>z.id==='centerFrame')!.bounds,{xMm:2300,yMm:2800,widthMm:1400,heightMm:1400});
 const f=l.placements.filter(p=>p.zoneId==='centerFrame');assert(f.length>0);
 assert(f.every(p=>p.tileAssetId==='border'));assert(l.placements.filter(p=>p.zoneId==='field').every(p=>p.tileAssetId==='field'));assert(l.placements.filter(p=>p.zoneId==='center').every(p=>p.tileAssetId==='center'));
 assert(f.filter(p=>p.segment==='top').every(p=>p.rotationDeg===90));assert(f.filter(p=>p.segment==='left').every(p=>p.rotationDeg===0));
 assert(f.some(p=>!p.fullTile));assert(l.placements.some(p=>p.zoneId==='field'&&p.xMm===0&&p.yMm===0),'No perimeter frame');coverage(l);
});
test('Center > Center Frame > Field subtraction and exact full-joint area reconciliation',()=>{
 const l=compile(surface,framed());coverage(l);
 for(const p of l.placements.filter(p=>p.zoneId==='field')) assert.equal(!!(p.xMm<3703&&p.xMm+p.widthMm>2297&&p.yMm<4203&&p.yMm+p.heightMm>2797),false);
 for(const p of l.placements.filter(p=>p.zoneId==='centerFrame')) assert.equal(!!(p.xMm<3600&&p.xMm+p.widthMm>2400&&p.yMm<4100&&p.yMm+p.heightMm>2900),false);
});
test('Center Frame cuts/IDs/crops are deterministic without mutating physical assets',()=>{
 const d=framed();d.center.widthMm=1377;d.center.heightMm=1249;const before=JSON.stringify(assets);
 const l=compile(surface,d);assert.deepEqual(l,compile(surface,d));assert.equal(JSON.stringify(assets),before);coverage(l);
 for(const p of l.placements){const a=assets.find(a=>a.id===p.tileAssetId)!;assert(p.sourceRect.xMm>=-1e-6&&p.sourceRect.yMm>=-1e-6);assert(p.sourceRect.xMm+p.sourceRect.widthMm<=a.widthMm+1e-6);assert(p.sourceRect.yMm+p.sourceRect.heightMm<=a.heightMm+1e-6);}
});
test('Center Frame rejects zero/narrow/oversize frame and oversize center including seams',()=>{
 for(const width of [0,-1,NaN,3,2500]){const d=framed();d.centerFrame.widthMm=width;assert.equal(compileLayout(surface,d,assets).ok,false);}
 const d=framed();d.center.widthMm=5900;assert.equal(compileLayout(surface,d,assets).ok,false);
});
test('independent enable toggles preserve field coverage, frame opening and asset choices',()=>{
 const d=framed();d.center.enabled=false;coverage(compile(surface,d));assert.equal(compile(surface,d).placements.some(p=>p.zoneId==='center'),false);
 d.centerFrame.enabled=false;coverage(compile(surface,d));assert(compile(surface,d).placements.every(p=>p.zoneId==='field'));
 d.center.enabled=true;coverage(compile(surface,d));assert(!compile(surface,d).placements.some(p=>p.zoneId==='centerFrame'));
 d.centerFrame.enabled=true;coverage(compile(surface,d));assert.equal(d.centerFrame.tileAssetId,'border');
});
test('room resizing preserves exact physical bodies, centered frame, area, bounds and deterministic IDs',()=>{
 for(const [widthMm,heightMm] of [[4200,5600],[5400,7200],[6000,7000],[8000,10000]]){
  const s={...surface,widthMm,heightMm},d=framed(),l=compile(s,d);coverage(l);assert.deepEqual(l.surface,s);assert.deepEqual(l,compile(s,d));
  const center=l.zones.find(z=>z.id==='center')!.bounds,frame=l.zones.find(z=>z.id==='centerFrame')!.bounds;
  assert.equal(center.xMm+center.widthMm/2,widthMm/2);assert.equal(center.yMm+center.heightMm/2,heightMm/2);assert.equal(frame.xMm+frame.widthMm/2,widthMm/2);assert.equal(frame.yMm+frame.heightMm/2,heightMm/2);
  assert(l.placements.filter(p=>p.zoneId==='field').every(p=>p.tileBounds.widthMm===600&&p.tileBounds.heightMm===600));
  assert(l.placements.filter(p=>p.zoneId==='center').every(p=>p.tileBounds.widthMm===1200&&p.tileBounds.heightMm===1200));
 }
});
test('room domain range validation holds invalid dimensions and converts meters centrally',async()=>{
 const {roomSizeError,roomSurface}=await import('../src/layout/roomDimensions.ts');
 assert.equal(roomSizeError({widthMm:4000,lengthMm:12000}),null);
 for(const v of [0,NaN,Infinity,-1,100001])assert(roomSizeError({widthMm:v,lengthMm:7000}));
 assert.deepEqual(roomSurface({widthMm:mToMm(5.4),lengthMm:mToMm(7.2)}),{id:'living-room-01/floor',widthMm:5400,heightMm:7200});
});
