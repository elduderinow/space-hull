"use client";

import { useGLTF } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { useStandardMaterial } from "@/lib/materials";
import { useTextureSet } from "@/lib/textures";

/**
 * The furniture, straight from the 2024 scene. The glTF materials that are kept
 * as-is (the glass table, the chair base) are ordinary MeshPhysicalMaterial and
 * MeshStandardMaterial; the renderer swaps those for their node equivalents on
 * its own, so they need no porting.
 */

export function Carpet({ height, color }: { height: number; color: string }) {
  const { nodes } = useGLTF("/model/carpet.glb");
  const rug = nodes.rug as Mesh;
  const textures = useTextureSet("cotton", { repeat: [0.5, 0.5] });
  const material = useStandardMaterial({
    color,
    metalness: 0,
    roughness: 1,
    normalScale: 0.3,
    textures,
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -height / 2 + 0.1, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={rug.geometry}
        scale={[700, 700, 500]}
        material={material}
      />
    </group>
  );
}

export function GlassTable({ height }: { height: number }) {
  const { nodes, materials } = useGLTF("/model/glass_table.glb");
  const table = nodes["Tables_Coffee-Tables_Glass-Coloured_02_Blue-Short"] as Mesh;

  return (
    <group rotation={[0, Math.PI / 2, 0]} position={[-1, -height / 2 + 1.3, 0]}>
      <mesh
        castShadow
        receiveShadow
        geometry={table.geometry}
        scale={6}
        material={materials["Blue-Glass_01_1k_glTF"]}
      />
    </group>
  );
}

export function CurvedChair({ height, color }: { height: number; color: string }) {
  const { nodes, materials } = useGLTF("/model/chair_curved.glb");
  const seat = nodes["Seating_Lounge-Chairs_Curved-Swivel_01_glTF"] as Mesh;
  const base = nodes["Seating_Lounge-Chairs_Curved-Swivel_01_glTF_1"] as Mesh;
  const textures = useTextureSet("cotton", { repeat: [1, 1] });
  const seatMaterial = useStandardMaterial({
    color,
    metalness: 0,
    roughness: 0.8,
    normalScale: 0.5,
    textures,
  });

  return (
    <group rotation={[0, Math.PI / 6, 0]} position={[-5, -height / 2 + 1.3, -4]}>
      <mesh castShadow receiveShadow geometry={seat.geometry} scale={4} material={seatMaterial} />
      <mesh
        castShadow
        receiveShadow
        geometry={base.geometry}
        scale={4}
        material={materials["Wood-Black-Anisotropic_01_05k_glTF"] as MeshStandardMaterial}
      />
    </group>
  );
}

export function FloorLamp({
  height,
  color,
  lightColor,
  position,
  intensity,
}: {
  height: number;
  color: string;
  lightColor: string;
  position: [number, number, number];
  intensity: number;
}) {
  const { nodes } = useGLTF("/model/floor_lamp.glb");
  const shade = nodes["Lighting_Floor-Lamps_Sculptural-Green_01_glTF"] as Mesh;
  const bulb = nodes["Lighting_Floor-Lamps_Sculptural-Green_01_glTF_1"] as Mesh;

  const shadeMaterial = useStandardMaterial({
    color: "white",
    emissive: color,
    emissiveIntensity: 200,
  });
  const bulbMaterial = useStandardMaterial({ color, roughness: 0.3, metalness: 0.5 });

  return (
    <group scale={3} rotation={[0, Math.PI / 4, 0]} position={[3, -height / 2 + 0.1, -8]}>
      <mesh castShadow receiveShadow geometry={shade.geometry} material={shadeMaterial} />
      <mesh castShadow receiveShadow geometry={bulb.geometry} material={bulbMaterial} />
      <pointLight
        castShadow
        position={position}
        intensity={intensity}
        color={lightColor}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
      />
    </group>
  );
}

useGLTF.preload("/model/carpet.glb");
useGLTF.preload("/model/glass_table.glb");
useGLTF.preload("/model/chair_curved.glb");
useGLTF.preload("/model/floor_lamp.glb");
