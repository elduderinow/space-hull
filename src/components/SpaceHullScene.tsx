"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import Controls from "./Controls";
import EnvironmentLightformers from "./EnvironmentLightformers";
import Lights from "./Lights";
import Post from "./Post";
import SpaceHull from "./SpaceHull";
import { DEFAULT_PACKING, type Hexagon, type PackingOptions } from "@/lib/hull";
import {
  DEFAULT_INTENSITY,
  INITIAL_ORBIT_ANGLE,
  PRESETS,
  intensityFromAngle,
  type PresetId,
} from "@/lib/presets";

type Backend = "webgpu" | "webgl";

export default function SpaceHullScene() {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [failed, setFailed] = useState(false);
  const [presetId, setPresetId] = useState<PresetId>(1);
  const [angle, setAngle] = useState(INITIAL_ORBIT_ANGLE);
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY);
  const [autoRotate, setAutoRotate] = useState(false);
  const [hexagon, setHexagon] = useState<Hexagon>(PRESETS[1].hexagon);
  const [packing, setPacking] = useState<PackingOptions>(DEFAULT_PACKING);

  const preset = PRESETS[presetId];

  /**
   * Every wall is a slab with its windows cut out by a boolean, so a drag that
   * moved geometry on each frame would rebuild eight of those per frame. The
   * sliders stay on the live value and the geometry follows the deferred one,
   * which lets React drop the intermediate hulls it never had time to draw.
   */
  const geometryHexagon = useDeferredValue(hexagon);
  const geometryPacking = useDeferredValue(packing);

  /**
   * WebGPU where available, WebGL 2 otherwise. Everything in the scene is node
   * materials, including the planet's noise, so the same graph compiles to WGSL
   * or GLSL depending on which backend starts.
   */
  const createRenderer = useCallback(async (props: object) => {
    const hasWebGPU = typeof navigator !== "undefined" && "gpu" in navigator;

    const renderer = new WebGPURenderer({
      ...(props as ConstructorParameters<typeof WebGPURenderer>[0]),
      forceWebGL: !hasWebGPU,
      antialias: true,
    });

    try {
      await renderer.init();
    } catch (error) {
      setFailed(true);
      throw error;
    }

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;

    const active = renderer.backend as { isWebGPUBackend?: boolean };
    setBackend(active.isWebGPUBackend === true ? "webgpu" : "webgl");
    return renderer;
  }, []);

  // The sun swinging through a day, 30 seconds end to end, brightness following
  // the angle.
  const frame = useRef<number>(undefined);
  useEffect(() => {
    if (!autoRotate) return;

    let start: number | null = null;
    const duration = 30000;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = ((timestamp - start) % duration) / duration;
      const next = Math.abs(Math.sin(progress * Math.PI)) * 360;
      setAngle(next);
      setIntensity(intensityFromAngle(next));
      frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [autoRotate]);

  if (failed) {
    return (
      <div className="status">
        <p>This scene could not start a GPU context.</p>
        <p className="muted">It needs WebGPU or WebGL 2.</p>
      </div>
    );
  }

  return (
    <>
      <Canvas
        dpr={[1, 1.5]}
        /* "percentage" rather than r3f's default: it sets PCFSoftShadowMap,
           which the WebGPU renderer no longer has and warns about. */
        shadows="percentage"
        camera={{ fov: 55, near: 0.1, far: 1000, position: [0, 0, 5] }}
        gl={createRenderer}
      >
        {/* The 2024 canvas let its CSS colour show through a transparent clear.
            The composed pipeline output here is opaque, so space is painted. */}
        <color attach="background" args={["#070810"]} />
        <Controls preset={preset} />
        <Lights preset={preset} angle={angle} intensity={intensity} />
        <Suspense fallback={null}>
          <SpaceHull
            key={presetId}
            preset={preset}
            hexagon={geometryHexagon}
            packing={geometryPacking}
          />
        </Suspense>
        <EnvironmentLightformers />
        <Post />
      </Canvas>

      <Clock />

      <div className="presets">
        {(Object.keys(PRESETS) as unknown as PresetId[]).map((id) => (
          <button
            key={id}
            type="button"
            className={Number(id) === presetId ? "active" : ""}
            onClick={() => {
              // A preset is where the sliders start, not a lock on them. Both
              // move together, or the first frame draws new colours on the old
              // cross-section.
              const next = Number(id) as PresetId;
              setPresetId(next);
              setHexagon(PRESETS[next].hexagon);
            }}
          >
            {PRESETS[Number(id) as PresetId].name}
          </button>
        ))}
      </div>

      <div className="panel">
        <label className="row">
          <span>intensity</span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
          />
          <em>{intensity.toFixed(1)}</em>
        </label>

        <label className="row">
          <span>orbit</span>
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={angle}
            onChange={(e) => {
              const next = Number(e.target.value);
              setAngle(next);
              setIntensity(intensityFromAngle(next));
            }}
          />
          <em>{Math.round(angle)}°</em>
        </label>

        <label className="row">
          <span>day cycle</span>
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => setAutoRotate(e.target.checked)}
          />
        </label>

        {/* Closed to start with, the way the 2024 leva folders were. */}
        <details className="group">
          <summary>hull</summary>
          {HULL_SLIDERS.map(({ key, label, min, max }) => (
            <Row
              key={key}
              label={label}
              min={min}
              max={max}
              step={0.1}
              value={hexagon[key]}
              onChange={(value) => setHexagon((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </details>

        <details className="group">
          <summary>windows</summary>
          {WINDOW_SLIDERS.map(({ key, label, min, max, step }) => (
            <Row
              key={key}
              label={label}
              min={min}
              max={max}
              step={step}
              value={packing[key]}
              onChange={(value) => setPacking((current) => ({ ...current, [key]: value }))}
            />
          ))}
        </details>
      </div>

      {backend ? <p className="backend">{backend}</p> : null}
    </>
  );
}

/** The 2024 hexagon folder: five numbers, 1 to 100, that rebuild the hull. */
const HULL_SLIDERS = [
  { key: "height", label: "height", min: 1, max: 100 },
  { key: "width", label: "width", min: 1, max: 100 },
  { key: "floorwidth", label: "floor", min: 1, max: 100 },
  { key: "ceilingwidth", label: "ceiling", min: 1, max: 100 },
  { key: "depth", label: "depth", min: 1, max: 100 },
] as const satisfies readonly { key: keyof Hexagon; label: string; min: number; max: number }[];

/** How the windows and panels scatter over each wall. */
const WINDOW_SLIDERS = [
  { key: "density", label: "density", min: 0, max: 100, step: 1 },
  { key: "windowRatio", label: "windows", min: 0, max: 100, step: 1 },
  { key: "gap", label: "gap", min: 0, max: 4, step: 0.1 },
  { key: "windowW", label: "win w", min: 0.5, max: 12, step: 0.1 },
  { key: "windowH", label: "win h", min: 0.5, max: 12, step: 0.1 },
  { key: "panelW", label: "panel w", min: 0.5, max: 12, step: 0.1 },
  { key: "panelH", label: "panel h", min: 0.5, max: 12, step: 0.1 },
] as const satisfies readonly {
  key: keyof PackingOptions;
  label: string;
  min: number;
  max: number;
  step: number;
}[];

function Row({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="row">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <em>{value.toFixed(1)}</em>
    </label>
  );
}

/**
 * The 2024 header clock, unchanged down to the year. It renders a placeholder
 * first so the server and client markup agree before the interval starts.
 */
function Clock() {
  const text = useClockText();
  return <p className="clock">{text}</p>;
}

function useClockText() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return "420K-AD --:--:--";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `420K-AD ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
