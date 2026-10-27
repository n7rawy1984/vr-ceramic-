import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compileLayout,MAX_GRID_CELLS} from '../src/layout/compiler.ts';
import {defaultInstallation,type LayoutPattern,type CompiledLayout,type FloorInstallation,type LayoutAsset} from '../src/layout/model.ts';
import {fieldRowOffset} from '../src/layout/patterns.ts';
import {floorBatchBuffers} from '../src/layout/renderGeometry.ts';
import {layoutAsset} from '../src/layout/assets.ts';
import {tileToProduct} from '../src/tiles/materialAdapter.ts';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {useFloorDesignStore} from '../src/state/useFloorDesignStore.ts';
import type {TileAssetView} from '../shared/tileAsset.ts';
const LAYOUT_PATTERNS = ["straight","running-bond-50","running-bond-33","checker"] as const;
const assets:LayoutAsset[]=[{id:'a',widthMm:600,heightMm:600},{id:'b',widthMm:600,heightMm:600},{id:'frame',widthMm:100,heightMm:600},{id:'center',widthMm:1200,heightMm:1200}];
const surface={id:'floor',widthMm:5400,heightMm:7200};
function definition(pattern:LayoutPattern):FloorInstallation {const i=defaultInstallation('floor','a','frame','center');i.field.pattern=pattern;if(pattern==='checker')i.field.secondaryTileAssetId='b';i.centerFrame.tileAssetId='frame';i.jointWidthMm=2;return i;}
function compile(pattern:LayoutPattern,opts:{orientation?:0|90;zones?:boolean;centerOff?:boolean;width?:number;height?:number;assets?:LayoutAsset[]}={}):CompiledLayout {
 const i=definition(pattern);i.field.orientation=opts.orientation??0;i.centerFrame.enabled=!!opts.zones;i.center.enabled=!!opts.zones&&!opts.centerOff;
 const r=compileLayout({...surface,widthMm:opts.width??surface.widthMm,heightMm:opts.height??surface.heightMm},i,opts.assets??assets);assert(r.ok,JSON.stringify(r));if(!r.ok)throw Error('compile');return r.layout;
}
const area=(r:{widthMm:number;heightMm:number})=>r.widthMm*r.heightMm;
function coverage(l:CompiledLayout){
 const rects=[...l.placements,...l.joints];for(const r of rects){assert(r.xMm>=-1e-6&&r.yMm>=-1e-6);assert(r.xMm+r.widthMm<=l.surface.widthMm+1e-6&&r.yMm+r.heightMm<=l.surface.heightMm+1e-6);assert(r.widthMm>0&&r.heightMm>0);}
 for(let a=0;a<rects.length;a++)for(let b=a+1;b<rects.length;b++){const x=rects[a],y=rects[b];const w=Math.min(x.xMm+x.widthMm,y.xMm+y.widthMm)-Math.max(x.xMm,y.xMm),h=Math.min(x.yMm+x.heightMm,y.yMm+y.heightMm)-Math.max(x.yMm,y.yMm);assert(!(w>1e-6&&h>1e-6),'no body/joint overlap');}
 assert(Math.abs(rects.reduce((s,r)=>s+area(r),0)-area(l.surface))<.1,'bodies + explicit joints exactly partition the floor');
}
test('Straight output is byte-identical to eight pre-M4A golden compilations',()=>{
 const cases=JSON.parse(readFileSync(new URL('./fixtures/straight-golden.json',import.meta.url),'utf8'));
 for(const c of cases)assert.equal(createHash('sha256').update(JSON.stringify(compileLayout(c.surface,c.installation,c.assets))).digest('hex'),c.sha256,c.name);
});
for(const pattern of ['running-bond-50','running-bond-33'] as const)for(const orientation of [0,90] as const)test(`${pattern} ${orientation}°: oriented pitch, periodic row offsets, real leading edge crops and full joints`,()=>{
 const a=[{id:'a',widthMm:300,heightMm:600},...assets.filter(a=>a.id!=='a')],l=compile(pattern,{orientation,assets:a});coverage(l);
 const tw=orientation===0?300:600,th=orientation===0?600:300,px=tw+2,py=th+2;
 for(let row=0;row<6;row++){
  const cycle=pattern==='running-bond-50'?2:3,offset=(row%cycle)*px/cycle;
  const pieces=l.placements.filter(p=>p.zoneId==='field'&&p.sourceTileId.includes(`/r${row}c`));assert(pieces.length>0);
  const first=pieces.find(p=>p.sourceTileId.endsWith(`c${offset>0?-1:0}`))!;assert(first);assert(Math.abs(first.tileBounds.xMm-(offset-(offset>0?px:0)))<1e-9);assert.equal(first.tileBounds.yMm,row*py);
  assert.equal(first.tileBounds.widthMm,tw);assert.equal(first.tileBounds.heightMm,th);assert.equal(first.rotationDeg,orientation);
  if(offset>0){assert.equal(first.xMm,0);assert(!first.fullTile);assert(Math.abs(first.widthMm-(offset-2))<1e-9);const next=pieces.find(p=>p.sourceTileId.endsWith('c0'))!;assert(Math.abs(next.xMm-first.widthMm-2)<1e-9);}
  for(const p of pieces){assert(p.sourceRect.xMm>=-1e-6&&p.sourceRect.yMm>=-1e-6);assert(p.sourceRect.xMm+p.sourceRect.widthMm<=300+1e-6);assert(p.sourceRect.yMm+p.sourceRect.heightMm<=600+1e-6);}
 }
});
test('one-third row phase does not accumulate drift even at distant row indices',()=>{
 for(const row of [0,1,2,3,4,5,3000,3001,3002,9999])assert.equal(fieldRowOffset('running-bond-33',row,603),(row%3)*603/3);
 assert.equal(fieldRowOffset('running-bond-33',3,602),0);
});
for(const pattern of LAYOUT_PATTERNS)test(`${pattern}: central frame/center exclusion and field-filled frame opening retain exact coverage`,()=>{
 for(const centerOff of [false,true]){
  const l=compile(pattern,{zones:true,centerOff});coverage(l);
  const frame=l.zones.find(z=>z.id==='centerFrame')!;
  for(const p of l.placements.filter(p=>p.zoneId==='field'))for(const r of frame.regions){const w=Math.min(p.xMm+p.widthMm,r.xMm+r.widthMm)-Math.max(p.xMm,r.xMm),h=Math.min(p.yMm+p.heightMm,r.yMm+r.heightMm)-Math.max(p.yMm,r.yMm);assert(!(w>1e-6&&h>1e-6));}
  const straight=compile('straight',{zones:true,centerOff});assert.deepEqual(l.placements.filter(p=>p.zoneId!=='field'),straight.placements.filter(p=>p.zoneId!=='field'),'Center/Frame logic remains unchanged');
  assert.deepEqual(l,compile(pattern,{zones:true,centerOff}),'deterministic output');
 }
});
test('Checker alternates A/B by original row and column, including cuts and centered exclusions',()=>{
 const l=compile('checker',{width:1806,height:1806});coverage(l);
 for(let row=0;row<3;row++)for(let col=0;col<3;col++){const p=l.placements.find(p=>p.sourceTileId.endsWith(`/r${row}c${col}`))!;assert.equal(p.tileAssetId,(row+col)%2===0?'a':'b');}
 const cuts=compile('checker',{zones:true});for(const p of cuts.placements.filter(p=>p.zoneId==='field')){const [,r,c]=p.sourceTileId.match(/\/r(\d+)c(\d+)$/)!;assert.equal(p.tileAssetId,(Number(r)+Number(c))%2===0?'a':'b');}
});
test('Checker resolves built-ins, mixed local/built-in tiles, both orientations, and rejects incompatible/missing B',()=>{
 const builtin=layoutAsset(FLOOR_CERAMICS[1]);const upload=tileToProduct({id:'local',name:'Local 60x60',width_mm:600,height_mm:600,finish:'matte',imageUrl:'blob:local'} as TileAssetView);const i=definition('checker');i.field.tileAssetId=upload.id;i.field.secondaryTileAssetId=builtin.id;
 for(const orientation of [0,90] as const){i.field.orientation=orientation;const r=compileLayout(surface,i,[layoutAsset(upload),builtin]);assert(r.ok);if(r.ok)assert.deepEqual(new Set(r.layout.placements.map(p=>p.tileAssetId)),new Set(['local',builtin.id]));}
 for(const b of [{...builtin,widthMm:300},{...builtin,heightMm:300}]){const r=compileLayout(surface,i,[layoutAsset(upload),b]);assert(!r.ok);if(!r.ok)assert(r.errors.some(e=>e.includes('equal physical body dimensions')));}
 const builtins=definition('checker');builtins.field.tileAssetId=builtin.id;builtins.field.secondaryTileAssetId=builtin.id;assert.equal(compileLayout(surface,builtins,FLOOR_CERAMICS.map(layoutAsset)).ok,true);
 i.field.secondaryTileAssetId='missing';assert.equal(compileLayout(surface,i,[layoutAsset(upload),builtin]).ok,false);
 i.field.secondaryTileAssetId=undefined;assert.equal(compileLayout(surface,i,[layoutAsset(upload),builtin]).ok,false);
});
for(const pattern of LAYOUT_PATTERNS)test(`${pattern}: 3x4, 8x10, 15x20 m remain exact at physical tile scale`,()=>{
 for(const [width,height]of[[3000,4000],[8000,10000],[15000,20000]]){
  const l=compile(pattern,{width,height});coverage(l);assert(l.placements.every(p=>p.tileBounds.widthMm===600&&p.tileBounds.heightMm===600));
  const buffers=floorBatchBuffers(l.surface,l.placements);assert.equal(buffers.positions.length,l.placements.length*12);assert.equal(buffers.indices.length,l.placements.length*6);
 }
});
test('all patterns retain existing cell safety limits, zero joints and immutable inputs',()=>{
 assert.equal(MAX_GRID_CELLS,10000);
 for(const pattern of LAYOUT_PATTERNS){const i=definition(pattern),before=structuredClone(i),s=structuredClone(surface),a=structuredClone(assets);compileLayout(s,i,a);assert.deepEqual(i,before);assert.deepEqual(s,surface);assert.deepEqual(a,assets);
  const tiny=assets.map(a=>({...a,widthMm:1,heightMm:1}));assert.equal(compileLayout(surface,i,tiny).ok,false);i.jointWidthMm=0;const r=compileLayout(surface,i,assets);assert(r.ok);if(r.ok){coverage(r.layout);assert.equal(r.layout.jointAreaMm2,0);}
 }
 const i=definition('straight');i.field.pattern='unknown' as LayoutPattern;assert.equal(compileLayout(surface,i,assets).ok,false);
});
test('deleting Checker A or B resets to a valid Straight field without missing asset references',()=>{
 const s=useFloorDesignStore;
 for(const removed of ['a','b']){
  const i=definition('checker');s.setState({installation:i});const ids=new Set(['ceramic-01','ceramic-02','ceramic-03','a','b','frame','center']);ids.delete(removed);s.getState().reconcileAssets(ids);const field=s.getState().installation.field;
  assert.equal(field.pattern,'straight');assert(ids.has(field.tileAssetId));assert(!field.secondaryTileAssetId||ids.has(field.secondaryTileAssetId));
  const a=[...assets.filter(a=>a.id!==removed),...FLOOR_CERAMICS.map(layoutAsset)];assert.equal(compileLayout(surface,s.getState().installation,a).ok,true);
 }
});
