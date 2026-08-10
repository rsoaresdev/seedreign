/**
 * The match engine: one seeded world, four houses, a clock that only runs out.
 *
 * The engine mutates a single MatchState in place at a fixed tick and reports
 * everything that happened through the event feed. It knows nothing about
 * React, canvases or translations; the HUD reads numbers off the state and the
 * FX layer drains events by serial.
 *
 * Combat model: an attack commits a share of the standing army into a front.
 * Each tick a front captures the tiles nearest its target along the house's
 * own border, paying a cost per tile that scales with the defender's troop
 * density, terrain and walls. A front dies when its strength is spent, its
 * path runs out or it has flooded past its target, and whatever strength is
 * left walks home.
 */

import { HEX_DIRECTIONS, hexDistance } from "@/components/game/hex";
import {
  generateWorld,
  HOUSES,
  type Tile,
  type World,
} from "@/components/game/world";
import { createRandom } from "@/lib/rng";

import {
  type Front,
  type HouseState,
  type MatchConfig,
  type MatchEvent,
  type MatchInput,
  type MatchState,
  PLAYER,
  type PulseId,
  type PulseInstance,
  type RelicId,
} from "./types";

/** Cost of walking onto open ground. */
const NEUTRAL_COST = 1.3;

/** Base cost of taking a defended tile before density is added. */
const ENEMY_COST = 2.1;

/** How hard troop density defends. */
const DENSITY_WEIGHT = 1.15;

/** Share of the capture cost the defender bleeds. */
const DEFENDER_ATTRITION = 0.35;

/** A wall multiplies the cost of the tile behind it. */
const WALL_FACTOR = 2.4;

/** Terrain drag, multiplied into every capture on that ground. */
const TERRAIN_COST: Partial<Record<Tile["terrain"], number>> = {
  forest: 1.15,
  hill: 1.3,
  peak: 1.7,
  snow: 1.45,
};

/** Landing on a far shore costs more than walking there. */
const NAVAL_FACTOR = 1.35;

/** Tiles a front may take after reaching its target before it disbands. */
const OVERRUN = 4;

/** Ceiling on simultaneous fronts per house. */
const MAX_FRONTS = 2;

/** Camps start with this much garrison; clearing one pays troops back. */
const CAMP_GARRISON = 24;
const CAMP_BOUNTY = 12;

/** Growth tuning. Territory feeds population, with diminishing returns. */
const GROWTH_BASE = 0.55;
const GROWTH_PER_TILE = 0.014;
const GROWTH_PER_CITY = 0.24;
const CAP_BASE = 90;
const CAP_PER_TILE = 3.2;
const CAP_FLOOR = 0.12;

/** The Collapse begins at this share of the match and spares this much land. */
const COLLAPSE_START = 0.7;
const COLLAPSE_SPARED = 0.2;

/** Pulse timing, as shares of the match. */
const PULSE_AT = [0.3, 0.55] as const;
const PULSE_SECONDS = 40;

/** Ground lower than this drowns when the flood pulse hits. */
const FLOOD_LEVEL = 0.56;

/** Starting army. Small on purpose: the opening minutes are about land. */
const OPENING_TROOPS = 40;

const ABILITY_CHARGES = 2;
const ORDER_CHARGES = 2;
const ORDER_COOLDOWN = 140;
const ABILITY_COOLDOWN = 220;

const EVENT_LIMIT = 48;

const RELIC_POOL: readonly RelicId[] = [
  "emberHeart",
  "bulwarkSigil",
  "tideCharm",
  "huntersMark",
  "warBanner",
  "stillRoot",
];

export function pushEvent(
  state: MatchState,
  event: Omit<MatchEvent, "serial" | "tick">
): void {
  state.nextSerial += 1;
  state.events.push({ ...event, serial: state.nextSerial, tick: state.tick });

  if (state.events.length > EVENT_LIMIT) {
    state.events.splice(0, state.events.length - EVENT_LIMIT);
  }
}

/** Live ground: on the map, not eaten, not under water. */
export function isAlive(state: MatchState, key: string): boolean {
  const tile = state.world.byKey.get(key);

  if (!tile?.land) return false;

  return !state.collapsed.has(key) && !state.flooded.has(key);
}

export function neighbourKeys(world: World, key: string): string[] {
  const tile = world.byKey.get(key);

  if (!tile) return [];

  const found: string[] = [];

  for (const [dq, dr] of HEX_DIRECTIONS) {
    const next = world.byKey.get(`${tile.q + dq},${tile.r + dr}`);

    if (next) found.push(next.key);
  }

  return found;
}

/** Whether land connects the house to the target without crossing water. */
function reachableByLand(
  state: MatchState,
  house: number,
  targetKey: string
): boolean {
  const seen = new Set<string>([targetKey]);
  const queue = [targetKey];

  for (let head = 0; head < queue.length; head += 1) {
    const key = queue[head];

    if (state.owners.get(key) === house) return true;

    for (const next of neighbourKeys(state.world, key)) {
      if (seen.has(next) || !isAlive(state, next)) continue;

      seen.add(next);
      queue.push(next);
    }
  }

  return false;
}

function hasPort(state: MatchState, house: number): boolean {
  for (const [key, holder] of state.owners) {
    if (holder !== house) continue;

    if (state.world.byKey.get(key)?.structure === "port") return true;
  }

  return false;
}

/** Whether the house may open a front on a far shore. */
export function canSail(state: MatchState, house: number): boolean {
  if (house === PLAYER) {
    if (state.config.commander === "tidecaller") return true;
    if (state.relics.includes("tideCharm")) return true;
  }

  return hasPort(state, house);
}

function terrainFactor(tile: Tile): number {
  return TERRAIN_COST[tile.terrain] ?? 1;
}

/** What one tile costs the attacking house right now. */
export function captureCost(
  state: MatchState,
  key: string,
  attacker: number,
  naval: boolean
): number {
  const tile = state.world.byKey.get(key);

  if (!tile) return Number.POSITIVE_INFINITY;

  const holder = state.owners.get(key);
  let cost: number;

  if (holder === undefined) {
    cost = NEUTRAL_COST;

    const garrison = state.camps.get(key);

    if (garrison !== undefined) cost += garrison;
  } else {
    const defender = state.houses[holder];
    const density =
      defender.territory > 0 ? defender.troops / (defender.territory * 3) : 0;

    cost = ENEMY_COST + density * DENSITY_WEIGHT * 3;

    const wallUntil = state.walls.get(key);

    if (wallUntil !== undefined && wallUntil > state.tick) {
      cost *=
        holder === PLAYER && state.config.commander === "warden"
          ? WALL_FACTOR * 1.4
          : WALL_FACTOR;
    }

    if (holder === PLAYER && state.config.commander === "warden") cost *= 1.12;
  }

  cost *= terrainFactor(tile);

  if (naval) {
    let factor = NAVAL_FACTOR;

    if (attacker === PLAYER && state.relics.includes("tideCharm")) factor = 0.9;
    if (attacker === PLAYER && state.config.commander === "tidecaller")
      factor = Math.min(factor, 1.1);

    cost *= factor;
  }

  if (state.sabotagedUntil[attacker] > state.tick) cost *= 1.25;
  if (attacker === PLAYER && state.relics.includes("warBanner")) cost *= 1.1;

  // Overextension: land past half the world grows restless, and every push
  // costs more to hold together. The free anti-snowball the lore promised.
  const mine = state.houses[attacker];
  const share = state.landAlive > 0 ? mine.territory / state.landAlive : 0;

  if (share > 0.5) cost *= 1 + (share - 0.5) * 1.6;

  return cost;
}

/**
 * Hand the tile to a house, settling everything standing on it: garrisons,
 * chests, the forge, the wonder, and both sides' running counters.
 */
export function claimTile(state: MatchState, key: string, house: number): void {
  const previous = state.owners.get(key);

  if (previous === house) return;

  const tile = state.world.byKey.get(key);

  if (!tile) return;

  if (previous !== undefined) {
    const loser = state.houses[previous];

    loser.territory -= 1;
    loser.tilesLost += 1;

    if (state.wonderHolder === previous && key === state.wonderKey) {
      state.wonderHolder = -1;
    }
  }

  state.owners.set(key, house);

  const winner = state.houses[house];

  winner.territory += 1;
  winner.tilesTaken += 1;

  const garrison = state.camps.get(key);

  if (garrison !== undefined) {
    state.camps.delete(key);
    winner.troops += CAMP_BOUNTY;
    winner.campsCleared += 1;
    pushEvent(state, { type: "camp", key, house, detail: null });
  }

  if (state.chests.has(key)) {
    state.chests.delete(key);

    let spoils = 2;

    if (state.config.decree === "guardedSpoils") spoils += 1;
    if (house === PLAYER && state.relics.includes("huntersMark")) spoils += 1;
    if (state.config.decree === "twinRelics") spoils += 1;

    winner.spoils += spoils;
    winner.chestsTaken += 1;
    pushEvent(state, { type: "chest", key, house, detail: String(spoils) });
  }

  if (key === state.forgeKey) {
    state.forgeKey = null;

    if (house === PLAYER) {
      const pool = RELIC_POOL.filter((relic) => !state.relics.includes(relic));
      const offer: RelicId[] = [];

      while (offer.length < 3 && pool.length > 0) {
        const pick = (state.rng() * pool.length) | 0;

        offer.push(pool.splice(pick, 1)[0]);
      }

      state.relicOffer = offer;
    } else {
      winner.spoils += 3;
    }

    pushEvent(state, { type: "forge", key, house, detail: null });
  }

  if (key === state.wonderKey) {
    state.wonderHolder = house;
    pushEvent(state, { type: "wonder", key, house, detail: null });
  }

  pushEvent(state, {
    type: previous === undefined ? "claim" : "loss",
    key,
    house,
    detail: previous === undefined ? null : String(previous),
  });

  if (previous !== undefined) checkElimination(state, previous, house);
}

export function checkElimination(
  state: MatchState,
  house: number,
  by: number
): void {
  const fallen = state.houses[house];

  if (!fallen.alive || fallen.territory > 0) return;

  fallen.alive = false;
  fallen.troops = 0;
  state.fronts = state.fronts.filter((front) => front.house !== house);

  if (by >= 0 && by !== house) state.houses[by].eliminations += 1;

  pushEvent(state, {
    type: "elimination",
    key: fallen.capital,
    house,
    detail: by >= 0 ? String(by) : null,
  });
}

/**
 * Open a front. Returns false when the order is impossible: aiming at your own
 * ground, at dead ground, or across water you cannot sail.
 */
export function startFront(
  state: MatchState,
  house: number,
  targetKey: string,
  commitShare: number
): boolean {
  if (!isAlive(state, targetKey)) return false;
  if (state.owners.get(targetKey) === house) return false;

  const actor = state.houses[house];

  if (!actor.alive || actor.troops < 6) return false;

  const naval = !reachableByLand(state, house, targetKey);

  if (naval && !canSail(state, house)) return false;

  const share = Math.min(1, Math.max(0.1, commitShare));
  let maxFronts = MAX_FRONTS;

  if (house === PLAYER && state.relics.includes("emberHeart")) maxFronts = 1;

  const mine = state.fronts.filter((front) => front.house === house);

  if (mine.length >= maxFronts) {
    const oldest = mine[0];

    actor.troops += oldest.strength;
    state.fronts = state.fronts.filter((front) => front.id !== oldest.id);
  }

  const strength = actor.troops * share;

  actor.troops -= strength;
  state.nextFrontId += 1;
  state.fronts.push({
    id: state.nextFrontId,
    house,
    targetKey,
    strength,
    frontier: [],
    captured: 0,
    arrived: false,
    naval,
  });

  return true;
}

/** Tiles the house could push into this tick, cheapest march first. */
function frontCandidates(state: MatchState, front: Front): string[] {
  const target = state.world.byKey.get(front.targetKey);

  if (!target) return [];

  const seen = new Set<string>();
  const out: { key: string; rank: number }[] = [];

  if (
    front.naval &&
    !front.arrived &&
    state.owners.get(front.targetKey) !== front.house
  ) {
    // A naval front lands on its target first and only then spreads out.
    return state.owners.get(front.targetKey) === front.house
      ? []
      : [front.targetKey];
  }

  for (const [key, holder] of state.owners) {
    if (holder !== front.house) continue;

    for (const next of neighbourKeys(state.world, key)) {
      if (seen.has(next)) continue;

      seen.add(next);

      if (!isAlive(state, next)) continue;
      if (state.owners.get(next) === front.house) continue;

      const tile = state.world.byKey.get(next);

      if (!tile) continue;

      const rank =
        hexDistance(tile.q, tile.r, target.q, target.r) +
        state.rng() * 0.4 +
        (terrainFactor(tile) - 1) * 1.5;

      out.push({ key: next, rank });
    }
  }

  return out.sort((a, b) => a.rank - b.rank).map((entry) => entry.key);
}

/** Captures a front attempts per tick. Strength buys pace, but slowly. */
function frontPace(state: MatchState, front: Front): number {
  let pace = 1 + Math.min(1, Math.floor(front.strength / 110));

  if (front.house === PLAYER && state.relics.includes("warBanner")) pace += 1;
  if (front.house === PLAYER && state.surgeUntil > state.tick) pace += 1;

  return pace;
}

function stepFront(state: MatchState, front: Front): boolean {
  const pace = frontPace(state, front);

  for (let step = 0; step < pace; step += 1) {
    if (front.strength <= 0.5) break;

    const candidates = frontCandidates(state, front);

    if (candidates.length === 0) break;

    const key = candidates[0];
    const holder = state.owners.get(key);
    const cost = captureCost(
      state,
      key,
      front.house,
      front.naval && !front.arrived
    );

    if (cost > front.strength) {
      front.strength = 0;
      break;
    }

    front.strength -= cost;

    if (holder !== undefined) {
      const defender = state.houses[holder];

      defender.troops = Math.max(
        0,
        defender.troops - cost * DEFENDER_ATTRITION
      );
    }

    claimTile(state, key, front.house);
    front.captured += 1;

    if (key === front.targetKey) front.arrived = true;
    if (front.arrived && front.captured >= OVERRUN && key !== front.targetKey) {
      front.strength = 0;
    }
    if (front.arrived) {
      const target = state.world.byKey.get(front.targetKey);
      const took = state.world.byKey.get(key);

      // Once past the prize, the front only mops up the immediate area.
      if (
        target &&
        took &&
        hexDistance(target.q, target.r, took.q, took.r) > 2
      ) {
        front.strength = 0;
      }
    }
  }

  if (front.strength <= 0.5) return false;
  if (!isAlive(state, front.targetKey) && !front.arrived) {
    // The ground it was marching on died under it; the army turns back.
    state.houses[front.house].troops += front.strength;

    return false;
  }

  return true;
}

function growHouses(state: MatchState): void {
  const surge = state.pulses.some(
    (pulse) => pulse.id === "surge" && pulse.fired && pulse.until > state.tick
  );

  for (let house = 0; house < state.houses.length; house += 1) {
    const entry = state.houses[house];

    if (!entry.alive) continue;

    let cities = 0;

    for (const [key, holder] of state.owners) {
      if (holder !== house) continue;
      if (state.world.byKey.get(key)?.structure === "city") cities += 1;
    }

    let rate =
      GROWTH_BASE +
      entry.territory * GROWTH_PER_TILE +
      cities * GROWTH_PER_CITY;

    if (surge) rate *= 1.6;
    if (state.config.decree === "longNight") rate *= 0.9;
    if (house === PLAYER && state.relics.includes("emberHeart")) rate *= 1.18;
    if (
      house === PLAYER &&
      state.config.commander === "reaver" &&
      state.fronts.some((front) => front.house === PLAYER)
    ) {
      rate *= 1.1;
    }

    const difficulty = state.config.difficulty;

    if (house !== PLAYER) rate *= [0.85, 1, 1.16][difficulty];

    const cap = CAP_BASE + entry.territory * CAP_PER_TILE;

    // The floor keeps growth alive near the cap; above it, nothing grows.
    rate *=
      entry.troops >= cap ? 0 : Math.max(CAP_FLOOR, 1 - entry.troops / cap);
    entry.troops += rate;

    const share = state.landAlive > 0 ? entry.territory / state.landAlive : 0;

    entry.peakShare = Math.max(entry.peakShare, share);

    if (state.wonderHolder === house) entry.wonderTicks += 1;
  }
}

function schedulePulses(state: MatchState): void {
  const pool: PulseId[] = ["flood", "vault", "bounty", "surge"];
  const count = state.config.duration >= 1200 ? 3 : 2;

  for (let index = 0; index < count; index += 1) {
    const at = Math.floor(
      state.config.duration *
        (PULSE_AT[index] ?? 0.78) *
        (0.92 + state.rng() * 0.16)
    );
    const pick = (state.rng() * pool.length) | 0;
    const id = pool.splice(pick, 1)[0];

    state.pulses.push({
      id,
      at,
      until: at + PULSE_SECONDS * 4,
      fired: false,
      markedHouse: -1,
    });
  }

  state.pulses.sort((a, b) => a.at - b.at);
}

function firePulse(state: MatchState, pulse: PulseInstance): void {
  pulse.fired = true;

  if (pulse.id === "flood") {
    const spawns = new Set(state.world.spawns);

    for (const tile of state.world.tiles) {
      if (!isAlive(state, tile.key)) continue;
      if (tile.elevation >= FLOOD_LEVEL) continue;
      if (spawns.has(tile.key)) continue;

      let coastal = false;

      for (const next of neighbourKeys(state.world, tile.key)) {
        const other = state.world.byKey.get(next);

        if (other && !other.land) coastal = true;
      }

      if (!coastal) continue;

      const holder = state.owners.get(tile.key);

      if (holder !== undefined) {
        state.houses[holder].territory -= 1;
        state.owners.delete(tile.key);
      }

      state.chests.delete(tile.key);
      state.flooded.set(tile.key, pulse.until);
      state.pulseMarks.add(tile.key);
      state.landAlive -= 1;
      pushEvent(state, {
        type: "flood",
        key: tile.key,
        house: -1,
        detail: null,
      });
    }

    for (let house = 0; house < state.houses.length; house += 1) {
      checkElimination(state, house, -1);
    }
  }

  if (pulse.id === "vault") {
    const open = state.world.tiles.filter(
      (tile) =>
        isAlive(state, tile.key) &&
        state.owners.get(tile.key) === undefined &&
        tile.structure === null &&
        tile.rim >= 3
    );

    for (let drop = 0; drop < 3 && open.length > 0; drop += 1) {
      const pick = (state.rng() * open.length) | 0;
      const tile = open.splice(pick, 1)[0];

      state.chests.add(tile.key);
      state.pulseMarks.add(tile.key);
      pushEvent(state, {
        type: "pulse",
        key: tile.key,
        house: -1,
        detail: "vault",
      });
    }
  }

  if (pulse.id === "bounty") {
    let leader = 0;

    for (let house = 1; house < state.houses.length; house += 1) {
      if (state.houses[house].territory > state.houses[leader].territory) {
        leader = house;
      }
    }

    pulse.markedHouse = leader;
  }

  pushEvent(state, {
    type: "pulse",
    key: null,
    house: pulse.markedHouse,
    detail: pulse.id,
  });
}

function restoreFloods(state: MatchState): void {
  for (const [key, until] of state.flooded) {
    if (until > state.tick) continue;

    state.flooded.delete(key);
    state.landAlive += 1;
    pushEvent(state, { type: "restore", key, house: -1, detail: null });
  }
}

function stepCollapse(state: MatchState): void {
  const start = Math.floor(state.config.duration * COLLAPSE_START);

  if (state.tick < start) return;

  const order = state.world.collapseOrder;
  const keepAlive = Math.floor(order.length * COLLAPSE_SPARED);
  const eatable = order.length - keepAlive;
  const progress = (state.tick - start) / (state.config.duration - start);
  const shouldHaveEaten = Math.floor(eatable * Math.min(1, progress));

  while (state.collapseIndex < shouldHaveEaten) {
    const key = order[state.collapseIndex];

    state.collapseIndex += 1;

    if (state.collapsed.has(key)) continue;

    if (
      state.relics.includes("stillRoot") &&
      progress < 0.9 &&
      state.houses[PLAYER].capital !== null
    ) {
      const capital = state.world.byKey.get(state.houses[PLAYER].capital);
      const tile = state.world.byKey.get(key);

      if (
        capital &&
        tile &&
        hexDistance(capital.q, capital.r, tile.q, tile.r) <= 2
      ) {
        continue;
      }
    }

    state.collapsed.add(key);

    // A tile still under flood water already left the landAlive count when it
    // drowned; eating it must not subtract it twice.
    const wasFlooded = state.flooded.delete(key);

    state.chests.delete(key);
    state.camps.delete(key);

    const holder = state.owners.get(key);

    if (holder !== undefined) {
      state.houses[holder].territory -= 1;
      state.owners.delete(key);
    }

    if (key === state.forgeKey) state.forgeKey = null;
    if (key === state.wonderKey && state.wonderHolder >= 0) {
      state.wonderHolder = -1;
    }

    if (!wasFlooded) state.landAlive -= 1;

    pushEvent(state, {
      type: "collapse",
      key,
      house: holder ?? -1,
      detail: null,
    });
  }

  for (let house = 0; house < state.houses.length; house += 1) {
    checkElimination(state, house, -1);
  }
}

function checkEnd(state: MatchState): void {
  if (state.over) return;

  if (!state.houses[PLAYER].alive) {
    state.over = true;
    state.endReason = "playerDead";

    return;
  }

  const living = state.houses.filter((house) => house.alive).length;

  if (state.config.condition === "domination" && living === 1) {
    state.over = true;
    state.endReason = "domination";

    return;
  }

  if (state.config.condition === "blitz" && state.landAlive > 0) {
    for (const house of state.houses) {
      if (house.alive && house.territory / state.landAlive >= 0.42) {
        state.over = true;
        state.endReason = "blitz";

        return;
      }
    }
  }

  if (state.tick >= state.config.duration) {
    state.over = true;
    state.endReason = "dusk";
  }
}

export function applyInput(state: MatchState, input: MatchInput): void {
  if (state.over) return;

  if (input.type === "slider") {
    state.attack = Math.min(100, Math.max(0, Math.round(input.value)));

    return;
  }

  if (input.type === "relic") {
    if (state.relicOffer?.includes(input.relic)) {
      state.relics.push(input.relic);
      state.relicOffer = null;
      pushEvent(state, {
        type: "relic",
        key: null,
        house: PLAYER,
        detail: input.relic,
      });

      if (state.config.decree === "twinRelics" && state.forgeKey === null) {
        // The decree lights a second forge somewhere neutral and inland.
        const open = state.world.tiles.filter(
          (tile) =>
            isAlive(state, tile.key) &&
            state.owners.get(tile.key) === undefined &&
            tile.structure === null &&
            tile.rim >= 4
        );

        if (open.length > 0) {
          state.forgeKey = open[(state.rng() * open.length) | 0].key;
        }
      }
    }

    return;
  }

  if (state.relicOffer !== null) return;

  if (input.type === "attack") {
    startFront(state, PLAYER, input.key, state.attack / 100);

    return;
  }

  if (input.type === "order") {
    // Order effects live in orders.ts; the engine only spends the slot.
    return;
  }

  if (input.type === "ability") {
    // Ability effects live in abilities.ts; same deal.
  }
}

export function stepMatch(state: MatchState): void {
  if (state.over || state.relicOffer !== null) return;

  state.tick += 1;

  growHouses(state);

  // Detached snapshot, not a filter in place: a capture inside stepFront can
  // eliminate a house and rewrite state.fronts, and a plain filter would
  // clobber that removal when it finished. Dead houses march nowhere.
  const marching = state.fronts;

  state.fronts = [];

  for (const front of marching) {
    if (state.houses[front.house].alive && stepFront(state, front)) {
      state.fronts.push(front);
    }
  }

  for (const pulse of state.pulses) {
    if (!pulse.fired && state.tick >= pulse.at) firePulse(state, pulse);
  }

  restoreFloods(state);
  stepCollapse(state);
  checkEnd(state);
}

/**
 * Deal the opening ground fresh, in equal measure.
 *
 * The generator's own opening grab is written for the landing page, where the
 * player starts modest on purpose. A ranked day cannot work that way: all
 * four houses grow the same number of tiles out from their spawns, with the
 * ragged borders the random frontier gives.
 */
function equalOpening(world: World, rng: () => number): Map<string, number> {
  const owners = new Map<string, number>();
  const land = world.tiles.filter((tile) => tile.land).length;
  const target = Math.floor((land * 0.4) / HOUSES.length);
  const frontiers: string[][] = HOUSES.map(() => []);

  const offer = (key: string, house: number) => {
    const tile = world.byKey.get(key);

    if (!tile) return;

    for (const [dq, dr] of HEX_DIRECTIONS) {
      const next = world.byKey.get(`${tile.q + dq},${tile.r + dr}`);

      if (next?.land && !owners.has(next.key)) {
        frontiers[house].push(next.key);
      }
    }
  };

  world.spawns.forEach((key, house) => {
    owners.set(key, house);
    offer(key, house);
  });

  const held = HOUSES.map(() => 1);
  let moving = true;

  while (moving) {
    moving = false;

    for (let house = 0; house < HOUSES.length; house += 1) {
      if (held[house] >= target) continue;

      const frontier = frontiers[house];
      let claimed = false;

      while (frontier.length > 0 && !claimed) {
        const pick = (rng() * frontier.length) | 0;
        const key = frontier[pick];

        frontier[pick] = frontier[frontier.length - 1];
        frontier.pop();

        if (owners.has(key)) continue;

        owners.set(key, house);
        offer(key, house);
        held[house] += 1;
        claimed = true;
      }

      if (claimed) moving = true;
    }
  }

  return owners;
}

export function createMatch(config: MatchConfig): MatchState {
  const world = generateWorld(config.seed, config.cols, config.rows);
  const rng = createRandom(config.seed ^ 0x5eed);
  const owners =
    world.spawns.length === HOUSES.length
      ? equalOpening(world, rng)
      : new Map(world.initialOwners);

  const houses: HouseState[] = HOUSES.map((_, index) => ({
    troops: OPENING_TROOPS,
    alive: true,
    territory: 0,
    peakShare: 0,
    capital: world.spawns[index] ?? null,
    spoils: 0,
    chestsTaken: 0,
    campsCleared: 0,
    eliminations: 0,
    tilesTaken: 0,
    tilesLost: 0,
    wonderTicks: 0,
  }));

  let landAlive = 0;
  const camps = new Map<string, number>();
  const chests = new Set<string>();
  let forgeKey: string | null = null;
  let wonderKey: string | null = null;

  for (const tile of world.tiles) {
    if (!tile.land) continue;

    landAlive += 1;

    const holder = owners.get(tile.key);

    if (holder !== undefined) houses[holder].territory += 1;

    // Camps and chests were placed against the generator's own opening map;
    // the match deals its own. One swallowed by somebody's starting blob would
    // be a free bounty or a dead chest, so only neutral ones survive.
    if (tile.structure === "camp" && holder === undefined) {
      camps.set(
        tile.key,
        config.decree === "guardedSpoils"
          ? Math.round(CAMP_GARRISON * 1.6)
          : CAMP_GARRISON
      );
    }

    if (tile.structure === "chest" && holder === undefined) {
      chests.add(tile.key);
    }

    if (tile.structure === "forge") forgeKey = tile.key;
    if (tile.structure === "wonder") wonderKey = tile.key;
  }

  const state: MatchState = {
    config,
    world,
    rng,
    tick: 0,
    over: false,
    endReason: null,
    owners,
    houses,
    fronts: [],
    nextFrontId: 0,
    attack: 60,
    hand: config.hand.map((order) => ({
      order,
      charges: ORDER_CHARGES,
      readyAt: 0,
    })),
    abilityCharges: ABILITY_CHARGES,
    abilityReadyAt: 0,
    surgeUntil: 0,
    walls: new Map(),
    camps,
    chests,
    forgeKey,
    wonderKey,
    // The opening deal can drop the wonder inside somebody's blob; they hold
    // it from the first tick, or nobody does.
    wonderHolder: wonderKey === null ? -1 : (owners.get(wonderKey) ?? -1),
    relics: [],
    relicOffer: null,
    pulses: [],
    flooded: new Map(),
    pulseMarks: new Set(),
    collapsed: new Set(),
    collapseIndex: 0,
    landAlive,
    events: [],
    nextSerial: 0,
    sabotagedUntil: HOUSES.map(() => 0),
  };

  schedulePulses(state);

  return state;
}

export function orderCooldown(state: MatchState): number {
  return state.config.decree === "swiftOrders"
    ? Math.floor(ORDER_COOLDOWN / 2)
    : ORDER_COOLDOWN;
}

export function abilityCooldown(state: MatchState): number {
  return state.config.commander === "reaver"
    ? Math.floor(ABILITY_COOLDOWN * 0.8)
    : ABILITY_COOLDOWN;
}
