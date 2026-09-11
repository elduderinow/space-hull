import { Color } from "three";
import type { Node } from "three/webgpu";
import { MeshLambertNodeMaterial } from "three/webgpu";
import { Fn, Loop, clamp, color, float, mix, time, uv, vec2, vec4 } from "three/tsl";

/**
 * The planet's surface, ported from GLSL to TSL.
 *
 * The 2024 version built it with lamina: a custom Abstract layer holding this
 * shader, stacked under a Depth layer, composed by LayerMaterial. lamina writes
 * GLSL through onBeforeCompile, so none of it survives on the WebGPU path. The
 * noise is ported node for node here; the Depth layer is folded into a constant
 * (see below).
 */

// Classic Perlin 2D, the Ashima/Stefan Gustavson version the original inlined.
const mod289 = Fn(([x]: [Node<"vec4">]) => x.sub(x.mul(1 / 289).floor().mul(289)));
const permute = Fn(([x]: [Node<"vec4">]) => mod289(x.mul(34).add(1).mul(x)));
const taylorInvSqrt = Fn(([r]: [Node<"vec4">]) => r.mul(-0.85373472095314).add(1.79284291400159));
const fade = Fn(([t]: [Node<"vec2">]) => t.mul(t).mul(t).mul(t.mul(t.mul(6).sub(15)).add(10)));

const cnoise = Fn(([P]: [Node<"vec2">]) => {
  const Pi = P.xyxy.floor().add(vec4(0, 0, 1, 1)).toVar();
  const Pf = P.xyxy.fract().sub(vec4(0, 0, 1, 1)).toVar();
  Pi.assign(mod289(Pi));

  const ix = Pi.xzxz;
  const iy = Pi.yyww;
  const fx = Pf.xzxz;
  const fy = Pf.yyww;

  const i = permute(permute(ix).add(iy));

  const gx = i.mul(1 / 41).fract().mul(2).sub(1).toVar();
  const gy = gx.abs().sub(0.5).toVar();
  const tx = gx.add(0.5).floor();
  gx.assign(gx.sub(tx));

  const g00 = vec2(gx.x, gy.x).toVar();
  const g10 = vec2(gx.y, gy.y).toVar();
  const g01 = vec2(gx.z, gy.z).toVar();
  const g11 = vec2(gx.w, gy.w).toVar();

  const norm = taylorInvSqrt(
    vec4(g00.dot(g00), g01.dot(g01), g10.dot(g10), g11.dot(g11)),
  ).toVar();
  g00.mulAssign(norm.x);
  g01.mulAssign(norm.y);
  g10.mulAssign(norm.z);
  g11.mulAssign(norm.w);

  const n00 = g00.dot(vec2(fx.x, fy.x));
  const n10 = g10.dot(vec2(fx.y, fy.y));
  const n01 = g01.dot(vec2(fx.z, fy.z));
  const n11 = g11.dot(vec2(fx.w, fy.w));

  const fadeXy = fade(Pf.xy);
  const nX = mix(vec2(n00, n01), vec2(n10, n11), fadeXy.x);
  const nXy = mix(nX.x, nX.y, fadeXy.y);

  return nXy.mul(2.3);
});

const fbm = Fn(([point, lacunarity, gain]: [Node<"vec2">, Node<"float">, Node<"float">]) => {
  const st = point.toVar();
  const value = float(0).toVar();
  const amplitude = float(0.6).toVar();

  Loop(10, () => {
    value.addAssign(amplitude.mul(cnoise(st).abs()));
    st.mulAssign(lacunarity);
    amplitude.mulAssign(gain);
  });

  return value;
});

export function createPlanetMaterial({
  colorA = "#124dd8",
  colorB = "#2bffe7",
  cloudTint = "#001741",
  lacunarity = 2.3,
  gain = 0.5,
}: {
  colorA?: string;
  colorB?: string;
  cloudTint?: string;
  lacunarity?: number;
  gain?: number;
} = {}) {
  const material = new MeshLambertNodeMaterial();

  const a = color(new Color(colorA));
  const b = color(new Color(colorB));
  const tint = color(new Color(cloudTint));
  const lac = float(lacunarity);
  const g = float(gain);

  /**
   * All of this has to live inside an Fn: the var assignments below need a
   * stack to write into, and there is none at module or call scope.
   */
  const surface = Fn(() => {
    const st = uv().mul(10);
    const t = time;

    // Domain warping: two rounds of fbm feeding the next.
    const q = vec2(fbm(st, lac, g), fbm(st.add(vec2(1, 1)), lac, g)).toVar();
    const r = vec2(
      fbm(st.add(q).add(vec2(1.7, 9.2)).add(t.mul(0.15)), lac, g),
      fbm(st.add(q).add(vec2(8.3, 2.8)).add(t.mul(0.126)), lac, g),
    ).toVar();

    const f = fbm(st.add(r), lac, g);

    const out = mix(a, b, clamp(f.mul(f).mul(4), 0, 1)).toVar();
    out.assign(mix(out, tint, clamp(q.length(), 0, 1)));
    out.assign(out.mul(mix(out, a, clamp(r.x.abs(), 0, 1))));

    /**
     * The second lamina layer was Depth(colorA #42f54e, colorB blue, alpha 0.5,
     * mode add), which fades between its two colours over a near/far window of
     * 2 to 10 units from the origin. The planet sits about 140 units out and is
     * 160 across, so that window is saturated everywhere on it and the layer
     * only ever contributed a flat half-strength blue. That constant is what is
     * added here rather than a depth ramp that would never ramp.
     */
    return out.add(color(new Color("blue")).mul(0.5));
  });

  material.colorNode = surface();

  return material;
}
