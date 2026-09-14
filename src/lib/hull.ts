import { Vector3 } from "three";

export type HullType =
  | "wall-right"
  | "wall-left"
  | "roof-left"
  | "roof-center"
  | "roof-right"
  | "floor-right"
  | "floor-center"
  | "floor-left"
  | "empty";

export type HullSegment = {
  type: HullType;
  position: Vector3;
  rotation: [number, number, number];
  length: number;
};

/**
 * The eight points of the hull cross-section, walked in order. The ninth
 * repeats the first so the loop closes.
 */
export function getHullPoints(
  floorWidth: number,
  ceilingWidth: number,
  height: number,
  width: number,
) {
  const halfHeight = height / 2;
  const halfWidth = width / 2;
  const halfFloor = floorWidth / 2;
  const halfCeiling = ceilingWidth / 2;

  return [
    { type: "roof-left" as const, position: new Vector3(-halfWidth, halfHeight * 0.5, 0) },
    { type: "roof-center" as const, position: new Vector3(-halfCeiling, halfHeight, 0) },
    { type: "roof-right" as const, position: new Vector3(halfCeiling, halfHeight, 0) },
    { type: "wall-right" as const, position: new Vector3(halfWidth, halfHeight * 0.5, 0) },
    { type: "floor-right" as const, position: new Vector3(halfWidth, -halfHeight * 0.5, 0) },
    { type: "floor-center" as const, position: new Vector3(halfFloor, -halfHeight, 0) },
    { type: "floor-left" as const, position: new Vector3(-halfFloor, -halfHeight, 0) },
    { type: "wall-left" as const, position: new Vector3(-halfWidth, -halfHeight * 0.5, 0) },
    { type: "empty" as const, position: new Vector3(-halfWidth, halfHeight * 0.5, 0) },
  ];
}

/** One wall panel per edge: midpoint, length and the roll that lines it up. */
export function getWallSegments(points: ReturnType<typeof getHullPoints>): HullSegment[] {
  const segments: HullSegment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i].position;
    const end = points[i + 1].position;
    const dir = end.clone().sub(start);

    segments.push({
      type: points[i].type,
      length: start.distanceTo(end),
      position: new Vector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2,
        (start.z + end.z) / 2,
      ),
      rotation: [0, Math.PI / 2, Math.atan2(dir.x, dir.y)],
    });
  }

  return segments;
}

export type PackedItem = {
  type: "window" | "panel";
  w: number;
  h: number;
  x: number;
  y: number;
};

/** The five numbers the cross-section is built from. */
export type Hexagon = {
  height: number;
  width: number;
  floorwidth: number;
  ceilingwidth: number;
  depth: number;
};

export type PackingOptions = {
  gap: number;
  density: number;
  windowRatio: number;
  windowW: number;
  windowH: number;
  panelW: number;
  panelH: number;
};

export const DEFAULT_PACKING: PackingOptions = {
  gap: 0.6,
  density: 40,
  windowRatio: 50,
  windowW: 6,
  windowH: 2,
  panelW: 4,
  panelH: 2,
};

/** xorshift, so a wall keeps its layout across rebuilds. See packWall. */
function makeRandom(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

/**
 * Scatters windows and panels over a wall on a grid, skipping cells by density
 * and flipping a coin per cell for which kind it is.
 *
 * The 2024 version called Math.random directly inside a useMemo, so every
 * remount reshuffled the whole hull and a leva tweak to an unrelated knob moved
 * every window. Seeding it per wall keeps a given hull stable, and the seed is
 * derived from the wall itself so the eight walls still differ from each other.
 */
export function packWall(
  containerW: number,
  containerH: number,
  seed: number,
  options: PackingOptions = DEFAULT_PACKING,
): PackedItem[] {
  const { gap, density, windowRatio, windowW, windowH, panelW, panelH } = options;
  const random = makeRandom(seed);
  const items: PackedItem[] = [];

  const cellW = Math.max(windowW, panelW) + gap;
  const cellH = Math.max(windowH, panelH) + gap;
  const cols = Math.floor(containerW / cellW);
  const rows = Math.floor(containerH / cellH);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (random() * 100 > density) continue;

      const isWindow = random() * 100 < windowRatio;
      const w = isWindow ? windowW : panelW;
      const h = isWindow ? windowH : panelH;

      items.push({
        type: isWindow ? "window" : "panel",
        w,
        h,
        x: col * cellW + w / 2 - containerW / 2,
        y: row * cellH + h / 2 - containerH / 2,
      });
    }
  }

  return items;
}
