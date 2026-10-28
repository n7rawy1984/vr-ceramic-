import {compileLayout,rectArea,imagePoint} from '../layout/compiler.ts';
import type {CompileResult,FloorInstallation,LayoutAsset,RectMm,Surface} from '../layout/model.ts';
import {compileDecorativePanel,polygonArea,rectangle,subtractPolygon,type Polygon} from './compiler.ts';
/** The normal compiler still owns Field/Frame/Center. This adapter subtracts the real panel shape from Center backing. */
export function compileFloor(surface:Surface,i:FloorInstallation,assets:readonly LayoutAsset[]):CompileResult {
  const result=compileLayout(surface,i,assets),p=i.center.enabled?i.center.panel:undefined;
  if(!result.ok||!p)return result;
  try{
    if(i.center.widthMm!==p.widthMm||i.center.heightMm!==p.heightMm)throw Error('Panel retains its own physical dimensions. Select the panel again to set the Center area.');
    const compiled=compileDecorativePanel(p),x=(surface.widthMm-p.widthMm)/2,y=(surface.heightMm-p.heightMm)/2;
    const boundary=compiled.boundary.map(v=>({x:v.x+x,y:v.y+y}));
    const pieces=(r:RectMm)=>{const polygon=rectangle(r.xMm,r.yMm,r.widthMm,r.heightMm);return r.xMm+r.widthMm<=x||r.yMm+r.heightMm<=y||r.xMm>=x+p.widthMm||r.yMm>=y+p.heightMm?[polygon]:subtractPolygon(polygon,boundary);};
    const bounds=(polygon:Polygon)=>{const xs=polygon.map(v=>v.x),ys=polygon.map(v=>v.y),xMm=Math.min(...xs),yMm=Math.min(...ys);return {xMm,yMm,widthMm:Math.max(...xs)-xMm,heightMm:Math.max(...ys)-yMm};};
    result.layout.placements=result.layout.placements.flatMap(tile=>tile.zoneId!=='center'?[tile]:pieces(tile).map((polygon,index)=>{
      const r=bounds(polygon),a=imagePoint(tile,r.xMm,r.yMm),b=imagePoint(tile,r.xMm+r.widthMm,r.yMm+r.heightMm);
      const w=tile.rotationDeg===90?tile.tileBounds.heightMm:tile.tileBounds.widthMm,h=tile.rotationDeg===90?tile.tileBounds.widthMm:tile.tileBounds.heightMm;
      return {...tile,...r,polygon,id:`${tile.id}/panel-cut${index}`,fullTile:false,sourceRect:{xMm:Math.min(a[0],b[0])*w,yMm:Math.min(a[1],b[1])*h,widthMm:Math.abs(b[0]-a[0])*w,heightMm:Math.abs(b[1]-a[1])*h}};
    }));
    result.layout.joints=result.layout.joints.flatMap(j=>pieces(j).map(polygon=>({...bounds(polygon),polygon})));
    if(result.layout.placements.length>40000||result.layout.placements.reduce((n,p)=>n+(p.polygon?.length??4),0)>500000)throw Error('Too many panel backing cut pieces. Choose larger Center tiles.');
    result.layout.decorative={definition:p,compiled,origin:{x,y}};
    result.layout.tileAreaMm2=result.layout.placements.reduce((a,t)=>a+(t.polygon?polygonArea(t.polygon):rectArea(t)),0)+compiled.tiles.reduce((a,t)=>a+polygonArea(t.polygon),0);
    result.layout.jointAreaMm2=result.layout.joints.reduce((a,j)=>a+(j.polygon?polygonArea(j.polygon):rectArea(j)),0)+compiled.joints.reduce((a,j)=>a+polygonArea(j),0);
    return result;
  }catch(e){return {ok:false,errors:[(e as Error).message]};}
}
