import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useWall } from '../surfaces/useWalls';
import { wallBatchBuffers } from '../surfaces/renderGeometry';
import type { WallId } from '../surfaces/model';
import type { CompiledTilePlacement } from '../layout/model';
import type { MaterialProduct } from '../catalog/types';
import { useCeramicTexture } from '../hooks/useCeramicTexture';
import { useOptionalTexture } from '../hooks/useOptionalTexture';
function Batch({wall,placements,product}:{wall:ReturnType<typeof useWall>;placements:CompiledTilePlacement[];product:MaterialProduct}){
  const {texture,error}=useCeramicTexture(product),normal=useOptionalTexture(product.normalTexture),roughness=useOptionalTexture(product.roughnessTexture);
  const geometry=useMemo(()=>{
    const b=wallBatchBuffers(wall.surface,{widthMm:wall.size.widthMm,lengthMm:wall.size.lengthMm},placements,product.imageTransform),g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.indices);g.computeBoundingSphere();return g;
  },[wall.surface,wall.size.widthMm,wall.size.lengthMm,placements,product.imageTransform]);
  const material=useMemo(()=>new THREE.MeshStandardMaterial({map:texture,color:texture?'#ffffff':'#c6c6c6',normalMap:normal,roughnessMap:roughness,roughness:roughness?1:(product.roughnessValue??.82),metalness:.04}),[texture,normal,roughness,product.roughnessValue]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>material.dispose(),[material]);
  return <mesh name={`wall-tiles-${wall.surface.id}`} geometry={geometry} material={material} receiveShadow userData={{placementCount:placements.length,imageError:error}}/>;
}
export function TiledWall({id}:{id:WallId}){
  const wall=useWall(id);
  if(!wall.result?.ok)return null;
  const product=wall.products.find(p=>p.id===wall.design.tileAssetId);if(!product)return null;
  // Shell material under the placements supplies joints; it already has matching real openings.
  return <Batch wall={wall} placements={wall.result.layout.placements} product={product}/>;
}
