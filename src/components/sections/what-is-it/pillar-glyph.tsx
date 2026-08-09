import { cn } from "@/lib/utils";

/** The glyph is a small board, the same shape the game itself is played on. */
const SIZE = 4;

/** Milliseconds the wave takes to cross the board from first cell to last. */
const SPREAD = 1100;

export type GlyphPattern = "sow" | "claim" | "collapse" | "share";

/**
 * One letter per cell: `g` gold, `t` teal, `v` violet, `.` land nobody holds.
 * Written out as rows so the shape is readable at a glance.
 */
const TONES: Record<GlyphPattern, readonly string[]> = {
  sow: [".tt.", "tttt", "tttt", ".tt."],
  claim: ["gg..", "ggg.", "gggg", ".ggg"],
  collapse: ["....", ".vv.", ".vv.", "...."],
  share: ["gg.t", "ggtt", "gvvt", ".gvv"],
};

const TONE_CLASS: Record<string, string> = {
  g: "bg-seed-gold",
  t: "bg-seed-teal",
  v: "bg-seed-violet",
  ".": "bg-seed-line-strong",
};

/** When a cell lights up. Lower goes first, and the scale is per pattern. */
function orderFor(pattern: GlyphPattern, x: number, y: number): number {
  const fromCentre =
    Math.abs(x - (SIZE - 1) / 2) + Math.abs(y - (SIZE - 1) / 2);

  switch (pattern) {
    // Sown from the middle out, the way a world takes hold.
    case "sow":
      return fromCentre;
    // Taken from a corner, the way a border actually advances.
    case "claim":
      return x + y;
    // Eaten from the edges in, the way the Collapse closes the map.
    case "collapse":
      return -fromCentre;
    // Read like a page, because that is how the shared grid is read.
    default:
      return y * SIZE + x;
  }
}

function buildCells(pattern: GlyphPattern) {
  const rows = TONES[pattern];
  const cells: { id: string; tone: string; order: number }[] = [];

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      cells.push({
        id: `${x}-${y}`,
        tone: TONE_CLASS[rows[y][x]],
        order: orderFor(pattern, x, y),
      });
    }
  }

  // Normalised, so every pattern takes the same time to cross the board no
  // matter how its order happens to be numbered.
  const orders = cells.map((cell) => cell.order);
  const first = Math.min(...orders);
  const span = Math.max(...orders) - first || 1;

  return cells.map((cell) => ({
    id: cell.id,
    tone: cell.tone,
    delay: ((cell.order - first) / span) * SPREAD,
  }));
}

/**
 * The mini illustration on a pillar card: a board whose cells light up in the
 * order that pillar is about. Pure CSS, one `animation-delay` per cell, so it
 * costs no JavaScript and stops dead under prefers-reduced-motion.
 */
export function PillarGlyph({ pattern }: { pattern: GlyphPattern }) {
  return (
    <div
      aria-hidden="true"
      className="grid w-fit grid-cols-4 gap-0.75 rounded-lg border border-seed-line bg-seed-bg p-2"
    >
      {buildCells(pattern).map((cell) => (
        <span
          key={cell.id}
          style={{ animationDelay: `${cell.delay}ms` }}
          className={cn(
            "size-2.5 rounded-xs motion-safe:animate-cell-wave",
            cell.tone
          )}
        />
      ))}
    </div>
  );
}
