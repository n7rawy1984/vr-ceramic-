import * as THREE from "three";
export type Pose = { position: THREE.Vector3; target: THREE.Vector3; fov: number };

export function presetPose(view: string, aspect: number, ROOM: {width:number;length:number;height:number}): Pose {
  const scale=Math.max(ROOM.width/6,ROOM.length/7);
  if (view === "top") {
    const fov = 45;
    // Fit both dimensions, including portrait screens. Tiny Z offset avoids
    // the lookAt singularity at the exact pole; this is a visual inspection.
    const height = Math.max(ROOM.length / 2, ROOM.width / 2 / aspect) /
      Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.22;
    return { position: new THREE.Vector3(0, height, 0.001), target: new THREE.Vector3(), fov };
  }
  if (view === "floor") return {
    position: new THREE.Vector3(0, Math.min(ROOM.height*.82,2.45 * scale), ROOM.length / 2 - Math.min(.65,ROOM.length*.1)),
    target: new THREE.Vector3(0, 0, -0.1), fov: 52,
  };
  if (view === "detail") return {
    position: new THREE.Vector3(Math.min(.65,ROOM.width*.2), Math.min(1.15,ROOM.height*.5), Math.min(1.8,ROOM.length*.25)),
    target: new THREE.Vector3(Math.min(.1,ROOM.width*.1), 0, Math.min(.5,ROOM.length*.1)), fov: 48,
  };
  return {
    position: new THREE.Vector3(Math.min(.8,ROOM.width*.13), Math.min(ROOM.height*.88,2.65 * scale), ROOM.length / 2 - Math.min(.4,ROOM.length*.1)),
    target: new THREE.Vector3(-Math.min(.3,ROOM.width*.1), 0, -Math.min(.9,ROOM.length*.2)), fov: 58,
  };
}

