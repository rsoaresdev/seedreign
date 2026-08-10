"use client";

/**
 * The state machine behind a world somebody is actually playing on.
 *
 * It owns four things: who holds which tile, where the Seeded is standing,
 * which order card is armed, and the queue of ground still changing hands. A
 * click and a timer tick both go through the same reducer, and every transition
 * is a pure function of the state before it, so the whole thing can be reasoned
 * about without a browser anywhere near it.
 */

import { useCallback, useEffect, useMemo, useReducer } from "react";

import type { OrderKey } from "@/components/game/cards/orders";
import type { Mark, MarkKind } from "@/components/game/game-viewport";
import { hexDistance } from "@/components/game/hex";
import type { StandingsRow } from "@/components/game/hud/standings-panel";
import {
  findPath,
  HOUSES,
  holdings,
  neighbourOf,
  type Owners,
  type Tile,
  type World,
} from "@/components/game/world";

/**
 * The orders this world deals. Four rather than the whole pool, because a
 * card that lands on the map has to be worth the tap it costs.
 */
export const PLAYABLE_ORDERS = [
  "expand",
  "blitz",
  "fortify",
  "storm",
] as const satisfies readonly OrderKey[];

export type PlayableOrder = (typeof PLAYABLE_ORDERS)[number];

/** What the last thing the player did is called, for the log and the ear. */
export type ReportKey = PlayableOrder | "march";

export type PlayReport = {
  order: ReportKey;
  /** Tiles that actually changed, which is not always what was asked for. */
  taken: number;
  serial: number;
};

/** Index 0 is the player, the same as everywhere else. */
const PLAYER = 0;

/** One hex per beat while the Seeded is on the move. */
const WALK_TICK = 280;

/** Orders land faster than a march: a card is spent, not walked. */
const BURST_TICK = 90;
const SPEAR_TICK = 70;
const LINE_TICK = 80;
const RIPPLE_TICK = 110;

/** Flashes kept on the map. Anything older has finished fading anyway. */
const MARK_LIMIT = 20;

/** Ceilings on a single card, so no one tap swallows the world. */
const EXPAND_CAP = 14;
const SPEAR_CAP = 13;
const RIPPLE_CAP = 16;

/** Where the slider sits before anybody touches it. */
const OPENING_ATTACK = 60;

const MIN_SHARE = 0;
const MAX_SHARE = 100;

type StepKind = "walk" | "claim" | "ward" | "strike" | "echo";

type Step = { key: string; kind: StepKind };

type Plan = { order: ReportKey; steps: Step[]; tick: number };

export type PlayState = {
  owners: ReadonlyMap<string, number>;
  commanderKey: string;
  armed: PlayableOrder | null;
  /** Share of the army pushing forward, 0 to 100. */
  attack: number;
  wards: readonly string[];
  queue: readonly Step[];
  /** Milliseconds between two steps of whatever is draining now. */
  tick: number;
  marks: readonly Mark[];
  serial: number;
  report: PlayReport | null;
};

export type PlayAction =
  | { type: "arm"; order: PlayableOrder | null }
  | { type: "attack"; value: number }
  | { type: "aim"; key: string }
  | { type: "advance" }
  | { type: "resolve" }
  | { type: "reset" };

export type WorldPlay = {
  owners: Owners;
  commanderKey: string;
  armed: PlayableOrder | null;
  attack: number;
  wards: readonly string[];
  marks: readonly Mark[];
  report: PlayReport | null;
  standings: readonly StandingsRow[];
  /** Ground is still changing hands. */
  busy: boolean;
  arm: (order: PlayableOrder | null) => void;
  setAttack: (value: number) => void;
  aimAt: (key: string) => void;
  reset: () => void;
};

function clampShare(value: number): number {
  return Math.round(Math.min(MAX_SHARE, Math.max(MIN_SHARE, value)));
}

/** Attack buys reach: one ring at the bottom of the slider, three at the top. */
function reachOf(attack: number): number {
  return 1 + Math.round((clampShare(attack) / MAX_SHARE) * 2);
}

/** Hold buys line. The same slider, read from the other end. */
function lineOf(attack: number): number {
  return 4 + Math.round(((MAX_SHARE - clampShare(attack)) / MAX_SHARE) * 6);
}

function markOf(kind: StepKind): MarkKind {
  if (kind === "ward") return "ward";
  if (kind === "strike") return "strike";
  if (kind === "echo") return "echo";

  return "claim";
}

/**
 * Land within reach of a tile, nearest first.
 *
 * The tie break on coordinates is not cosmetic: it is what makes an order
 * unroll in the same order every time, which is the difference between a
 * ripple and a shuffle.
 */
function ringOf(world: World, from: Tile, radius: number): Tile[] {
  return world.tiles
    .filter(
      (tile) =>
        tile.land && hexDistance(tile.q, tile.r, from.q, from.r) <= radius
    )
    .map((tile) => ({
      tile,
      at: hexDistance(tile.q, tile.r, from.q, from.r),
    }))
    .sort((a, b) => a.at - b.at || a.tile.r - b.tile.r || a.tile.q - b.tile.q)
    .map((entry) => entry.tile);
}

function nearestFirst(tiles: Tile[], from: Tile): Tile[] {
  return tiles
    .map((tile) => ({ tile, at: hexDistance(tile.q, tile.r, from.q, from.r) }))
    .sort((a, b) => a.at - b.at || a.tile.r - b.tile.r || a.tile.q - b.tile.q)
    .map((entry) => entry.tile);
}

/** Walk there, taking everything stepped on. */
function planMarch(world: World, state: PlayState, target: Tile): Plan {
  const route = findPath(world, state.owners, state.commanderKey, target.key);

  return {
    order: "march",
    steps: route.map((key) => ({ key, kind: "walk" })),
    tick: WALK_TICK,
  };
}

/** Push into whatever is still open around the target, ring by ring. */
function planExpand(world: World, state: PlayState, target: Tile): Plan {
  const open = ringOf(world, target, reachOf(state.attack)).filter(
    (tile) => state.owners.get(tile.key) === undefined
  );

  return {
    order: "expand",
    steps: open
      .slice(0, EXPAND_CAP)
      .map((tile) => ({ key: tile.key, kind: "claim" })),
    tick: BURST_TICK,
  };
}

/**
 * One thin spear along the route the Seeded would have walked, without the
 * Seeded. The commander stays where they are, which is exactly what makes a
 * Blitz a gamble rather than a faster march.
 */
function planBlitz(world: World, state: PlayState, target: Tile): Plan {
  const route = findPath(world, state.owners, state.commanderKey, target.key);
  const depth = Math.min(SPEAR_CAP, 4 + reachOf(state.attack) * 3);

  return {
    order: "blitz",
    steps: route.slice(0, depth).map((key) => ({ key, kind: "claim" })),
    tick: SPEAR_TICK,
  };
}

/** Wall the stretch of your own border nearest the target. */
function planFortify(world: World, state: PlayState, target: Tile): Plan {
  const warded = new Set(state.wards);
  const line = world.tiles.filter((tile) => {
    if (state.owners.get(tile.key) !== PLAYER) return false;
    if (warded.has(tile.key)) return false;

    for (let direction = 0; direction < 6; direction += 1) {
      const next = neighbourOf(world, tile, direction);

      if (next?.land && state.owners.get(next.key) !== PLAYER) return true;
    }

    return false;
  });

  return {
    order: "fortify",
    steps: nearestFirst(line, target)
      .slice(0, lineOf(state.attack))
      .map((tile) => ({ key: tile.key, kind: "ward" })),
    tick: LINE_TICK,
  };
}

/**
 * Weather rolling out from where it was called.
 *
 * Every tile it crosses feels it, but only rival ground changes hands, and only
 * for as long as the storm holds. That is the trade against Expand, which takes
 * open ground and cannot touch a rival at all.
 */
function planStorm(world: World, state: PlayState, target: Tile): Plan {
  const reach = reachOf(state.attack);
  const swept = ringOf(world, target, reach + 1).slice(0, RIPPLE_CAP);
  let flips = reach;

  return {
    order: "storm",
    steps: swept.map((tile) => {
      const holder = state.owners.get(tile.key);

      if (holder !== undefined && holder !== PLAYER && flips > 0) {
        flips -= 1;

        return { key: tile.key, kind: "strike" };
      }

      return { key: tile.key, kind: "echo" };
    }),
    tick: RIPPLE_TICK,
  };
}

function planFor(world: World, state: PlayState, target: Tile): Plan {
  switch (state.armed) {
    case "expand":
      return planExpand(world, state, target);
    case "blitz":
      return planBlitz(world, state, target);
    case "fortify":
      return planFortify(world, state, target);
    case "storm":
      return planStorm(world, state, target);
    default:
      return planMarch(world, state, target);
  }
}

/** Hand the queue over to a fresh plan and put the card back in the hand. */
function begin(state: PlayState, plan: Plan): PlayState {
  const serial = state.serial + 1;
  const taken = plan.steps.filter((step) => step.kind !== "echo").length;

  return {
    ...state,
    armed: null,
    queue: plan.steps,
    tick: plan.tick,
    report: { order: plan.order, taken, serial },
    serial,
  };
}

function applyStep(world: World, state: PlayState, step: Step): PlayState {
  const serial = state.serial + 1;
  const marks = [
    ...state.marks,
    { key: step.key, kind: markOf(step.kind), serial },
  ].slice(-MARK_LIMIT);

  if (step.kind === "echo") return { ...state, marks, serial };

  if (step.kind === "ward") {
    return {
      ...state,
      marks,
      serial,
      wards: state.wards.includes(step.key)
        ? state.wards
        : [...state.wards, step.key],
    };
  }

  const tile = world.byKey.get(step.key);
  const owners = tile?.land
    ? new Map(state.owners).set(step.key, PLAYER)
    : state.owners;

  return {
    ...state,
    marks,
    serial,
    owners,
    commanderKey: step.kind === "walk" ? step.key : state.commanderKey,
  };
}

/**
 * Where the Seeded starts.
 *
 * The generator hands back an empty spawn list for a grid too small to hold
 * four houses, so there is a fallback rather than a crash on a world nobody
 * would ever ask for.
 */
function startKey(world: World): string {
  const spawn = world.spawns[0];

  if (spawn !== undefined) return spawn;

  return world.tiles.find((tile) => tile.land)?.key ?? "";
}

function initial(world: World): PlayState {
  return {
    owners: world.initialOwners,
    commanderKey: startKey(world),
    armed: null,
    attack: OPENING_ATTACK,
    wards: [],
    queue: [],
    tick: WALK_TICK,
    marks: [],
    serial: 0,
    report: null,
  };
}

function reduce(world: World, state: PlayState, action: PlayAction): PlayState {
  switch (action.type) {
    case "arm":
      return { ...state, armed: action.order };

    case "attack":
      return { ...state, attack: clampShare(action.value) };

    case "aim": {
      const target = world.byKey.get(action.key);

      // Retargeting mid march is on purpose: changing your mind halfway is
      // the whole reason the walk is slow enough to watch.
      return target?.land ? begin(state, planFor(world, state, target)) : state;
    }

    case "advance": {
      const [next, ...rest] = state.queue;

      return next === undefined
        ? state
        : { ...applyStep(world, state, next), queue: rest };
    }

    case "resolve": {
      let settled = state;

      for (const step of state.queue) settled = applyStep(world, settled, step);

      return { ...settled, queue: [], marks: [] };
    }

    case "reset":
      return initial(world);
  }
}

/**
 * @param animate false resolves every order the instant it is given, which is
 * what prefers-reduced-motion asks for: the world still works, it just never
 * moves.
 */
export function useWorldPlay(world: World, animate: boolean): WorldPlay {
  const step = useCallback(
    (state: PlayState, action: PlayAction) => reduce(world, state, action),
    [world]
  );

  const [state, dispatch] = useReducer(step, world, initial);

  useEffect(() => {
    if (state.queue.length === 0) return;

    if (!animate) {
      dispatch({ type: "resolve" });
      return;
    }

    const timer = window.setTimeout(
      () => dispatch({ type: "advance" }),
      state.tick
    );

    return () => window.clearTimeout(timer);
  }, [animate, state.queue, state.tick]);

  const land = useMemo(
    () => world.tiles.filter((tile) => tile.land).length,
    [world]
  );

  const standings = useMemo(() => {
    const counts = holdings(world, state.owners);

    return HOUSES.map((house, index) => ({
      house,
      share: land === 0 ? 0 : counts[index] / land,
    }));
  }, [world, state.owners, land]);

  const arm = useCallback((order: PlayableOrder | null) => {
    dispatch({ type: "arm", order });
  }, []);

  const setAttack = useCallback((value: number) => {
    dispatch({ type: "attack", value });
  }, []);

  const aimAt = useCallback((key: string) => {
    dispatch({ type: "aim", key });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "reset" });
  }, []);

  return {
    owners: state.owners,
    commanderKey: state.commanderKey,
    armed: state.armed,
    attack: state.attack,
    wards: state.wards,
    marks: state.marks,
    report: state.report,
    standings,
    busy: state.queue.length > 0,
    arm,
    setAttack,
    aimAt,
    reset,
  };
}
