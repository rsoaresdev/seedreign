import { mapPaint } from "@/components/game/art/defs";
import { hexCorners, hexPath } from "@/components/game/hex";
import {
  neighbourOf,
  type Terrain,
  type Tile,
  type World,
} from "@/components/game/world";

/**
 * Hexes are drawn a hair oversized. Two neighbours filled to exactly the same
 * edge still let a subpixel of background through once the rasteriser has had
 * its say, and a grid of hairlines is the one thing the ground must never
 * look like.
 */
const SEAM = 1.004;

/** Deepest first, so higher ground always laps over what it stands above. */
const BAND_ORDER: readonly Terrain[] = [
  "abyss",
  "sea",
  "shelf",
  "shore",
  "plain",
  "forest",
  "hill",
  "peak",
  "snow",
];

const BAND_FILL: Record<Terrain, string> = {
  abyss: "fill-seed-map-abyss",
  sea: "fill-seed-map-sea",
  shelf: "fill-seed-map-shelf",
  shore: "fill-seed-map-shore",
  plain: "fill-seed-map-plain",
  forest: "fill-seed-map-forest",
  hill: "fill-seed-map-hill",
  peak: "fill-seed-map-peak",
  snow: "fill-seed-map-snow",
};

/** Upper left edges face the sun, lower right edges fall away from it. */
const LIT_EDGES: readonly number[] = [2, 3];
const SHADE_EDGES: readonly number[] = [5, 0];

/**
 * How much higher a tile has to stand before its edges are worth drawing.
 *
 * Set to about the height of one terrain band. Lower than that and every
 * gentle roll in the ground picks up an edge, which reads as scratches on the
 * map rather than as a slope.
 */
const RELIEF = 0.055;

/** Share of tiles of each kind that carry anything at all. */
const CANOPY_CHANCE = 0.82;
const DUNE_CHANCE = 0.42;
const SWELL_CHANCE = 0.5;

/**
 * Where firs stand inside a tile.
 *
 * None of them overlap, and that is deliberate: the whole canopy is two merged
 * paths, one lit side and one shaded side, so there is no depth order to put a
 * near tree in front of a far one.
 */
const TREE_SLOTS: readonly { dx: number; dy: number; scale: number }[] = [
  { dx: -0.36, dy: 0.28, scale: 1 },
  { dx: 0.1, dy: 0.44, scale: 0.82 },
  { dx: 0.38, dy: 0.02, scale: 0.9 },
  { dx: -0.12, dy: -0.24, scale: 0.72 },
];

type Sheet = {
  bands: Record<Terrain, string[]>;
  land: string[];
  coast: string[];
  lit: string[];
  shade: string[];
  canopyLight: string[];
  canopyDark: string[];
  ridgeLight: string[];
  ridgeDark: string[];
  ridgeCap: string[];
  dunes: string[];
  swells: string[];
};

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Stable per tile.
 *
 * Decoration has to fall out of the coordinates themselves. The same world is
 * drawn once on the server and again on hydration, and anything rolled twice
 * would grow a different forest each time.
 */
function tileHash(q: number, r: number, salt: number): number {
  let h = Math.imul(q, 0x27d4_eb2d) ^ Math.imul(r, 0x1656_67b1) ^ salt;

  h = Math.imul(h ^ (h >>> 15), 0x2545_f491);
  h ^= h >>> 13;

  return (h >>> 0) / 0x1_0000_0000;
}

function polygon(points: readonly (readonly [number, number])[]): string {
  let path = "";

  for (let index = 0; index < points.length; index += 1) {
    const [x, y] = points[index];

    path += `${index === 0 ? "M" : " L"} ${round(x)} ${round(y)}`;
  }

  return `${path} Z`;
}

/** One fir, in two tiers, split just off centre so the left side takes sun. */
function conifer(x: number, y: number, scale: number, sheet: Sheet): void {
  const spine = x + 0.02 * scale;
  const lowSpan = 0.18 * scale;
  const lowTop = y - 0.26 * scale;
  const highBase = y - 0.16 * scale;
  const highSpan = 0.125 * scale;
  const highTop = y - 0.4 * scale;

  sheet.canopyLight.push(
    polygon([
      [x, lowTop],
      [x - lowSpan, y],
      [spine, y],
    ]),
    polygon([
      [x, highTop],
      [x - highSpan, highBase],
      [spine, highBase],
    ])
  );
  sheet.canopyDark.push(
    polygon([
      [x, lowTop],
      [spine, y],
      [x + lowSpan, y],
    ]),
    polygon([
      [x, highTop],
      [spine, highBase],
      [x + highSpan, highBase],
    ])
  );
}

/**
 * A summit: the slope the sun reaches, the shoulder falling away from it, and
 * a cap sitting on top.
 *
 * The cap is measured against the two slopes rather than guessed, so it stays
 * on the mountain however far the summit leans.
 */
function ridge(
  x: number,
  y: number,
  scale: number,
  lean: number,
  cap: number,
  twin: boolean,
  sheet: Sheet
): void {
  const apexX = x + lean * scale;
  const apexY = y - 0.34 * scale;
  const foot = y + 0.22 * scale;
  const spine = apexX + 0.02 * scale;
  const drop = 0.14 * scale * cap;
  const capY = apexY + drop;
  const twinX = x + 0.24 * scale;
  const twinY = y - 0.16 * scale;

  sheet.ridgeLight.push(
    polygon([
      [apexX, apexY],
      [x - 0.38 * scale, foot],
      [spine, foot],
    ])
  );
  // The second summit lives inside the shaded face rather than beside it: a
  // separate shape would need a depth order the merged sheets do not have.
  sheet.ridgeDark.push(
    polygon(
      twin
        ? [
            [apexX, apexY],
            [x + 0.1 * scale, y - 0.04 * scale],
            [twinX, twinY],
            [x + 0.4 * scale, foot],
            [spine, foot],
          ]
        : [
            [apexX, apexY],
            [x + 0.16 * scale, y - 0.02 * scale],
            [x + 0.36 * scale, foot],
            [spine, foot],
          ]
    )
  );
  sheet.ridgeCap.push(
    polygon([
      [apexX, apexY],
      [apexX - ((0.38 + lean) * drop) / 0.56, capY],
      [apexX + ((0.16 - lean) * drop) / 0.32, capY],
    ])
  );

  if (!twin) return;

  sheet.ridgeCap.push(
    polygon([
      [twinX, twinY],
      [twinX - drop * 0.5, twinY + drop * 0.7],
      [twinX + drop * 0.44, twinY + drop * 0.7],
    ])
  );
}

function duneTick(x: number, y: number): string {
  return `M ${round(x - 0.19)} ${round(y)} q 0.19 -0.1 0.38 0`;
}

function waveDash(x: number, y: number): string {
  const start = `M ${round(x - 0.21)} ${round(y)}`;

  return `${start} q 0.105 -0.07 0.21 0 q 0.105 0.07 0.21 0`;
}

function canopy(tile: Tile, sheet: Sheet): void {
  if (tileHash(tile.q, tile.r, 0x1a) > CANOPY_CHANCE) return;

  const count = tileHash(tile.q, tile.r, 0x2b) < 0.45 ? 2 : 3;
  const first = Math.floor(tileHash(tile.q, tile.r, 0x3c) * TREE_SLOTS.length);

  for (let index = 0; index < count; index += 1) {
    const slot = TREE_SLOTS[(first + index) % TREE_SLOTS.length];

    conifer(tile.x + slot.dx, tile.y + slot.dy, slot.scale, sheet);
  }
}

function crest(tile: Tile, sheet: Sheet): void {
  const roll = tileHash(tile.q, tile.r, 0x4d);
  const lean = (roll - 0.5) * 0.3;
  const scale = 0.8 + tileHash(tile.q, tile.r, 0x5e) * 0.3;

  ridge(
    tile.x,
    tile.y,
    scale,
    lean,
    // Above the snow line the cap runs most of the way down the summit.
    tile.terrain === "snow" ? 1 : 0.5,
    roll > 0.52,
    sheet
  );
}

function dunes(tile: Tile, sheet: Sheet): void {
  const roll = tileHash(tile.q, tile.r, 0x6f);

  if (roll > DUNE_CHANCE) return;

  const drift = (roll / DUNE_CHANCE - 0.5) * 0.36;

  sheet.dunes.push(
    duneTick(tile.x + drift, tile.y - 0.14),
    duneTick(tile.x - drift * 0.7, tile.y + 0.24)
  );
}

function swells(tile: Tile, sheet: Sheet): void {
  const roll = tileHash(tile.q, tile.r, 0x7a);

  if (roll > SWELL_CHANCE) return;

  const drift = (roll / SWELL_CHANCE - 0.5) * 0.34;

  sheet.swells.push(
    waveDash(tile.x + drift, tile.y - 0.2),
    waveDash(tile.x - drift, tile.y + 0.22)
  );
}

function decorate(tile: Tile, sheet: Sheet): void {
  if (tile.terrain === "forest") {
    canopy(tile, sheet);
  } else if (tile.terrain === "peak" || tile.terrain === "snow") {
    crest(tile, sheet);
  } else if (tile.terrain === "shore") {
    dunes(tile, sheet);
  } else if (tile.terrain === "shelf") {
    swells(tile, sheet);
  }
}

/**
 * The coastline and the slopes.
 *
 * A land tile hands every edge it shares with water to the surf, and every
 * edge where it stands above the ground beside it to either the light or the
 * shadow, depending on which way that edge faces. That is the whole of the
 * relief: no blur and no gradient per tile, only which side of a step the one
 * sun can see.
 */
function relief(world: World, tile: Tile, sheet: Sheet): void {
  const corners = hexCorners(tile.x, tile.y, 1);
  const edge = (direction: number) => {
    const a = corners[direction];
    const b = corners[(direction + 1) % 6];

    return `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`;
  };

  for (let direction = 0; direction < 6; direction += 1) {
    const next = neighbourOf(world, tile, direction);

    if (!next?.land) {
      sheet.coast.push(edge(direction));
      continue;
    }

    if (tile.elevation - next.elevation < RELIEF) continue;
    if (LIT_EDGES.includes(direction)) sheet.lit.push(edge(direction));
    if (SHADE_EDGES.includes(direction)) sheet.shade.push(edge(direction));
  }
}

function drawWorld(world: World): Sheet {
  const sheet: Sheet = {
    bands: {
      abyss: [],
      sea: [],
      shelf: [],
      shore: [],
      plain: [],
      forest: [],
      hill: [],
      peak: [],
      snow: [],
    },
    land: [],
    coast: [],
    lit: [],
    shade: [],
    canopyLight: [],
    canopyDark: [],
    ridgeLight: [],
    ridgeDark: [],
    ridgeCap: [],
    dunes: [],
    swells: [],
  };

  for (const tile of world.tiles) {
    const hex = hexPath(tile.x, tile.y, SEAM);

    sheet.bands[tile.terrain].push(hex);

    if (tile.land) {
      sheet.land.push(hex);
      relief(world, tile, sheet);
    }

    decorate(tile, sheet);
  }

  return sheet;
}

/** A merged sheet of filled shapes. An empty sheet costs no node at all. */
function Ink({
  className,
  opacity,
  parts,
}: {
  className: string;
  opacity?: number;
  parts: readonly string[];
}) {
  if (parts.length === 0) return null;

  return (
    <path className={className} d={parts.join(" ")} fillOpacity={opacity} />
  );
}

/** A merged sheet of loose edges, drawn as one stroke. */
function Edges({
  className,
  opacity,
  parts,
  width,
}: {
  className: string;
  opacity?: number;
  parts: readonly string[];
  width: number;
}) {
  if (parts.length === 0) return null;

  return (
    <path
      className={className}
      d={parts.join(" ")}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeOpacity={opacity}
      strokeWidth={width}
    />
  );
}

/** One full bleed pass over the whole world. */
function Wash({ fill, world }: { fill: string; world: World }) {
  return (
    <rect
      fill={fill}
      height={world.height}
      width={world.width}
      x={world.minX}
      y={world.minY}
    />
  );
}

/**
 * The ground itself: nine bands from the abyss up to the snow line, the light
 * they catch, and a sparse scatter of firs, ridges, dunes and surf.
 *
 * Each band is a single path carrying every hex in it rather than one path per
 * tile, and the decoration is merged the same way. A full world lands in a
 * couple of dozen nodes, and the only edges left for the eye to find are the
 * ones between two different terrains.
 */
export function TerrainLayer({
  world,
  scene,
}: {
  world: World;
  /** The scene whose `MapDefs` this layer draws out of. */
  scene: string;
}) {
  const sheet = drawWorld(world);

  return (
    <g>
      {BAND_ORDER.map((band) => (
        <Ink className={BAND_FILL[band]} key={band} parts={sheet.bands[band]} />
      ))}

      {/*
        Dry ground, lifted warm and away from the water.

        The ramp puts a plain and a shallow sea within a few values of each
        other, which is right for a slate map and useless for finding the
        coastline. This is what makes a continent read as a continent from
        across the room.
      */}
      <Ink className="fill-seed-sun" opacity={0.075} parts={sheet.land} />

      <Wash fill={mapPaint(scene, "grain")} world={world} />

      <Edges
        className="stroke-seed-map-abyss"
        opacity={0.2}
        parts={sheet.shade}
        width={0.06}
      />
      <Edges
        className="stroke-seed-sun"
        opacity={0.12}
        parts={sheet.lit}
        width={0.05}
      />
      {/* The shoreline, dark water below a line of surf. */}
      <Edges
        className="stroke-seed-map-abyss"
        opacity={0.4}
        parts={sheet.coast}
        width={0.17}
      />
      <Edges
        className="stroke-seed-map-snow"
        opacity={0.6}
        parts={sheet.coast}
        width={0.06}
      />

      <Edges
        className="stroke-seed-map-shore"
        opacity={0.42}
        parts={sheet.swells}
        width={0.045}
      />
      <Edges
        className="stroke-seed-map-snow"
        opacity={0.3}
        parts={sheet.dunes}
        width={0.05}
      />

      <Ink
        className="fill-seed-map-shelf"
        opacity={0.62}
        parts={sheet.ridgeDark}
      />
      <Ink
        className="fill-seed-map-snow"
        opacity={0.62}
        parts={sheet.ridgeLight}
      />
      <Ink className="fill-seed-sun" opacity={0.42} parts={sheet.ridgeCap} />
      <Ink
        className="fill-seed-map-abyss"
        opacity={0.5}
        parts={sheet.canopyDark}
      />
      <Ink
        className="fill-seed-map-hill"
        opacity={0.85}
        parts={sheet.canopyLight}
      />

      <Wash fill={mapPaint(scene, "sun-fall")} world={world} />
      <Wash fill={mapPaint(scene, "deep")} world={world} />
    </g>
  );
}
