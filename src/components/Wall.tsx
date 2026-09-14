"use client";

import { useMemo } from "react";
import { useStandardMaterial } from "@/lib/materials";
import { useTextureSet } from "@/lib/textures";
import { packWall, type HullSegment, type HullType, type PackingOptions } from "@/lib/hull";
import { buildWallGeometry, buildWindowFrame } from "@/lib/wallGeometry";

/**
 * One face of the hull: a slab with windows cut through it, window frames and
 * greebled panels sitting on the surface, and a light bar along the two side
 * walls.
 */
export default function Wall({
  segment,
  depth,
  seed,
  packing,
  color,
  windowColor,
  panelColor,
  lightBarColor,
}: {
  segment: HullSegment;
  depth: number;
  seed: number;
  packing: PackingOptions;
  color: string;
  windowColor: string;
  panelColor: string;
  lightBarColor: string;
}) {
  const hullTextures = useTextureSet("greeble_space", { repeat: [1, 1] });
  const floorTextures = useTextureSet("worn_abs", { repeat: [0.6, 0.6] });
  const steelTextures = useTextureSet("steel", { repeat: [0.1, 0.1] });
  const greebleTextures = useTextureSet("greeble");

  const isFloor = segment.type === "floor-center";

  const items = useMemo(
    () => (isFloor ? [] : packWall(depth, segment.length, seed, packing)),
    [isFloor, depth, segment.length, seed, packing],
  );

  const geometry = useMemo(
    () => buildWallGeometry(depth, segment.length, items, !isFloor),
    [depth, segment.length, items, isFloor],
  );

  const wallMaterial = useStandardMaterial(
    isFloor
      ? { color: "white", metalness: 0, roughness: 0.8, normalScale: 0.4, textures: floorTextures }
      : { color, metalness: 0, roughness: 1, normalScale: 5, textures: hullTextures },
  );

  const frameMaterial = useStandardMaterial({
    color: windowColor,
    metalness: 0.4,
    roughness: 0.5,
    normalScale: 5,
    textures: steelTextures,
  });

  const panelMaterial = useStandardMaterial({
    color: panelColor,
    metalness: 0.2,
    roughness: 0.6,
    normalScale: 0.4,
    textures: greebleTextures,
  });

  const lightBarMaterial = useStandardMaterial({
    color: lightBarColor,
    emissive: lightBarColor,
    emissiveIntensity: 20,
  });

  const frames = useMemo(
    () =>
      items
        .filter((item) => item.type === "window")
        .map((item) => ({ item, geometry: buildWindowFrame(item.w, item.h) })),
    [items],
  );

  const lightBar = lightBarPosition(segment.type);

  return (
    <group position={segment.position} rotation={[0, Math.PI / 2, 0]}>
      <mesh
        castShadow
        receiveShadow
        rotation={[segment.rotation[2], 0, 0]}
        geometry={geometry}
        material={wallMaterial}
      >
        {frames.map(({ item, geometry: frameGeometry }, i) => (
          <mesh
            key={`frame-${i}`}
            castShadow
            receiveShadow
            position={[item.x - item.w / 2, item.y - item.h / 2, 0]}
            geometry={frameGeometry}
            material={frameMaterial}
          />
        ))}

        {items
          .filter((item) => item.type === "panel")
          .map((item, i) => (
            <mesh key={`panel-${i}`} position={[item.x, item.y, 0]} material={panelMaterial}>
              <boxGeometry args={[item.w, item.h, 0.2]} />
            </mesh>
          ))}

        {lightBar ? (
          <mesh
            castShadow
            receiveShadow
            rotation={[0, 0, Math.PI / 2]}
            position={lightBar}
            material={lightBarMaterial}
          >
            <cylinderGeometry args={[0.05, 0.05, depth / 2]} />
          </mesh>
        ) : null}
      </mesh>
    </group>
  );
}

function lightBarPosition(type: HullType): [number, number, number] | null {
  if (type === "wall-left") return [0, -1.9, 0.05];
  if (type === "wall-right") return [0, 1.9, 0.05];
  return null;
}
