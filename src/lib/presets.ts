import { DEFAULT_PACKING, type Hexagon, type PackingOptions } from "./hull";
import type { TextureSetName } from "./textures";

export type PresetId = 1 | 2 | 3 | 4;

/** What the hull walls are made of. Hoth needed painted panel, not greeble. */
export type WallSurface = {
  textures: TextureSetName;
  repeat: [number, number];
  metalness: number;
  roughness: number;
  normalScale: number;
};

/** The 2024 wall: deep greeble, lit hard from the side. */
const GREEBLED_HULL: WallSurface = {
  textures: "greeble_space",
  repeat: [1, 1],
  metalness: 0,
  roughness: 1,
  normalScale: 5,
};

/** Painted metal panel, flat enough for the wall colour to survive. */
const PAINTED_PANEL: WallSurface = {
  textures: "worn_abs",
  repeat: [0.4, 0.4],
  metalness: 0.15,
  roughness: 0.62,
  normalScale: 0.5,
};

export type Preset = {
  name: string;
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  hexagon: Hexagon;
  /** How windows and panels scatter over each wall. */
  packing: PackingOptions;
  surface: WallSurface;
  wallColor: string;
  windowColor: string;
  lightBarColor: string;
  panelColor: string;
  lampColor: string;
  lampLightColor: string;
  lampPosition: [number, number, number];
  lampIntensity: number;
  rugColor: string;
  chairColor: string;
  camera: { position: [number, number, number]; lookAt: [number, number, number] };
  shadow: { frustum: number; far: number; near: number; bias: number; normalBias: number };
};

/** The three 2024 presets, values unchanged apart from the dropped SoftShadows knobs. */
export const PRESETS: Record<PresetId, Preset> = {
  1: {
    name: "Ahch-To",
    ambientColor: "#ffffff",
    ambientIntensity: 0.5,
    directionalColor: "#ff7300",
    hexagon: { height: 10, width: 26, floorwidth: 17.4, ceilingwidth: 2.0, depth: 20 },
    packing: DEFAULT_PACKING,
    surface: GREEBLED_HULL,
    wallColor: "#69502b",
    windowColor: "#4e3a23",
    lightBarColor: "#76ff00",
    panelColor: "#5f87ce",
    lampColor: "#756b0b",
    lampLightColor: "#ff00b6",
    lampPosition: [0, 1.8, 0.6],
    lampIntensity: 101,
    rugColor: "#939393",
    chairColor: "#5c1b00",
    camera: { position: [-8.2, -1.3, 6.2], lookAt: [-2, -1, 0] },
    shadow: { frustum: 16, far: 58, near: 4, bias: -0.002, normalBias: 0.08 },
  },
  2: {
    name: "Devaron",
    ambientColor: "#b3d9ff",
    ambientIntensity: 0.7,
    directionalColor: "#4a90e2",
    hexagon: { height: 30.3, width: 67.0, floorwidth: 43.2, ceilingwidth: 57.4, depth: 80.3 },
    packing: DEFAULT_PACKING,
    surface: GREEBLED_HULL,
    wallColor: "#3a4a5c",
    windowColor: "#2d3e50",
    lightBarColor: "#00d4ff",
    panelColor: "#5b9bd5",
    lampColor: "#2e5c8a",
    lampLightColor: "#00bfff",
    lampPosition: [0, 2.0, 0.8],
    lampIntensity: 120,
    rugColor: "#6b7b8c",
    chairColor: "#2c3e50",
    camera: { position: [0, -12, 11], lookAt: [0, -10, 0] },
    shadow: { frustum: 59, far: 89, near: -104, bias: -0.004, normalBias: 0.08 },
  },
  3: {
    name: "Hosnian Prime",
    ambientColor: "#fff4e6",
    ambientIntensity: 0.0,
    directionalColor: "#ff5600",
    hexagon: { height: 11, width: 28.1, floorwidth: 25.6, ceilingwidth: 2.2, depth: 34.3 },
    packing: DEFAULT_PACKING,
    surface: GREEBLED_HULL,
    wallColor: "#623011",
    windowColor: "#753704",
    lightBarColor: "#e52bef",
    panelColor: "#d4a574",
    lampColor: "#b8860b",
    lampLightColor: "#ffaf47",
    lampPosition: [0, 1.9, 0.7],
    lampIntensity: 110,
    rugColor: "#a0826d",
    chairColor: "#8b4513",
    camera: { position: [-8.2, -1.3, 6.2], lookAt: [-2, -1, 0] },
    shadow: { frustum: 24, far: 58, near: 4, bias: -0.002, normalBias: 0.08 },
  },
  4: {
    name: "Hoth",
    /* Warm painted metal inside, cold daylight outside. The 2024 presets all
       light the room from the sun; this one leans on the tubes and the lamp and
       lets the window light read as the cold thing. */
    ambientColor: "#fff1da",
    ambientIntensity: 0.42,
    directionalColor: "#c3d8ea",
    hexagon: { height: 8.2, width: 22.4, floorwidth: 19.8, ceilingwidth: 13.5, depth: 13.6 },
    /* Fewer, wider windows with more wall between them. The default scatter is
       tuned for a hangar and reads as a curtain wall at this size.
       Sized against the walls, not by eye: a cell is windowW + gap across, and
       the first attempt at this made one 8.5 wide against a 13.6 deep wall, so
       every wall came out one column of nothing and Hoth had no windows at all. */
    packing: { gap: 0.8, density: 58, windowRatio: 58, windowW: 5.4, windowH: 2.6, panelW: 3.4, panelH: 1.8 },
    /* greeble_space carries its own dark basecolour, which swallowed the cream
       and put the room back in a hangar. worn_abs has none, so wallColor wins. */
    surface: PAINTED_PANEL,
    wallColor: "#cdc3ab",
    windowColor: "#b4a992",
    lightBarColor: "#ffd9a2",
    panelColor: "#9a9482",
    lampColor: "#7c6c4c",
    lampLightColor: "#ffb257",
    lampPosition: [0, 1.7, 0.6],
    lampIntensity: 64,
    rugColor: "#8a7f6c",
    chairColor: "#6f6545",
    camera: { position: [-6.4, -1.6, 5.2], lookAt: [-1.4, -1.2, 0] },
    shadow: { frustum: 16, far: 58, near: 4, bias: -0.002, normalBias: 0.08 },
  },
};

/** The 2024 light started at [7, 11, -30]; this is that position as an angle. */
export const INITIAL_ORBIT_ANGLE = (Math.atan2(-30, 7) * (180 / Math.PI) + 360) % 360;
export const ORBIT_RADIUS = Math.sqrt(7 * 7 + 30 * 30);
export const ORBIT_Y = 11;
export const DEFAULT_INTENSITY = 15.8;

/** Sun brightness over the orbit: peak at 90 degrees, floor at 270. */
export function intensityFromAngle(angle: number) {
  const MIN = 15;
  const MAX = 100;
  const normalized = (1 + Math.cos(((angle - 90) * Math.PI) / 180)) / 2;
  return MIN + (MAX - MIN) * normalized;
}

export function lightPositionFromAngle(angle: number): [number, number, number] {
  const rad = (angle * Math.PI) / 180;
  return [ORBIT_RADIUS * Math.cos(rad), ORBIT_Y, ORBIT_RADIUS * Math.sin(rad)];
}
