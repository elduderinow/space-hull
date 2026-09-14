"use client";

import { useMemo } from "react";
import { getHullPoints, getWallSegments, type Hexagon, type PackingOptions } from "@/lib/hull";
import type { Preset } from "@/lib/presets";
import Planet from "./Planet";
import Wall from "./Wall";
import WindowShield from "./WindowShield";
import { Carpet, CurvedChair, FloorLamp, GlassTable } from "./Interior";

/**
 * The hull: an eight-sided cross-section extruded by its depth, one wall mesh
 * per edge, a shield ring at the far end, the planet outside and the furniture
 * inside.
 */
export default function SpaceHull({
  preset,
  hexagon,
  packing,
}: {
  preset: Preset;
  hexagon: Hexagon;
  packing: PackingOptions;
}) {
  const { height, width, floorwidth, ceilingwidth, depth } = hexagon;

  const points = useMemo(
    () => getHullPoints(floorwidth, ceilingwidth, height, width),
    [floorwidth, ceilingwidth, height, width],
  );

  const segments = useMemo(() => getWallSegments(points), [points]);
  const shieldPoints = useMemo(
    () => points.map((point) => ({ x: point.position.x, y: point.position.y })),
    [points],
  );

  return (
    <group>
      {segments.map((segment, i) => (
        <Wall
          key={`${segment.type}-${i}`}
          segment={segment}
          depth={depth}
          // Each wall gets its own layout, and the same one every time.
          seed={(i + 1) * 9176 + Math.round(segment.length * 100)}
          packing={packing}
          surface={preset.surface}
          color={preset.wallColor}
          windowColor={preset.windowColor}
          panelColor={preset.panelColor}
          lightBarColor={preset.lightBarColor}
        />
      ))}

      <group position={[0, 0, -depth / 2 - 0.2]}>
        <WindowShield points={shieldPoints} color={preset.windowColor} />
      </group>

      <Planet />

      <Carpet height={height} color={preset.rugColor} />
      <GlassTable height={height} />
      <CurvedChair height={height} color={preset.chairColor} />
      <FloorLamp
        height={height}
        color={preset.lampColor}
        lightColor={preset.lampLightColor}
        position={preset.lampPosition}
        intensity={preset.lampIntensity}
      />
    </group>
  );
}
