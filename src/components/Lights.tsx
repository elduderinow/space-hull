"use client";

import { lightPositionFromAngle, type Preset } from "@/lib/presets";

/**
 * One orbiting directional light plus ambient fill.
 *
 * The 2024 scene wrapped these in drei's <SoftShadows>, which swaps three's
 * shadow GLSL chunk for a PCSS one. Chunk patching does not reach the node
 * renderer, so the shadows are ordinary PCF here and the softness knobs are
 * gone with it.
 */
export default function Lights({
  preset,
  angle,
  intensity,
}: {
  preset: Preset;
  angle: number;
  intensity: number;
}) {
  const { shadow } = preset;

  return (
    <group>
      <directionalLight
        color={preset.directionalColor}
        castShadow
        position={lightPositionFromAngle(angle)}
        intensity={intensity}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-normalBias={shadow.normalBias}
        shadow-bias={shadow.bias}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-shadow.frustum, shadow.frustum, -shadow.frustum, shadow.frustum, shadow.near, shadow.far]}
        />
      </directionalLight>
      <ambientLight color={preset.ambientColor} intensity={preset.ambientIntensity} />
    </group>
  );
}
