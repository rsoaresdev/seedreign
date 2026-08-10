"use client";

/**
 * The hub: today's world above the fold, every other way to play below it.
 *
 * This is the screen the ritual lives on, so the daily card gets the stage
 * treatment: the world number in display type, the day's condition and Decree,
 * the commander the seed assigned, a dusk clock actually ticking toward the
 * next Sowing and one glowing PLAY. Everything else is a smaller door.
 */

import {
  ChevronRight,
  Flame,
  Hammer,
  Shield,
  Swords,
  Timer,
  Trophy,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { skinById } from "../meta/commanders";
import type { DailyBrief } from "../meta/daily";
import {
  isOfficialSeed,
  msUntilNextWorld,
  parseForgeCode,
  weeklyBrief,
  weeklyNumberAt,
} from "../meta/daily";
import {
  daysLeftInEra,
  eraIdAt,
  eraNameKey,
  eraNumber,
  tierOf,
  tierProgress,
} from "../meta/era";
import type { Profile } from "../meta/profile";
import { clearProfile, defaultProfile } from "../meta/profile";
import type { MatchIntent } from "../play-app";
import { CommanderPortrait } from "../render/portrait";
import type { ConditionId, Difficulty } from "../sim/types";
import { GemIcon, ShardIcon } from "./icons";

const TIER_KEYS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "legend",
] as const;

const CONDITION_CHOICES: readonly ConditionId[] = [
  "conquest",
  "domination",
  "relicHunt",
  "blitz",
];

function useDuskClock(): string {
  const [label, setLabel] = useState("--:--:--");

  useEffect(() => {
    const paint = () => {
      const ms = msUntilNextWorld(Date.now());
      const total = Math.floor(ms / 1000);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      const seconds = total % 60;

      setLabel(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
          seconds
        ).padStart(2, "0")}`
      );
    };

    paint();

    const timer = window.setInterval(paint, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return label;
}

export function CurrencyChips({ profile }: { profile: Profile }) {
  const t = useTranslations("Play.common");

  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-seed-gold-edge bg-seed-gold-tint px-3 py-1 font-mono text-seed-gold text-sm tabular-nums"
        title={t("shards")}
      >
        <ShardIcon className="size-3.5" />
        {profile.shards.toLocaleString()}
      </span>
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-seed-violet-edge bg-seed-violet-tint px-3 py-1 font-mono text-seed-violet text-sm tabular-nums"
        title={t("gems")}
      >
        <GemIcon className="size-3.5" />
        {profile.gems.toLocaleString()}
      </span>
    </div>
  );
}

type HubProps = {
  world: number;
  brief: DailyBrief;
  profile: Profile;
  updateProfile: (mutate: (profile: Profile) => Profile) => void;
  onStart: (intent: MatchIntent) => void;
  onArmory: () => void;
  onBoards: () => void;
};

export function HubScreen({
  world,
  brief,
  profile,
  updateProfile,
  onStart,
  onArmory,
  onBoards,
}: HubProps) {
  const t = useTranslations("Play");
  const tGame = useTranslations("Game.hud");
  const tBrand = useTranslations("Brand");
  const dusk = useDuskClock();
  const [heat, setHeat] = useState<Difficulty>(0);
  const [skirmishOpen, setSkirmishOpen] = useState(false);
  const [size, setSize] = useState<"small" | "large">("large");
  const [difficulty, setDifficulty] = useState<Difficulty>(1);
  const [condition, setCondition] = useState<ConditionId>("conquest");
  const [forgeOpen, setForgeOpen] = useState(false);
  const [forgeInput, setForgeInput] = useState("");
  const [forgeBad, setForgeBad] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  const played = profile.daily?.world === world ? profile.daily : null;
  // An attempt that started counts as spent even if it never finished.
  const spent = played !== null || profile.dailyAttemptWorld === world;
  const skin =
    skinById(profile.equipped[profile.commander]) ??
    skinById(profile.ownedSkins[0]);
  const dailySkin = skinById(profile.equipped[brief.commander]);
  const tier = tierOf(profile.era.points);
  const eraId = eraIdAt(Date.now());

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2">
          <span className="font-bold font-display text-lg tracking-tight">
            {tBrand("name")}
          </span>
          <Badge size="sm" variant="gold">
            {t("hub.eraBadge", { number: eraNumber(eraId) })}
          </Badge>
        </div>
        <CurrencyChips profile={profile} />
      </header>

      {profile.eraRecap ? (
        <section className="mb-4 rounded-xl border border-seed-violet-edge bg-seed-violet-tint p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-semibold text-seed-violet">
                {t("hub.recap.title", {
                  era: t(`eras.names.${eraNameKey(profile.eraRecap.eraId)}`),
                })}
              </p>
              <p className="mt-1 text-seed-muted text-sm">
                {t("hub.recap.body", {
                  points: profile.eraRecap.points,
                  tier: t(`tiers.${TIER_KEYS[profile.eraRecap.tier]}`),
                  gems: profile.eraRecap.gems,
                })}
              </p>
            </div>
            <Button
              onClick={() =>
                updateProfile((current) => ({ ...current, eraRecap: null }))
              }
              size="sm"
              variant="outline"
            >
              {t("common.claim")}
            </Button>
          </div>
        </section>
      ) : null}

      {/* Today's world: the main event. */}
      <section className="relative overflow-hidden rounded-2xl border border-seed-line-strong bg-seed-panel-raised shadow-raised">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(42rem 18rem at 18% -20%, var(--seed-glow-gold), transparent 70%), radial-gradient(36rem 16rem at 95% 0%, var(--seed-glow-teal), transparent 70%)",
          }}
        />

        <div className="relative p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-seed-teal text-xs uppercase tracking-[0.22em]">
              {t("hub.daily.kicker")}
            </p>
            <span className="inline-flex items-center gap-1.5 font-mono text-seed-muted text-xs uppercase tracking-[0.18em]">
              <span className="size-1.5 rounded-full bg-seed-gold motion-safe:animate-pulse-dot" />
              {tGame("dusk")}{" "}
              <span className="text-seed-text tabular-nums">{dusk}</span>
            </span>
          </div>

          <h1 className="mt-3 font-bold font-display text-4xl tracking-tight sm:text-5xl">
            {tGame("world")}{" "}
            <span className="text-seed-gold">{world.toLocaleString()}</span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="gold">
              {tGame(`conditions.${brief.condition}`)}
            </Badge>
            <Badge variant="violet">{tGame(`decrees.${brief.decree}`)}</Badge>
            {profile.streak.count > 0 ? (
              <Badge variant="teal">
                <Flame aria-hidden="true" className="size-3" />
                {t("hub.daily.streak", { count: profile.streak.count })}
              </Badge>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-4">
            {dailySkin ? (
              <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-seed-line-strong bg-seed-panel">
                <CommanderPortrait
                  className="size-full"
                  commander={brief.commander}
                  skin={dailySkin}
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="font-display font-semibold">
                {t(`commanders.${brief.commander}.name`)}
              </p>
              <p className="text-seed-muted text-sm">
                {t("hub.daily.assigned")}
              </p>
            </div>
          </div>

          {spent ? (
            <div className="mt-6 rounded-xl border border-seed-line bg-seed-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-seed-muted text-xs uppercase tracking-[0.18em]">
                    {t("hub.daily.playedLabel")}
                  </p>
                  {played ? (
                    <>
                      <p className="mt-1 font-bold font-display text-2xl text-seed-gold tabular-nums">
                        {played.score.toLocaleString()}
                      </p>
                      <p className="text-seed-muted text-sm">
                        {t("hub.daily.topPercent", {
                          percent: played.percentile,
                        })}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-seed-muted text-sm">
                      {t("hub.daily.spent")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={onBoards} size="sm" variant="outline">
                    {t("hub.daily.board")}
                  </Button>
                  <Button
                    onClick={() =>
                      onStart({ mode: "daily", brief, official: false })
                    }
                    size="sm"
                    variant="secondary"
                  >
                    {t("hub.daily.practice")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative mt-6">
              <span
                aria-hidden="true"
                className="absolute inset-0 mx-auto w-3/4 rounded-full bg-seed-gold opacity-40 blur-2xl motion-safe:animate-glow-pulse"
              />
              <Button
                className="relative w-full"
                onClick={() =>
                  onStart({ mode: "daily", brief, official: true })
                }
                size="xl"
                variant="play"
              >
                {t("hub.daily.play")}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* The other doors. */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ModeCard
          blurb={t("modes.blitz.blurb")}
          icon={<Timer aria-hidden="true" className="size-5" />}
          onClick={() =>
            onStart({
              mode: "blitz",
              seed: (Date.now() ^ (Math.random() * 0xffffff)) | 0,
            })
          }
          title={t("modes.blitz.title")}
          tone="gold"
        />

        <div className="rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel transition-colors hover:border-seed-line-strong">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-lg border border-seed-violet-edge bg-seed-violet-tint text-seed-violet">
              <Flame aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold">
                {t("modes.weekly.title")}
              </p>
              <p className="truncate text-seed-muted text-sm">
                {t("modes.weekly.blurb")}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {([0, 1, 2] as const).map((level) => (
              <button
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors",
                  heat === level
                    ? "border-seed-violet-edge bg-seed-violet-tint text-seed-violet"
                    : "border-seed-line text-seed-muted hover:border-seed-line-strong"
                )}
                aria-pressed={heat === level}
                key={level}
                onClick={() => setHeat(level)}
                type="button"
              >
                {t("hub.weekly.heat", { level: level + 1 })}
              </button>
            ))}
            <Button
              onClick={() =>
                onStart({
                  mode: "weekly",
                  brief: weeklyBrief(weeklyNumberAt(Date.now())),
                  heat,
                })
              }
              size="sm"
              variant="secondary"
            >
              {t("common.play")}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel transition-colors hover:border-seed-line-strong">
          <button
            className="flex w-full items-center gap-3 text-left"
            onClick={() => setSkirmishOpen((open) => !open)}
            type="button"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-lg border border-seed-teal-edge bg-seed-teal-tint text-seed-teal">
              <Swords aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold">
                {t("modes.skirmish.title")}
              </span>
              <span className="block truncate text-seed-muted text-sm">
                {t("modes.skirmish.blurb")}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-4 text-seed-muted transition-transform",
                skirmishOpen && "rotate-90"
              )}
            />
          </button>

          {skirmishOpen ? (
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                {(["small", "large"] as const).map((option) => (
                  <button
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase tracking-wide",
                      size === option
                        ? "border-seed-teal-edge bg-seed-teal-tint text-seed-teal"
                        : "border-seed-line text-seed-muted"
                    )}
                    aria-pressed={size === option}
                    key={option}
                    onClick={() => setSize(option)}
                    type="button"
                  >
                    {t(`hub.skirmish.size.${option}`)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {([0, 1, 2] as const).map((level) => (
                  <button
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase tracking-wide",
                      difficulty === level
                        ? "border-seed-teal-edge bg-seed-teal-tint text-seed-teal"
                        : "border-seed-line text-seed-muted"
                    )}
                    aria-pressed={difficulty === level}
                    key={level}
                    onClick={() => setDifficulty(level)}
                    type="button"
                  >
                    {t(`difficulty.${level}`)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {CONDITION_CHOICES.map((option) => (
                  <button
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide",
                      condition === option
                        ? "border-seed-teal-edge bg-seed-teal-tint text-seed-teal"
                        : "border-seed-line text-seed-muted"
                    )}
                    aria-pressed={condition === option}
                    key={option}
                    onClick={() => setCondition(option)}
                    type="button"
                  >
                    {tGame(`conditions.${option}`)}
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  onStart({
                    mode: "skirmish",
                    seed: (Date.now() ^ (Math.random() * 0xffffff)) | 0,
                    size,
                    difficulty,
                    condition,
                  })
                }
                variant="secondary"
              >
                {t("common.play")}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel transition-colors hover:border-seed-line-strong">
          <button
            className="flex w-full items-center gap-3 text-left"
            onClick={() => setForgeOpen((open) => !open)}
            type="button"
          >
            <span className="inline-flex size-11 items-center justify-center rounded-lg border border-seed-gold-edge bg-seed-gold-tint text-seed-gold">
              <Hammer aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display font-semibold">
                {t("modes.forge.title")}
              </span>
              <span className="block truncate text-seed-muted text-sm">
                {t("modes.forge.blurb")}
              </span>
            </span>
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-4 text-seed-muted transition-transform",
                forgeOpen && "rotate-90"
              )}
            />
          </button>

          {forgeOpen ? (
            <div className="mt-3 flex gap-2">
              <input
                aria-invalid={forgeBad}
                aria-label={t("hub.forge.codeLabel")}
                className={cn(
                  "min-w-0 flex-1 rounded-lg border bg-seed-bg px-3 py-2 font-mono text-sm uppercase tracking-widest placeholder:text-seed-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  forgeBad
                    ? "border-seed-danger-edge"
                    : "border-seed-line-bright"
                )}
                onChange={(event) => {
                  setForgeInput(event.target.value);
                  setForgeBad(false);
                }}
                placeholder={t("hub.forge.placeholder")}
                value={forgeInput}
              />
              <Button
                onClick={() => {
                  const seed =
                    forgeInput.trim() === ""
                      ? (Date.now() ^ (Math.random() * 0xffffff)) | 0
                      : parseForgeCode(forgeInput);

                  // Official maps cannot be forged; scouting the daily would
                  // be one shared code away.
                  if (seed === null || isOfficialSeed(seed, Date.now())) {
                    setForgeBad(true);

                    return;
                  }

                  onStart({ mode: "forge", seed });
                }}
                variant="default"
              >
                {t("hub.forge.sow")}
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Wardrobe and ladder. */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          className="group flex items-center gap-4 rounded-xl border border-seed-line bg-seed-panel p-4 text-left shadow-panel transition-all hover:border-seed-line-strong hover:shadow-raised"
          onClick={onArmory}
          type="button"
        >
          {skin ? (
            <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-seed-line-strong bg-seed-panel-raised">
              <CommanderPortrait
                className="size-full"
                commander={profile.commander}
                skin={skin}
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">
              {t(`commanders.${profile.commander}.name`)}
            </p>
            <p className="truncate text-seed-muted text-sm">
              {skin ? t(`skins.${skin.id}`) : null}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-seed-gold text-xs uppercase tracking-[0.18em]">
              <Shield aria-hidden="true" className="size-3" />
              {t("hub.armory")}
            </p>
          </div>
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-seed-muted transition-transform group-hover:translate-x-0.5"
          />
        </button>

        <button
          className="group rounded-xl border border-seed-line bg-seed-panel p-4 text-left shadow-panel transition-all hover:border-seed-line-strong hover:shadow-raised"
          onClick={onBoards}
          type="button"
        >
          <div className="flex items-center justify-between">
            <p className="inline-flex items-center gap-2 font-display font-semibold">
              <Trophy aria-hidden="true" className="size-4 text-seed-gold" />
              {t(`eras.names.${eraNameKey(eraId)}`)}
            </p>
            <Badge size="sm" variant="gold">
              {t(`tiers.${TIER_KEYS[tier]}`)}
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-seed-bg">
            <div
              className="h-full rounded-full bg-linear-to-r from-seed-teal to-seed-gold"
              style={{
                width: `${Math.round(tierProgress(profile.era.points) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-seed-muted text-xs">
            <span className="font-mono tabular-nums">
              {t("hub.league.points", { points: profile.era.points })}
            </span>
            <span>
              {t("hub.league.daysLeft", { days: daysLeftInEra(Date.now()) })}
            </span>
          </div>
        </button>
      </section>

      <section className="mt-8 flex flex-wrap items-center justify-between gap-3 text-seed-muted text-xs">
        <p className="font-mono uppercase tracking-[0.18em]">
          {t("hub.stats", {
            matches: profile.matchesPlayed,
            best: profile.bestScore.toLocaleString(),
          })}
        </p>
        <button
          className={cn(
            "rounded-md px-2 py-1 transition-colors",
            resetArmed
              ? "bg-seed-danger-tint text-seed-danger"
              : "hover:text-seed-text"
          )}
          onClick={() => {
            if (!resetArmed) {
              setResetArmed(true);

              return;
            }

            clearProfile();
            updateProfile(() => defaultProfile(eraIdAt(Date.now())));
            setResetArmed(false);
          }}
          type="button"
        >
          {resetArmed ? t("hub.resetConfirm") : t("hub.reset")}
        </button>
      </section>
    </div>
  );
}

function ModeCard({
  title,
  blurb,
  icon,
  tone,
  onClick,
}: {
  title: string;
  blurb: string;
  icon: React.ReactNode;
  tone: "gold" | "teal" | "violet";
  onClick: () => void;
}) {
  const toneClass = {
    gold: "border-seed-gold-edge bg-seed-gold-tint text-seed-gold",
    teal: "border-seed-teal-edge bg-seed-teal-tint text-seed-teal",
    violet: "border-seed-violet-edge bg-seed-violet-tint text-seed-violet",
  }[tone];

  return (
    <button
      className="group flex items-center gap-3 rounded-xl border border-seed-line bg-seed-panel p-4 text-left shadow-panel transition-all hover:border-seed-line-strong hover:shadow-raised motion-safe:hover:-translate-y-0.5"
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-lg border",
          toneClass
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold">{title}</span>
        <span className="block truncate text-seed-muted text-sm">{blurb}</span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 text-seed-muted transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}
