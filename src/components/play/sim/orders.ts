/**
 * What each drafted order actually does when it lands on the map.
 *
 * Orders are horizontal by design: none of them adds raw stats, each one buys
 * a shape of play the army alone cannot. They spend a charge and start a
 * cooldown; both are tracked on the hand slot by the caller.
 */

import type { OrderKey } from "@/components/game/cards/orders";
import { hexDistance } from "@/components/game/hex";

import {
  checkElimination,
  claimTile,
  isAlive,
  neighbourKeys,
  orderCooldown,
  pushEvent,
} from "./engine";
import { type MatchState, PLAYER } from "./types";

/** Tiles a single Expand may swallow. */
const EXPAND_CAP = 12;

/** Length of a Blitz spear. */
const BLITZ_CAP = 10;

/** Border tiles one Fortify walls, and for how long. */
const FORTIFY_CAP = 8;
const WALL_TICKS = 260;

/** Size of a Landing beachhead and the garrison it brings ashore. */
const LANDING_CAP = 5;
const LANDING_TROOPS = 10;

/** Share of the victim's army Sabotage burns, and how long aim suffers. */
const SABOTAGE_SHARE = 0.18;
const SABOTAGE_TICKS = 240;

/** Enemy tiles one Storm-Caller scours back to neutral. */
const STORM_CAP = 8;

/** Radius the Nuke levels. Two rings is nineteen tiles of nothing. */
const NUKE_RADIUS = 2;

/** Neutral tiles nearest the aim, breadth first from the aim itself. */
function nearestOpen(
  state: MatchState,
  aimKey: string,
  count: number,
  accept: (key: string) => boolean
): string[] {
  const seen = new Set<string>([aimKey]);
  const queue = [aimKey];
  const taken: string[] = [];

  for (let head = 0; head < queue.length && taken.length < count; head += 1) {
    const key = queue[head];

    if (accept(key)) taken.push(key);

    for (const next of neighbourKeys(state.world, key)) {
      if (seen.has(next) || !isAlive(state, next)) continue;

      seen.add(next);
      queue.push(next);
    }
  }

  return taken;
}

function playExpand(state: MatchState, aimKey: string): boolean {
  if (!isAlive(state, aimKey)) return false;

  const taken = nearestOpen(
    state,
    aimKey,
    EXPAND_CAP,
    (key) => state.owners.get(key) === undefined && !state.camps.has(key)
  );

  if (taken.length === 0) return false;

  for (const key of taken) claimTile(state, key, PLAYER);

  return true;
}

/** March a straight spear from the nearest own tile to the aim, through anyone. */
function playBlitz(state: MatchState, aimKey: string): boolean {
  const aim = state.world.byKey.get(aimKey);

  if (!aim || !isAlive(state, aimKey)) return false;
  if (state.camps.has(aimKey)) return false;

  let start: string | null = null;
  let nearest = Number.POSITIVE_INFINITY;

  for (const [key, holder] of state.owners) {
    if (holder !== PLAYER) continue;

    const tile = state.world.byKey.get(key);

    if (!tile) continue;

    const away = hexDistance(tile.q, tile.r, aim.q, aim.r);

    if (away < nearest) {
      nearest = away;
      start = key;
    }
  }

  if (start === null) return false;

  // Greedy walk: from the start, keep stepping onto the live neighbour that
  // stands closest to the aim. Water blocks a spear; that is the Landing's job.
  const spear: string[] = [];
  let cursor = start;

  while (spear.length < BLITZ_CAP && cursor !== aimKey) {
    let best: string | null = null;
    let bestAway = Number.POSITIVE_INFINITY;
    const here = state.world.byKey.get(cursor);

    if (!here) break;

    for (const next of neighbourKeys(state.world, cursor)) {
      // A garrison blocks a spear the way water does; camps are paid for.
      if (!isAlive(state, next) || state.camps.has(next)) continue;

      const tile = state.world.byKey.get(next);

      if (!tile) continue;

      const away = hexDistance(tile.q, tile.r, aim.q, aim.r);

      if (away < bestAway) {
        bestAway = away;
        best = next;
      }
    }

    if (best === null) break;

    const hereAway = hexDistance(here.q, here.r, aim.q, aim.r);

    if (bestAway >= hereAway) break;

    spear.push(best);
    cursor = best;
  }

  if (spear.length === 0) return false;

  for (const key of spear) {
    if (state.owners.get(key) !== PLAYER) claimTile(state, key, PLAYER);
  }

  return true;
}

function playFortify(state: MatchState, aimKey: string): boolean {
  const aim = state.world.byKey.get(aimKey);

  if (!aim) return false;

  const border: { key: string; away: number }[] = [];

  for (const [key, holder] of state.owners) {
    if (holder !== PLAYER) continue;

    const tile = state.world.byKey.get(key);

    if (!tile) continue;

    let exposed = false;

    for (const next of neighbourKeys(state.world, key)) {
      if (isAlive(state, next) && state.owners.get(next) !== PLAYER) {
        exposed = true;
        break;
      }
    }

    if (!exposed) continue;

    border.push({ key, away: hexDistance(tile.q, tile.r, aim.q, aim.r) });
  }

  if (border.length === 0) return false;

  border.sort((a, b) => a.away - b.away);

  let cap = FORTIFY_CAP;
  let until = state.tick + WALL_TICKS;

  if (state.relics.includes("bulwarkSigil")) {
    cap += 4;
    until = Number.MAX_SAFE_INTEGER;
  }
  if (state.config.commander === "warden") until += WALL_TICKS;

  for (const entry of border.slice(0, cap)) {
    state.walls.set(entry.key, until);
  }

  return true;
}

function playLanding(state: MatchState, aimKey: string): boolean {
  const aim = state.world.byKey.get(aimKey);

  if (!aim || !isAlive(state, aimKey)) return false;
  if (state.owners.get(aimKey) === PLAYER) return false;

  let coastal = false;

  for (const next of neighbourKeys(state.world, aimKey)) {
    const tile = state.world.byKey.get(next);

    if (tile && !tile.land) coastal = true;
  }

  if (!coastal) return false;

  const pocket = nearestOpen(
    state,
    aimKey,
    LANDING_CAP,
    (key) => state.owners.get(key) !== PLAYER && !state.camps.has(key)
  );

  if (pocket.length === 0) return false;

  for (const key of pocket) claimTile(state, key, PLAYER);

  state.houses[PLAYER].troops += LANDING_TROOPS;

  return true;
}

function playSabotage(state: MatchState, aimKey: string): boolean {
  const holder = state.owners.get(aimKey);

  if (holder === undefined || holder === PLAYER) return false;

  const victim = state.houses[holder];

  victim.troops = Math.max(0, victim.troops * (1 - SABOTAGE_SHARE));
  state.sabotagedUntil[holder] = state.tick + SABOTAGE_TICKS;

  return true;
}

function playStorm(state: MatchState, aimKey: string): boolean {
  const scoured = nearestOpen(state, aimKey, STORM_CAP, (key) => {
    const holder = state.owners.get(key);

    return holder !== undefined && holder !== PLAYER;
  });

  if (scoured.length === 0) return false;

  for (const key of scoured) {
    const holder = state.owners.get(key);

    if (holder === undefined) continue;

    state.houses[holder].territory -= 1;
    state.houses[holder].tilesLost += 1;
    state.owners.delete(key);
    state.walls.delete(key);

    if (key === state.wonderKey) state.wonderHolder = -1;
  }

  return true;
}

function playNuke(state: MatchState, aimKey: string): boolean {
  const aim = state.world.byKey.get(aimKey);

  if (!aim) return false;

  let struck = 0;

  for (const tile of state.world.tiles) {
    if (hexDistance(tile.q, tile.r, aim.q, aim.r) > NUKE_RADIUS) continue;
    if (!isAlive(state, tile.key)) continue;

    const holder = state.owners.get(tile.key);

    if (holder !== undefined) {
      state.houses[holder].territory -= 1;
      state.houses[holder].tilesLost += 1;
      state.owners.delete(tile.key);
    }

    state.collapsed.add(tile.key);
    state.chests.delete(tile.key);
    state.camps.delete(tile.key);
    state.walls.delete(tile.key);

    if (tile.key === state.forgeKey) state.forgeKey = null;
    if (tile.key === state.wonderKey) state.wonderHolder = -1;

    state.landAlive -= 1;
    struck += 1;
  }

  return struck > 0;
}

const EFFECTS: Record<
  OrderKey,
  (state: MatchState, aimKey: string) => boolean
> = {
  expand: playExpand,
  blitz: playBlitz,
  fortify: playFortify,
  landing: playLanding,
  sabotage: playSabotage,
  storm: playStorm,
  nuke: playNuke,
};

/**
 * Play the order in a hand slot at a tile. Returns false and spends nothing
 * when the aim makes no sense for the card.
 */
export function playOrder(
  state: MatchState,
  slotIndex: number,
  aimKey: string
): boolean {
  if (state.over || state.relicOffer !== null) return false;

  const slot = state.hand[slotIndex];

  if (!slot || slot.charges <= 0 || slot.readyAt > state.tick) return false;

  const landed = EFFECTS[slot.order](state, aimKey);

  if (!landed) return false;

  slot.charges -= 1;
  slot.readyAt = state.tick + orderCooldown(state);
  pushEvent(state, {
    type: "order",
    key: aimKey,
    house: PLAYER,
    detail: slot.order,
  });

  // Storm and nuke can zero a house out, the player's own included; settle
  // every ledger immediately. checkElimination refuses self-credit on kills.
  for (let house = 0; house < state.houses.length; house += 1) {
    checkElimination(state, house, PLAYER);
  }

  return true;
}
