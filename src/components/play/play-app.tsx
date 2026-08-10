"use client";

/**
 * The game shell: one client component that owns the profile, the current
 * screen and the reward flow, and hands everything below it plain props.
 *
 * Screens are a state machine rather than routes on purpose: a match must
 * survive a locale-prefixed URL, back buttons must never tear down a running
 * sim by accident, and the whole thing stays a single page under /play.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { OrderKey } from "@/components/game/cards/orders";

import {
  blitzConfig,
  currentWorldNumber,
  type DailyBrief,
  dailyBrief,
  dailyConfig,
  type SkirmishSize,
  skirmishConfig,
  type WeeklyBrief,
  weeklyConfig,
  weeklyNumberAt,
} from "./meta/daily";
import {
  type ShardBreakdown,
  shardReward,
  weeklyHeatBonus,
} from "./meta/economy";
import { eraIdAt, eraPointsFor, TIER_GEMS, tierOf } from "./meta/era";
import { placeOnBoard } from "./meta/leaderboard";
import {
  loadProfile,
  type Profile,
  recordDaily,
  saveProfile,
} from "./meta/profile";
import { buildShareGrid } from "./meta/share";
import { ArmoryScreen } from "./screens/armory";
import { BoardsScreen } from "./screens/boards";
import { DraftScreen } from "./screens/draft";
import { HubScreen } from "./screens/hub";
import { MatchScreen } from "./screens/match";
import { ResultsScreen } from "./screens/results";
import type { MatchOutcome } from "./sim/score";
import type {
  ConditionId,
  Difficulty,
  MatchConfig,
  MatchState,
} from "./sim/types";

export type MatchIntent =
  | { mode: "daily"; brief: DailyBrief; official: boolean }
  | { mode: "blitz"; seed: number }
  | { mode: "weekly"; brief: WeeklyBrief; heat: Difficulty }
  | {
      mode: "skirmish";
      seed: number;
      size: SkirmishSize;
      difficulty: Difficulty;
      condition: ConditionId;
    }
  | { mode: "forge"; seed: number };

export type MatchReport = {
  outcome: MatchOutcome;
  config: MatchConfig;
  intent: MatchIntent;
  reward: ShardBreakdown;
  grid: string[];
  /** Daily only: where the official run landed among the ghosts. */
  rank: number | null;
  totalSeeded: number | null;
  percentile: number | null;
  eraPoints: number;
  official: boolean;
  world: number | null;
  heatBonus: number;
};

type Screen =
  | { id: "hub" }
  | { id: "draft"; intent: MatchIntent }
  | { id: "match"; intent: MatchIntent; config: MatchConfig }
  | { id: "results"; report: MatchReport }
  | { id: "armory" }
  | { id: "boards" };

export function PlayApp() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [screen, setScreen] = useState<Screen>({ id: "hub" });
  const savedRef = useRef(false);

  // The profile only exists in the browser; the first paint is a shell and
  // everything meaningful mounts right after hydration.
  useEffect(() => {
    const eraId = eraIdAt(Date.now());
    let loaded = loadProfile(eraId);

    if (loaded.era.id !== eraId) {
      // The month turned while the Seeded was away: close the Era, pay Gems.
      const tier = tierOf(loaded.era.points);
      const gems = loaded.era.points > 0 ? TIER_GEMS[tier] : 0;

      loaded = {
        ...loaded,
        gems: loaded.gems + gems,
        eraRecap:
          loaded.era.points > 0
            ? { eraId: loaded.era.id, points: loaded.era.points, tier, gems }
            : null,
        era: { id: eraId, points: 0 },
      };
    }

    setProfile(loaded);
    savedRef.current = true;
  }, []);

  useEffect(() => {
    if (profile && savedRef.current) saveProfile(profile);
  }, [profile]);

  const updateProfile = useCallback((mutate: (profile: Profile) => Profile) => {
    setProfile((current) => (current ? mutate(current) : current));
  }, []);

  // The world number tracks the actual UTC day, so a hub left open past
  // midnight serves the new Sowing rather than yesterday's.
  const [world, setWorld] = useState(() => currentWorldNumber());

  useEffect(() => {
    const sync = () => setWorld(currentWorldNumber());
    const timer = window.setInterval(sync, 30_000);

    document.addEventListener("visibilitychange", sync);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const brief = useMemo(() => dailyBrief(world), [world]);

  const toDraft = useCallback((intent: MatchIntent) => {
    setScreen({ id: "draft", intent });
  }, []);

  const toMatch = useCallback(
    (intent: MatchIntent, hand: readonly OrderKey[]) => {
      if (!profile) return;

      let config: MatchConfig;

      switch (intent.mode) {
        case "daily":
          config = dailyConfig(intent.brief, hand);
          break;
        case "blitz":
          config = blitzConfig(intent.seed, profile.commander, hand);
          break;
        case "weekly":
          config = weeklyConfig(
            intent.brief,
            intent.heat,
            profile.commander,
            hand
          );
          break;
        case "skirmish":
          config = skirmishConfig(
            intent.seed,
            intent.size,
            intent.difficulty,
            intent.condition,
            profile.commander,
            hand
          );
          break;
        case "forge":
          config = skirmishConfig(
            intent.seed,
            "large",
            1,
            "conquest",
            profile.commander,
            hand,
            "forge"
          );
          break;
      }

      if (intent.mode === "daily" && intent.official) {
        // The official attempt is spent the moment the match starts, so
        // abandoning a bad opening is not a reroll.
        updateProfile((current) => ({
          ...current,
          dailyAttemptWorld: intent.brief.world,
        }));
      }

      setScreen({ id: "match", intent, config });
    },
    [profile, updateProfile]
  );

  const finishMatch = useCallback(
    (
      intent: MatchIntent,
      config: MatchConfig,
      state: MatchState,
      outcome: MatchOutcome
    ) => {
      if (!profile) return;

      const grid = buildShareGrid(state);
      const official = intent.mode === "daily" && intent.official;
      const firstDaily = official;
      const streakAfter = official
        ? profile.streak.lastWorld === intent.brief.world - 1
          ? profile.streak.count + 1
          : 1
        : profile.streak.count;
      const casual = !official && intent.mode !== "weekly";
      const casualToday =
        profile.casualRuns.day === world ? profile.casualRuns.count : 0;
      const reward = shardReward(
        official ? "daily" : intent.mode === "daily" ? "skirmish" : intent.mode,
        outcome.playerScore,
        outcome.placement,
        firstDaily,
        streakAfter,
        casual ? casualToday : 0
      );

      let rank: number | null = null;
      let totalSeeded: number | null = null;
      let percentile: number | null = null;
      let eraPoints = 0;
      let heatBonus = 0;

      if (official) {
        const standing = placeOnBoard(
          intent.brief.seed,
          intent.brief.world,
          outcome.playerScore
        );

        rank = standing.rank;
        totalSeeded = standing.total;
        percentile = standing.percentile;
        eraPoints = eraPointsFor(standing.percentile, outcome.victory);
      }

      if (intent.mode === "weekly") {
        const week = weeklyNumberAt(Date.now());
        const cleared =
          profile.weekly.week === week ? profile.weekly.heatCleared : 0;

        if (outcome.victory && intent.heat + 1 > cleared) {
          // Every level skipped on the way up pays out too, so clearing the
          // hardest heat first forfeits nothing.
          for (let level = cleared; level <= intent.heat; level += 1) {
            heatBonus += weeklyHeatBonus(level);
          }
        }
      }

      const report: MatchReport = {
        outcome,
        config,
        intent,
        reward,
        grid,
        rank,
        totalSeeded,
        percentile,
        eraPoints,
        official,
        world: intent.mode === "daily" ? intent.brief.world : null,
        heatBonus,
      };

      updateProfile((current) => {
        let next: Profile = {
          ...current,
          shards: current.shards + reward.total + heatBonus,
          totalShardsEarned:
            current.totalShardsEarned + reward.total + heatBonus,
          matchesPlayed: current.matchesPlayed + 1,
          bestScore: Math.max(current.bestScore, outcome.playerScore),
        };

        if (casual) {
          next = {
            ...next,
            casualRuns: {
              day: world,
              count:
                (current.casualRuns.day === world
                  ? current.casualRuns.count
                  : 0) + 1,
            },
          };
        }

        if (official && percentile !== null) {
          next = recordDaily(next, {
            world: intent.brief.world,
            score: outcome.playerScore,
            placement: outcome.placement,
            percentile,
            victory: outcome.victory,
            grid,
          });
          next = {
            ...next,
            era: { ...next.era, points: next.era.points + eraPoints },
          };
        }

        if (intent.mode === "weekly" && heatBonus > 0) {
          next = {
            ...next,
            weekly: {
              week: weeklyNumberAt(Date.now()),
              heatCleared: intent.heat + 1,
            },
          };
        }

        return next;
      });

      setScreen({ id: "results", report });
    },
    [profile, updateProfile, world]
  );

  const toHub = useCallback(() => setScreen({ id: "hub" }), []);

  if (!profile) {
    return (
      <main className="flex min-h-dvh items-center justify-center">
        <div className="size-10 rounded-full bg-seed-gold motion-safe:animate-pulse-dot" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh">
      {screen.id === "hub" ? (
        <HubScreen
          brief={brief}
          onArmory={() => setScreen({ id: "armory" })}
          onBoards={() => setScreen({ id: "boards" })}
          onStart={toDraft}
          profile={profile}
          updateProfile={updateProfile}
          world={world}
        />
      ) : null}

      {screen.id === "draft" ? (
        <DraftScreen
          intent={screen.intent}
          onBack={toHub}
          onConfirm={(hand) => toMatch(screen.intent, hand)}
          profile={profile}
          updateProfile={updateProfile}
        />
      ) : null}

      {screen.id === "match" ? (
        <MatchScreen
          config={screen.config}
          intent={screen.intent}
          onEnd={(state, outcome) =>
            finishMatch(screen.intent, screen.config, state, outcome)
          }
          onQuit={toHub}
          profile={profile}
        />
      ) : null}

      {screen.id === "results" ? (
        <ResultsScreen
          onAgain={() => {
            const intent = screen.report.intent;

            if (intent.mode === "daily") {
              toDraft({ ...intent, official: false });
            } else {
              toDraft(intent);
            }
          }}
          onBoards={() => setScreen({ id: "boards" })}
          onHub={toHub}
          report={screen.report}
        />
      ) : null}

      {screen.id === "armory" ? (
        <ArmoryScreen
          onBack={toHub}
          profile={profile}
          updateProfile={updateProfile}
        />
      ) : null}

      {screen.id === "boards" ? (
        <BoardsScreen
          brief={brief}
          onBack={toHub}
          profile={profile}
          world={world}
        />
      ) : null}
    </main>
  );
}
