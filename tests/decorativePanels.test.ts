import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compileDecorativePanel,panelGeometryKey,polygonArea,rectangle,intersectPolygon,subtractPolygon} from '../src/panels/compiler.ts';
import {artworkUv,artworkQuality} from '../src/panels/mapping.ts';
import {DEFAULT_ARTWORK_TRANSFORM,normalizePanel,type DecorativePanel,type ArtworkSource} from '../src/panels/model.ts';
import {compileFloor} from '../src/panels/floor.ts';
import {panelBuffers,mappedPanelUvs} from '../src/panels/render.ts';
import {createPanelRepository,type PanelStorage} from '../src/panels/repository.ts';
import {defaultProjectState,normalizeProjectDocument,stateFingerprint} from '../src/projects/model.ts';
import {FLOOR_CERAMICS} from '../src/catalog/materials.ts';
import {layoutAsset} from '../src/layout/assets.ts';
import {roomSurface} from '../src/layout/roomDimensions.ts';
import {prepareAutoDesign} from '../src/autoDesign/prepare.ts';
import {LocalRulePlanner} from '../src/autoDesign/planner.ts';
import {decisionState} from '../src/autoDesign/session.ts';
const panel=(shape:DecorativePanel['shape']='rectangle'):DecorativePanel=>({version:1,id:'p',revision:1,name:'Flower',shape,widthMm:2400,heightMm:2400,tileVariantId:'ceramic-02',tileSize:{widthMm:600,heightMm:600},tileOrientation:0,jointWidthMm:2,artworkSourceId:'art',artworkTransform:{...DEFAULT_ARTWORK_TRANSFORM}});
const near=(a:number,b:number,e=1e-5)=>assert(Math.abs(a-b)<=e,`${a} != ${b}`);
for(const shape of ['rectangle','circle','ellipse'] as const)test(`${shape}: deterministic physical bodies, clipped cuts, joints, UVs and area conservation`,()=>{
 const p=panel(shape);if(shape==='ellipse'){p.widthMm=3000;p.heightMm=1800;}
 const a=compileDecorativePanel(p),b=compileDecorativePanel(p);assert.deepEqual(a,b);assert(a.tiles.length>0);assert(a.tiles.some(t=>t.cut));
 near(a.tiles.reduce((n,t)=>n+polygonArea(t.polygon),0)+a.joints.reduce((n,j)=>n+polygonArea(j),0),polygonArea(a.boundary),.001);
 for(const tile of a.tiles){assert.equal(tile.body.width,600);assert.equal(tile.body.height,600);for(const [i,v]of tile.polygon.entries()){assert(v.x>=-1e-6&&v.y>=-1e-6&&v.x<=p.widthMm+1e-6&&v.y<=p.heightMm+1e-6);near(tile.panelUv[i].x,v.x/p.widthMm);near(tile.panelUv[i].y,v.y/p.heightMm);if(shape!=='rectangle')assert(((v.x-p.widthMm/2)/(p.widthMm/2))**2+((v.y-p.heightMm/2)/(p.heightMm/2))**2<=1.000001);}}
 if(shape==='rectangle'){assert.equal(a.tiles.length,16);assert.equal(a.tiles.filter(t=>t.cut).length,7);assert.equal(a.tiles[3].polygon[1].x,2400);assert.equal(a.tiles[1].body.x-a.tiles[0].body.x,602);}
 else {const ellipseArea=Math.PI*p.widthMm*p.heightMm/4;assert(ellipseArea>polygonArea(a.boundary));assert(ellipseArea-polygonArea(a.boundary)<Math.PI*Math.max(p.widthMm,p.heightMm)*.25);}
 const buffers=panelBuffers(a);assert(buffers.positions.length/3===buffers.uv.length/2);assert(buffers.indices.length>0);assert(buffers.indices.every(i=>i<buffers.positions.length/3));
});
test('artwork is continuous across tile boundaries and logical full joints; never per-body repetition',()=>{
 const p=panel(),c=compileDecorativePanel(p),pixels={pixelWidth:2400,pixelHeight:2400};
 assert.deepEqual(artworkUv(p,pixels,{x:0,y:0}),[0,0]);assert.deepEqual(artworkUv(p,pixels,{x:2400,y:2400}),[1,1]);const left=artworkUv(p,pixels,{x:600,y:300}),right=artworkUv(p,pixels,{x:602,y:300});near(right[0]-left[0],2/2400);assert.notDeepEqual(artworkUv(p,pixels,{x:c.tiles[0].body.x,y:0}),artworkUv(p,pixels,{x:c.tiles[1].body.x,y:0}));
});
test('scale/offset/rotation change only mapping and preserve image facts and physical compilation key',()=>{
 const p=panel('circle'),old=compileDecorativePanel(p),key=panelGeometryKey(p),pixels={pixelWidth:3000,pixelHeight:1500},before=mappedPanelUvs(old,p,pixels);
 p.artworkTransform={fit:'fit',scale:1.5,offsetXmm:120,offsetYmm:-50,rotationDeg:37};assert.equal(panelGeometryKey(p),key);assert.deepEqual(compileDecorativePanel(p),old);assert.notDeepEqual(mappedPanelUvs(old,p,pixels),before);assert.deepEqual(pixels,{pixelWidth:3000,pixelHeight:1500});
 p.artworkTransform={...DEFAULT_ARTWORK_TRANSFORM,rotationDeg:90};const uv=artworkUv(p,{pixelWidth:2400,pixelHeight:2400},{x:2400,y:1200});near(uv[0],.5);near(uv[1],0);
});
test('Fit, Fill and Manual semantics preserve aspect, including neutral uncovered areas',()=>{
 const p=panel(),pixels={pixelWidth:2400,pixelHeight:1200};p.artworkTransform.fit='fit';near(artworkUv(p,pixels,{x:0,y:0})[1],-.5);p.artworkTransform.fit='fill';near(artworkUv(p,pixels,{x:0,y:0})[0],.25);p.artworkTransform.fit='manual';near(artworkUv(p,pixels,{x:0,y:0})[1],-.5);
});
test('orientation swaps real body dimensions; polygon room-intersection cuts retain continuous UVs',()=>{
 const p=panel('ellipse');p.tileSize={widthMm:600,heightMm:1200};p.tileOrientation=90;const c=compileDecorativePanel(p,rectangle(120,300,1800,1500));assert(c.tiles.every(t=>t.body.width===1200&&t.body.height===600));assert(c.tiles.every(t=>t.polygon.every(v=>v.x>=120-1e-6&&v.y>=300-1e-6&&v.x<=1920+1e-6&&v.y<=1800+1e-6)));assert(c.tiles.every(t=>t.panelUv.every((uv,i)=>Math.abs(uv.x-t.polygon[i].x/2400)<1e-10)));
 assert.equal(intersectPolygon(rectangle(0,0,2,2),[]).length,0);
});
test('polygon subtraction is disjoint and conserves subject area',()=>{
 const subject=rectangle(0,0,2400,2400),circle=compileDecorativePanel(panel('circle')).boundary,out=subtractPolygon(subject,circle);near(out.reduce((n,p)=>n+polygonArea(p),0)+polygonArea(circle),2400**2,.01);for(const p of out)near(polygonArea(intersectPolygon(p,circle)),0,.001);
});
for(const shape of ['rectangle','circle','ellipse'] as const)test(`Center ${shape}: Field, Frame, normal backing and panel do not overlap`,()=>{
 const state=defaultProjectState(),i=state.floorDesign.installation;i.center.enabled=true;i.center.widthMm=2400;i.center.heightMm=2400;i.center.panel=panel(shape);i.centerFrame.enabled=true;const result=compileFloor(roomSurface(state.roomSize),i,FLOOR_CERAMICS.map(layoutAsset));assert(result.ok);const d=result.layout.decorative!;assert(d);assert(result.layout.placements.some(p=>p.zoneId==='field'));assert(result.layout.placements.some(p=>p.zoneId==='centerFrame'));
 const world=d.compiled.boundary.map(v=>({x:v.x+d.origin.x,y:v.y+d.origin.y}));for(const t of result.layout.placements){const polygon=t.polygon??rectangle(t.xMm,t.yMm,t.widthMm,t.heightMm);near(polygonArea(intersectPolygon(polygon,world)),0,.001);}
 near(result.layout.tileAreaMm2+result.layout.jointAreaMm2,state.roomSize.widthMm*state.roomSize.lengthMm,.05);
 if(shape==='rectangle')assert(!result.layout.placements.some(t=>t.zoneId==='center'));else assert(result.layout.placements.some(t=>t.zoneId==='center'&&t.polygon));
});
test('room resize retains panel dimensions and recenters; too-small rooms reject atomically',()=>{
 const state=defaultProjectState(),i=state.floorDesign.installation;i.center={...i.center,enabled:true,widthMm:2400,heightMm:2400,panel:panel('circle')};const a=compileFloor(roomSurface(state.roomSize),i,FLOOR_CERAMICS.map(layoutAsset));assert(a.ok);const b=compileFloor({id:i.surfaceId,widthMm:8000,heightMm:9000},i,FLOOR_CERAMICS.map(layoutAsset));assert(b.ok);assert.deepEqual(a.layout.decorative!.compiled,b.layout.decorative!.compiled);assert.deepEqual(b.layout.decorative!.origin,{x:2800,y:3300});assert(!compileFloor({id:i.surfaceId,widthMm:2000,heightMm:2000},i,FLOOR_CERAMICS.map(layoutAsset)).ok);
});
test('quality is advisory at physical mapped dimensions, with no mutation or image processing',()=>{
 const p=panel(),pixels={pixelWidth:2400,pixelHeight:2400};p.widthMm=p.heightMm=1000;assert.equal(artworkQuality(p,pixels).label,'Excellent');p.widthMm=p.heightMm=2400;assert.equal(artworkQuality(p,pixels).label,'Good');p.widthMm=p.heightMm=4000;assert.equal(artworkQuality(p,pixels).label,'Low for close-up');assert.deepEqual(pixels,{pixelWidth:2400,pixelHeight:2400});
});
test('shape, dimensions, transforms and bounded tile candidate budgets validate before allocation',()=>{
 for(const p of [{...panel(),widthMm:0},{...panel('circle'),heightMm:2000},{...panel(),jointWidthMm:101},{...panel(),artworkTransform:{...DEFAULT_ARTWORK_TRANSFORM,scale:0}}])assert.throws(()=>compileDecorativePanel(p));assert.throws(()=>compileDecorativePanel({...panel(),tileSize:{widthMm:.001,heightMm:.001}}),/10000/);assert.deepEqual(normalizePanel(panel()),panel());
});
function storage(){const panels=new Map<string,DecorativePanel>(),artworks=new Map<string,ArtworkSource>();let writes=0;const db:PanelStorage={read:async()=>({panels:[...panels.values()],artworks:[...artworks.values()]}),panel:async p=>{panels.set(p.id,structuredClone(p));},artwork:async a=>{writes++;artworks.set(a.id,a);},remove:async(kind,id)=>{(kind==='decorative-panels'?panels:artworks).delete(id);}};return {db,panels,artworks,get writes(){return writes;}};}
const png=()=>{const bytes=new Uint8Array(32),d=new DataView(bytes.buffer);d.setUint32(0,0x89504e47);d.setUint32(4,0x0d0a1a0a);d.setUint32(16,2400);d.setUint32(20,2400);return new Blob([bytes],{type:'image/png'});};
test('save/edit/rename/duplicate/delete share one artwork Blob and do not mutate captured project revisions',async()=>{
 const db=storage(),repo=createPanelRepository(db.db),blob=png();await repo.upload({id:'art',name:'Original',blob,pixelWidth:2400,pixelHeight:2400,mimeType:'image/png'});const original=await repo.save(panel('circle'));const state=defaultProjectState();state.floorDesign.enabled=true;Object.assign(state.floorDesign.installation.center,{enabled:true,widthMm:2400,heightMm:2400,panel:original});const before=stateFingerprint(state);
 const edited=await repo.save({...original,name:'Renamed',widthMm:3000,heightMm:3000});assert.equal(edited.revision,2);const copy=await repo.duplicate(original.id);assert.notEqual(copy.id,original.id);assert.equal(copy.artworkSourceId,'art');assert.equal(db.artworks.size,1);assert.equal(db.writes,1);assert.strictEqual(db.artworks.get('art')!.blob,blob);assert.equal(stateFingerprint(state),before);assert.equal(state.floorDesign.installation.center.panel!.revision,1);await assert.rejects(repo.save(original),/changed/);await repo.remove(original.id);assert.equal(db.artworks.size,1);assert(db.panels.has(copy.id));assert.equal(stateFingerprint(state),before);
 const opened=normalizeProjectDocument({schemaVersion:6,id:'project',name:'Panel room',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:state});assert.equal(stateFingerprint(opened.projectDocument),before);assert(prepareAutoDesign(opened.projectDocument,FLOOR_CERAMICS).result.ok);
});
test('old schema migration adds no panel; corrupted panel snapshot recovers only Center',()=>{
 const state=defaultProjectState();for(const version of [1,2,3,4,5]){const d=normalizeProjectDocument({schemaVersion:version,id:'legacy',name:'Legacy',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:state});assert.equal(d.schemaVersion,6);assert(!d.projectDocument.floorDesign.installation.center.panel);}
 const broken=structuredClone(state);broken.floorDesign.installation.center.panel={...panel(),shape:'broken'} as unknown as DecorativePanel;const doc=normalizeProjectDocument({schemaVersion:6,id:'bad',name:'Bad snapshot',createdAt:'2026-10-28',updatedAt:'2026-10-28',projectDocument:broken});assert(doc.recoveryWarnings?.[0].includes('damaged'));assert.equal(stateFingerprint(doc.projectDocument),stateFingerprint(state));
});
test('Guided Floor preservation retains panel snapshot/output; unlocked planner does not generate panels',async()=>{
 const state=defaultProjectState();state.floorDesign.enabled=true;Object.assign(state.floorDesign.installation.center,{enabled:true,widthMm:2400,heightMm:2400,panel:panel('circle')});const previous=prepareAutoDesign(state,FLOOR_CERAMICS),planner=new LocalRulePlanner();const input={state:previous.state,products:FLOOR_CERAMICS,intent:{style:'luxury' as const,materials:{primary:{tileAssetId:'ceramic-01'}},guidance:{locks:{floor:true}}}};const locked=await planner.generate(input),prepared=prepareAutoDesign(decisionState(previous.state,locked),FLOOR_CERAMICS,previous);assert.strictEqual(prepared.result,previous.result);assert.deepEqual(prepared.state.floorDesign,previous.state.floorDesign);const unlocked=await planner.generate({...input,intent:{...input.intent,guidance:{}}});assert(!unlocked.floor.installation.center.panel);
});
