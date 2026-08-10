"use client";

/**
 * The clock that drives a match and the bridge into React.
 *
 * The simulation lives in a ref and is mutated in place; React re-renders on a
 * version counter bumped once per sim tick, which at four ticks a second is
 * cheap. The interval measures real elapsed time and catches up in whole
 * ticks, so a backgrounded or throttled tab slows the frame rate without
 * bending the match clock.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OrderKey } from "@/components/game/cards/orders";

import { castAbility } from "../sim/abilities";
import { stepBots } from "../sim/ai";
import { applyInput, createMatch, startFront, stepMatch } from "../sim/engine";
import { playOrder } from "../sim/orders";
import { type MatchOutcome, scoreMatch } from "../sim/score";
import {
  type MatchConfig,
  type MatchState,
  PLAYER,
  type RelicId,
  TICKS_PER_SECOND,
} from "../sim/types";

const TICK_MS = 1000 / TICKS_PER_SECOND;

/** Most ticks one interval callback may replay after a stall. */
const CATCH_UP = 8;

export type ArmedCard =
  | { kind: "order"; slot: number }
  | { kind: "ability" }
  | null;

export type MatchHandle = {
  state: MatchState;
  /** Monotonic tick version; memo against this to recompute per sim tick. */
  version: number;
  paused: boolean;
  armed: ArmedCard;
  outcome: MatchOutcome | null;
  setPaused: (paused: boolean) => void;
  setArmed: (armed: ArmedCard) => void;
  setSlider: (value: number) => void;
  /** A tap on the map: routes to the armed card or opens an attack front. */
  aimAt: (key: string) => boolean;
  chooseRelic: (relic: RelicId) => void;
};

export function useMatch(
  config: MatchConfig,
  onEnd: (outcome: MatchOutcome) => void
): MatchHandle {
  const stateRef = useRef<MatchState | null>(null);

  if (stateRef.current === null || stateRef.current.config !== config) {
    stateRef.current = createMatch(config);
  }

  const state = stateRef.current;
  const [version, setVersion] = useState(0);
  const [paused, setPaused] = useState(false);
  const [armed, setArmed] = useState<ArmedCard>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);

  onEndRef.current = onEnd;

  useEffect(() => {
    endedRef.current = false;
    setOutcome(null);
    setArmed(null);
    setVersion(0);
  }, []);

  useEffect(() => {
    if (paused || state.over) return;

    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      let due = Math.floor((now - last) / TICK_MS);

      if (due <= 0) return;

      due = Math.min(due, CATCH_UP);
      // Advance by whole ticks only, keeping the fractional remainder, so the
      // match clock never silently drifts behind the wall clock.
      last += due * TICK_MS;

      if (now - last > CATCH_UP * TICK_MS) last = now - CATCH_UP * TICK_MS;

      for (let step = 0; step < due && !state.over; step += 1) {
        if (state.relicOffer !== null) break;

        stepBots(state);
        stepMatch(state);
      }

      setVersion((current) => current + 1);

      if (state.over && !endedRef.current) {
        endedRef.current = true;

        const scored = scoreMatch(state);

        setOutcome(scored);
        onEndRef.current(scored);
      }
    }, TICK_MS);

    return () => window.clearInterval(timer);
  }, [paused, state]);

  const setSlider = useCallback(
    (value: number) => {
      applyInput(state, { type: "slider", value });
      setVersion((current) => current + 1);
    },
    [state]
  );

  const aimAt = useCallback(
    (key: string): boolean => {
      if (state.over || state.relicOffer !== null) return false;

      let landed: boolean;

      if (armed?.kind === "order") {
        landed = playOrder(state, armed.slot, key);
      } else if (armed?.kind === "ability") {
        landed = castAbility(state, key);
      } else {
        landed = startFront(state, PLAYER, key, state.attack / 100);
      }

      if (landed) setArmed(null);

      setVersion((current) => current + 1);

      return landed;
    },
    [state, armed]
  );

  const chooseRelic = useCallback(
    (relic: RelicId) => {
      applyInput(state, { type: "relic", relic });
      setVersion((current) => current + 1);
    },
    [state]
  );

  return useMemo(
    () => ({
      state,
      version,
      paused,
      armed,
      outcome,
      setPaused,
      setArmed,
      setSlider,
      aimAt,
      chooseRelic,
    }),
    [state, version, paused, armed, outcome, setSlider, aimAt, chooseRelic]
  );
}

/** Orders in hand ready to aim right now, for the HUD. */
export function readySlots(state: MatchState): boolean[] {
  return state.hand.map(
    (slot) => slot.charges > 0 && slot.readyAt <= state.tick
  );
}

export type HandView = {
  order: OrderKey;
  charges: number;
  /** 0 when ready, otherwise the fraction of cooldown still to run. */
  cooldown: number;
};

export function handView(state: MatchState, cooldownTicks: number): HandView[] {
  return state.hand.map((slot) => ({
    order: slot.order,
    charges: slot.charges,
    cooldown:
      slot.readyAt <= state.tick || slot.charges <= 0
        ? 0
        : Math.min(1, (slot.readyAt - state.tick) / cooldownTicks),
  }));
}
