"use client";

import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { Preset } from "@/lib/presets";

/** Orbit controls that fly to the preset's framing whenever it changes. */
export default function Controls({ preset }: { preset: Preset }) {
  const controls = useRef<CameraControls>(null);
  const { position, lookAt } = preset.camera;

  useEffect(() => {
    void controls.current?.setLookAt(
      position[0],
      position[1],
      position[2],
      lookAt[0],
      lookAt[1],
      lookAt[2],
      true,
    );
  }, [position, lookAt]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={1}
      maxDistance={1000}
      dampingFactor={0.1}
      truckSpeed={1}
    />
  );
}
