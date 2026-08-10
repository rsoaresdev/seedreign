/**
 * Seeded randomness shared by everything the game draws.
 *
 * One integer in, the same world out, on the server and in the browser alike.
 * Nothing here may reach for `Math.random`, the clock or the DOM: a world is
 * built once while rendering and again on hydration, and the two have to agree
 * down to the last tile.
 */

/** xorshift32. Integer maths and one seed in, so a world is reproducible. */
export function createRandom(seed: number): () => number {
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

/**
 * Tiling value noise on a `size` by `size` lattice, sampled with `u` and `v`
 * in [0, 1).
 *
 * Smoothstep between lattice points is what keeps a coastline rounded instead
 * of faceted, and the wrap means a caller can sample slightly past the edge
 * without falling off the lattice.
 */
export function createNoise2d(
  random: () => number,
  size: number
): (u: number, v: number) => number {
  const lattice = new Float32Array(size * size);

  for (let i = 0; i < lattice.length; i += 1) lattice[i] = random();

  return (u, v) => {
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
