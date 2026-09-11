"use client";

import { useEffect, useMemo, useState } from "react";
import { RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from "three";

/** The 2024 texture sets, minus the ones the SpaceHull scene never used. */
export const TEXTURE_SETS = {
  greeble: {
    normalMap: "/textures/greeble/normal.jpg",
    roughnessMap: "/textures/greeble/roughness.jpg",
    aoMap: "/textures/greeble/ambientOcclusion.jpg",
    metalnessMap: "/textures/greeble/metalness.jpg",
  },
  greeble_space: {
    map: "/textures/greeble_space/basecolor.png",
    normalMap: "/textures/greeble_space/normal.png",
    aoMap: "/textures/greeble_space/ao.png",
    roughnessMap: "/textures/greeble_space/roughness.png",
    metalnessMap: "/textures/greeble_space/metalness.png",
  },
  worn_abs: {
    map: "/textures/worn_abs/basecolor.jpg",
    normalMap: "/textures/worn_abs/normal.png",
    roughnessMap: "/textures/worn_abs/roughness.jpg",
    metalnessMap: "/textures/worn_abs/metalness.jpg",
  },
  steel: {
    map: "/textures/steel/basecolor.jpg",
    normalMap: "/textures/steel/normal.png",
    roughnessMap: "/textures/steel/roughness.jpg",
    metalnessMap: "/textures/steel/metalness.jpg",
  },
  cotton: {
    map: "/textures/cotton/basecolor.png",
    normalMap: "/textures/cotton/normal.png",
    metalnessMap: "/textures/cotton/metalness.png",
    aoMap: "/textures/cotton/ao.png",
  },
} as const;

export type TextureSetName = keyof typeof TEXTURE_SETS;
export type TextureSet = Partial<Record<"map" | "normalMap" | "roughnessMap" | "aoMap" | "metalnessMap", Texture>>;

/**
 * One cache for the whole app. The hull reuses the same five sets across dozens
 * of meshes, and loading each one per mesh would fetch 26MB of PNG several
 * times over.
 */
const cache = new Map<string, Texture>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

/** Starts the download once per url and returns the texture only once it is in. */
function loadOnce(url: string): Texture | undefined {
  const ready = cache.get(url);
  if (ready) return ready;
  if (pending.has(url)) return undefined;

  pending.add(url);
  new TextureLoader().load(url, (texture) => {
    cache.set(url, texture);
    pending.delete(url);
    for (const notify of listeners) notify();
  });

  return undefined;
}

export function useTextureSet(
  name: TextureSetName,
  { repeat, rotation = 0, flipY = true }: { repeat?: [number, number]; rotation?: number; flipY?: boolean } = {},
): TextureSet {
  const [tick, setTick] = useState(0);
  const repeatX = repeat?.[0] ?? 1;
  const repeatY = repeat?.[1] ?? 1;

  useEffect(() => {
    const notify = () => setTick((t) => t + 1);
    listeners.add(notify);
    return () => {
      listeners.delete(notify);
    };
  }, []);

  return useMemo(() => {
    const set: TextureSet = {};

    for (const [key, url] of Object.entries(TEXTURE_SETS[name])) {
      // Each mesh needs its own repeat and rotation, so the loaded texture is
      // cloned per set. Clones share the decoded image, so this costs a
      // descriptor rather than another download.
      const source = loadOnce(url);
      if (!source) continue;
      const texture = source.clone();
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.rotation = rotation;
      texture.flipY = flipY;
      texture.anisotropy = 4;
      // Only the base colour carries colour. Flagging the data maps sRGB would
      // skew roughness, metalness and AO.
      if (key === "map") texture.colorSpace = SRGBColorSpace;
      texture.needsUpdate = true;
      set[key as keyof TextureSet] = texture;
    }

    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, repeatX, repeatY, rotation, flipY, tick]);
}
