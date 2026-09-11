"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { RenderPipeline, type WebGPURenderer } from "three/webgpu";
import { mrt, output, pass, transformedNormalView } from "three/tsl";
import { ao } from "three/examples/jsm/tsl/display/GTAONode.js";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";

/**
 * The 2024 chain was N8AO, Uncharted2 tone mapping and a light bloom through
 * @react-three/postprocessing, none of which runs on the node renderer.
 *
 * GTAO stands in for N8AO and three's BloomNode for the bloom. Tone mapping is
 * the renderer's: three has no Uncharted2 operator, so ACES does the job. The
 * two curves are close in the shoulder and differ mostly in how hard they roll
 * off the highlights, which here is the emissive light bars and the lamp.
 *
 * Bloom strength does not carry over either. postprocessing's Bloom intensity
 * of 0.02 with a luminance threshold of 0 is a whole-frame haze; three's bloom
 * takes a threshold in the same units, so the numbers are retuned rather than
 * copied.
 */
export default function Post({
  bloomStrength = 0.25,
  bloomRadius = 0.6,
  bloomThreshold = 0.6,
  aoRadius = 1,
  aoScale = 1.5,
}: {
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  aoRadius?: number;
  aoScale?: number;
}) {
  const renderer = useThree((s) => s.gl) as unknown as WebGPURenderer;
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  const pipeline = useMemo(() => {
    const composed = new RenderPipeline(renderer);

    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: transformedNormalView }));

    const color = scenePass.getTextureNode("output");
    const depth = scenePass.getTextureNode("depth");
    const normal = scenePass.getTextureNode("normal");

    const aoPass = ao(depth, normal, camera);
    aoPass.radius.value = aoRadius;
    aoPass.scale.value = aoScale;

    const occluded = aoPass.getTextureNode().mul(color);
    composed.outputNode = occluded.add(
      bloom(occluded, bloomStrength, bloomRadius, bloomThreshold),
    );

    return composed;
  }, [renderer, scene, camera, bloomStrength, bloomRadius, bloomThreshold, aoRadius, aoScale]);

  useEffect(() => () => pipeline.dispose(), [pipeline]);

  // Priority above 0 takes the render loop from r3f, so the composed output is
  // what reaches the canvas.
  useFrame(() => {
    pipeline.render();
  }, 1);

  return null;
}
