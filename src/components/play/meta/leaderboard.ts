/**
 * The daily board. The rivals on it are ghosts: deterministic Seeded grown
 * from the world's own seed, so everyone sees the same names posting the same
 * scores, and a run can be measured against them without a server round trip.
 */

import { createRandom } from "@/lib/rng";

const FIRST = [
  "Ash",
  "Bryn",
  "Cinder",
  "Dawn",
  "Ember",
  "Fen",
  "Gale",
  "Hal",
  "Iron",
  "Kes",
  "Lark",
  "Mor",
  "Night",
  "Oro",
  "Quill",
  "Rune",
  "Sable",
  "Thorn",
  "Vael",
  "Wren",
] as const;

const SECOND = [
  "born",
  "brook",
  "fall",
  "ford",
  "grim",
  "holt",
  "march",
  "mere",
  "reign",
  "strand",
  "vane",
  "weald",
  "wick",
  "wing",
] as const;

/** A slice of handles read as typed usernames rather than lore names. */
const HANDLE_TAILS = ["", "", "", "7", "99", "x", "_ii"] as const;

export type BoardRow = {
  rank: number;
  name: string;
  score: number;
  you: boolean;
};

export type BoardStanding = {
  rows: BoardRow[];
  rank: number;
  total: number;
  /** 1 is the very top. Rounded up, so the best real answer is "top 1%". */
  percentile: number;
};

/** How many Seeded took the field, grown a little as the world number climbs. */
export function seededCount(world: number): number {
  const random = createRandom((world * 977) | 0);

  return 9000 + Math.floor(random() * 7000);
}

function ghostName(random: () => number): string {
  const first = FIRST[(random() * FIRST.length) | 0];
  const second = SECOND[(random() * SECOND.length) | 0];
  const tail = HANDLE_TAILS[(random() * HANDLE_TAILS.length) | 0];
  const name = `${first}${second}${tail}`;

  return random() < 0.3 ? name.toLowerCase() : name;
}

/**
 * The visible top of the board: a hundred ghosts, best first. Scores follow a
 * decaying curve with local noise so the ladder reads competitive rather than
 * generated.
 */
export function ghostBoard(seed: number, count = 100): BoardRow[] {
  const random = createRandom(seed ^ 0x60a7);
  const rows: BoardRow[] = [];
  let score = 3300 + Math.floor(random() * 500);

  for (let rank = 1; rank <= count; rank += 1) {
    rows.push({ rank, name: ghostName(random), score, you: false });

    const step = 4 + Math.floor(random() * (rank < 10 ? 30 : 14));

    score = Math.max(300, score - step);
  }

  return rows;
}

/**
 * Where a score lands among the ghosts. The full field is far bigger than the
 * visible hundred; the tail below the board is modelled as a linear ramp down
 * to zero.
 */
export function placeOnBoard(
  seed: number,
  world: number,
  score: number
): BoardStanding {
  const ghosts = ghostBoard(seed);
  const total = seededCount(world);
  const floor = ghosts[ghosts.length - 1].score;

  let rank: number;

  if (score >= floor) {
    rank = ghosts.filter((row) => row.score > score).length + 1;
  } else {
    // Below the visible board: interpolate into the invisible tail.
    const tailShare = Math.max(0, Math.min(1, score / floor));

    rank =
      ghosts.length + Math.floor((1 - tailShare) * (total - ghosts.length)) + 1;
  }

  rank = Math.min(rank, total);

  const withYou: BoardRow[] = [
    ...ghosts.filter((row) => row.score > score),
    { rank, name: "", score, you: true },
    ...ghosts.filter((row) => row.score <= score),
  ].map((row, index) => ({ ...row, rank: index + 1 }));

  const percentile = Math.max(1, Math.ceil((rank / total) * 100));

  return { rows: withYou.slice(0, 100), rank, total, percentile };
}
