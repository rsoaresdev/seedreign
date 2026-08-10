/**
 * World generation: one integer seed grows a whole map.
 *
 * Everything here is pure and seeded. Terrain, spawns, the opening land grab,
 * every structure and the order the Collapse eats the ground all come out of
 * the same stream, so the same seed produces the same world on the server and
 * in the browser.
 *
 * Geometry is authored with a hex circumradius of exactly 1 and the drawn
 * bounds are reported alongside it, so a caller can write a `viewBox` without
 * measuring anything.
 */

import { createNoise2d, createRandom } from "@/lib/rng";
import {
  HEX_DIRECTIONS,
  hexCenter,
  hexCorners,
  hexDistance,
  hexKey,
} from "./hex";

/** Exactly four, always in this order. Index 0 is the player. */
export const HOUSES = ["gold", "teal", "violet", "danger"] as const;

export type House = (typeof HOUSES)[number];

export type Terrain =
  | "abyss"
  | "sea"
  | "shelf"
  | "shore"
  | "plain"
  | "forest"
  | "hill"
  | "peak"
  | "snow";

export type StructureKind =
  | "city"
  | "port"
  | "forge"
  | "wonder"
  | "camp"
  | "chest";

export type Tile = {
  q: number;
  r: number;
  key: string;
  /** Pixel centre at a circumradius of 1. Scale by whatever draws it. */
  x: number;
  y: number;
  terrain: Terrain;
  land: boolean;
  /** 0 at the deepest water, 0.5 at the waterline, 1 at the highest peak. */
  elevation: number;
  /** Rings in from the outer edge of the map. The Collapse eats 0 first. */
  rim: number;
  structure: StructureKind | null;
};

/** Tile key to house index. A missing key is neutral ground. */
export type Owners = ReadonlyMap<string, number>;

export type World = {
  seed: number;
  cols: number;
  rows: number;
  width: number;
  height: number;
  minX: number;
  minY: number;
  tiles: Tile[];
  byKey: Map<string, Tile>;
  spawns: string[];
  initialOwners: Owners;
  collapseOrder: string[];
};

/** Smallest grid worth generating, so a caller cannot ask for a sliver. */
const MIN_GRID = 3;

/** Generate, measure, reject: a map outside this land ratio gets rerolled. */
const MIN_LAND = 0.34;
const MAX_LAND = 0.6;
const MAX_REROLLS = 8;

/** Height at which ground breaks the surface. */
const SEA_LEVEL = 0.34;

/** How hard the elliptical falloff pulls the landmass into a body. */
const FALLOFF_WEIGHT = 0.4;

/**
 * The sea frame. `SEA_FRAME` is the share of each side that gets pushed under
 * and the weight is heavy enough that no draw can survive it, so open water
 * rings the map on every side no matter what the noise did.
 */
const SEA_FRAME = 0.38;
const SEA_FRAME_WEIGHT = 1.15;

/** Woodland is a mask over flat ground, so it reads as patches, not a ring. */
const FOREST_LEVEL = 0.52;

/** Candidates weighed per house, so the four start far apart. */
const SPAWN_SAMPLES = 48;

/** Share of the land already taken when the world is handed over. */
const CLAIMED_LAND_SHARE = 0.55;

/** The player's cut of that. Modest on purpose: the map is there to be won. */
const PLAYER_CLAIM_SHARE = 0.2;

/** Minimum hex distance between two structures, per kind. */
const CITY_GAP = 4;
const PORT_GAP = 3;
const LANDMARK_GAP = 3;
const CAMP_GAP = 3;
const CHEST_GAP = 2;

/** Land tiles each structure of a kind is worth, and the sane range. */
const CITY_DENSITY = { per: 30, min: 3, max: 9 };
const PORT_DENSITY = { per: 34, min: 2, max: 8 };
const CAMP_DENSITY = { per: 22, min: 3, max: 10 };
const CHEST_DENSITY = { per: 24, min: 3, max: 9 };

const HALF_WIDTH = Math.sqrt(3) / 2;
const HALF_HEIGHT = 1;

/** Read top down: the first band the height clears wins. */
const BANDS: readonly { above: number; terrain: Terrain }[] = [
  { above: SEA_LEVEL + 0.35, terrain: "snow" },
  { above: SEA_LEVEL + 0.27, terrain: "peak" },
  { above: SEA_LEVEL + 0.18, terrain: "hill" },
  { above: SEA_LEVEL + 0.04, terrain: "plain" },
  { above: SEA_LEVEL, terrain: "shore" },
  { above: SEA_LEVEL - 0.1, terrain: "shelf" },
  { above: SEA_LEVEL - 0.42, terrain: "sea" },
];

/** Ground that cannot be walked or held. */
const WATER: ReadonlySet<Terrain> = new Set<Terrain>(["abyss", "sea", "shelf"]);

type Point = { u: number; v: number };

type Layout = {
  cols: number;
  rows: number;
  tiles: Tile[];
  byKey: Map<string, Tile>;
  points: Point[];
  minX: number;
  minY: number;
  width: number;
  height: number;
};

type Shape = { terrain: Terrain[]; elevation: Float64Array; land: number };

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function stepTile(
  byKey: Map<string, Tile>,
  tile: Tile,
  direction: number
): Tile | undefined {
  const step = HEX_DIRECTIONS[direction];

  if (!step) return undefined;

  return byKey.get(hexKey(tile.q + step[0], tile.r + step[1]));
}

/**
 * Rows are laid out offset rather than as a rhombus, so the grid reads as a
 * rectangle and a viewport wastes no corners on empty space.
 */
function buildLayout(cols: number, rows: number): Layout {
  const tiles: Tile[] = [];
  const byKey = new Map<string, Tile>();

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const q = col - Math.floor(row / 2);
      const key = hexKey(q, row);
      const { x, y } = hexCenter(q, row, 1);
      const tile: Tile = {
        q,
        r: row,
        key,
        x,
        y,
        terrain: "abyss",
        land: false,
        elevation: 0,
        rim: 0,
        structure: null,
      };

      tiles.push(tile);
      byKey.set(key, tile);
    }
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const tile of tiles) {
    minX = Math.min(minX, tile.x - HALF_WIDTH);
    maxX = Math.max(maxX, tile.x + HALF_WIDTH);
    minY = Math.min(minY, tile.y - HALF_HEIGHT);
    maxY = Math.max(maxY, tile.y + HALF_HEIGHT);
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const points = tiles.map((tile) => ({
    u: (tile.x - minX) / width,
    v: (tile.y - minY) / height,
  }));

  measureRim(tiles, byKey);

  return { cols, rows, tiles, byKey, points, minX, minY, width, height };
}

/** Rings in from the border, breadth first, so the Collapse has an order. */
function measureRim(tiles: Tile[], byKey: Map<string, Tile>): void {
  const queue: Tile[] = [];
  const seen = new Set<string>();

  for (const tile of tiles) {
    let onEdge = false;

    for (let direction = 0; direction < 6; direction += 1) {
      if (!stepTile(byKey, tile, direction)) {
        onEdge = true;
        break;
      }
    }

    if (!onEdge) continue;

    tile.rim = 0;
    seen.add(tile.key);
    queue.push(tile);
  }

  for (let head = 0; head < queue.length; head += 1) {
    const tile = queue[head];

    for (let direction = 0; direction < 6; direction += 1) {
      const next = stepTile(byKey, tile, direction);

      if (!next || seen.has(next.key)) continue;

      next.rim = tile.rim + 1;
      seen.add(next.key);
      queue.push(next);
    }
  }
}

/**
 * Three octaves of value noise, an elliptical falloff and a sea frame.
 *
 * The coarse octave carves the landmass, the middle one breaks the coast into
 * bays and peninsulas, the finest throws a few islands offshore, the falloff
 * gathers it all into one body and the frame drowns whatever reached the edge.
 */
function shapeWorld(points: readonly Point[], random: () => number): Shape {
  const continents = createNoise2d(random, 3);
  const coast = createNoise2d(random, 7);
  const grain = createNoise2d(random, 17);
  const woods = createNoise2d(random, 5);

  const heights = new Float64Array(points.length);
  const terrain: Terrain[] = new Array<Terrain>(points.length);
  const elevation = new Float64Array(points.length);

  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  let land = 0;

  for (let index = 0; index < points.length; index += 1) {
    const { u, v } = points[index];
    const dx = (u - 0.5) * 2;
    const dy = (v - 0.5) * 2;
    const falloff = (dx * dx + dy * dy) * 0.5;
    const toEdge = Math.min(u, 1 - u, v, 1 - v) * 2;
    const frame = 1 - Math.min(1, toEdge / SEA_FRAME);
    const height =
      continents(u, v) * 0.52 +
      coast(u, v) * 0.28 +
      grain(u, v) * 0.2 -
      falloff * FALLOFF_WEIGHT -
      frame * frame * SEA_FRAME_WEIGHT;

    heights[index] = height;
    low = Math.min(low, height);
    high = Math.max(high, height);
  }

  const deep = SEA_LEVEL - low || 1;
  const tall = high - SEA_LEVEL || 1;

  for (let index = 0; index < points.length; index += 1) {
    const height = heights[index];
    let banded: Terrain = "abyss";

    for (const band of BANDS) {
      if (height >= band.above) {
        banded = band.terrain;
        break;
      }
    }

    const { u, v } = points[index];

    if (banded === "plain" && woods(u, v) > FOREST_LEVEL) banded = "forest";

    terrain[index] = banded;
    // Water and ground each get half the range, pinned to this world's own
    // deepest and highest points, so shading never washes out on a flat seed.
    elevation[index] =
      height >= SEA_LEVEL
        ? 0.5 + clamp01((height - SEA_LEVEL) / tall) * 0.5
        : clamp01((height - low) / deep) * 0.5;

    if (height >= SEA_LEVEL) land += 1;
  }

  return { terrain, elevation, land };
}

/** Zero once the ratio is inside the band, otherwise how far outside it is. */
function landMiss(land: number, total: number): number {
  const ratio = total === 0 ? 0 : land / total;

  if (ratio < MIN_LAND) return MIN_LAND - ratio;
  if (ratio > MAX_LAND) return ratio - MAX_LAND;

  return 0;
}

function nearestSpawn(tile: Tile, spawns: readonly Tile[]): number {
  let nearest = Number.POSITIVE_INFINITY;

  for (const spawn of spawns) {
    nearest = Math.min(nearest, hexDistance(tile.q, tile.r, spawn.q, spawn.r));
  }

  return nearest;
}

/**
 * One spawn per house, sampled and weighed so nobody starts in a rival's lap.
 * The first is free, every one after it takes the candidate that sits furthest
 * from everyone already placed.
 */
function pickSpawns(candidates: Tile[], random: () => number): Tile[] {
  const spawns: Tile[] = [];

  for (let house = 0; house < HOUSES.length; house += 1) {
    let best: Tile | null = null;
    let bestScore = -1;

    for (let sample = 0; sample < SPAWN_SAMPLES; sample += 1) {
      const candidate = candidates[(random() * candidates.length) | 0];

      if (spawns.some((spawn) => spawn.key === candidate.key)) continue;

      const score =
        spawns.length === 0 ? random() : nearestSpawn(candidate, spawns);

      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
    }

    if (best) {
      spawns.push(best);
      continue;
    }

    // Only reachable if every sample landed on a spawn already taken, which
    // needs a pool of about four tiles. Two houses sharing one would leave the
    // first of them holding no ground at all, so the pool is walked for a tile
    // nobody has yet before settling for anything.
    const free = candidates.find(
      (tile) => !spawns.some((spawn) => spawn.key === tile.key)
    );

    spawns.push(free ?? candidates[house]);
  }

  return spawns;
}

/**
 * The opening land grab. All four houses push out one tile at a time from a
 * bag of frontier candidates drawn at random, which is what keeps the borders
 * ragged instead of collapsing into clean Voronoi cells, and everyone stops
 * with a healthy amount of neutral ground still on the table.
 */
function growOwners(
  byKey: Map<string, Tile>,
  spawns: readonly Tile[],
  landCount: number,
  random: () => number
): Map<string, number> {
  const owners = new Map<string, number>();
  const frontiers: string[][] = HOUSES.map(() => []);
  const held = HOUSES.map(() => 0);
  const claimed = Math.round(landCount * CLAIMED_LAND_SHARE);
  const playerTarget = Math.round(claimed * PLAYER_CLAIM_SHARE);
  const rivalTarget = Math.round(
    (claimed - playerTarget) / (HOUSES.length - 1)
  );
  const targets = HOUSES.map((_, house) =>
    house === 0 ? playerTarget : rivalTarget
  );

  const offer = (tile: Tile, house: number) => {
    for (let direction = 0; direction < 6; direction += 1) {
      const next = stepTile(byKey, tile, direction);

      if (next?.land && !owners.has(next.key)) frontiers[house].push(next.key);
    }
  };

  const claim = (house: number): boolean => {
    const frontier = frontiers[house];

    while (frontier.length > 0) {
      const pick = (random() * frontier.length) | 0;
      const key = frontier[pick];

      frontier[pick] = frontier[frontier.length - 1];
      frontier.pop();

      // Another house may have taken it since it was offered.
      const tile = byKey.get(key);

      if (!tile || owners.has(key)) continue;

      owners.set(key, house);
      offer(tile, house);

      return true;
    }

    return false;
  };

  spawns.forEach((tile, house) => {
    owners.set(tile.key, house);
    held[house] += 1;
    offer(tile, house);
  });

  let moving = true;

  while (moving) {
    moving = false;

    for (let house = 0; house < HOUSES.length; house += 1) {
      if (held[house] >= targets[house]) continue;

      if (claim(house)) {
        held[house] += 1;
        moving = true;
      }
    }
  }

  return owners;
}

function densityCount(
  pool: number,
  density: { per: number; min: number; max: number }
): number {
  const wanted = Math.round(pool / density.per);

  return Math.max(density.min, Math.min(density.max, wanted));
}

/**
 * Everything that stands on the ground.
 *
 * Candidates are scored, shuffled by a per tile jitter so the spread never
 * looks stamped, then taken in order while a minimum gap keeps two structures
 * from ever touching. The jitter is drawn up front: pulling from the stream
 * inside a comparator would make the result depend on the sort.
 */
function placeStructures(
  layout: Layout,
  owners: Owners,
  spawns: readonly Tile[],
  random: () => number
): void {
  const { tiles, byKey } = layout;
  const jitter = new Map<string, number>();

  for (const tile of tiles) jitter.set(tile.key, random());

  const noise = (tile: Tile) => jitter.get(tile.key) ?? 0;
  const reserved = new Set(spawns.map((tile) => tile.key));
  const placed: Tile[] = [];

  const touchesWater = (tile: Tile) => {
    for (let direction = 0; direction < 6; direction += 1) {
      const next = stepTile(byKey, tile, direction);

      if (!next?.land) return true;
    }

    return false;
  };

  const take = (
    kind: StructureKind,
    pool: Tile[],
    score: (tile: Tile) => number,
    count: number,
    gap: number
  ): Tile[] => {
    const ranked = pool
      .map((tile) => ({ tile, rank: score(tile) }))
      .sort((a, b) => b.rank - a.rank);
    const taken: Tile[] = [];

    for (const { tile } of ranked) {
      if (taken.length >= count) break;
      if (reserved.has(tile.key) || tile.structure) continue;
      if (
        placed.some(
          (other) => hexDistance(tile.q, tile.r, other.q, other.r) < gap
        )
      ) {
        continue;
      }

      tile.structure = kind;
      placed.push(tile);
      taken.push(tile);
    }

    return taken;
  };

  const landTiles = tiles.filter((tile) => tile.land);
  const neutral = landTiles.filter((tile) => !owners.has(tile.key));
  const inland = landTiles.filter((tile) => !touchesWater(tile));
  const player = spawns[0];

  // The forge and the wonder are prizes, so they go down first and go down far
  // from the player: reaching either one has to cost a march.
  const [wonder] = take(
    "wonder",
    inland.length > 0 ? inland : landTiles,
    (tile) =>
      hexDistance(tile.q, tile.r, player.q, player.r) + noise(tile) * 1.5,
    1,
    LANDMARK_GAP
  );

  take(
    "forge",
    inland.length > 0 ? inland : landTiles,
    (tile) => {
      const fromPlayer = hexDistance(tile.q, tile.r, player.q, player.r);
      const fromWonder = wonder
        ? hexDistance(tile.q, tile.r, wonder.q, wonder.r)
        : fromPlayer;

      return Math.min(fromPlayer, fromWonder) + noise(tile) * 1.5;
    },
    1,
    LANDMARK_GAP
  );

  take(
    "city",
    inland.filter(
      (tile) =>
        tile.terrain === "plain" ||
        tile.terrain === "forest" ||
        tile.terrain === "hill"
    ),
    (tile) => tile.elevation * 0.6 + tile.rim * 0.05 + noise(tile) * 0.6,
    densityCount(landTiles.length, CITY_DENSITY),
    CITY_GAP
  );

  // A harbour wants a mouth, not a puddle and not an isthmus, so two or three
  // open sides scores best.
  take(
    "port",
    landTiles.filter((tile) => touchesWater(tile)),
    (tile) => {
      let open = 0;

      for (let direction = 0; direction < 6; direction += 1) {
        const next = stepTile(byKey, tile, direction);

        if (!next?.land) open += 1;
      }

      return 1 - Math.abs(open - 2) * 0.25 + noise(tile) * 0.5;
    },
    densityCount(landTiles.length, PORT_DENSITY),
    PORT_GAP
  );

  take(
    "camp",
    neutral,
    (tile) => noise(tile),
    densityCount(neutral.length, CAMP_DENSITY),
    CAMP_GAP
  );

  take(
    "chest",
    neutral,
    (tile) => noise(tile),
    densityCount(neutral.length, CHEST_DENSITY),
    CHEST_GAP
  );
}

export function generateWorld(seed: number, cols: number, rows: number): World {
  const gridCols = Math.max(MIN_GRID, Math.floor(cols));
  const gridRows = Math.max(MIN_GRID, Math.floor(rows));
  const random = createRandom(seed);
  const layout = buildLayout(gridCols, gridRows);
  const total = layout.tiles.length;

  let shape = shapeWorld(layout.points, random);
  let miss = landMiss(shape.land, total);

  // Generate, measure, reject. A map that is nearly all sea or nearly all
  // ground is not a fair fight, so it gets thrown away and sown again.
  for (let attempt = 1; attempt < MAX_REROLLS && miss > 0; attempt += 1) {
    const next = shapeWorld(layout.points, random);
    const nextMiss = landMiss(next.land, total);

    if (nextMiss < miss) {
      shape = next;
      miss = nextMiss;
    }
  }

  const landTiles: Tile[] = [];

  for (let index = 0; index < layout.tiles.length; index += 1) {
    const tile = layout.tiles[index];

    tile.terrain = shape.terrain[index];
    tile.elevation = shape.elevation[index];
    tile.land = !WATER.has(tile.terrain);

    if (tile.land) landTiles.push(tile);
  }

  const openings = landTiles.filter(
    (tile) => tile.terrain !== "shore" && tile.rim >= 2
  );
  // A grid small enough to sit entirely inside the sea frame drowns whole.
  // There is nothing to fight over, so it comes back empty rather than half
  // built with three houses sharing one rock.
  const spawns =
    landTiles.length >= HOUSES.length
      ? pickSpawns(
          openings.length >= HOUSES.length ? openings : landTiles,
          random
        )
      : [];
  const initialOwners = growOwners(
    layout.byKey,
    spawns,
    landTiles.length,
    random
  );

  if (spawns.length > 0) {
    placeStructures(layout, initialOwners, spawns, random);
  }

  const collapseOrder = landTiles
    .slice()
    .sort((a, b) => a.rim - b.rim || a.r - b.r || a.q - b.q)
    .map((tile) => tile.key);

  return {
    seed,
    cols: gridCols,
    rows: gridRows,
    width: layout.width,
    height: layout.height,
    minX: layout.minX,
    minY: layout.minY,
    tiles: layout.tiles,
    byKey: layout.byKey,
    spawns: spawns.map((tile) => tile.key),
    initialOwners,
    collapseOrder,
  };
}

export function neighbourOf(
  world: World,
  tile: Tile,
  direction: number
): Tile | undefined {
  return stepTile(world.byKey, tile, direction);
}

/**
 * Shortest walk between two land tiles, as the tile keys stepped onto.
 *
 * Breadth first, land only. Where several routes tie on length, the one that
 * keeps to friendly and neutral ground wins: a commander crosses a rival's
 * front because they have to, not because a queue happened to order it that
 * way.
 */
export function findPath(
  world: World,
  owners: Owners,
  fromKey: string,
  toKey: string
): string[] {
  if (fromKey === toKey) return [];

  const from = world.byKey.get(fromKey);
  const target = world.byKey.get(toKey);

  if (!from?.land || !target?.land) return [];

  const mover = owners.get(fromKey);
  const cameFrom = new Map<string, string>([[fromKey, fromKey]]);
  const queue: Tile[] = [from];
  let found = false;

  for (let head = 0; head < queue.length && !found; head += 1) {
    const tile = queue[head];
    const hostile: Tile[] = [];

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (!next?.land || cameFrom.has(next.key)) continue;

      const owner = owners.get(next.key);

      if (owner !== undefined && owner !== mover) {
        hostile.push(next);
        continue;
      }

      cameFrom.set(next.key, tile.key);
      queue.push(next);

      if (next.key === toKey) found = true;
    }

    for (const next of hostile) {
      if (cameFrom.has(next.key)) continue;

      cameFrom.set(next.key, tile.key);
      queue.push(next);

      if (next.key === toKey) found = true;
    }
  }

  if (!cameFrom.has(toKey)) return [];

  const path: string[] = [];
  let cursor = toKey;

  while (cursor !== fromKey) {
    path.push(cursor);

    const previous = cameFrom.get(cursor);

    if (previous === undefined) return [];

    cursor = previous;
  }

  return path.reverse();
}

/**
 * The two territory outlines for one house.
 *
 * Independent `M x y L x y` segments rather than stitched loops: a house can
 * hold several disconnected pockets with holes in them, and chasing closed
 * rings through that is a lot of work for a result nobody can see.
 */
export function territoryPaths(
  world: World,
  owners: Owners,
  owner: number
): { border: string; front: string } {
  const border: string[] = [];
  const front: string[] = [];

  for (const tile of world.tiles) {
    if (owners.get(tile.key) !== owner) continue;

    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);
      const other = next ? owners.get(next.key) : undefined;

      if (other === owner) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];
      const segment = `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(
        b.y
      )}`;

      border.push(segment);

      // A front line is where two houses actually touch. Neutral ground and
      // the edge of the map are just a border.
      if (other !== undefined) front.push(segment);
    }
  }

  return { border: border.join(" "), front: front.join(" ") };
}

/** Land tiles held per house index. Always four entries. */
export function holdings(world: World, owners: Owners): number[] {
  const counts = HOUSES.map(() => 0);

  for (const [key, house] of owners) {
    if (house < 0 || house >= counts.length) continue;
    if (world.byKey.get(key)?.land) counts[house] += 1;
  }

  return counts;
}
