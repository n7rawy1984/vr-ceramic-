import { PanelMesh } from '../panels/PanelMesh';
import { useCallback, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useFloorDesign } from "../layout/useFloorDesign";
import { floorBatchBuffers, floorWorldPoint } from "../layout/renderGeometry";
import { roomSurface } from "../layout/roomDimensions";
import type { CompiledTilePlacement } from "../layout/model";
import type { MaterialProduct } from "../catalog/types";
import { useCeramicTexture } from "../hooks/useCeramicTexture";
import { useOptionalTexture } from "../hooks/useOptionalTexture";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { mmToM } from "../utils/units";

/** One merged quad batch per asset, including clipped UVs. No React node per tile. */
function AssetBatch({ product, placements, report }: { product: MaterialProduct; placements: CompiledTilePlacement[]; report: (id: string, error: string | null) => void }) {
  const size=useFloorDesignStore(s=>s.roomSize);
  const surface=useMemo(()=>roomSurface(size),[size]);
  const { texture, error } = useCeramicTexture(product);
  const normal = useOptionalTexture(product.normalTexture);
  const roughness = useOptionalTexture(product.roughnessTexture);
  const geometry = useMemo(() => {
    const {positions,normals,uv,indices}=floorBatchBuffers(surface,placements,product.imageTransform);
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeBoundingSphere();return g;
  }, [surface,placements,product.imageTransform]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: texture ? "#ffffff" : "#c6c6c6", map: texture ?? null, normalMap: normal, roughnessMap: roughness,
    roughness: roughness ? 1 : (product.roughnessValue ?? .82), metalness: .04,
  }), [texture, normal, roughness, product.roughnessValue]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => { report(product.id,error); return () => report(product.id,null); }, [product.id,error,report]);
  return <mesh name={`layout-asset-${product.id}`} geometry={geometry} material={material} receiveShadow
    userData={{ placementIds: placements.map(p=>p.id), placementCount: placements.length }} />;
}
export function AdvancedFloor() {
  const size=useFloorDesignStore(s=>s.roomSize);
  const surface=useMemo(()=>roomSurface(size),[size]);
  const { products, result } = useFloorDesign();
  const [errors, setErrors] = useState<Record<string,string|null>>({});
  const selected = useFloorDesignStore(s=>s.selectedPlacementId);
  const setError = useConfiguratorStore(s=>s.setFloorImageError);
  const report = useCallback((id: string, error: string|null) => setErrors(old=>old[id]===error ? old : {...old,[id]:error}), []);
  const groups = useMemo(() => {
    const map = new Map<string,CompiledTilePlacement[]>();
    if(result.ok)for(const p of result.layout.placements){const group=map.get(p.tileAssetId)??[];group.push(p);map.set(p.tileAssetId,group);}
    return [...map].map(([id,placements])=>({id,placements}));
  },[result]);
  const message = groups.map(g=>errors[g.id]).filter(Boolean).join(" ") || null;
  useEffect(()=>{setError(message);return()=>setError(null);},[message,setError]);
  const placement = result.ok ? result.layout.placements.find(p=>p.id===selected) : undefined;
  const outline = useMemo(()=>{
    if(!placement)return null;
    const p=placement;const corners=[[p.xMm,p.yMm],[p.xMm+p.widthMm,p.yMm],[p.xMm+p.widthMm,p.yMm+p.heightMm],[p.xMm,p.yMm+p.heightMm]];
    const points=corners.flatMap((a,i)=>[new THREE.Vector3(...floorWorldPoint(surface,a[0],a[1],.006)),new THREE.Vector3(...floorWorldPoint(surface,...corners[(i+1)%4] as [number,number],.006))]);
    return new THREE.BufferGeometry().setFromPoints(points);
  },[placement,surface]);
  useEffect(()=>()=>outline?.dispose(),[outline]);
  return <group name="compiled-floor" userData={{ placementCount: result.ok ? result.layout.placements.length : 0, batchCount: groups.length }}>
    <mesh name="layout-grout" rotation={[-Math.PI/2,0,0]} receiveShadow>
      <planeGeometry args={[mmToM(surface.widthMm),mmToM(surface.heightMm)]}/><meshStandardMaterial color="#a6a39c" roughness={.94}/>
    </mesh>
    {groups.map(g=><AssetBatch key={g.id} product={products.find(p=>p.id===g.id)!} placements={g.placements} report={report}/>)}
    {result.ok&&result.layout.decorative&&<PanelMesh panel={result.layout.decorative} surface={result.layout.surface}/>}
    {outline&&<lineSegments geometry={outline}><lineBasicMaterial color="#f7c66a" depthTest={false}/></lineSegments>}
  </group>;
}
