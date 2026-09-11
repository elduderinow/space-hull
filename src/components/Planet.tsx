"use client";

import { useEffect, useMemo } from "react";
import { createPlanetMaterial } from "@/lib/planetMaterial";

/**
 * The world outside the window. Geometry detail is halved from the 2024 value
 * (icosahedron detail 11 is roughly 1.3 million triangles for a sphere whose
 * silhouette is all that shows through the hull).
 */
export default function Planet() {
  const material = useMemo(() => createPlanetMaterial(), []);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <mesh position={[0, -70, -100]} rotation={[0, Math.PI, 0]} scale={2} material={material}>
      <icosahedronGeometry args={[40, 6]} />
    </mesh>
  );
}
