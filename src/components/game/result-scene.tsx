/**
 * The world a run ended on.
 *
 * Drawn with the same layers the live map is drawn with, so there is no doubt
 * it is the same game: the ground, who finished holding it, everything still
 * standing on it, and the ring the Collapse had eaten its way in to by dusk.
 * One fixed seed, so every reader is looking at the same day.
 *
 * It is a still. Nothing here moves, so there is nothing to hold back under
 * reduced motion.
 */

import { MapDefs } from "@/components/game/art/defs";
import { StructureLayer } from "@/components/game/art/structures";
import { TerrainLayer } from "@/components/game/art/terrain";
import { TerritoryLayer } from "@/components/game/art/territory";
import { hexCorners, hexPath } from "@/components/game/hex";
import {
  generateWorld,
  neighbourOf,
  type Owners,
  type Tile,
  type World,
} from "@/components/game/world";
import { createRandom } from "@/lib/rng";
import { cn } from "@/lib/utils";

/** The day this card is about. Same integer in, same world out, forever. */
const SEED = 142;

/**
 * Deliberately smaller than a world anyone plays on. This one is read at a
 * glance from inside a card, so a coarse grid keeps a city looking like a city.
 */
const COLS = 15;
const ROWS = 10;

/**
 * How much of the world's own frame the picture drops on every side.
 *
 * Taken off all four sides equally, so the aspect stays exactly the world's.
 * Enough to lose the empty water in the corners and still leave a band of dead
 * ground around the zone.
 */
const CROP = 0.06;

/** Index 0 is the player, the same as everywhere else. */
const PLAYER = 0;

/** Names this map's paint, so it never shares an id with another one. */
const SCENE = "result";

/** Share of the ground the Collapse has taken by the time the card is cut. */
const EATEN = 0.36;

/**
 * How far a tile's turn can drift from its ring, in rings.
 *
 * Under one whole ring, so the zone still closes in from the outside, with an
 * edge that looks chewed rather than compassed.
 */
const RAGGED = 0.6;

/** The player's cut of everything left standing. */
const HELD = 0.78;

/** Matches the terrain layer: two neighbours must not show a seam between them. */
const SEAM = 1.004;

/** The veil is nearly opaque. Whatever stood there is a memory, not a feature. */
const ASH = 0.92;
const ASH_HEAT = 0.02;

/**
 * The edge of the zone: a hairline with a wide, faint bloom under it.
 *
 * Thin on purpose. It runs the whole way around the surviving world, so a
 * heavy line turns into the only thing anybody sees.
 */
const RIM_WIDTH = 0.042;
const RIM_OPACITY = 0.88;
const RIM_BLOOM = 0.55;
const RIM_BLOOM_OPACITY = 0.055;

type Ruin = {
  /** Keys of every tile the Collapse has already taken, water included. */
  gone: Set<string>;
  /** Those tiles, merged. */
  ash: string;
  /** Where the zone meets ground still standing. */
  rim: string;
};

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * The Collapse, caught partway through.
 *
 * Tiles go in ring order out of the world's own `rim`, jittered by less than a
 * ring so the boundary wanders. Water goes with the ground it was beside: the
 * zone is the shape of what is left of the world, not the shape of a coast.
 */
function unravel(world: World): Ruin {
  const random = createRandom(world.seed * 31 + 7);
  const turns = world.tiles.map((tile) => tile.rim + random() * RAGGED);
  const landTurns: number[] = [];

  for (let index = 0; index < world.tiles.length; index += 1) {
    if (world.tiles[index].land) landTurns.push(turns[index]);
  }

  landTurns.sort((a, b) => a - b);

  const wanted = Math.round(landTurns.length * EATEN);
  // Reading the cut off the sorted land turns lets the water come along for
  // free without ever throwing the amount of ground eaten off its target.
  const cut = wanted > 0 ? landTurns[wanted - 1] : Number.NEGATIVE_INFINITY;
  const gone = new Set<string>();

  for (let index = 0; index < world.tiles.length; index += 1) {
    if (turns[index] <= cut) gone.add(world.tiles[index].key);
  }

  const ash: string[] = [];
  const rim: string[] = [];

  for (const tile of world.tiles) {
    if (!gone.has(tile.key)) continue;

    ash.push(hexPath(tile.x, tile.y, SEAM));

    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      // A tile off the edge of the map is not a frontier: everything out there
      // went first. Only the side facing the survivors gets a line.
      if (!next || gone.has(next.key)) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];

      rim.push(`M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`);
    }
  }

  return { gone, ash: ash.join(" "), rim: rim.join(" ") };
}

/**
 * How the day finished.
 *
 * The player pushes out of the opening claim one tile at a time, taking
 * neutral ground and rivals alike, until they hold their share of everything
 * the Collapse has not eaten. Frontier tiles come out of the bag at random,
 * which is what leaves the border ragged and the last rival pinned into a
 * corner instead of sliced off by a clean line.
 */
function conquer(world: World, gone: ReadonlySet<string>): Owners {
  const owners = new Map(world.initialOwners);
  const random = createRandom(world.seed * 17 + 3);
  const frontier: string[] = [];
  const standing = world.tiles.filter(
    (tile) => tile.land && !gone.has(tile.key)
  ).length;
  const wanted = Math.round(standing * HELD);
  let held = 0;

  const offer = (tile: Tile) => {
    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (next?.land && owners.get(next.key) !== PLAYER)
        frontier.push(next.key);
    }
  };

  for (const tile of world.tiles) {
    if (owners.get(tile.key) !== PLAYER) continue;
    if (!gone.has(tile.key)) held += 1;

    offer(tile);
  }

  while (held < wanted && frontier.length > 0) {
    const pick = (random() * frontier.length) | 0;
    const key = frontier[pick];

    frontier[pick] = frontier[frontier.length - 1];
    frontier.pop();

    const tile = world.byKey.get(key);

    if (!tile || owners.get(key) === PLAYER) continue;

    owners.set(key, PLAYER);

    if (!gone.has(key)) held += 1;

    offer(tile);
  }

  return owners;
}

const WORLD = generateWorld(SEED, COLS, ROWS);
const RUIN = unravel(WORLD);
const OWNERS = conquer(WORLD, RUIN.gone);
const VIEW_BOX = [
  WORLD.minX + WORLD.width * CROP,
  WORLD.minY + WORLD.height * CROP,
  WORLD.width * (1 - CROP * 2),
  WORLD.height * (1 - CROP * 2),
]
  .map((value) => value.toFixed(3))
  .join(" ");

/**
 * The finished world, wide enough to sit across the top of a card.
 *
 * Decorative: every number the picture carries is written out in the HUD
 * beside it, so there is nothing here for a screen reader to miss.
 */
export function ResultScene({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("block h-auto w-full", className)}
      focusable="false"
      viewBox={VIEW_BOX}
    >
      <MapDefs scene={SCENE} />

      {/* Pointy tops leave a notch along the first and last row of the grid,
          and open water is what belongs behind them. */}
      <rect
        className="fill-seed-map-abyss"
        height={WORLD.height}
        width={WORLD.width}
        x={WORLD.minX}
        y={WORLD.minY}
      />

      <TerrainLayer scene={SCENE} world={WORLD} />
      <TerritoryLayer owners={OWNERS} world={WORLD} />
      <StructureLayer scene={SCENE} world={WORLD} />

      {/* The veil, and the heat still coming off the edge of it. */}
      <path className="fill-seed-map-abyss" d={RUIN.ash} fillOpacity={ASH} />
      <path className="fill-destructive" d={RUIN.ash} fillOpacity={ASH_HEAT} />

      <path
        className="stroke-destructive"
        d={RUIN.rim}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={RIM_BLOOM_OPACITY}
        strokeWidth={RIM_BLOOM}
      />
      <path
        className="stroke-destructive"
        d={RUIN.rim}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={RIM_OPACITY}
        strokeWidth={RIM_WIDTH}
      />
    </svg>
  );
}
