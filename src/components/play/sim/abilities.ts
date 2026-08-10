/**
 * Commander actives. One aimed ability per commander, two charges a match.
 *
 * These are sidegrades, not power: each one converts a situation the army
 * handles badly into one it handles well, and nothing here outgrows a
 * well-played slider.
 */

import { hexDistance } from "@/components/game/hex";

import {
  abilityCooldown,
  claimTile,
  isAlive,
  neighbourKeys,
  pushEvent,
} from "./engine";
import { type CommanderId, type MatchState, PLAYER } from "./types";

/** Radius of the Warden's instant rampart. */
const BULWARK_RADIUS = 2;
const BULWARK_TICKS = 200;

/** How long the Reaver's warpath drives the fronts. */
const WARPATH_TICKS = 48;

/** Size of the Tidecaller's surf pocket and the garrison it carries. */
const RIPTIDE_CAP = 5;
const RIPTIDE_TROOPS = 8;

function castBulwark(state: MatchState, aimKey: string): boolean {
  const aim = state.world.byKey.get(aimKey);

  if (!aim) return false;

  let walled = 0;

  for (const [key, holder] of state.owners) {
    if (holder !== PLAYER) continue;

    const tile = state.world.byKey.get(key);

    if (!tile) continue;
    if (hexDistance(tile.q, tile.r, aim.q, aim.r) > BULWARK_RADIUS) continue;

    state.walls.set(key, state.tick + BULWARK_TICKS);
    walled += 1;
  }

  return walled > 0;
}

function castWarpath(state: MatchState): boolean {
  state.surgeUntil = state.tick + WARPATH_TICKS;

  return true;
}

function castRiptide(state: MatchState, aimKey: string): boolean {
  if (!isAlive(state, aimKey)) return false;
  if (state.owners.get(aimKey) === PLAYER) return false;

  let coastal = false;

  for (const next of neighbourKeys(state.world, aimKey)) {
    const tile = state.world.byKey.get(next);

    if (tile && !tile.land) coastal = true;
  }

  if (!coastal) return false;

  const seen = new Set<string>([aimKey]);
  const queue = [aimKey];
  const pocket: string[] = [];

  for (
    let head = 0;
    head < queue.length && pocket.length < RIPTIDE_CAP;
    head += 1
  ) {
    const key = queue[head];

    if (state.owners.get(key) !== PLAYER && !state.camps.has(key)) {
      pocket.push(key);
    }

    for (const next of neighbourKeys(state.world, key)) {
      if (seen.has(next) || !isAlive(state, next)) continue;

      seen.add(next);
      queue.push(next);
    }
  }

  if (pocket.length === 0) return false;

  for (const key of pocket) claimTile(state, key, PLAYER);

  state.houses[PLAYER].troops += RIPTIDE_TROOPS;

  return true;
}

const CASTS: Record<
  CommanderId,
  (state: MatchState, aimKey: string) => boolean
> = {
  warden: castBulwark,
  reaver: (state) => castWarpath(state),
  tidecaller: castRiptide,
};

/** True when the ability landed and the charge was spent. */
export function castAbility(state: MatchState, aimKey: string): boolean {
  if (state.over || state.relicOffer !== null) return false;
  if (state.abilityCharges <= 0) return false;
  if (state.abilityReadyAt > state.tick) return false;

  const landed = CASTS[state.config.commander](state, aimKey);

  if (!landed) return false;

  state.abilityCharges -= 1;
  state.abilityReadyAt = state.tick + abilityCooldown(state);
  pushEvent(state, {
    type: "ability",
    key: aimKey,
    house: PLAYER,
    detail: state.config.commander,
  });

  return true;
}
