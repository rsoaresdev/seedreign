"use client";

/**
 * The whole world at a thumbnail: flat ground, four banners, nothing else.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { hexPath } from "@/components/game/hex";
import { HOUSES, type Owners, type World } from "@/components/game/world";

/**
 * A hair over one hex, so neighbours overlap instead of leaving an antialiased
 * seam between them. At this size a seam reads as a tile grid, which is the one
 * thing the map must never look like.
 */
const TILE = 1.04;

/** Fills in the world's own house order. Index 0 is the player. */
const HOUSE_FILL = [
  "fill-seed-gold",
  "fill-seed-teal",
  "fill-seed-violet",
  "fill-destructive",
] as const;

export function Minimap({ world, owners }: { world: World; owners: Owners }) {
  const t = useTranslations("Game.hud");

  // The ground only moves when the world does, so it is kept off the path the
  // ownership changes take.
  const ground = useMemo(
    () =>
      world.tiles
        .filter((tile) => tile.land)
        .map((tile) => hexPath(tile.x, tile.y, TILE))
        .join(" "),
    [world]
  );

  const claims = useMemo(() => {
    const parts: string[][] = HOUSES.map(() => []);

    for (const [key, house] of owners) {
      if (house < 0 || house >= parts.length) continue;

      const tile = world.byKey.get(key);

      if (!tile?.land) continue;

      parts[house].push(hexPath(tile.x, tile.y, TILE));
    }

    return parts.map((part) => part.join(" "));
  }, [world, owners]);

  const viewBox = [world.minX, world.minY, world.width, world.height]
    .map((value) => value.toFixed(3))
    .join(" ");

  return (
    <svg
      aria-label={t("minimap")}
      className="block h-auto w-full rounded-md border border-seed-line"
      role="img"
      viewBox={viewBox}
    >
      <rect
        className="fill-seed-map-sea"
        height={world.height}
        width={world.width}
        x={world.minX}
        y={world.minY}
      />

      <path className="fill-seed-map-hill" d={ground} />

      {claims.map((claim, house) =>
        claim ? (
          <path className={HOUSE_FILL[house]} d={claim} key={HOUSES[house]} />
        ) : null
      )}
    </svg>
  );
}
