import { lightingContributions } from '../lighting/model';
import { FloorLamp } from './Furniture';
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
  const lighting=useFloorDesignStore(s=>s.lighting);
  const power=lightingContributions(lighting),color=lighting.lightingColor;
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
      <ambientLight name="room-ambient" intensity={power.ambient} color={lighting.lightingEnabled&&lighting.lightingBrightness>0?color:"#ffffff"} />
      <hemisphereLight name="room-hemisphere" color={color} groundColor="#b6b6b6" intensity={power.hemisphere} />

      {/* Sun, positioned outside the window wall so light rakes into the
          room in the same direction a customer would actually see. */}
      <directionalLight
        name="room-key"
        ref={sunRef}
        position={[halfW + 2.2, ROOM.height + 1.4, -windowOffset]}
        intensity={power.key}
        color={color}
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

      {/* Broad interior fill at mid-height (avoids inverse-square ceiling hotspot), no shadow (keeps light/shadow
          casters to a single one for Quest headroom). */}
      <pointLight name="room-fill"
        position={[0, ROOM.height*.5, 0]}
        intensity={power.point}
        distance={Math.max(10,shadowExtent*1.5)}
        decay={2}
        color={color}
      />
      <FloorLamp visible={lighting.lightFixtureVisible}/>
    </>
  );
}
