/**
 * The living world behind the hero.
 *
 * One seed grows a map, three houses take it, the Collapse eats it from the
 * edges, and the next seed sows another one. The loop is deliberately cheap:
 * the terrain is painted once per world and a tick repaints only the handful
 * of cells that actually changed, so nothing here ever redraws a full canvas
 * inside the animation loop.
 */

/** Values below zero are terrain. Anything from zero up is a house index. */
const SEA = -2;
const UNCLAIMED = -1;

/** One house per brand accent. */
const HOUSE_TOKENS = ["--seed-gold", "--seed-teal", "--seed-violet"] as const;

/** Roughly how wide a cell is, in CSS pixels. */
const CELL_SIZE = 18;

/** Ceiling on the grid, so a very large viewport cannot make a tick expensive. */
const MAX_CELLS = 4000;

/** Cells a house takes per tick. */
const CLAIM_RATE = 3;

/** Cells the Collapse eats per tick. It reads as faster than the conquest. */
const COLLAPSE_RATE = 26;

/** Ticks the finished map is held before the Collapse starts. */
const HOLD_TICKS = 18;

/** Ticks of empty sea before the next world is sown. */
const DAWN_TICKS = 8;

/** Generate, measure, reject: a map outside this land ratio gets rerolled. */
const MIN_LAND = 0.3;
const MAX_LAND = 0.62;
const MAX_REROLLS = 8;

/** Candidate spawns weighed per house, so the three start far apart. */
const SPAWN_ATTEMPTS = 40;

type Phase = "conquest" | "hold" | "collapse" | "dawn";

type Rgb = readonly [number, number, number];

type HousePaint = { fill: string; edge: string };

type Palette = { land: string; houses: HousePaint[] };

export type HeroWorld = {
  /** Rebuild for a new canvas size, given in CSS pixels, and repaint. */
  resize(width: number, height: number, dpr: number): void;
  /** Advance one step and repaint only what changed. */
  tick(): void;
  /** Jump straight to a conquered map: the still frame, painted once. */
  settle(): void;
};

/** xorshift32. Integer maths and one seed in, so a world is reproducible. */
function createRandom(seed: number): () => number {
  let state = seed | 0 || 0x9e3779b9;

  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    return (state >>> 0) / 0x1_0000_0000;
  };

  // Consecutive seeds start out correlated, so burn the first few draws.
  for (let i = 0; i < 8; i += 1) next();

  return next;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Tiling value noise on a `size` by `size` lattice, sampled in [0, 1). */
function createNoise(random: () => number, size: number) {
  const lattice = new Float32Array(size * size);

  for (let i = 0; i < lattice.length; i += 1) lattice[i] = random();

  return (u: number, v: number): number => {
    const x = u * size;
    const y = v * size;
    const xa = Math.floor(x) % size;
    const ya = Math.floor(y) % size;
    const xb = (xa + 1) % size;
    const yb = (ya + 1) % size;
    const tx = smoothstep(x - Math.floor(x));
    const ty = smoothstep(y - Math.floor(y));

    const top =
      lattice[ya * size + xa] * (1 - tx) + lattice[ya * size + xb] * tx;
    const bottom =
      lattice[yb * size + xa] * (1 - tx) + lattice[yb * size + xb] * tx;

    return top * (1 - ty) + bottom * ty;
  };
}

function parseHex(value: string): Rgb {
  const hex = value.trim().replace("#", "");
  const full =
    hex.length === 3
      ? `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`
      : hex;
  const int = Number.parseInt(full, 16);

  if (full.length !== 6 || Number.isNaN(int)) return [0, 0, 0];

  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function mix(color: Rgb, towards: Rgb, amount: number): Rgb {
  return [
    Math.round(color[0] + (towards[0] - color[0]) * amount),
    Math.round(color[1] + (towards[1] - color[1]) * amount),
    Math.round(color[2] + (towards[2] - color[2]) * amount),
  ];
}

function toCss(color: Rgb): string {
  return `rgb(${color[0]} ${color[1]} ${color[2]})`;
}

/**
 * Colours come from the brand tokens rather than from literals here, so the
 * map can never drift away from the palette. They are mixed down towards the
 * page background until they read as a backdrop: the headline sits on top of
 * this and has to stay comfortably readable.
 */
function readPalette(element: Element): Palette {
  const styles = getComputedStyle(element);
  const read = (token: string) => parseHex(styles.getPropertyValue(token));
  const background = read("--seed-bg");

  return {
    land: toCss(mix(read("--seed-line-strong"), background, 0.5)),
    houses: HOUSE_TOKENS.map((token) => {
      const base = read(token);

      return {
        fill: toCss(mix(base, background, 0.76)),
        edge: toCss(mix(base, background, 0.42)),
      };
    }),
  };
}

/** Cell count for a viewport, kept near CELL_SIZE until the ceiling bites. */
function gridFor(width: number, height: number) {
  const wanted = (width * height) / (CELL_SIZE * CELL_SIZE);
  const size = CELL_SIZE * Math.max(1, Math.sqrt(wanted / MAX_CELLS));

  return {
    cols: Math.max(8, Math.round(width / size)),
    rows: Math.max(6, Math.round(height / size)),
  };
}

export function createHeroWorld(
  canvas: HTMLCanvasElement,
  seed: number
): HeroWorld {
  const context = canvas.getContext("2d");
  const frontiers: number[][] = HOUSE_TOKENS.map(() => []);
  /** Cells claimed last tick, still painted as the advancing edge. */
  const glowing: number[] = [];

  let palette = readPalette(canvas);
  let random = createRandom(seed);
  let currentSeed = seed;
  let cols = 0;
  let rows = 0;
  let gutter = 1;
  let owner = new Int8Array(0);
  let collapseOrder: number[] = [];
  let collapseCursor = 0;
  let phase: Phase = "conquest";
  let phaseTicks = 0;

  function cellRect(index: number) {
    const x = index % cols;
    const y = (index / cols) | 0;
    const left = Math.round((x * canvas.width) / cols);
    const top = Math.round((y * canvas.height) / rows);

    return {
      left,
      top,
      width: Math.round(((x + 1) * canvas.width) / cols) - left,
      height: Math.round(((y + 1) * canvas.height) / rows) - top,
    };
  }

  function paintCell(index: number, fill: string) {
    if (!context) return;

    const { left, top, width, height } = cellRect(index);

    context.fillStyle = fill;
    context.fillRect(left, top, width - gutter, height - gutter);
  }

  function clearCell(index: number) {
    if (!context) return;

    const { left, top, width, height } = cellRect(index);

    context.clearRect(left, top, width, height);
  }

  function paintAll() {
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < owner.length; index += 1) {
      const value = owner[index];

      if (value === SEA) continue;

      paintCell(
        index,
        value === UNCLAIMED ? palette.land : palette.houses[value].fill
      );
    }
  }

  function offer(index: number, house: number) {
    if (owner[index] === UNCLAIMED) frontiers[house].push(index);
  }

  function offerNeighbours(index: number, house: number) {
    const x = index % cols;
    const y = (index / cols) | 0;

    if (x > 0) offer(index - 1, house);
    if (x < cols - 1) offer(index + 1, house);
    if (y > 0) offer(index - cols, house);
    if (y < rows - 1) offer(index + cols, house);
  }

  /**
   * Takes one cell for a house. The frontier is a bag of candidates drawn from
   * at random and emptied by swapping with the last entry, so expansion costs
   * the same whether a house owns ten cells or a thousand.
   */
  function claim(house: number, paint: boolean): boolean {
    const frontier = frontiers[house];

    while (frontier.length > 0) {
      const pick = (random() * frontier.length) | 0;
      const index = frontier[pick];

      frontier[pick] = frontier[frontier.length - 1];
      frontier.pop();

      // Another house may have taken it since it was offered.
      if (owner[index] !== UNCLAIMED) continue;

      owner[index] = house;
      offerNeighbours(index, house);

      if (paint) {
        paintCell(index, palette.houses[house].edge);
        glowing.push(index);
      }

      return true;
    }

    return false;
  }

  function advance(paint: boolean): number {
    let claimed = 0;

    for (let house = 0; house < frontiers.length; house += 1) {
      for (let n = 0; n < CLAIM_RATE; n += 1) {
        if (claim(house, paint)) claimed += 1;
      }
    }

    return claimed;
  }

  function nearestSpawnDistance(index: number, spawns: number[]): number {
    let nearest = Number.POSITIVE_INFINITY;

    for (const spawn of spawns) {
      const dx = (index % cols) - (spawn % cols);
      const dy = ((index / cols) | 0) - ((spawn / cols) | 0);

      nearest = Math.min(nearest, dx * dx + dy * dy);
    }

    return nearest;
  }

  function pickSpawns(land: number[]): number[] {
    const spawns: number[] = [];

    for (let house = 0; house < frontiers.length; house += 1) {
      let best = land[(random() * land.length) | 0];
      let bestScore = -1;

      for (let attempt = 0; attempt < SPAWN_ATTEMPTS; attempt += 1) {
        const candidate = land[(random() * land.length) | 0];
        const score =
          spawns.length === 0
            ? random()
            : nearestSpawnDistance(candidate, spawns);

        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }

      spawns.push(best);
    }

    return spawns;
  }

  /**
   * Three octaves of value noise minus an elliptical falloff. The finest
   * octave is what breaks the coast into bays and throws a few islands off it,
   * and the falloff is what keeps the sea at the edges of the section.
   */
  function fillTerrain(distance: Float32Array): number {
    const continents = createNoise(random, 3);
    const coast = createNoise(random, 8);
    const grain = createNoise(random, 19);
    let land = 0;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const u = (x + 0.5) / cols;
        const v = (y + 0.5) / rows;
        const dx = (u - 0.5) * 1.45;
        const dy = (v - 0.5) * 1.8;
        const falloff = dx * dx + dy * dy;
        const height =
          continents(u, v) * 0.54 +
          coast(u, v) * 0.29 +
          grain(u, v) * 0.17 -
          falloff * 0.5;
        const index = y * cols + x;

        distance[index] = falloff;

        if (height > 0.34) {
          owner[index] = UNCLAIMED;
          land += 1;
        } else {
          owner[index] = SEA;
        }
      }
    }

    return land;
  }

  function build(nextSeed: number) {
    const total = cols * rows;

    currentSeed = nextSeed;
    random = createRandom(nextSeed);
    owner = new Int8Array(total);

    const distance = new Float32Array(total);
    let land = 0;

    for (let attempt = 0; attempt < MAX_REROLLS; attempt += 1) {
      land = fillTerrain(distance);

      const ratio = land / total;

      if (ratio >= MIN_LAND && ratio <= MAX_LAND) break;
    }

    const landCells: number[] = [];

    for (let index = 0; index < total; index += 1) {
      if (owner[index] === UNCLAIMED) landCells.push(index);
    }

    // The Collapse unravels the world from the edges inwards.
    collapseOrder = landCells.slice().sort((a, b) => distance[b] - distance[a]);
    collapseCursor = 0;

    for (const frontier of frontiers) frontier.length = 0;
    glowing.length = 0;

    if (landCells.length > frontiers.length) {
      for (const [house, index] of pickSpawns(landCells).entries()) {
        owner[index] = house;
        offerNeighbours(index, house);
      }
    }

    phase = "conquest";
    phaseTicks = 0;

    paintAll();
  }

  return {
    resize(width, height, dpr) {
      const pixelWidth = Math.max(1, Math.round(width * dpr));
      const pixelHeight = Math.max(1, Math.round(height * dpr));

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      gutter = Math.max(1, Math.round(dpr));
      palette = readPalette(canvas);

      const grid = gridFor(width, height);

      cols = grid.cols;
      rows = grid.rows;

      build(currentSeed);
    },

    tick() {
      // Last tick's advancing edge cools down into the house colour.
      for (const index of glowing)
        paintCell(index, palette.houses[owner[index]].fill);
      glowing.length = 0;

      if (phase === "conquest") {
        if (advance(true) === 0) {
          phase = "hold";
          phaseTicks = 0;
        }

        return;
      }

      if (phase === "hold") {
        phaseTicks += 1;

        if (phaseTicks >= HOLD_TICKS) {
          phase = "collapse";
          phaseTicks = 0;
        }

        return;
      }

      if (phase === "collapse") {
        for (
          let n = 0;
          n < COLLAPSE_RATE && collapseCursor < collapseOrder.length;
          n += 1
        ) {
          clearCell(collapseOrder[collapseCursor]);
          collapseCursor += 1;
        }

        if (collapseCursor >= collapseOrder.length) {
          phase = "dawn";
          phaseTicks = 0;
        }

        return;
      }

      phaseTicks += 1;

      if (phaseTicks >= DAWN_TICKS) build(currentSeed + 1);
    },

    settle() {
      let guard = owner.length;

      while (phase === "conquest" && guard > 0) {
        if (advance(false) === 0) phase = "hold";
        guard -= 1;
      }

      glowing.length = 0;
      paintAll();
    },
  };
}
