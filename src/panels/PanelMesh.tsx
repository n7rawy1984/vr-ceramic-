import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {panelBuffers,mappedPanelUvs} from './render';
import {useArtwork} from './images';
import type {CompiledLayout} from '../layout/model';
export function PanelMesh({panel,surface}:{panel:NonNullable<CompiledLayout['decorative']>;surface:CompiledLayout['surface']}){
  const {definition,compiled,origin}=panel,{texture,source,error}=useArtwork(definition.artworkSourceId);
  const geometry=useMemo(()=>{const b=panelBuffers(compiled,origin,surface),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.setIndex(b.indices);g.computeVertexNormals();g.computeBoundingSphere();return g;},[compiled,origin,surface]);
  useEffect(()=>{if(source){geometry.setAttribute('uv',new THREE.BufferAttribute(mappedPanelUvs(compiled,definition,source),2));}},[geometry,compiled,definition,source]);
  const material=useMemo(()=>{const m=new THREE.MeshStandardMaterial({map:texture,color:texture?'#ffffff':'#f3f1eb',roughness:.65,metalness:.02});
    m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
      vec4 sampledDiffuseColor = texture2D(map, vMapUv);
      if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) sampledDiffuseColor = vec4(1.0);
      sampledDiffuseColor = vec4(mix(vec3(1.0), sampledDiffuseColor.rgb, sampledDiffuseColor.a), 1.0);
      diffuseColor *= sampledDiffuseColor;
      #endif`);};return m;},[texture]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);useEffect(()=>()=>material.dispose(),[material]);
  return <mesh name="decorative-panel" geometry={geometry} material={material} receiveShadow userData={{panelId:definition.id,revision:definition.revision,placementCount:compiled.tiles.length,artworkSourceId:definition.artworkSourceId,error}}/>;
}
