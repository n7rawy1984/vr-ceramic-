import * as THREE from 'three';

/** Camera-only cutaway. Original materials and all shadow-casting geometry remain untouched. */
export function createSideCutaway() {
  const originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>();
  const clones=new Map<THREE.Material,THREE.Material>();
  const muted=(material:THREE.Material)=>{
    let clone=clones.get(material);
    if(!clone){clone=material.clone();clone.colorWrite=false;clone.depthWrite=false;clones.set(material,clone);}
    return clone;
  };
  const isClone=(material:THREE.Material)=>[...clones.values()].includes(material);
  function restore(){
    for(const [mesh,material] of originals){
      const current=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      // A texture/material refresh may already have replaced the temporary material.
      if(current.every(isClone))mesh.material=material;
    }
    originals.clear();for(const material of clones.values())material.dispose();clones.clear();
  }
  function update(group:THREE.Group,hidden:boolean){
    group.userData.cutawayHidden=hidden;
    if(!hidden){if(originals.size)restore();return;}
    const used=new Set<THREE.Material>(),seen=new Set<THREE.Mesh>();
    group.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      seen.add(object);
      const current=Array.isArray(object.material)?object.material:[object.material];
      if(!current.every(isClone)){
        originals.set(object,object.material);
        object.material=Array.isArray(object.material)?object.material.map(muted):muted(object.material);
      }
      const original=originals.get(object);
      for(const material of Array.isArray(original)?original:original?[original]:[])used.add(material);
    });
    for(const mesh of originals.keys())if(!seen.has(mesh))originals.delete(mesh);
    for(const [original,clone] of clones)if(!used.has(original)){clone.dispose();clones.delete(original);}
  }
  return {update,dispose:restore};
}
