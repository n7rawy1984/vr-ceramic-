import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { useRoom } from "./useRoom";
import { useEffect, useRef } from "react";
import type { DirectionalLight, Object3D } from "three";

/**
 * Neutral showroom lighting: one shadow-casting key aligned with the window so
 * daylight visibly rakes across the ceramic floor, soft sky/ground fill, and
 * one small neutral point light for interior ambience. Single shadow caster,
 * no post-processing — cheap enough for standalone Quest rendering while
 * still giving polished vs. matte ceramics a clearly different look.
 */
export function Lighting() {
  const ROOM = useRoom();
  const windowOffset=useFloorDesignStore(s=>s.architecture.window.offsetMm)/1000;
  const shadowExtent=Math.max(ROOM.width,ROOM.length,ROOM.height);
  const halfW = ROOM.width / 2;
  const sunRef = useRef<DirectionalLight>(null);
  const sunTargetRef = useRef<Object3D>(null);

  // A DirectionalLight's `target` only aims correctly once it's part of the
  // scene graph (its matrixWorld otherwise never updates) — wire it up via
  // an actual object3D below rather than the `target-position` shorthand.
  useEffect(() => {
    if (sunRef.current && sunTargetRef.current) {
      sunRef.current.target = sunTargetRef.current;
    }
    sunRef.current?.shadow.camera.updateProjectionMatrix();
  }, [ROOM.width,ROOM.length,ROOM.height]);

  return (
    <>
      {/* Soft overall fill so no corner of the room goes fully black — dark
          finishes (satin/matte) need enough ambient bounce to still read
          detail away from direct light, without washing out the rest of
          the room. */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#ffffff", "#b6b6b6", 0.65]} />

      {/* Sun, positioned outside the window wall so light rakes into the
          room in the same direction a customer would actually see. */}
      <directionalLight
        ref={sunRef}
        position={[halfW + 2.2, ROOM.height + 1.4, -windowOffset]}
        intensity={1.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={Math.min(1,ROOM.height/10)}
        shadow-camera-far={Math.max(40,shadowExtent*4)}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-radius={2.5}
        shadow-bias={-0.0008}
      />
      <object3D ref={sunTargetRef} position={[0, 0.4, 0.2]} />

      {/* Neutral interior fill near the ceiling, no shadow (keeps light/shadow
          casters to a single one for Quest headroom). */}
      <pointLight
        position={[0, ROOM.height*.85, 0]}
        intensity={0.85}
        distance={Math.max(10,shadowExtent*1.5)}
        decay={2}
        color="#ffffff"
      />
    </>
  );
}
