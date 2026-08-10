/**
 * Shared vocabulary for the match simulation.
 *
 * Everything the engine, the AI, the renderer and the HUD agree on lives here,
 * so none of them have to import each other. The simulation itself never
 * touches the DOM: it is plain data advanced by pure-ish functions at a fixed
 * tick, which is what lets the same match replay identically from a seed.
 */

import type { OrderKey } from "@/components/game/cards/orders";
import type { World } from "@/components/game/world";

/** Four sim ticks per second. Every duration below is counted in ticks. */
export const TICKS_PER_SECOND = 4;

/** Index 0 is the player, the same as everywhere else in the codebase. */
export const PLAYER = 0;

export type ConditionId = "conquest" | "domination" | "relicHunt" | "blitz";

export type DecreeId =
  | "twinRelics"
  | "longNight"
  | "swiftOrders"
  | "guardedSpoils";

export type ModeId = "daily" | "blitz" | "weekly" | "skirmish" | "forge";

export type CommanderId = "warden" | "reaver" | "tidecaller";

export type RelicId =
  | "emberHeart"
  | "bulwarkSigil"
  | "tideCharm"
  | "huntersMark"
  | "warBanner"
  | "stillRoot";

export type PulseId = "flood" | "vault" | "bounty" | "surge";

/** Bot strength. Sprout learns, Warlord fights, Sovereign punishes. */
export type Difficulty = 0 | 1 | 2;

export type MatchConfig = {
  seed: number;
  cols: number;
  rows: number;
  /** Total match length in sim ticks. */
  duration: number;
  condition: ConditionId;
  decree: DecreeId | null;
  mode: ModeId;
  difficulty: Difficulty;
  commander: CommanderId;
  /** The three drafted orders, in hand order. */
  hand: readonly OrderKey[];
};

export type HouseState = {
  troops: number;
  alive: boolean;
  /** Land tiles currently held. Kept incrementally, the hot number in the UI. */
  territory: number;
  /** Highest land share ever held, 0..1. Feeds the score. */
  peakShare: number;
  /** Spawn tile, where the banner stands until the ground itself dies. */
  capital: string | null;
  spoils: number;
  chestsTaken: number;
  campsCleared: number;
  eliminations: number;
  tilesTaken: number;
  tilesLost: number;
  /** Ticks spent holding the wonder. Slow, heavy score. */
  wonderTicks: number;
};

export type Front = {
  id: number;
  house: number;
  targetKey: string;
  /** Troops committed and not yet spent. The front dies when this runs dry. */
  strength: number;
  /** Non-owned land tiles the front can push into next. */
  frontier: string[];
  captured: number;
  /** Whether the target has been reached, after which the front winds down. */
  arrived: boolean;
  /** A naval front starts on the far shore instead of growing from a border. */
  naval: boolean;
};

export type HandSlot = {
  order: OrderKey;
  charges: number;
  /** Tick the slot becomes usable again. */
  readyAt: number;
};

export type PulseInstance = {
  id: PulseId;
  /** Tick the pulse fires. */
  at: number;
  /** Tick its effect wears off, for timed pulses. */
  until: number;
  fired: boolean;
  /** House index carrying the bounty when the pulse is a bounty. */
  markedHouse: number;
};

/**
 * One entry in the match's outward-facing event feed. The renderer drains
 * these by serial to spawn particles and banners without the engine ever
 * knowing a canvas exists.
 */
export type MatchEvent = {
  serial: number;
  tick: number;
  type:
    | "claim"
    | "loss"
    | "chest"
    | "camp"
    | "forge"
    | "wonder"
    | "pulse"
    | "collapse"
    | "elimination"
    | "order"
    | "ability"
    | "relic"
    | "flood"
    | "restore";
  /** Tile the event happened on, when it has a place at all. */
  key: string | null;
  house: number;
  /** Pulse id, order key, relic id: whatever names the event's subject. */
  detail: string | null;
};

export type EndReason = "dusk" | "domination" | "blitz" | "playerDead";

export type MatchState = {
  config: MatchConfig;
  world: World;
  rng: () => number;
  tick: number;
  over: boolean;
  endReason: EndReason | null;

  owners: Map<string, number>;
  houses: HouseState[];
  fronts: Front[];
  nextFrontId: number;

  /** Player attack share, 0..100. Read at the moment a front is committed. */
  attack: number;

  hand: HandSlot[];
  abilityCharges: number;
  abilityReadyAt: number;
  /** Tick a warpath style ability buff expires. */
  surgeUntil: number;

  /** Wall expiry tick per tile, any house. Owner checked at defence time. */
  walls: Map<string, number>;
  /** Garrison strength still standing on neutral camp tiles. */
  camps: Map<string, number>;
  /** Tiles still carrying an unopened chest. */
  chests: Set<string>;
  /** Tile the forge stands on while its relic is unclaimed. */
  forgeKey: string | null;
  wonderKey: string | null;
  /** Which house holds the wonder, or -1. */
  wonderHolder: number;

  /** Player relics, and the pending choose-one-of-three offer. */
  relics: RelicId[];
  relicOffer: RelicId[] | null;

  pulses: PulseInstance[];
  /** Tiles drowned by a flood, mapped to the tick they resurface. */
  flooded: Map<string, number>;
  /** Every tile a Pulse ever touched. The share grid reads this at the end. */
  pulseMarks: Set<string>;

  /** Ground the Collapse has eaten. Never comes back. */
  collapsed: Set<string>;
  collapseIndex: number;
  /** Land tiles still standing. */
  landAlive: number;

  events: MatchEvent[];
  nextSerial: number;

  /** Sabotage debuff expiry per house. */
  sabotagedUntil: number[];
};

export type MatchInput =
  | { type: "attack"; key: string }
  | { type: "slider"; value: number }
  | { type: "order"; slot: number; key: string }
  | { type: "ability"; key: string }
  | { type: "relic"; relic: RelicId };

/** Seconds left on the dusk clock, for the HUD. */
export function secondsLeft(state: MatchState): number {
  return Math.max(
    0,
    Math.ceil((state.config.duration - state.tick) / TICKS_PER_SECOND)
  );
}

/** Match progress 0..1, which is also the height of the sun. */
export function duskProgress(state: MatchState): number {
  return Math.min(1, state.tick / state.config.duration);
}
