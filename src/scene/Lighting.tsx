import { useEffect, useRef } from "react";
import type { DirectionalLight, Object3D } from "three";
import { ROOM, WINDOW } from "./roomConfig";

/**
 * VR-friendly lighting: one shadow-casting "sun" aligned with the window so
 * daylight visibly rakes across the ceramic floor, soft sky/ground fill, and
 * one small warm point light for interior ambience. Single shadow caster,
 * no post-processing — cheap enough for standalone Quest rendering while
 * still giving polished vs. matte ceramics a clearly different look.
 */
export function Lighting() {
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
  }, []);

  return (
    <>
      {/* Soft overall fill so no corner of the room goes fully black — dark
          finishes (satin/matte) need enough ambient bounce to still read
          detail away from direct light, without washing out the rest of
          the room. */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#cfe3f7", "#736a5c", 0.46]} />

      {/* Sun, positioned outside the window wall so light rakes into the
          room in the same direction a customer would actually see. */}
      <directionalLight
        ref={sunRef}
        position={[halfW + 2.2, ROOM.height + 1.4, WINDOW.sillHeight + 0.6]}
        intensity={2.4}
        color="#fff2dd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={12}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-radius={2.5}
        shadow-bias={-0.0008}
      />
      <object3D ref={sunTargetRef} position={[0, 0.4, 0.2]} />

      {/* Warm interior fill near the ceiling, no shadow (keeps light/shadow
          casters to a single one for Quest headroom). */}
      <pointLight
        position={[0, ROOM.height - 0.3, 0]}
        intensity={0.85}
        distance={6.5}
        decay={2}
        color="#fff1dd"
      />
    </>
  );
}
