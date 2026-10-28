import {normalizePanel,type DecorativePanel,type PointMm} from './model.ts';
export type Polygon=PointMm[];
export type PanelPiece={id:string;row:number;column:number;body:{x:number;y:number;width:number;height:number};polygon:Polygon;panelUv:PointMm[];cut:boolean};
export type CompiledPanel={boundary:Polygon;tiles:PanelPiece[];joints:Polygon[];widthMm:number;heightMm:number;toleranceMm:number};
export const PANEL_TOLERANCE_MM=.25;
export const polygonArea=(p:Polygon)=>Math.abs(p.reduce((a,v,i)=>{const n=p[(i+1)%p.length];return a+v.x*n.y-n.x*v.y;},0))/2;
export const rectangle=(x:number,y:number,w:number,h:number):Polygon=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
/** Convex half-plane clipping, including new intersection vertices in physical mm. */
export function halfPlane(subject:Polygon,a:PointMm,b:PointMm,inside=true):Polygon {
  const cross=(p:PointMm)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
  const result:Polygon=[];
  for(let i=0;i<subject.length;i++){
    const p=subject[i],q=subject[(i+1)%subject.length],cp=cross(p),cq=cross(q),ip=inside?cp>=-1e-7:cp<=1e-7,iq=inside?cq>=-1e-7:cq<=1e-7;
    if(ip)result.push(p);
    if(ip!==iq){const t=cp/(cp-cq);result.push({x:p.x+t*(q.x-p.x),y:p.y+t*(q.y-p.y)});}
  }
  return result.length>=3&&polygonArea(result)>1e-12?result:[];
}
export function intersectPolygon(subject:Polygon,boundary:Polygon):Polygon {
  if(!boundary.length)return [];
  let p=subject;for(let i=0;i<boundary.length&&p.length;i++)p=halfPlane(p,boundary[i],boundary[(i+1)%boundary.length]);return p;
}
/** Disjoint convex pieces outside a convex boundary; used by normal Center backing tiles. */
export function subtractPolygon(subject:Polygon,boundary:Polygon):Polygon[] {
  let p=subject;const outside:Polygon[]=[];
  for(let i=0;i<boundary.length&&p.length;i++){const a=boundary[i],b=boundary[(i+1)%boundary.length],piece=halfPlane(p,a,b,false);if(piece.length)outside.push(piece);p=halfPlane(p,a,b,true);}
  return outside;
}
export function panelBoundary(p:Pick<DecorativePanel,'shape'|'widthMm'|'heightMm'>):Polygon {
  if(p.shape==='rectangle')return rectangle(0,0,p.widthMm,p.heightMm);
  const radius=Math.max(p.widthMm,p.heightMm)/2;
  const n=Math.max(64,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-PANEL_TOLERANCE_MM/radius))));
  return Array.from({length:n},(_,i)=>{const a=i*2*Math.PI/n;return {x:p.widthMm/2+Math.cos(a)*p.widthMm/2,y:p.heightMm/2+Math.sin(a)*p.heightMm/2};});
}
/** Geometry key deliberately excludes artwork identity/transform. UV mapping is independent. */
export const panelGeometryKey=(p:DecorativePanel)=>JSON.stringify([p.shape,p.widthMm,p.heightMm,p.tileSize,p.tileOrientation,p.jointWidthMm]);
export function compileDecorativePanel(input:DecorativePanel,clip?:Polygon):CompiledPanel {
  const p=normalizePanel(input),boundary=clip?intersectPolygon(panelBoundary(p),clip):panelBoundary(p);
  const w=p.tileOrientation===90?p.tileSize.heightMm:p.tileSize.widthMm,h=p.tileOrientation===90?p.tileSize.widthMm:p.tileSize.heightMm,j=p.jointWidthMm;
  const rows=Math.ceil(p.heightMm/(h+j)),cols=Math.ceil(p.widthMm/(w+j));
  if(rows*cols>10000)throw Error('Panel exceeds 10000 tile bodies. Choose larger tiles or a smaller panel.');
  const tiles:PanelPiece[]=[],joints:Polygon[]=[];let vertices=0;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const x=col*(w+j),y=row*(h+j),polygon=intersectPolygon(rectangle(x,y,w,h),boundary);
    if(polygon.length){vertices+=polygon.length;tiles.push({id:`r${row}c${col}`,row,column:col,body:{x,y,width:w,height:h},polygon,panelUv:polygon.map(v=>({x:v.x/p.widthMm,y:v.y/p.heightMm})),cut:Math.abs(polygonArea(polygon)-w*h)>1e-4});}
    if(j)for(const gap of [rectangle(x+w,y,j,h+j),rectangle(x,y+h,w,j)]){const part=intersectPolygon(gap,boundary);if(part.length){joints.push(part);vertices+=part.length;}}
    if(vertices>500000)throw Error('Panel exceeds the cut-vertex budget. Choose larger tiles.');
  }
  return {boundary,tiles,joints,widthMm:p.widthMm,heightMm:p.heightMm,toleranceMm:PANEL_TOLERANCE_MM};
}
/** Physical-only entry for editor memoization: mapping changes cannot trigger compilation. */
export function compilePanelGeometry(key:string):CompiledPanel {
  const [shape,widthMm,heightMm,tileSize,tileOrientation,jointWidthMm]=JSON.parse(key);
  return compileDecorativePanel({version:1,id:'geometry',revision:1,name:'Geometry',shape,widthMm,heightMm,tileSize,tileOrientation,jointWidthMm,artworkSourceId:'geometry',tileVariantId:'geometry',artworkTransform:{fit:'fill',scale:1,offsetXmm:0,offsetYmm:0,rotationDeg:0}});
}
