/**
 * Pointy-top hex geometry in axial coordinates.
 *
 * Every measurement is expressed against a circumradius the caller supplies,
 * so a world can be generated once in hex units and scaled by whatever
 * viewport ends up drawing it.
 */

export type Axial = { q: number; r: number };

/**
 * Neighbours in a fixed order: E, NE, NW, W, SW, SE.
 *
 * The territory layer emits one border edge per index, so this order and the
 * corner order below have to stay in step. Rotate one without the other and
 * every border lands on the wrong side of its tile.
 */
export const HEX_DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

const SQRT_3 = Math.sqrt(3);

/**
 * Unit corner offsets. The first sits at 30 degrees and the rest turn the way
 * `HEX_DIRECTIONS` turns, which is what makes corner `i` and corner `i + 1`
 * bound the edge shared with neighbour `i`.
 */
const CORNERS = Array.from({ length: 6 }, (_, index) => {
  const angle = ((30 - 60 * index) * Math.PI) / 180;

  return { x: Math.cos(angle), y: Math.sin(angle) };
});

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function hexCenter(
  q: number,
  r: number,
  size: number
): { x: number; y: number } {
  return { x: size * SQRT_3 * (q + r / 2), y: size * 1.5 * r };
}

export function hexCorners(
  cx: number,
  cy: number,
  size: number
): { x: number; y: number }[] {
  return CORNERS.map((corner) => ({
    x: cx + corner.x * size,
    y: cy + corner.y * size,
  }));
}

export function hexPath(cx: number, cy: number, size: number): string {
  const corners = hexCorners(cx, cy, size);
  let path = `M ${round(corners[0].x)} ${round(corners[0].y)}`;

  for (let index = 1; index < corners.length; index += 1) {
    path += ` L ${round(corners[index].x)} ${round(corners[index].y)}`;
  }

  return `${path} Z`;
}

export function hexDistance(
  aq: number,
  ar: number,
  bq: number,
  br: number
): number {
  const dq = aq - bq;
  const dr = ar - br;

  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}
