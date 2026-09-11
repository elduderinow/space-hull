"use client";

import { useMemo } from "react";
import { useStandardMaterial } from "@/lib/materials";
import { useTextureSet } from "@/lib/textures";
import { buildShieldGeometry } from "@/lib/wallGeometry";

/** The outer ring of the hull, seen through the windows. */
export default function WindowShield({
  points,
  color,
}: {
  points: { x: number; y: number }[];
  color: string;
}) {
  const textures = useTextureSet("steel", { repeat: [0.1, 0.1] });
  const geometry = useMemo(() => buildShieldGeometry(points), [points]);
  const material = useStandardMaterial({
    color,
    metalness: 0.8,
    roughness: 0,
    normalScale: 0.4,
    doubleSide: true,
    textures,
  });

  return <mesh castShadow receiveShadow geometry={geometry} material={material} />;
}
