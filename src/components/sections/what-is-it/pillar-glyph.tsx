import type { ReactNode } from "react";

import { MapDefs } from "@/components/game/art/defs";
import { TerrainLayer } from "@/components/game/art/terrain";
import { TerritoryLayer } from "@/components/game/art/territory";
import { hexCorners, hexPath } from "@/components/game/hex";
import {
  generateWorld,
  HOUSES,
  neighbourOf,
  type Owners,
  type Tile,
  type World,
} from "@/components/game/world";

export type GlyphPattern = "sow" | "claim" | "collapse" | "share";

/**
 * All four pillars are moments of one day, so they grow from one seed: the
 * coast a reader meets on the first card is the coast being fought over on the
 * second, eaten by the ring on the third and handed round in a chat on the
 * fourth.
 */
const SEED = 2_026_081;
const COLS = 16;
const ROWS = 13;

const WORLD = generateWorld(SEED, COLS, ROWS);

/** Matches the map layers: two neighbours must never show a seam. */
const SEAM = 1.004;

/** Share of the day's land each house holds at midday, and again at dusk. */
const MIDDAY = [0.42, 0.34];
const DUSK = [0.54, 0.28, 0.12];

/** How much of the map is still standing once the ring has closed. */
const STANDING = 0.38;

/** Hex units across the window: how close each card stands to the ground. */
const COAST_SPAN = 11;
const FRONT_SPAN = 12;
const RING_SPAN = 16;

/** The window is three units wide for every two it is tall. */
const WINDOW_RATIO = 2 / 3;

/** Half a hex, so a box closes around tiles rather than around their centres. */
const HALF_WIDTH = Math.sqrt(3) / 2;
const HALF_HEIGHT = 1;

type Box = { x: number; y: number; width: number; height: number };

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Who holds what, pushed out from the spawns the world already chose.
 *
 * A freshly sown world hands over borders nobody has committed to yet, which
 * is the wrong moment for three of these four cards. Frontier tiles are taken
 * in the order they were offered rather than at random, so a card is fixed by
 * the seed and by nothing else.
 */
function claimGround(world: World, shares: readonly number[]): Owners {
  const land = world.tiles.filter((tile) => tile.land).length;
  const holds = shares.map((share) => Math.round(land * share));
  const owners = new Map<string, number>();
  const frontiers: string[][] = holds.map(() => []);
  const held = holds.map(() => 0);

  const offer = (tile: Tile, house: number) => {
    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (next?.land && !owners.has(next.key)) frontiers[house].push(next.key);
    }
  };

  const claim = (house: number): boolean => {
    const frontier = frontiers[house];

    while (frontier.length > 0) {
      const key = frontier.shift();
      const tile = key === undefined ? undefined : world.byKey.get(key);

      if (!tile || owners.has(tile.key)) continue;

      owners.set(tile.key, house);
      offer(tile, house);

      return true;
    }

    return false;
  };

  for (const [house, key] of world.spawns.entries()) {
    const start = house < holds.length ? world.byKey.get(key) : undefined;

    if (!start) continue;

    owners.set(start.key, house);
    held[house] = 1;
    offer(start, house);
  }

  let moving = true;

  while (moving) {
    moving = false;

    for (let house = 0; house < holds.length; house += 1) {
      if (held[house] >= holds[house] || !claim(house)) continue;

      held[house] += 1;
      moving = true;
    }
  }

  return owners;
}

/** Whether a tile is still inside the ring, measured against the map itself. */
function inside(world: World, tile: Tile, radius: number): boolean {
  const nx = (tile.x - (world.minX + world.width / 2)) / (world.width / 2);
  const ny = (tile.y - (world.minY + world.height / 2)) / (world.height / 2);

  return nx * nx + ny * ny <= radius * radius;
}

/** The world split in three: the ground, the water, and the line between. */
function shoreSheets(world: World): {
  ground: string;
  water: string;
  surf: string;
} {
  const ground: string[] = [];
  const water: string[] = [];
  const surf: string[] = [];

  for (const tile of world.tiles) {
    const hex = hexPath(tile.x, tile.y, SEAM);

    if (!tile.land) {
      water.push(hex);
      continue;
    }

    ground.push(hex);

    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      if (neighbourOf(world, tile, direction)?.land) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];

      surf.push(`M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`);
    }
  }

  return {
    ground: ground.join(" "),
    water: water.join(" "),
    surf: surf.join(" "),
  };
}

/** The ground the Collapse has taken, and the line it is closing along. */
function unravel(
  world: World,
  radius: number
): { ground: string; edge: string } {
  const ground: string[] = [];
  const edge: string[] = [];

  for (const tile of world.tiles) {
    if (inside(world, tile, radius)) continue;

    ground.push(hexPath(tile.x, tile.y, SEAM));

    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (!next || !inside(world, next, radius)) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];

      edge.push(`M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`);
    }
  }

  return { ground: ground.join(" "), edge: edge.join(" ") };
}

/** The day reduced to a shape: the land, and whoever ended the day on it. */
function outcome(
  world: World,
  owners: Owners
): { land: string; houses: string[] } {
  const land: string[] = [];
  const houses: string[][] = HOUSES.map(() => []);

  for (const tile of world.tiles) {
    if (!tile.land) continue;

    const hex = hexPath(tile.x, tile.y, SEAM);
    const house = owners.get(tile.key);

    if (house === undefined || house < 0 || house >= houses.length) {
      land.push(hex);
      continue;
    }

    houses[house].push(hex);
  }

  return { land: land.join(" "), houses: houses.map((part) => part.join(" ")) };
}

/** A box `span` hex units wide, centred on whatever the scene looks at. */
function frame(span: number, x: number, y: number): Box {
  const height = span * WINDOW_RATIO;

  return { x: x - span / 2, y: y - height / 2, width: span, height };
}

function viewBox(box: Box): string {
  return [box.x, box.y, box.width, box.height]
    .map((value) => value.toFixed(3))
    .join(" ");
}

/** The tight box around the day's land, so the shape fills whatever holds it. */
function shapeBounds(world: World): Box {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const tile of world.tiles) {
    if (!tile.land) continue;

    minX = Math.min(minX, tile.x - HALF_WIDTH);
    maxX = Math.max(maxX, tile.x + HALF_WIDTH);
    minY = Math.min(minY, tile.y - HALF_HEIGHT);
    maxY = Math.max(maxY, tile.y + HALF_HEIGHT);
  }

  if (minX > maxX) {
    return {
      x: world.minX,
      y: world.minY,
      width: world.width,
      height: world.height,
    };
  }

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * How far outside a window a tile can still leave a mark on it: a hex reaches
 * one unit from its own centre, and the widest stroke laid along an edge half
 * of its own width past that.
 */
const OVERHANG = 1.4;

/**
 * The same world with everything the window cannot show dropped from the draw.
 *
 * Only the list the layers walk is cut. `byKey` is left whole, so a tile on the
 * lip of the window still finds its neighbours, and the coast, the relief and
 * the borders come out exactly as they would have on the full map.
 */
function cropped(world: World, box: Box): World {
  return {
    ...world,
    tiles: world.tiles.filter(
      (tile) =>
        tile.x >= box.x - OVERHANG &&
        tile.x <= box.x + box.width + OVERHANG &&
        tile.y >= box.y - OVERHANG &&
        tile.y <= box.y + box.height + OVERHANG
    ),
  };
}

/** Slide a frame back inside the map, so a window never opens onto nothing. */
function clampFrame(world: World, box: Box): Box {
  const right = world.minX + world.width - box.width;
  const bottom = world.minY + world.height - box.height;

  return {
    ...box,
    x: Math.min(Math.max(box.x, world.minX), right),
    y: Math.min(Math.max(box.y, world.minY), bottom),
  };
}

/**
 * The best stretch of coast to stand a window on: the one where the frame ends
 * up half ground and half open water.
 *
 * Anchoring on a single shore tile is not enough, because a tile at the mouth
 * of a bay and a tile on the outside of a cape look identical from one hex
 * away and read as opposites once there is a whole frame around them.
 */
function coastFrame(world: World, span: number): Box {
  const middle = frame(
    span,
    world.minX + world.width / 2,
    world.minY + world.height / 2
  );
  let best = middle;
  let bestMiss = Number.POSITIVE_INFINITY;

  for (const tile of world.tiles) {
    if (!tile.land) continue;

    const box = frame(span, tile.x, tile.y);

    if (box.x < world.minX || box.x + box.width > world.minX + world.width) {
      continue;
    }
    if (box.y < world.minY || box.y + box.height > world.minY + world.height) {
      continue;
    }

    let held = 0;
    let ground = 0;

    for (const other of world.tiles) {
      if (Math.abs(other.x - tile.x) > span / 2) continue;
      if (Math.abs(other.y - tile.y) > box.height / 2) continue;

      held += 1;
      if (other.land) ground += 1;
    }

    const miss = held === 0 ? 1 : Math.abs(ground / held - 0.5);

    if (miss >= bestMiss) continue;

    bestMiss = miss;
    best = box;
  }

  return best;
}

/** The middle of the fighting: wherever two houses actually touch. */
function frontCentre(world: World, owners: Owners): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let count = 0;

  for (const tile of world.tiles) {
    const house = owners.get(tile.key);

    if (house === undefined) continue;

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);
      const other = next ? owners.get(next.key) : undefined;

      if (other === undefined || other === house) continue;

      x += tile.x;
      y += tile.y;
      count += 1;
      break;
    }
  }

  if (count === 0) {
    return {
      x: world.minX + world.width / 2,
      y: world.minY + world.height / 2,
    };
  }

  return { x: x / count, y: y / count };
}

const MIDDAY_OWNERS = claimGround(WORLD, MIDDAY);
const DUSK_OWNERS = claimGround(WORLD, DUSK);
const SHAPE = outcome(WORLD, DUSK_OWNERS);

const FRONT = frontCentre(WORLD, MIDDAY_OWNERS);
const MIDDLE = {
  x: WORLD.minX + WORLD.width / 2,
  y: WORLD.minY + WORLD.height / 2,
};

const COAST_FRAME = coastFrame(WORLD, COAST_SPAN);
const FRONT_FRAME = clampFrame(WORLD, frame(FRONT_SPAN, FRONT.x, FRONT.y));
const RING_FRAME = frame(RING_SPAN, MIDDLE.x, MIDDLE.y);

const FRONT_VIEW = viewBox(FRONT_FRAME);
const RING_VIEW = viewBox(RING_FRAME);
const SHAPE_VIEW = viewBox(shapeBounds(WORLD));

// Each window stands on a strip of one world, and a pane this small shows well
// under a third of it. Whatever the frame cannot reach is cut before it is
// drawn, so a thumbnail ships a thumbnail's worth of geometry.
const SOW_WORLD = cropped(WORLD, COAST_FRAME);
const CLAIM_WORLD = cropped(WORLD, FRONT_FRAME);
const RING_WORLD = cropped(WORLD, RING_FRAME);

const SHORE = shoreSheets(SOW_WORLD);
const TAKEN = unravel(RING_WORLD, STANDING);

/** The design space the share card is drawn in, in the window's own pixels. */
const CARD_VIEW = "0 0 96 64";

const HOUSE_FILL = [
  "fill-seed-gold",
  "fill-seed-teal",
  "fill-seed-violet",
  "fill-destructive",
] as const;

/** Milliseconds between one waiting dot and the next. */
const DOT_STEP = 260;

/**
 * The pane every pillar is seen through. Small, so it is cropped to fill
 * rather than letterboxed: the world rings itself with open water, and losing
 * a sliver of that costs nothing.
 */
function Pane({ children, view }: { children: ReactNode; view: string }) {
  return (
    <span className="block w-24 overflow-hidden rounded-lg border border-seed-line bg-seed-bg">
      <svg
        aria-hidden="true"
        className="block h-16 w-full"
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        viewBox={view}
      >
        {children}
      </svg>
    </span>
  );
}

/** Dawn. Ground breaking the surface, and the first light landing on it. */
function Sow() {
  return (
    <Pane view={viewBox(COAST_FRAME)}>
      <MapDefs scene="sow" />
      <defs>
        {/* Pinned to the corner of the frame rather than to the shape it
            fills, so the sun comes up over the window and not over the
            continent, which mostly lies outside it. */}
        <radialGradient
          cx={COAST_FRAME.x}
          cy={COAST_FRAME.y}
          gradientUnits="userSpaceOnUse"
          id="sr-pillar-dawn"
          r={COAST_FRAME.width}
        >
          <stop
            className="[stop-color:var(--seed-sun)]"
            offset="0"
            stopOpacity="0.26"
          />
          <stop
            className="[stop-color:var(--seed-gold)]"
            offset="0.55"
            stopOpacity="0.08"
          />
          <stop
            className="[stop-color:var(--seed-gold)]"
            offset="1"
            stopOpacity="0"
          />
        </radialGradient>

        <radialGradient
          cx={COAST_FRAME.x + COAST_FRAME.width / 2}
          cy={COAST_FRAME.y + COAST_FRAME.height / 2}
          gradientUnits="userSpaceOnUse"
          id="sr-pillar-deep"
          r={COAST_FRAME.width * 0.62}
        >
          <stop
            className="[stop-color:var(--seed-map-abyss)]"
            offset="0.45"
            stopOpacity="0"
          />
          <stop
            className="[stop-color:var(--seed-map-abyss)]"
            offset="1"
            stopOpacity="0.4"
          />
        </radialGradient>
      </defs>

      <TerrainLayer scene="sow" world={SOW_WORLD} />

      {/*
        The ramp puts a plain and a shallow sea a few values apart, so at this
        size the coast has to be built rather than found: deeper water, warmer
        ground, and a lit line along the join.
      */}
      <path
        className="fill-seed-map-abyss"
        d={SHORE.water}
        fillOpacity={0.45}
      />
      <path className="fill-seed-gold" d={SHORE.ground} fillOpacity={0.07} />
      <path d={SHORE.ground} fill="url(#sr-pillar-dawn)" />
      <path
        className="stroke-seed-sun"
        d={SHORE.surf}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.14}
        strokeWidth={0.34}
      />
      <path
        className="stroke-seed-sun"
        d={SHORE.surf}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.62}
        strokeWidth={0.11}
      />

      <rect
        fill="url(#sr-pillar-deep)"
        height={COAST_FRAME.height}
        width={COAST_FRAME.width}
        x={COAST_FRAME.x}
        y={COAST_FRAME.y}
      />
    </Pane>
  );
}

/** Midday. Two houses have run out of empty ground between them. */
function Claim() {
  return (
    <Pane view={FRONT_VIEW}>
      <MapDefs scene="claim" />
      <TerrainLayer scene="claim" world={CLAIM_WORLD} />
      <TerritoryLayer owners={MIDDAY_OWNERS} world={CLAIM_WORLD} />
    </Pane>
  );
}

/** Dusk. The edges are already gone and the ring is still coming in. */
function Collapse() {
  return (
    <Pane view={RING_VIEW}>
      <MapDefs scene="collapse" />
      <TerrainLayer scene="collapse" world={RING_WORLD} />
      <TerritoryLayer owners={DUSK_OWNERS} world={RING_WORLD} />

      <path
        className="fill-seed-map-abyss"
        d={TAKEN.ground}
        fillOpacity={0.88}
      />
      <path
        className="stroke-destructive motion-safe:animate-pulse"
        d={TAKEN.edge}
        fill="none"
        strokeLinecap="round"
        strokeOpacity={0.28}
        strokeWidth={0.42}
      />
      <path
        className="stroke-destructive"
        d={TAKEN.edge}
        fill="none"
        strokeLinecap="round"
        strokeWidth={0.13}
      />
    </Pane>
  );
}

/** After dusk. The day is a shape now, small enough to hand to a friend. */
function Share() {
  return (
    <Pane view={CARD_VIEW}>
      <path
        className="fill-seed-panel-raised stroke-seed-line"
        d="M 13 2 H 66 A 10 10 0 0 1 76 12 V 30 A 10 10 0 0 1 66 40 H 27 L 8 49 L 13 40 A 10 10 0 0 1 3 30 V 12 A 10 10 0 0 1 13 2 Z"
        strokeWidth={1}
      />

      <svg
        aria-hidden="true"
        height={28}
        preserveAspectRatio="xMidYMid meet"
        viewBox={SHAPE_VIEW}
        width={60}
        x={10}
        y={7}
      >
        <path className="fill-seed-map-shore" d={SHAPE.land} />
        {SHAPE.houses.map((house, index) =>
          house === "" ? null : (
            <path className={HOUSE_FILL[index]} d={house} key={HOUSES[index]} />
          )
        )}
      </svg>

      <path
        className="fill-seed-panel stroke-seed-line"
        d="M 54 44 H 85 A 8 8 0 0 1 93 52 V 54 A 8 8 0 0 1 85 62 H 62 A 8 8 0 0 1 54 54 V 52 A 8 8 0 0 1 62 44 Z"
        strokeWidth={1}
      />
      {[64, 73, 82].map((cx, index) => (
        <circle
          className="fill-seed-muted motion-safe:animate-pulse"
          cx={cx}
          cy={53}
          key={cx}
          r={2.6}
          style={{ animationDelay: `${index * DOT_STEP}ms` }}
        />
      ))}
    </Pane>
  );
}

const SCENES: Record<GlyphPattern, () => ReactNode> = {
  sow: Sow,
  claim: Claim,
  collapse: Collapse,
  share: Share,
};

/**
 * The illustration on a pillar card: one moment of one day, drawn on the same
 * ground the game is played on.
 */
export function PillarGlyph({ pattern }: { pattern: GlyphPattern }) {
  const Scene = SCENES[pattern];

  return <Scene />;
}
