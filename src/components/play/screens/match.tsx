"use client";

/**
 * The match screen: the living map in the middle, glass HUD above and below.
 *
 * Top bar carries the clock and the standings, bottom bar carries the army
 * split, the drafted orders and the commander. Pulses and eliminations sweep
 * in as banners, the forge interrupts with a relic choice, and when the world
 * finally goes dark the screen holds a beat before the tally.
 */

import { Pause } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { CardArt } from "@/components/game/cards/card-art";
import { ORDERS } from "@/components/game/cards/orders";
import { ForceSlider } from "@/components/game/hud/force-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { freeSkinOf, skinById } from "../meta/commanders";
import type { Profile } from "../meta/profile";
import type { MatchIntent } from "../play-app";
import { FxCanvas } from "../render/fx-canvas";
import { CommanderPortrait } from "../render/portrait";
import { MatchStage } from "../render/stage";
import { handView, useMatch } from "../render/use-match";
import { abilityCooldown, orderCooldown } from "../sim/engine";
import type { MatchOutcome } from "../sim/score";
import {
  type MatchConfig,
  type MatchState,
  PLAYER,
  type PulseId,
  type RelicId,
  secondsLeft,
} from "../sim/types";
import { ShardIcon } from "./icons";

const HOUSE_DOT = [
  "bg-seed-gold",
  "bg-seed-teal",
  "bg-seed-violet",
  "bg-destructive",
] as const;

const HOUSE_KEYS = ["gold", "teal", "violet", "danger"] as const;

/** Banner-worthy event types, mapped to a tone. */
const BANNER_TONE: Record<string, "gold" | "teal" | "violet" | "danger"> = {
  pulse: "teal",
  elimination: "danger",
  forge: "violet",
  wonder: "gold",
  relic: "violet",
};

type BannerItem = {
  id: number;
  text: string;
  tone: "gold" | "teal" | "violet" | "danger";
};

function clock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;

  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function SunArc({ progress }: { progress: number }) {
  const angle = Math.PI * (1 - progress);
  const x = 22 + 18 * Math.cos(angle);
  const y = 22 - 16 * Math.sin(angle);

  return (
    <svg aria-hidden="true" className="h-6 w-11" viewBox="0 0 44 24">
      <path
        className="stroke-seed-line-strong"
        d="M 4 22 A 18 16 0 0 1 40 22"
        fill="none"
        strokeDasharray="2 2.4"
        strokeWidth={1.4}
      />
      <circle
        className={progress > 0.7 ? "fill-seed-violet" : "fill-seed-gold"}
        cx={x}
        cy={y}
        r={3.2}
      />
    </svg>
  );
}

type MatchScreenProps = {
  config: MatchConfig;
  intent: MatchIntent;
  profile: Profile;
  onEnd: (state: MatchState, outcome: MatchOutcome) => void;
  onQuit: () => void;
};

export function MatchScreen({
  config,
  intent,
  profile,
  onEnd,
  onQuit,
}: MatchScreenProps) {
  const t = useTranslations("Play");
  const tGame = useTranslations("Game");
  const reduced = useReducedMotion();
  const animate = reduced === false;

  const skin =
    skinById(profile.equipped[config.commander]) ??
    freeSkinOf(config.commander);

  const endedRef = useRef(false);
  const pendingRef = useRef<{ timer: number; outcome: MatchOutcome } | null>(
    null
  );
  const handleEnd = useCallback((outcome: MatchOutcome) => {
    // Hold the final frame for a breath before the tally lands.
    if (endedRef.current) return;

    endedRef.current = true;

    const timer = window.setTimeout(() => {
      pendingRef.current = null;
      onEndRef.current(outcome);
    }, 1900);

    pendingRef.current = { timer, outcome };
  }, []);

  // A finished match must reach the ledger even if this screen is torn down
  // during the closing beat.
  useEffect(
    () => () => {
      const pending = pendingRef.current;

      if (pending) {
        pendingRef.current = null;
        window.clearTimeout(pending.timer);
        onEndRef.current(pending.outcome);
      }
    },
    []
  );
  const match = useMatch(config, handleEnd);
  const onEndRef = useRef((outcome: MatchOutcome) =>
    onEnd(match.state, outcome)
  );

  onEndRef.current = (outcome: MatchOutcome) => onEnd(match.state, outcome);

  const { state, version } = match;
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const seenRef = useRef(0);
  const collapseAnnounced = useRef(false);

  const pushBanner = useCallback((text: string, tone: BannerItem["tone"]) => {
    const id = Date.now() + Math.random();

    setBanners((current) => [...current.slice(-1), { id, text, tone }]);
    window.setTimeout(() => {
      setBanners((current) => current.filter((banner) => banner.id !== id));
    }, 3600);
  }, []);

  // Drain sim events into banners once per sim tick. The state object is
  // mutated in place, so the tick version is the signal that re-runs this.
  useEffect(() => {
    if (version < 0) return;

    for (const event of state.events) {
      if (event.serial <= seenRef.current) continue;

      seenRef.current = event.serial;

      const tone = BANNER_TONE[event.type];

      if (!tone) continue;

      // Pulses emit one keyless summary event plus one event per tile struck;
      // only the summary earns a banner.
      if (event.type === "pulse" && event.detail && event.key === null) {
        pushBanner(t(`pulses.${event.detail as PulseId}.title`), "teal");
      } else if (event.type === "elimination") {
        pushBanner(
          t("match.eliminated", {
            house: tGame(`hud.standings.houses.${HOUSE_KEYS[event.house]}`),
          }),
          "danger"
        );
      } else if (event.type === "forge" && event.house !== PLAYER) {
        pushBanner(t("match.forgeLost"), "violet");
      } else if (event.type === "wonder") {
        pushBanner(
          t("match.wonderTaken", {
            house: tGame(`hud.standings.houses.${HOUSE_KEYS[event.house]}`),
          }),
          "gold"
        );
      }
    }

    const collapseStart = Math.floor(state.config.duration * 0.7);

    if (!collapseAnnounced.current && state.tick >= collapseStart) {
      collapseAnnounced.current = true;
      pushBanner(t("match.collapseBegins"), "danger");
    }
  }, [state, version, pushBanner, t, tGame]);

  const seconds = secondsLeft(state);
  const progress = Math.min(1, state.tick / state.config.duration);
  const me = state.houses[PLAYER];
  const share = state.landAlive > 0 ? me.territory / state.landAlive : 0;
  // Cheap enough to rebuild every render; the screen renders at sim rate.
  const hand = handView(state, orderCooldown(state));
  const abilityCd =
    state.abilityReadyAt <= state.tick || state.abilityCharges <= 0
      ? 0
      : Math.min(
          1,
          (state.abilityReadyAt - state.tick) / abilityCooldown(state)
        );

  const onTap = useCallback(
    (key: string) => {
      const landed = match.aimAt(key);

      if (!landed && match.armed === null) {
        const holder = state.owners.get(key);

        if (holder !== PLAYER) pushBanner(t("match.cannotReach"), "teal");
      }
    },
    [match, state, pushBanner, t]
  );

  const practice = intent.mode === "daily" && !intent.official;
  // While a modal layer is up, everything behind it goes inert so focus and
  // taps cannot leak into the running HUD.
  const veiled =
    state.relicOffer !== null || match.paused || match.outcome !== null;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-seed-bg">
      {/* Top bar */}
      <header
        className="z-10 border-seed-line border-b bg-seed-glass backdrop-blur-xl"
        inert={veiled || undefined}
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-3 py-2 sm:px-5">
          <Button
            aria-label={t("match.pause")}
            onClick={() => match.setPaused(true)}
            size="icon-sm"
            variant="ghost"
          >
            <Pause aria-hidden="true" className="size-4" />
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Badge size="sm" variant="gold">
              {tGame(`hud.conditions.${config.condition}`)}
            </Badge>
            {config.decree ? (
              <Badge
                className="hidden sm:inline-flex"
                size="sm"
                variant="violet"
              >
                {tGame(`hud.decrees.${config.decree}`)}
              </Badge>
            ) : null}
            {practice ? (
              <Badge size="sm" variant="teal">
                {t("match.practice")}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <SunArc progress={progress} />
            <span
              className={cn(
                "font-mono text-sm tabular-nums",
                seconds <= 30 ? "text-seed-danger" : "text-seed-text"
              )}
            >
              {clock(seconds)}
            </span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 pb-2 sm:px-5">
          {state.houses.map((house, index) => {
            const houseShare =
              state.landAlive > 0 ? house.territory / state.landAlive : 0;

            return (
              <div
                className="flex flex-1 items-center gap-1.5"
                key={HOUSE_KEYS[index]}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    HOUSE_DOT[index],
                    !house.alive && "opacity-30"
                  )}
                />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-seed-bg">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      HOUSE_DOT[index],
                      !house.alive && "opacity-30"
                    )}
                    style={{ width: `${Math.round(houseShare * 100)}%` }}
                  />
                </div>
                <span className="w-7 text-right font-mono text-[0.65rem] text-seed-muted tabular-nums">
                  {Math.round(houseShare * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Banners */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 top-24 z-20 flex flex-col items-center gap-2 px-4"
        role="status"
      >
        <AnimatePresence>
          {banners.map((banner) => (
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                // Dark glass under the tint keeps the text readable over
                // snowfields and bright coasts alike.
                "rounded-full border bg-seed-glass px-4 py-1.5 font-display font-semibold text-sm shadow-panel backdrop-blur-xl",
                {
                  gold: "border-seed-gold-edge bg-linear-to-r from-seed-gold-tint to-seed-gold-tint text-seed-gold",
                  teal: "border-seed-teal-edge bg-linear-to-r from-seed-teal-tint to-seed-teal-tint text-seed-teal",
                  violet:
                    "border-seed-violet-edge bg-linear-to-r from-seed-violet-tint to-seed-violet-tint text-seed-violet",
                  danger:
                    "border-seed-danger-edge bg-linear-to-r from-seed-danger-tint to-seed-danger-tint text-seed-danger",
                }[banner.tone]
              )}
              exit={{ opacity: 0, y: -8 }}
              initial={{ opacity: 0, y: 12 }}
              key={banner.id}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              {banner.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>

      {/* The world */}
      <div className="flex min-h-0 flex-1" inert={veiled || undefined}>
        <MatchStage
          animate={animate}
          armed={match.armed !== null}
          className="min-h-0 flex-1"
          label={t("match.mapLabel")}
          onTap={onTap}
          skin={skin}
          state={state}
          version={version}
        >
          <FxCanvas skin={skin} state={state} />
        </MatchStage>
      </div>

      {/* Bottom bar */}
      <footer
        className="z-10 border-seed-line border-t bg-seed-glass backdrop-blur-xl"
        inert={veiled || undefined}
      >
        <div className="mx-auto w-full max-w-3xl px-3 py-2.5 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-sm tabular-nums">
              <span className="text-seed-gold">{Math.floor(me.troops)}</span>{" "}
              <span className="text-seed-muted text-xs uppercase tracking-wide">
                {t("match.troops")}
              </span>
            </p>
            <p className="font-mono text-seed-muted text-xs tabular-nums">
              {t("match.held", { percent: Math.round(share * 100) })}
            </p>
            {config.condition === "relicHunt" || me.spoils > 0 ? (
              <p className="inline-flex items-center gap-1 font-mono text-seed-gold text-sm tabular-nums">
                <ShardIcon className="size-3" />
                {me.spoils}
              </p>
            ) : null}
          </div>

          <div className="mt-2">
            <ForceSlider onChange={match.setSlider} value={state.attack} />
          </div>

          <div className="mt-2 flex items-stretch gap-2">
            {hand.map((slot, index) => {
              const order = ORDERS.find((entry) => entry.key === slot.order);

              if (!order) return null;

              const armed =
                match.armed?.kind === "order" && match.armed.slot === index;
              const dead = slot.charges <= 0;
              const cooling = slot.cooldown > 0;

              return (
                <button
                  aria-label={tGame(`cards.${slot.order}.name`)}
                  aria-pressed={armed}
                  className={cn(
                    "group relative flex-1 overflow-hidden rounded-lg border transition-all",
                    armed
                      ? "border-seed-gold shadow-glow-gold"
                      : "border-seed-line hover:border-seed-line-strong",
                    (dead || cooling) && "opacity-45"
                  )}
                  disabled={dead || cooling}
                  key={slot.order}
                  onClick={() =>
                    match.setArmed(
                      armed ? null : { kind: "order", slot: index }
                    )
                  }
                  type="button"
                >
                  <span className="pointer-events-none block h-[clamp(3.5rem,12dvh,8rem)]">
                    <CardArt art={order.art} />
                  </span>
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-seed-bg to-transparent px-1.5 pt-3 pb-1 text-left">
                    <span className="block truncate font-display font-semibold text-[0.65rem]">
                      {tGame(`cards.${slot.order}.name`)}
                    </span>
                  </span>
                  <span className="pointer-events-none absolute top-1 right-1 flex gap-0.5">
                    {Array.from({ length: slot.charges }, (_, pip) => (
                      <span
                        className="size-1.5 rounded-full bg-seed-gold"
                        // biome-ignore lint/suspicious/noArrayIndexKey: pips are anonymous.
                        key={pip}
                      />
                    ))}
                  </span>
                  {cooling ? (
                    <span
                      className="pointer-events-none absolute inset-0 bg-seed-scrim"
                      style={{
                        clipPath: `inset(0 0 ${(1 - slot.cooldown) * 100}% 0)`,
                      }}
                    />
                  ) : null}
                </button>
              );
            })}

            <button
              aria-label={t(`commanders.${config.commander}.abilityName`)}
              aria-pressed={match.armed?.kind === "ability"}
              className={cn(
                "relative w-16 shrink-0 overflow-hidden rounded-lg border transition-all",
                match.armed?.kind === "ability"
                  ? "border-seed-gold shadow-glow-gold"
                  : "border-seed-line-strong hover:border-seed-line-bright",
                (state.abilityCharges <= 0 || abilityCd > 0) && "opacity-45"
              )}
              disabled={state.abilityCharges <= 0 || abilityCd > 0}
              onClick={() =>
                match.setArmed(
                  match.armed?.kind === "ability" ? null : { kind: "ability" }
                )
              }
              type="button"
            >
              <CommanderPortrait
                className="size-full"
                commander={config.commander}
                skin={skin}
              />
              <span className="pointer-events-none absolute top-1 right-1 flex gap-0.5">
                {Array.from({ length: state.abilityCharges }, (_, pip) => (
                  <span
                    className="size-1.5 rounded-full bg-seed-teal"
                    // biome-ignore lint/suspicious/noArrayIndexKey: pips are anonymous.
                    key={pip}
                  />
                ))}
              </span>
              {abilityCd > 0 ? (
                <span
                  className="pointer-events-none absolute inset-0 bg-seed-scrim"
                  style={{ clipPath: `inset(0 0 ${(1 - abilityCd) * 100}% 0)` }}
                />
              ) : null}
            </button>
          </div>
        </div>
      </footer>

      {/* Relic choice */}
      {state.relicOffer ? (
        <RelicModal offer={state.relicOffer} onPick={match.chooseRelic} />
      ) : null}

      {/* Pause */}
      {match.paused ? (
        <div
          aria-labelledby="sr-pause-title"
          aria-modal="true"
          className="absolute inset-0 z-30 flex items-center justify-center bg-seed-scrim p-6 backdrop-blur-sm"
          onKeyDown={(event) => {
            if (event.key === "Escape") match.setPaused(false);
          }}
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-seed-line-strong bg-seed-panel-raised p-6 shadow-raised">
            <h2 className="font-bold font-display text-2xl" id="sr-pause-title">
              {t("match.pausedTitle")}
            </h2>
            <p className="mt-2 text-seed-muted text-sm">
              {tGame(`hud.conditions.${config.condition}`)}
              {config.decree
                ? ` · ${tGame(`hud.decrees.${config.decree}`)}`
                : null}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button
                autoFocus
                onClick={() => match.setPaused(false)}
                size="lg"
                variant="play"
              >
                {t("match.resume")}
              </Button>
              <Button onClick={onQuit} size="lg" variant="outline">
                {t("match.abandon")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* The final frame */}
      {match.outcome ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-seed-scrim/80">
          <motion.p
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "font-bold font-display text-4xl tracking-tight sm:text-5xl",
              match.outcome.victory ? "text-seed-gold" : "text-seed-text"
            )}
            initial={
              animate ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >
            {match.outcome.victory ? t("match.victory") : t("match.duskFalls")}
          </motion.p>
        </div>
      ) : null}
    </div>
  );
}

function RelicModal({
  offer,
  onPick,
}: {
  offer: readonly RelicId[];
  onPick: (relic: RelicId) => void;
}) {
  const t = useTranslations("Play");

  return (
    <div
      aria-labelledby="sr-relic-title"
      aria-modal="true"
      className="absolute inset-0 z-30 flex items-center justify-center bg-seed-scrim p-5 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md">
        <p className="text-center font-medium text-seed-violet text-xs uppercase tracking-[0.22em]">
          {t("match.relics.kicker")}
        </p>
        <h2
          className="mt-2 text-center font-bold font-display text-2xl"
          id="sr-relic-title"
        >
          {t("match.relics.title")}
        </h2>
        <div className="mt-5 flex flex-col gap-3">
          {offer.map((relic, _index) => (
            <button
              className="rounded-xl border border-seed-violet-edge bg-seed-panel-raised p-4 text-left shadow-panel transition-all hover:border-seed-violet hover:shadow-glow-violet"
              key={relic}
              onClick={() => onPick(relic)}
              type="button"
            >
              <p className="font-display font-semibold text-seed-violet">
                {t(`relics.${relic}.name`)}
              </p>
              <p className="mt-1 text-seed-muted text-sm">
                {t(`relics.${relic}.desc`)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
