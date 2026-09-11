"use client";

import { useEffect, useMemo } from "react";
import { Color, DoubleSide, Vector2 } from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import type { TextureSet } from "./textures";

export type StandardMaterialOptions = {
  color?: string;
  metalness?: number;
  roughness?: number;
  normalScale?: number;
  emissive?: string;
  emissiveIntensity?: number;
  doubleSide?: boolean;
  textures?: TextureSet;
};

/**
 * MeshStandardNodeMaterial built and kept in sync by hand.
 *
 * Maps land after the first render, and a node material has to be told its
 * graph changed: assigning a map without needsUpdate leaves the compiled shader
 * sampling nothing.
 */
export function useStandardMaterial({
  color = "#ffffff",
  metalness = 0,
  roughness = 1,
  normalScale = 1,
  emissive,
  emissiveIntensity = 1,
  doubleSide = false,
  textures,
}: StandardMaterialOptions) {
  const material = useMemo(() => new MeshStandardNodeMaterial(), []);

  useEffect(() => {
    material.color = new Color(color);
    material.metalness = metalness;
    material.roughness = roughness;
    material.normalScale = new Vector2(normalScale, normalScale);
    if (doubleSide) material.side = DoubleSide;
    if (emissive) {
      material.emissive = new Color(emissive);
      material.emissiveIntensity = emissiveIntensity;
    }
  }, [material, color, metalness, roughness, normalScale, emissive, emissiveIntensity, doubleSide]);

  useEffect(() => {
    material.map = textures?.map ?? null;
    material.normalMap = textures?.normalMap ?? null;
    material.roughnessMap = textures?.roughnessMap ?? null;
    material.metalnessMap = textures?.metalnessMap ?? null;
    material.aoMap = textures?.aoMap ?? null;
    material.needsUpdate = true;
  }, [material, textures]);

  useEffect(() => () => material.dispose(), [material]);

  return material;
}
