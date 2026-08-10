/**
 * The rival houses. Three brains, one per personality, sharing a target list.
 *
 * A bot looks at the map the way a decent player does: open land first, then
 * spoils, then whoever is weakest along its border, and the centre of the
 * world once the Collapse starts eating the rim. Difficulty buys sharper
 * cadence and better aim, never information the player lacks.
 */

import { hexDistance } from "@/components/game/hex";
import type { Tile } from "@/components/game/world";

import { canSail, isAlive, neighbourKeys, startFront } from "./engine";
import { type MatchState, PLAYER } from "./types";

/** Ticks between decisions, by difficulty. */
const CADENCE = [7, 5, 4] as const;

/** Attack share a bot commits, by personality, before situation nudges it. */
const COMMIT = [0.55, 0.68, 0.5] as const;

/** Personality per rival house index (1, 2, 3). */
type Personality = "balanced" | "raider" | "hoarder";

const PERSONALITY: Record<number, Personality> = {
  1: "balanced",
  2: "hoarder",
  3: "raider",
};

type Candidate = { key: string; value: number };

function bordersHouse(state: MatchState, key: string, house: number): boolean {
  for (const next of neighbourKeys(state.world, key)) {
    if (state.owners.get(next) === house) return true;
  }

  return false;
}

/** Centre of the surviving world, where everyone must go at dusk. */
function coreTile(state: MatchState): Tile | null {
  const order = state.world.collapseOrder;

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const tile = state.world.byKey.get(order[index]);

    if (tile && isAlive(state, tile.key)) return tile;
  }

  return null;
}

function weakestRival(state: MatchState, house: number): number {
  let weakest = -1;
  let lowest = Number.POSITIVE_INFINITY;

  for (let other = 0; other < state.houses.length; other += 1) {
    if (other === house || !state.houses[other].alive) continue;

    const heft = state.houses[other].troops + state.houses[other].territory * 2;

    if (heft < lowest) {
      lowest = heft;
      weakest = other;
    }
  }

  return weakest;
}

function gatherCandidates(state: MatchState, house: number): Candidate[] {
  const me = state.houses[house];
  const personality = PERSONALITY[house] ?? "balanced";
  const collapseOn = state.tick >= state.config.duration * 0.7;
  const core = collapseOn ? coreTile(state) : null;
  const bounty = state.pulses.find(
    (pulse) => pulse.id === "bounty" && pulse.fired && pulse.until > state.tick
  );
  const prey = weakestRival(state, house);
  const sailor = canSail(state, house);
  const candidates: Candidate[] = [];

  let leader = -1;
  let leaderShare = 0;

  for (let other = 0; other < state.houses.length; other += 1) {
    const share =
      state.landAlive > 0 ? state.houses[other].territory / state.landAlive : 0;

    if (other !== house && share > leaderShare) {
      leader = other;
      leaderShare = share;
    }
  }

  const progress = state.tick / state.config.duration;

  for (const tile of state.world.tiles) {
    if (!isAlive(state, tile.key)) continue;

    const holder = state.owners.get(tile.key);

    if (holder === house) continue;

    const touching = bordersHouse(state, tile.key, house);

    if (!touching && !sailor) continue;

    let value = 0;

    if (holder === undefined) {
      value += 3;

      if (state.camps.has(tile.key)) {
        // A camp is worth clearing only with an army to spare.
        value += me.troops > 80 ? 4 : -6;
      }
    } else if (progress < 0.18) {
      // The opening belongs to open land. Nobody worth playing against
      // knifes a neighbour before the world has even settled.
      value -= 6;
    } else {
      const rival = state.houses[holder];
      const density = rival.territory > 0 ? rival.troops / rival.territory : 99;

      value += 2 - Math.min(4, density);

      if (holder === prey) value += 2.5;
      if (bounty && holder === bounty.markedHouse) value += 4;
      if (holder === PLAYER) value += state.config.difficulty * 0.9;
      if (personality === "raider") value += 1.5;

      // Everyone turns on a runaway leader. Nobody likes an empire.
      if (holder === leader && leaderShare > 0.35) {
        value += (leaderShare - 0.35) * 14;
      }
    }

    if (state.chests.has(tile.key)) {
      value += personality === "hoarder" ? 7 : 4;
    }

    if (tile.structure === "city") value += 3;
    if (tile.structure === "port") value += 2;
    if (tile.key === state.forgeKey) value += personality === "hoarder" ? 6 : 3;
    if (tile.key === state.wonderKey) value += 4;

    if (core) {
      const toCore = hexDistance(tile.q, tile.r, core.q, core.r);

      value += Math.max(0, 6 - toCore * 0.4);
    }

    if (!touching) value -= 5;
    if (state.collapsed.has(tile.key)) continue;

    // The rim is a trap once the world starts unravelling.
    if (collapseOn && tile.rim < 3) value -= 8;

    value += state.rng() * (2.5 - state.config.difficulty);

    if (value > 0) candidates.push({ key: tile.key, value });
  }

  return candidates;
}

/** One decision pass for one rival house. */
function decide(state: MatchState, house: number): void {
  const me = state.houses[house];

  if (!me.alive || me.troops < 25) return;

  const active = state.fronts.filter((front) => front.house === house).length;
  const aggressive = PERSONALITY[house] === "raider";

  if (active >= (aggressive && state.config.difficulty === 2 ? 2 : 1)) return;

  const candidates = gatherCandidates(state, house);

  if (candidates.length === 0) return;

  candidates.sort((a, b) => b.value - a.value);

  // The best few targets, not always the best one: perfect play reads as
  // scripted, and a small wobble is what makes a rival feel alive.
  const reach = Math.min(
    candidates.length,
    3 - Math.min(2, state.config.difficulty)
  );
  const pick = candidates[(state.rng() * reach) | 0];

  let share: number = COMMIT[house - 1] ?? 0.6;

  if (me.troops > 220) share = Math.min(0.85, share + 0.15);
  if (state.tick < state.config.duration * 0.15)
    share = Math.max(0.4, share - 0.1);

  startFront(state, house, pick.key, share);
}

/** Advance every rival brain that is due a decision this tick. */
export function stepBots(state: MatchState): void {
  if (state.over || state.relicOffer !== null) return;

  const cadence = CADENCE[state.config.difficulty];

  for (let house = 1; house < state.houses.length; house += 1) {
    // Houses take turns on offset ticks so their moves never read as a drill.
    if ((state.tick + house * 2) % cadence !== 0) continue;

    decide(state, house);
  }
}
