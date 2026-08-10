/**
 * Shards: the soft currency, earned only by playing. The faucets live here so
 * every screen pays the same way. Gems never appear in this file's math; they
 * come from Era payouts, and one day from the store.
 */

import type { ModeId } from "../sim/types";

export type ShardBreakdown = {
  base: number;
  score: number;
  placement: number;
  firstOfDay: number;
  streak: number;
  total: number;
};

/** What just showing up is worth, per mode. */
const MODE_BASE: Record<ModeId, number> = {
  daily: 40,
  weekly: 30,
  blitz: 15,
  skirmish: 10,
  forge: 10,
};

const PLACEMENT_BONUS = [60, 35, 15, 5] as const;

/** Diminishing returns: score pays, but grinding one mode all day does not. */
const SCORE_DIVISOR = 150;
const SCORE_CAP = 30;

/** Payout multiplier by casual runs already taken today. */
const CASUAL_DECAY = [1, 1, 0.75, 0.5, 0.35, 0.25] as const;

export function shardReward(
  mode: ModeId,
  score: number,
  placement: number,
  firstDailyOfDay: boolean,
  streak: number,
  casualRunsToday = 0
): ShardBreakdown {
  const ranked = mode === "daily" || mode === "weekly";
  const decay = ranked
    ? 1
    : (CASUAL_DECAY[Math.min(casualRunsToday, CASUAL_DECAY.length - 1)] ?? 1);
  const base = Math.round(MODE_BASE[mode] * decay);
  const fromScore = Math.round(
    Math.min(SCORE_CAP, Math.floor(score / SCORE_DIVISOR)) * decay
  );
  const fromPlacement = Math.round(
    (PLACEMENT_BONUS[placement - 1] ?? 0) * decay
  );
  const firstOfDay = firstDailyOfDay ? 50 : 0;
  const fromStreak = firstDailyOfDay ? Math.min(50, streak * 5) : 0;

  return {
    base,
    score: fromScore,
    placement: fromPlacement,
    firstOfDay,
    streak: fromStreak,
    total: base + fromScore + fromPlacement + firstOfDay + fromStreak,
  };
}

/** Weekly heat pays once per level per week, on top of the match shards. */
export function weeklyHeatBonus(heat: number): number {
  return [80, 140, 220][heat] ?? 0;
}
