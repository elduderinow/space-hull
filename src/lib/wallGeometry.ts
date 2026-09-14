import { BoxGeometry, BufferGeometry, ExtrudeGeometry, Shape } from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import type { PackedItem } from "./hull";

/**
 * A wall slab with a hole punched through it for every window. Panels sit on
 * the surface and need no cut.
 *
 * The 2024 scene expressed this as @react-three/csg JSX, where the Window
 * component rendered its frame mesh and a <Subtraction> box side by side.
 * three-bvh-csg is the same library underneath, driven here so the result is a
 * plain geometry a node material can take.
 */
export function buildWallGeometry(
  depth: number,
  height: number,
  items: PackedItem[],
  cut: boolean,
): BufferGeometry {
  const base = new BoxGeometry(depth, height, 0.1);
  const windows = cut ? items.filter((item) => item.type === "window") : [];
  if (windows.length === 0) return base;

  const evaluator = new Evaluator();
  evaluator.useGroups = false;

  let current = new Brush(base);
  current.updateMatrixWorld();

  /* Every evaluate returns a fresh Brush wrapping a fresh geometry, so the one
     it replaced has to go back. Dropping them on the floor is what made a slider
     drag walk off the end of GPU memory: a drag is hundreds of hulls, each of
     them eight walls, each wall one geometry per window it cuts. */
  for (const item of windows) {
    const holeGeometry = new BoxGeometry(item.w - 0.2, item.h - 0.2, 0.4);
    const hole = new Brush(holeGeometry);
    hole.position.set(item.x, item.y, 0);
    hole.updateMatrixWorld();

    const next = evaluator.evaluate(current, hole, SUBTRACTION);
    holeGeometry.dispose();
    if (current.geometry !== base) current.geometry.dispose();
    current = next;
  }

  base.dispose();
  const result = current.geometry;
  result.computeVertexNormals();
  return result;
}

/** A rounded rectangle, drawn from its bottom-left corner. */
function roundedRect(x: number, y: number, w: number, h: number, radius: number) {
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** The window frame: a rounded rectangle with a rounded hole, extruded. */
export function buildWindowFrame(w: number, h: number): ExtrudeGeometry {
  const inset = 0.1;
  const shape = roundedRect(0, 0, w, h, 0.5);
  shape.holes.push(roundedRect(inset, inset, w - 2 * inset, h - 2 * inset, 0.5));

  return new ExtrudeGeometry(shape, {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 1.5,
    bevelSize: 0,
    bevelOffset: 0.03,
    bevelSegments: 1,
  });
}

/**
 * The shield around the outside of the hull: the cross-section outline with a
 * version of itself scaled 10% toward the centre knocked out, extruded.
 */
export function buildShieldGeometry(points: { x: number; y: number }[]): ExtrudeGeometry {
  const outline = new Shape();
  outline.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) outline.lineTo(points[i].x, points[i].y);
  outline.closePath();

  const inset = 0.1;
  const hole = new Shape();
  hole.moveTo(points[0].x * (1 - inset), points[0].y * (1 - inset));
  for (let i = 1; i < points.length; i++) {
    hole.lineTo(points[i].x * (1 - inset), points[i].y * (1 - inset));
  }
  hole.closePath();
  outline.holes.push(hole);

  return new ExtrudeGeometry(outline, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0,
    bevelSize: 0,
    bevelOffset: 0,
    bevelSegments: 1,
  });
}
