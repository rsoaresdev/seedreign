"use client";

/**
 * The one `<svg>` the world is drawn into.
 *
 * It owns the `viewBox` and nothing else: no state, no handlers, no clock. Hand
 * it a world and who holds what and it paints exactly that, which is what lets
 * the same component serve a still scene and a stage somebody is playing on.
 */

import { motion } from "motion/react";

import { Commander } from "@/components/game/art/commander";
import { MapDefs } from "@/components/game/art/defs";
import { StructureLayer } from "@/components/game/art/structures";
import { TerrainLayer } from "@/components/game/art/terrain";
import { TerritoryLayer } from "@/components/game/art/territory";
import { hexCorners, hexPath } from "@/components/game/hex";
import { neighbourOf, type Owners, type World } from "@/components/game/world";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Index 0 is the player, the same as everywhere else. */
const PLAYER = 0;

/** Names this map's paint, so it never shares an id with another one. */
const SCENE = "play";

/** Matches the terrain layer, so a flash covers its tile with no seam. */
const SEAM = 1.004;

/** Seconds a claim takes to sink into the ground. */
const FLASH = 0.72;

const WALL_WIDTH = 0.2;
const WALL_CORE = 0.075;

const RING_INNER = 0.9;
const RING_OUTER = 0.98;
const RING_WIDTH = 0.075;

/** What a single tile changing hands looks like while it happens. */
export type MarkKind = "claim" | "ward" | "strike" | "echo";

export type Mark = {
  key: string;
  kind: MarkKind;
  /** Bumped per mark, so a tile taken twice flashes twice. */
  serial: number;
};

/**
 * Only a claim flashes in a house colour, because a claim is the one thing
 * that actually changes who holds the ground. Everything else is weather and
 * masonry, and it borrows from the map ramp instead of from a banner.
 */
const MARK_FILL: Record<MarkKind, string> = {
  claim: "fill-seed-gold",
  ward: "fill-seed-map-snow",
  strike: "fill-seed-sun",
  echo: "fill-seed-map-snow",
};

const MARK_OPACITY: Record<MarkKind, number> = {
  claim: 0.7,
  ward: 0.55,
  strike: 0.85,
  echo: 0.3,
};

export type GameViewportProps = {
  world: World;
  owners: Owners;
  /** Where the Seeded stands. Anything the world does not know is ignored. */
  commanderKey: string | null;
  /** Tiles carrying a rampart along the edges they do not own. */
  wards?: readonly string[];
  /** Ground changing hands right now. */
  marks?: readonly Mark[];
  /** The tile under the pointer or the keyboard. */
  aim?: string | null;
  /** An order is waiting to be aimed, so the ring reads as a target. */
  armed?: boolean;
  /** False keeps the world fully resolved and perfectly still. */
  animate?: boolean;
  className?: string;
};

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * The rectangle the world occupies, which is exactly what the `viewBox` reads.
 *
 * There is deliberately no margin around it: a caller laying interactive hit
 * targets over the map can then place them with plain percentages instead of
 * reproducing an offset that only lives in here.
 */
export function worldView(world: World): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: world.minX,
    y: world.minY,
    width: world.width,
    height: world.height,
  };
}

/**
 * The ramparts, as one merged stroke.
 *
 * Only edges facing walkable ground are drawn. A wall built against open water
 * is a wall against nothing, and it reads as a mistake on the coastline.
 */
function wallPath(
  world: World,
  owners: Owners,
  wards: readonly string[]
): string {
  const parts: string[] = [];

  for (const key of wards) {
    const tile = world.byKey.get(key);

    if (!tile) continue;

    const holder = owners.get(key);
    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (!next?.land || owners.get(next.key) === holder) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];

      parts.push(`M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`);
    }
  }

  return parts.join(" ");
}

export function GameViewport({
  world,
  owners,
  commanderKey,
  wards = [],
  marks = [],
  aim = null,
  armed = false,
  animate = false,
  className,
}: GameViewportProps) {
  const view = worldView(world);
  const viewBox = [view.x, view.y, view.width, view.height]
    .map((value) => value.toFixed(3))
    .join(" ");

  const commander = commanderKey ? world.byKey.get(commanderKey) : undefined;
  const target = aim ? world.byKey.get(aim) : undefined;
  const wall = wallPath(world, owners, wards);

  return (
    <svg
      // The standings, the minimap and every tile's own button already say all
      // of this in words, so the painting itself stays out of the tree.
      aria-hidden="true"
      className={cn("block h-auto w-full", className)}
      viewBox={viewBox}
    >
      <MapDefs scene={SCENE} />

      <rect
        className="fill-seed-map-abyss"
        height={view.height}
        width={view.width}
        x={view.x}
        y={view.y}
      />

      <TerrainLayer scene={SCENE} world={world} />
      <TerritoryLayer owners={owners} world={world} />

      {wall === "" ? null : (
        // Stone rather than a house colour: three of the four banners are on
        // this map already, and a rampart in one of them reads as a border.
        <g>
          <path
            className="stroke-seed-map-abyss"
            d={wall}
            fill="none"
            strokeLinecap="round"
            strokeOpacity={0.55}
            strokeWidth={WALL_WIDTH}
          />
          <path
            className="stroke-seed-sun"
            d={wall}
            fill="none"
            strokeLinecap="round"
            strokeOpacity={0.8}
            strokeWidth={WALL_CORE}
          />
        </g>
      )}

      <StructureLayer scene={SCENE} world={world} />

      {animate
        ? marks.map((mark) => {
            const tile = world.byKey.get(mark.key);

            if (!tile) return null;

            return (
              <motion.path
                animate={{ opacity: 0 }}
                className={MARK_FILL[mark.kind]}
                d={hexPath(tile.x, tile.y, SEAM)}
                initial={{ opacity: MARK_OPACITY[mark.kind] }}
                key={mark.serial}
                transition={{ duration: FLASH, ease: EASE_OUT }}
              />
            );
          })
        : null}

      {commander ? (
        // Gated in CSS rather than in JavaScript: the transform is the same
        // markup either way, so the server and the browser cannot disagree
        // about where the figure is standing.
        <g
          className="motion-safe:transition-transform motion-safe:duration-260 motion-safe:ease-linear"
          style={{
            transform: `translate(${round(commander.x)}px, ${round(
              commander.y
            )}px)`,
          }}
        >
          <Commander house={PLAYER} />
        </g>
      ) : null}

      {target ? (
        <g>
          <path
            className={armed ? "fill-seed-gold" : "fill-seed-sun"}
            d={hexPath(target.x, target.y, RING_OUTER)}
            fillOpacity={0.12}
          />
          <path
            className={armed ? "stroke-seed-gold" : "stroke-seed-sun"}
            d={hexPath(target.x, target.y, RING_INNER)}
            fill="none"
            strokeLinejoin="round"
            strokeOpacity={0.9}
            strokeWidth={RING_WIDTH}
          />
        </g>
      ) : null}
    </svg>
  );
}
