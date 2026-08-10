import type { ReactNode } from "react";

import { hexCorners, hexPath } from "@/components/game/hex";
import {
  generateWorld,
  neighbourOf,
  type Owners,
  type Tile,
  territoryPaths,
  type World,
} from "@/components/game/world";
import { cn } from "@/lib/utils";

export type StepPattern = "draft" | "expand" | "pulse" | "collapse" | "share";

/**
 * The five steps are one day in order, so they are drawn on one world: the
 * island a border crosses on the second card is the island a fault splits on
 * the third and the ring closes on at the fourth.
 */
const SEED = 8_140_377;
const COLS = 9;
const ROWS = 9;

const WORLD = generateWorld(SEED, COLS, ROWS);

/** Matches the map layers: two neighbours must never show a seam. */
const SEAM = 1.004;

/** The panel in its own pixels, which is also the size it is shown at. */
const WIDTH = 140;
const HEIGHT = 116;

/** Share of the land you hold, and the share the rival across from you does. */
const HELD = [0.44, 0.3];

/** The same day from the other side, for the result a friend sends back. */
const RIVAL_HELD = [0.26, 0.48];

/** How much of the map is still standing once the ring has closed. */
const STANDING = 0.54;

/** Half a hex either side of the fault, so it tears rather than cracks. */
const FAULT_WIDTH = 0.95;

/** The fault runs across the grid rather than along a row of hexes. */
const FAULT_TILT = 0.62;

type Box = { x: number; y: number; width: number; height: number };

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Who holds what, pushed out from the spawns the world already chose.
 *
 * A freshly sown world hands over borders nobody has committed to yet, and a
 * step called Expand needs the moment after that. Frontier tiles are taken in
 * the order they were offered rather than at random, so a panel is fixed by
 * the seed and by nothing else.
 */
function spread(world: World, shares: readonly number[]): Owners {
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

/** Every tile the test keeps, merged into one shape. */
function sheet(world: World, keep: (tile: Tile) => boolean): string {
  const parts: string[] = [];

  for (const tile of world.tiles) {
    if (keep(tile)) parts.push(hexPath(tile.x, tile.y, SEAM));
  }

  return parts.join(" ");
}

/** The outline of whatever the test keeps, as one stroke. */
function rim(world: World, keep: (tile: Tile) => boolean): string {
  const parts: string[] = [];

  for (const tile of world.tiles) {
    if (!keep(tile)) continue;

    const corners = hexCorners(tile.x, tile.y, 1);

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (next && keep(next)) continue;

      const a = corners[direction];
      const b = corners[(direction + 1) % 6];

      parts.push(`M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`);
    }
  }

  return parts.join(" ");
}

/**
 * The tight box around the day's land.
 *
 * Every map panel is framed on this rather than on the world, because half a
 * generated world is open water and an island floating in the middle of the
 * card is exactly the weak, decorative read this is replacing.
 */
function landBox(world: World): Box {
  // Half a hex, so the box closes around tiles and not around their centres.
  const half = { x: Math.sqrt(3) / 2, y: 1 };
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const tile of world.tiles) {
    if (!tile.land) continue;

    minX = Math.min(minX, tile.x - half.x);
    maxX = Math.max(maxX, tile.x + half.x);
    minY = Math.min(minY, tile.y - half.y);
    maxY = Math.max(maxY, tile.y + half.y);
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

/** Open a box out by `margin` on every side, without leaving the map. */
function grow(world: World, box: Box, margin: number): Box {
  const x = Math.max(box.x - margin, world.minX);
  const y = Math.max(box.y - margin, world.minY);

  return {
    x,
    y,
    width: Math.min(box.width + margin * 2, world.minX + world.width - x),
    height: Math.min(box.height + margin * 2, world.minY + world.height - y),
  };
}

function viewBox(box: Box): string {
  return [box.x, box.y, box.width, box.height]
    .map((value) => value.toFixed(3))
    .join(" ");
}

const BOX = landBox(WORLD);
const MIDDLE = { x: BOX.x + BOX.width / 2, y: BOX.y + BOX.height / 2 };

const FAULT_NORMAL = { x: Math.cos(FAULT_TILT), y: Math.sin(FAULT_TILT) };

function torn(tile: Tile): boolean {
  const across =
    (tile.x - MIDDLE.x) * FAULT_NORMAL.x + (tile.y - MIDDLE.y) * FAULT_NORMAL.y;

  return Math.abs(across) < FAULT_WIDTH;
}

function standing(tile: Tile): boolean {
  const nx = (tile.x - MIDDLE.x) / (BOX.width / 2);
  const ny = (tile.y - MIDDLE.y) / (BOX.height / 2);

  return nx * nx + ny * ny <= STANDING * STANDING;
}

const OWNERS = spread(WORLD, HELD);
const RIVAL_OWNERS = spread(WORLD, RIVAL_HELD);

const LAND = sheet(WORLD, (tile) => tile.land);
const COAST = rim(WORLD, (tile) => tile.land);
const MINE = sheet(WORLD, (tile) => OWNERS.get(tile.key) === 0);
const THEIRS = sheet(WORLD, (tile) => OWNERS.get(tile.key) === 1);
const FRONT = territoryPaths(WORLD, OWNERS, 0).front;

const WHOLE = sheet(WORLD, (tile) => tile.land && !torn(tile));
const WHOLE_MINE = sheet(
  WORLD,
  (tile) => !torn(tile) && OWNERS.get(tile.key) === 0
);
const WHOLE_THEIRS = sheet(
  WORLD,
  (tile) => !torn(tile) && OWNERS.get(tile.key) === 1
);
const FAULT = rim(WORLD, (tile) => tile.land && torn(tile));

const LOST = sheet(WORLD, (tile) => !standing(tile));
const RING = rim(WORLD, standing);

const FRIEND_MINE = sheet(WORLD, (tile) => RIVAL_OWNERS.get(tile.key) === 0);
const FRIEND_THEIRS = sheet(WORLD, (tile) => RIVAL_OWNERS.get(tile.key) === 1);

const MAP_VIEW = viewBox(grow(WORLD, BOX, 0.8));
const PANEL_VIEW = `0 0 ${WIDTH} ${HEIGHT}`;
const SHAPE_VIEW = viewBox(BOX);

/** The six orders on the table, and the three of them you keep. */
const DRAFT = [
  { turn: -17, x: 18, y: 70, kept: false },
  { turn: -10, x: 39, y: 54, kept: true },
  { turn: -3, x: 60, y: 66, kept: false },
  { turn: 4, x: 81, y: 52, kept: true },
  { turn: 11, x: 102, y: 56, kept: true },
  { turn: 18, x: 123, y: 72, kept: false },
];

/** The day's land, laid into whatever box the caller hands it. */
function Shape({
  height,
  mine,
  theirs,
  width,
  x,
  y,
}: {
  height: number;
  mine: string;
  theirs: string;
  width: number;
  x: number;
  y: number;
}) {
  return (
    <svg
      aria-hidden="true"
      height={height}
      preserveAspectRatio="xMidYMid meet"
      viewBox={SHAPE_VIEW}
      width={width}
      x={x}
      y={y}
    >
      <path className="fill-seed-map-peak" d={LAND} />
      <path className="fill-seed-gold" d={mine} />
      <path className="fill-seed-teal" d={theirs} />
    </svg>
  );
}

/** Six orders dealt face up, three of them already pulled out of the row. */
function Draft() {
  return (
    <g>
      {DRAFT.map((card) => (
        <g
          key={card.x}
          transform={`translate(${card.x} ${card.y}) rotate(${card.turn})`}
        >
          <rect
            className={card.kept ? "fill-seed-gold" : "fill-seed-map-peak"}
            height={40}
            rx={4}
            width={30}
            x={-15}
            y={-20}
          />
          <rect
            className={card.kept ? "fill-seed-sun" : "fill-seed-map-snow"}
            height={17}
            rx={2}
            width={23}
            x={-11.5}
            y={-15}
          />
          <rect
            className="fill-seed-map-abyss"
            height={3}
            rx={1.5}
            width={17}
            x={-11.5}
            y={5}
          />
          <rect
            className="fill-seed-map-abyss"
            height={2.5}
            rx={1.25}
            width={22}
            x={-11.5}
            y={11}
          />
          <circle className="fill-seed-map-abyss" cx={-10} cy={-13.5} r={4} />
        </g>
      ))}
    </g>
  );
}

/** Two borders that have run out of empty ground between them. */
function Expand() {
  return (
    <g>
      <path className="fill-seed-map-peak" d={LAND} />
      <path className="fill-seed-gold" d={MINE} />
      <path className="fill-seed-teal" d={THEIRS} />
      <path
        className="stroke-seed-map-snow"
        d={COAST}
        fill="none"
        strokeLinejoin="round"
        strokeWidth={0.16}
      />
      <path
        className="stroke-seed-sun"
        d={FRONT}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.35}
        strokeWidth={1}
      />
      <path
        className="stroke-seed-sun"
        d={FRONT}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.4}
      />
    </g>
  );
}

/** A fault opening across the island, and the shock still going out. */
function Pulse() {
  return (
    <g>
      <path className="fill-seed-map-peak" d={WHOLE} />
      <path className="fill-seed-gold" d={WHOLE_MINE} />
      <path className="fill-seed-teal" d={WHOLE_THEIRS} />
      <path
        className="stroke-seed-violet"
        d={FAULT}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={0.34}
      />

      <ellipse
        className="stroke-seed-violet"
        cx={MIDDLE.x}
        cy={MIDDLE.y}
        fill="none"
        rx={BOX.width * 0.34}
        ry={BOX.height * 0.34}
        strokeWidth={0.42}
      />
      <ellipse
        className="stroke-seed-violet"
        cx={MIDDLE.x}
        cy={MIDDLE.y}
        fill="none"
        rx={BOX.width * 0.52}
        ry={BOX.height * 0.52}
        strokeOpacity={0.55}
        strokeWidth={0.3}
      />
    </g>
  );
}

/** Everything outside the last ring is already gone. */
function Collapse() {
  return (
    <g>
      <path className="fill-seed-map-peak" d={LAND} />
      <path className="fill-seed-gold" d={MINE} />
      <path className="fill-seed-teal" d={THEIRS} />
      {/* Short of opaque, so the ground that stood there still ghosts through
          and the eye reads a map being taken rather than a hole punched in
          one. */}
      <path className="fill-seed-map-abyss" d={LOST} fillOpacity={0.88} />
      <path
        className="stroke-destructive"
        d={RING}
        fill="none"
        strokeLinejoin="round"
        strokeOpacity={0.4}
        strokeWidth={1.2}
      />
      <path
        className="stroke-destructive"
        d={RING}
        fill="none"
        strokeLinejoin="round"
        strokeWidth={0.36}
      />
    </g>
  );
}

/** The day handed round: your shape, and the same day back from a friend. */
function Share() {
  return (
    <g>
      <path
        className="fill-seed-map-peak stroke-seed-map-snow"
        d="M 18 2 H 98 A 14 14 0 0 1 112 16 V 56 A 14 14 0 0 1 98 70 H 46 L 22 88 L 30 70 H 18 A 14 14 0 0 1 4 56 V 16 A 14 14 0 0 1 18 2 Z"
        strokeWidth={2}
      />
      <Shape height={56} mine={MINE} theirs={THEIRS} width={92} x={12} y={8} />

      <path
        className="fill-seed-map-abyss stroke-seed-map-peak"
        d="M 70 78 H 126 A 12 12 0 0 1 138 90 V 102 A 12 12 0 0 1 126 114 H 70 A 12 12 0 0 1 58 102 V 90 A 12 12 0 0 1 70 78 Z"
        strokeWidth={2}
      />
      <Shape
        height={28}
        mine={FRIEND_MINE}
        theirs={FRIEND_THEIRS}
        width={68}
        x={64}
        y={82}
      />
    </g>
  );
}

const SCENES: Record<StepPattern, () => ReactNode> = {
  draft: Draft,
  expand: Expand,
  pulse: Pulse,
  collapse: Collapse,
  share: Share,
};

const VIEWS: Record<StepPattern, string> = {
  draft: PANEL_VIEW,
  expand: MAP_VIEW,
  pulse: MAP_VIEW,
  collapse: MAP_VIEW,
  share: PANEL_VIEW,
};

/**
 * The state of the world at one step of the day, drawn as card texture rather
 * than as a panel of its own.
 *
 * It sits behind the copy at seven percent, which is the whole brief: no
 * hairlines, no terrain, no tinting the ground under a house. Flat shapes in
 * the loudest tones the palette has, because a seventh of a colour is all that
 * survives to be read.
 *
 * Nothing here moves. Whatever is drawn ends up under a paragraph somebody is
 * trying to read, and that is not the place for a heartbeat.
 */
export function StepBoard({
  pattern,
  className,
}: {
  pattern: StepPattern;
  className?: string;
}) {
  const Scene = SCENES[pattern];

  return (
    <svg
      aria-hidden="true"
      className={cn("block h-29 w-35", className)}
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      viewBox={VIEWS[pattern]}
    >
      <Scene />
    </svg>
  );
}
