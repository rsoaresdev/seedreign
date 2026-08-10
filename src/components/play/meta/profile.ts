/**
 * The Seeded's ledger: currencies, wardrobe, streak, history, Era standing.
 *
 * Worlds die at dusk; this file is what survives them. It lives in
 * localStorage under a versioned key and every mutation goes through a helper
 * that returns a fresh object, so React state and storage never disagree.
 */

import type { CommanderId } from "../sim/types";
import { freeSkinOf, skinById } from "./commanders";

const STORAGE_KEY = "seedreign.profile.v1";

export type DayRecord = {
  world: number;
  score: number;
  placement: number;
  percentile: number;
  victory: boolean;
  /** The spoiler-free grid, one string per row. */
  grid: string[];
};

export type EraRecap = {
  eraId: string;
  points: number;
  /** Index into the tier ladder, bronze first. */
  tier: number;
  gems: number;
};

export type Profile = {
  version: 1;
  shards: number;
  gems: number;
  totalShardsEarned: number;
  ownedSkins: string[];
  equipped: Record<CommanderId, string>;
  commander: CommanderId;
  streak: { count: number; lastWorld: number };
  /** Today's official run, if the daily was already taken. */
  daily: DayRecord | null;
  history: DayRecord[];
  matchesPlayed: number;
  bestScore: number;
  era: { id: string; points: number };
  /** Shown once in the hub after an Era closes, then dismissed. */
  eraRecap: EraRecap | null;
  /** Highest Weekly heat cleared this week, and which week it was. */
  weekly: { week: number; heatCleared: number };
  /**
   * World number whose official daily attempt has been taken, finished or
   * not. Consumed the moment the match starts, so abandoning is not a reroll.
   */
  dailyAttemptWorld: number | null;
  /** Casual runs taken today, for the diminishing shard faucet. */
  casualRuns: { day: number; count: number };
};

export function defaultProfile(eraId: string): Profile {
  return {
    version: 1,
    shards: 120,
    gems: 0,
    totalShardsEarned: 120,
    ownedSkins: [
      freeSkinOf("warden").id,
      freeSkinOf("reaver").id,
      freeSkinOf("tidecaller").id,
    ],
    equipped: {
      warden: freeSkinOf("warden").id,
      reaver: freeSkinOf("reaver").id,
      tidecaller: freeSkinOf("tidecaller").id,
    },
    commander: "warden",
    streak: { count: 0, lastWorld: 0 },
    daily: null,
    history: [],
    matchesPlayed: 0,
    bestScore: 0,
    era: { id: eraId, points: 0 },
    eraRecap: null,
    weekly: { week: 0, heatCleared: 0 },
    dailyAttemptWorld: null,
    casualRuns: { day: 0, count: 0 },
  };
}

export function loadProfile(eraId: string): Profile {
  if (typeof window === "undefined") return defaultProfile(eraId);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return defaultProfile(eraId);

    const parsed = JSON.parse(raw) as Partial<Profile> | null;

    // Anything the app dereferences without a guard has to hold its shape;
    // a torn or foreign payload falls back to a fresh ledger.
    if (
      parsed?.version !== 1 ||
      typeof parsed.shards !== "number" ||
      typeof parsed.era?.id !== "string" ||
      typeof parsed.era.points !== "number" ||
      typeof parsed.streak?.count !== "number" ||
      typeof parsed.weekly?.week !== "number" ||
      !Array.isArray(parsed.ownedSkins) ||
      typeof parsed.equipped !== "object" ||
      parsed.equipped === null
    ) {
      return defaultProfile(eraId);
    }

    // Fields added after a profile was written fill in from the defaults.
    return { ...defaultProfile(eraId), ...(parsed as Profile) };
  } catch {
    return defaultProfile(eraId);
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or blocked. The run still plays; it just will not persist.
  }
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do; the next load falls back to defaults anyway.
  }
}

export function ownsSkin(profile: Profile, skinId: string): boolean {
  return profile.ownedSkins.includes(skinId);
}

/** Buy a skin outright. Returns the same profile when it cannot be afforded. */
export function buySkin(profile: Profile, skinId: string): Profile {
  const skin = skinById(skinId);

  if (!skin || ownsSkin(profile, skinId) || skin.tier === "free") {
    return profile;
  }

  if (skin.tier === "shards") {
    if (profile.shards < skin.cost) return profile;

    return {
      ...profile,
      shards: profile.shards - skin.cost,
      ownedSkins: [...profile.ownedSkins, skinId],
    };
  }

  if (profile.gems < skin.cost) return profile;

  return {
    ...profile,
    gems: profile.gems - skin.cost,
    ownedSkins: [...profile.ownedSkins, skinId],
  };
}

export function equipSkin(profile: Profile, skinId: string): Profile {
  const skin = skinById(skinId);

  if (!skin || !ownsSkin(profile, skinId)) return profile;

  return {
    ...profile,
    commander: skin.commander,
    equipped: { ...profile.equipped, [skin.commander]: skinId },
  };
}

export function chooseCommander(
  profile: Profile,
  commander: CommanderId
): Profile {
  return { ...profile, commander };
}

/**
 * Fold a finished official daily into the ledger: streak, history, best.
 * The streak survives only an unbroken chain of consecutive worlds.
 */
export function recordDaily(profile: Profile, record: DayRecord): Profile {
  const chained = profile.streak.lastWorld === record.world - 1;
  const streak = {
    count: chained ? profile.streak.count + 1 : 1,
    lastWorld: record.world,
  };

  return {
    ...profile,
    daily: record,
    streak,
    history: [record, ...profile.history].slice(0, 30),
    bestScore: Math.max(profile.bestScore, record.score),
  };
}
