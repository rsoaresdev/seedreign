/**
 * The Sowing: what today's world is, for everyone at once.
 *
 * Everything rotates from the world number, which is just the count of UTC
 * days since the first Sowing. The same number seeds the map, deals the draft,
 * picks the condition and the Decree and assigns the commander, so two players
 * on opposite sides of the planet stand in identical worlds.
 */

import type { OrderKey } from "@/components/game/cards/orders";
import { createRandom } from "@/lib/rng";

import type {
  CommanderId,
  ConditionId,
  DecreeId,
  Difficulty,
  MatchConfig,
  ModeId,
} from "../sim/types";
import { TICKS_PER_SECOND } from "../sim/types";

/** The first Sowing, midnight UTC. World 1 was born this day. */
const EPOCH_UTC = Date.UTC(2026, 0, 1);

const DAY_MS = 86_400_000;

/** Conditions the daily rotates through. */
const CONDITIONS: readonly ConditionId[] = [
  "conquest",
  "domination",
  "relicHunt",
  "blitz",
];

const DECREES: readonly DecreeId[] = [
  "twinRelics",
  "longNight",
  "swiftOrders",
  "guardedSpoils",
];

const COMMANDER_ROTATION: readonly CommanderId[] = [
  "warden",
  "reaver",
  "tidecaller",
];

/** Every order in the game. The daily deals six of these. */
const ORDER_POOL: readonly OrderKey[] = [
  "expand",
  "blitz",
  "fortify",
  "landing",
  "sabotage",
  "storm",
  "nuke",
];

/** Daily worlds are the big stage. */
const DAILY_COLS = 20;
const DAILY_ROWS = 26;
const DAILY_SECONDS = 360;

const BLITZ_COLS = 14;
const BLITZ_ROWS = 18;
const BLITZ_SECONDS = 150;

const WEEKLY_SECONDS = 300;

export type DailyBrief = {
  world: number;
  seed: number;
  condition: ConditionId;
  decree: DecreeId;
  commander: CommanderId;
  /** Six orders offered; the player keeps three. */
  offer: OrderKey[];
};

/** Integer hash of a world number, well spread for the PRNG. */
function seedOf(world: number): number {
  let hash = world | 0;

  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;

  return hash | 0;
}

export function worldNumberAt(now: number): number {
  return Math.floor((now - EPOCH_UTC) / DAY_MS) + 1;
}

export function currentWorldNumber(): number {
  return worldNumberAt(Date.now());
}

/** Milliseconds until the next Sowing, for the dusk countdown in the hub. */
export function msUntilNextWorld(now: number): number {
  const into = (now - EPOCH_UTC) % DAY_MS;

  return DAY_MS - into;
}

export function dailyBrief(world: number): DailyBrief {
  const random = createRandom(seedOf(world));
  const condition = CONDITIONS[(random() * CONDITIONS.length) | 0];
  const decree = DECREES[(random() * DECREES.length) | 0];
  const commander = COMMANDER_ROTATION[world % COMMANDER_ROTATION.length];

  const pool = [...ORDER_POOL];
  const offer: OrderKey[] = [];

  while (offer.length < 6 && pool.length > 0) {
    offer.push(pool.splice((random() * pool.length) | 0, 1)[0]);
  }

  return { world, seed: seedOf(world), condition, decree, commander, offer };
}

/** The ISO-like week number the Weekly rotates on. */
export function weeklyNumberAt(now: number): number {
  return Math.floor((now - EPOCH_UTC) / (DAY_MS * 7)) + 1;
}

export type WeeklyBrief = {
  week: number;
  seed: number;
  decree: DecreeId;
  offer: OrderKey[];
};

export function weeklyBrief(week: number): WeeklyBrief {
  // Salted out of the daily seed space, so no weekly is ever a preview of a
  // future world.
  const seed = seedOf(week * 7 + 3) ^ 0x7ee45eed;
  const random = createRandom(seed);
  const decree = DECREES[(random() * DECREES.length) | 0];
  const pool = [...ORDER_POOL];
  const offer: OrderKey[] = [];

  while (offer.length < 6 && pool.length > 0) {
    offer.push(pool.splice((random() * pool.length) | 0, 1)[0]);
  }

  return { week, seed, decree, offer };
}

/**
 * Whether a seed would reproduce an official competitive map: today's world,
 * tomorrow's, or this week's event. The Forge refuses these, or scouting the
 * daily would be one code away.
 */
export function isOfficialSeed(seed: number, now: number): boolean {
  const world = worldNumberAt(now);
  const weekly = weeklyBrief(weeklyNumberAt(now)).seed;

  return (
    seed === seedOf(world) || seed === seedOf(world + 1) || seed === weekly
  );
}

export function dailyConfig(
  brief: DailyBrief,
  hand: readonly OrderKey[]
): MatchConfig {
  return {
    seed: brief.seed,
    cols: DAILY_COLS,
    rows: DAILY_ROWS,
    duration:
      (brief.decree === "longNight"
        ? Math.round(DAILY_SECONDS * 1.2)
        : DAILY_SECONDS) * TICKS_PER_SECOND,
    condition: brief.condition,
    decree: brief.decree,
    mode: "daily",
    difficulty: 1,
    commander: brief.commander,
    hand,
  };
}

export function blitzConfig(
  seed: number,
  commander: CommanderId,
  hand: readonly OrderKey[]
): MatchConfig {
  return {
    seed,
    cols: BLITZ_COLS,
    rows: BLITZ_ROWS,
    duration: BLITZ_SECONDS * TICKS_PER_SECOND,
    condition: "blitz",
    decree: null,
    mode: "blitz",
    difficulty: 1,
    commander,
    hand,
  };
}

export function weeklyConfig(
  brief: WeeklyBrief,
  heat: Difficulty,
  commander: CommanderId,
  hand: readonly OrderKey[]
): MatchConfig {
  return {
    seed: brief.seed + heat,
    cols: DAILY_COLS,
    rows: DAILY_ROWS,
    duration: WEEKLY_SECONDS * TICKS_PER_SECOND,
    condition: "conquest",
    decree: brief.decree,
    mode: "weekly",
    difficulty: heat,
    commander,
    hand,
  };
}

export type SkirmishSize = "small" | "large";

export function skirmishConfig(
  seed: number,
  size: SkirmishSize,
  difficulty: Difficulty,
  condition: ConditionId,
  commander: CommanderId,
  hand: readonly OrderKey[],
  mode: ModeId = "skirmish"
): MatchConfig {
  return {
    seed,
    cols: size === "small" ? BLITZ_COLS : DAILY_COLS,
    rows: size === "small" ? BLITZ_ROWS : DAILY_ROWS,
    duration: (size === "small" ? 240 : DAILY_SECONDS) * TICKS_PER_SECOND,
    condition,
    decree: null,
    mode,
    difficulty,
    commander,
    hand,
  };
}

/** A random offer for the free modes, dealt from a throwaway seed. */
export function casualOffer(seed: number): OrderKey[] {
  const random = createRandom(seed);
  const pool = [...ORDER_POOL];
  const offer: OrderKey[] = [];

  while (offer.length < 6 && pool.length > 0) {
    offer.push(pool.splice((random() * pool.length) | 0, 1)[0]);
  }

  return offer;
}

/** Forge codes are just seeds spelled in a friendlier alphabet. */
export function forgeCode(seed: number): string {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let value = seed >>> 0;
  let code = "";

  for (let index = 0; index < 7; index += 1) {
    code = alphabet[value % alphabet.length] + code;
    value = Math.floor(value / alphabet.length);
  }

  return code;
}

export function parseForgeCode(code: string): number | null {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  const cleaned = code.trim().toUpperCase();

  if (cleaned.length === 0 || cleaned.length > 7) return null;

  let value = 0;

  for (const char of cleaned) {
    const digit = alphabet.indexOf(char);

    if (digit < 0) return null;

    value = value * alphabet.length + digit;
  }

  return value | 0;
}
