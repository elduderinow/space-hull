# Space Hull

A ship interior looking out on a procedurally generated planet. Three presets
change the hull's proportions, its materials and the colour of the star it is
orbiting; a slider swings that star through a full day.

Rendered with three.js on `WebGPURenderer`, falling back to WebGL 2 where WebGPU
is missing. The badge in the top right says which backend actually started.

Ported from the SpaceHull scene in a 2024 portfolio project.

## Running it

```bash
npm install
npm run dev
```

## What is in the scene

- An eight-sided hull built per wall, each slab a box with its windows cut out
  by CSG and a frame extruded back into the hole.
- Windows and panels packed onto each wall at a density and ratio set in
  `src/lib/hull.ts`.
- A planet whose surface is domain-warped fbm over classic Perlin noise, written
  as a TSL node graph in `src/lib/planetMaterial.ts`.
- Carpet, glass table, curved chair and floor lamp loaded from glTF.
- GTAO and bloom composed through a `RenderPipeline`.

## How the port differs

The original ran on the WebGL renderer with leva panels, a zustand store and a
stack of libraries that have no WebGPU path. The scene is the same; the plumbing
under it is not.

- **Wall packing is seeded.** The 2024 version called `Math.random` inside a
  `useMemo`, so every remount reshuffled the hull and a tweak to an unrelated
  knob moved every window. The seed here is derived from the wall itself, so a
  given hull is stable and the eight walls still differ from each other.
- **The planet material is hand-ported to TSL.** It was lamina: a custom
  Abstract layer of GLSL under a Depth layer, composed by `LayerMaterial`.
  lamina injects GLSL through `onBeforeCompile`, which the node renderer never
  sees. The noise is ported node for node. The Depth layer is folded into a
  constant: it ramps over 2 to 10 units from the origin, and the planet sits
  about 140 units out, so that ramp was saturated everywhere on it and only ever
  contributed a flat half-strength blue.
- **The environment is built by hand.** drei's `<Environment>` with
  `<Lightformer>` children drives the core `PMREMGenerator`, whose prefilter
  pass uses a plain `ShaderMaterial` the node builder rejects. The same four
  rectangles at the same intensities are prefiltered here with the
  `PMREMGenerator` from `three/webgpu`.
- **Post-processing is three's own TSL passes.** `@react-three/postprocessing`
  does not run on the WebGPU path, so N8AO becomes GTAO, bloom becomes
  `BloomNode`, and Uncharted2 tone mapping becomes ACES. The bloom values were
  retuned rather than copied; the intensity scales do not carry over.
- **Shadows are plain PCF.** drei's `SoftShadows` patches a GLSL shadow chunk
  that the node renderer does not use, and `PCFSoftShadowMap` has been removed
  from `WebGPURenderer`.
- **CSG is `three-bvh-csg` directly** instead of `@react-three/csg`, which
  builds its own React tree around the same library.
- **leva and the zustand store are gone**, replaced by an HTML panel and local
  React state. Space is painted as a scene background rather than showing
  through a transparent clear, because the composed pipeline output is opaque.
- The planet's icosahedron detail is 6 rather than 11. At 11 it is about four
  million triangles for a sphere that is never seen up close.
