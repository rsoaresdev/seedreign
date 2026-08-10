/**
 * The finished world the landing shows off, and the standings it landed in.
 *
 * Numbers and names are data rather than copy, so they live here instead of in
 * the message files: they read the same in every language.
 */
export const RESULT = {
  world: 142,
  territory: 87,
  time: "12:04",
  percentile: 4,
  /**
   * The shape of the day, one letter per cell: `g` ground you held, `t` a
   * rival's, `v` where a Pulse landed, `x` what the Collapse took.
   */
  rows: [
    "xxggtx",
    "xgggtt",
    "vgggtt",
    "gggvgt",
    "ggggvt",
    "xgggxx",
  ] as readonly string[],
} as const;

/**
 * Today's top of the board. The row flagged `you` is the reader's, and takes
 * its label from the messages rather than from `name`.
 */
export const STANDINGS = [
  { id: "ashvane", name: "Ashvane", score: 2940, you: false },
  { id: "kestrel", name: "kestrel", score: 2712, you: false },
  { id: "you", name: "", score: 2655, you: true },
  { id: "rowan", name: "Rowan", score: 2488, you: false },
] as const satisfies readonly {
  id: string;
  name: string;
  score: number;
  you: boolean;
}[];

/** How many players have taken today's world so far. */
export const SEEDED_TODAY = 12_481;

/** How far into the current Era the board above is. */
export const SEASON_DAY = 12;

/** The ladder, bottom to top, and where the board above currently sits. */
export const TIERS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Legend",
] as const;

/** Index into `TIERS`. */
export const CURRENT_TIER = 2;

/** The grid as it lands in a group chat. */
const EMOJI: Record<string, string> = {
  g: "🟨",
  t: "🟩",
  v: "🟪",
  x: "⬛",
  ".": "⬜",
};

/** Serialises the board into the plain text that gets pasted into a chat. */
export function gridText(rows: readonly string[]): string {
  return rows
    .map((row) => Array.from(row, (cell) => EMOJI[cell]).join(""))
    .join("\n");
}
