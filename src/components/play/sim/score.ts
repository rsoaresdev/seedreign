/**
 * The multi-dimensional score. Territory pays, but so do speed, spoils,
 * wonders and style, so there is always more than one road to the top of the
 * board. Rivals are scored with the same rule, which is what makes the final
 * standings honest.
 */

import { type ConditionId, type MatchState, PLAYER } from "./types";

export type MedalId =
  | "unbroken"
  | "avalanche"
  | "warlord"
  | "seeker"
  | "survivor";

export type HouseScore = {
  house: number;
  score: number;
  share: number;
  alive: boolean;
};

export type MatchOutcome = {
  /** Standings sorted best first. */
  standings: HouseScore[];
  /** The player's placement, 1 to 4. */
  placement: number;
  playerScore: number;
  playerShare: number;
  victory: boolean;
  medals: MedalId[];
  condition: ConditionId;
};

const TERRITORY_WEIGHT = 2400;
const PEAK_WEIGHT = 500;
const SPOILS_WEIGHT = 55;
const CAMP_WEIGHT = 70;
const ELIMINATION_WEIGHT = 320;
const WONDER_TICK_WEIGHT = 0.5;
const RELIC_WEIGHT = 130;

/** Winning the day's condition is the single biggest prize on the sheet. */
const CONDITION_WEIGHT = 700;
const PLACEMENT_WEIGHT = [340, 170, 60, 0] as const;

function conditionRank(state: MatchState, house: number): number {
  const entry = state.houses[house];

  switch (state.config.condition) {
    case "relicHunt":
      return entry.spoils;
    case "domination":
      return entry.eliminations * 10 + (entry.alive ? 5 : 0);
    default:
      return entry.territory;
  }
}

function houseScore(
  state: MatchState,
  house: number,
  placement: number
): number {
  const entry = state.houses[house];
  const share = state.landAlive > 0 ? entry.territory / state.landAlive : 0;

  let score =
    share * TERRITORY_WEIGHT +
    entry.peakShare * PEAK_WEIGHT +
    entry.spoils * SPOILS_WEIGHT +
    entry.campsCleared * CAMP_WEIGHT +
    entry.eliminations * ELIMINATION_WEIGHT +
    entry.wonderTicks * WONDER_TICK_WEIGHT;

  if (house === PLAYER) score += state.relics.length * RELIC_WEIGHT;
  if (placement === 0) score += CONDITION_WEIGHT;

  score += PLACEMENT_WEIGHT[placement] ?? 0;

  if (!entry.alive) score *= 0.45;

  return Math.round(score);
}

export function scoreMatch(state: MatchState): MatchOutcome {
  const order = state.houses
    .map((_, house) => house)
    .sort((a, b) => conditionRank(state, b) - conditionRank(state, a));

  const standings: HouseScore[] = order.map((house, index) => ({
    house,
    score: houseScore(state, house, index),
    share:
      state.landAlive > 0 ? state.houses[house].territory / state.landAlive : 0,
    alive: state.houses[house].alive,
  }));

  standings.sort((a, b) => b.score - a.score);

  const placement = standings.findIndex((entry) => entry.house === PLAYER) + 1;
  const player = state.houses[PLAYER];
  const medals: MedalId[] = [];

  if (player.alive && player.tilesLost === 0) medals.push("unbroken");
  if (player.tilesTaken >= 90) medals.push("avalanche");
  if (player.eliminations >= 2) medals.push("warlord");
  if (player.chestsTaken >= 4 || state.relics.length >= 2)
    medals.push("seeker");
  if (player.alive && state.endReason === "dusk") medals.push("survivor");

  const playerRow = standings[placement - 1];
  const medalBonus = medals.length * 90;

  playerRow.score += medalBonus;
  standings.sort((a, b) => b.score - a.score);

  const finalPlacement =
    standings.findIndex((entry) => entry.house === PLAYER) + 1;

  return {
    standings,
    placement: finalPlacement,
    playerScore: playerRow.score,
    playerShare: playerRow.share,
    victory: finalPlacement === 1 && player.alive,
    medals,
    condition: state.config.condition,
  };
}
