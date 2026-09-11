"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, Mesh, PlaneGeometry, Scene, type Texture } from "three";
import { MeshBasicNodeMaterial, PMREMGenerator, type WebGPURenderer } from "three/webgpu";

/**
 * Four bright rectangles prefiltered into an environment map. This is what
 * drei's <Environment> with <Lightformer> children does, rebuilt by hand
 * because drei's version drives a CubeCamera and the core PMREMGenerator, whose
 * prefilter pass uses a plain ShaderMaterial the node builder rejects.
 *
 * Positions, rotations and intensities are the 2024 ones.
 */
const LIGHTFORMERS: {
  intensity: number;
  position: [number, number, number];
  rotation: [number, number, number];
}[] = [
  { intensity: 50, position: [-10, -10, 0], rotation: [0, Math.PI / 2, 0] },
  { intensity: 30, position: [10, 1, 0], rotation: [0, Math.PI / 2, 0] },
  { intensity: 500, position: [0, 0, 10], rotation: [0, 0, 0] },
  { intensity: 600, position: [-10, -10, 0], rotation: [Math.PI / 2, 0, 0] },
];

export default function EnvironmentLightformers() {
  const scene = useThree((s) => s.scene);
  const renderer = useThree((s) => s.gl);

  useEffect(() => {
    const source = new Scene();
    const geometry = new PlaneGeometry(1, 1);

    for (const { intensity, position, rotation } of LIGHTFORMERS) {
      const material = new MeshBasicNodeMaterial();
      // drei folds a Lightformer's intensity into its colour, which is what
      // makes these read as light sources once they are prefiltered.
      material.color = new Color("white").multiplyScalar(intensity);
      const mesh = new Mesh(geometry, material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      source.add(mesh);
    }

    const pmrem = new PMREMGenerator(renderer as unknown as WebGPURenderer);
    let envMap: Texture | null = null;

    try {
      envMap = pmrem.fromScene(source, 0, 0.1, 100).texture;
      scene.environment = envMap;
    } finally {
      pmrem.dispose();
      geometry.dispose();
      for (const child of source.children) (child as Mesh).material && ((child as Mesh).material as { dispose(): void }).dispose();
    }

    return () => {
      scene.environment = null;
      envMap?.dispose();
    };
  }, [scene, renderer]);

  return null;
}
