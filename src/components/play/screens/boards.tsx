"use client";

/**
 * The boards: today's world and the Era ladder.
 *
 * The daily board is the same for everyone with the seed; the Seeded's own
 * official run is slotted among the ghosts. The Era tab is the long game:
 * points, tier ladder and what the Collapse of the month will pay.
 */

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { DailyBrief } from "../meta/daily";
import {
  daysLeftInEra,
  eraIdAt,
  eraNameKey,
  TIER_FLOORS,
  TIER_GEMS,
  tierOf,
  tierProgress,
} from "../meta/era";
import { ghostBoard, placeOnBoard, seededCount } from "../meta/leaderboard";
import type { Profile } from "../meta/profile";
import { GemIcon } from "./icons";

const TIER_KEYS = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "legend",
] as const;

type BoardsProps = {
  world: number;
  brief: DailyBrief;
  profile: Profile;
  onBack: () => void;
};

export function BoardsScreen({ world, brief, profile, onBack }: BoardsProps) {
  const t = useTranslations("Play");
  const [tab, setTab] = useState<"daily" | "era">("daily");

  const played = profile.daily?.world === world ? profile.daily : null;
  const rows = useMemo(() => {
    if (played) {
      return placeOnBoard(brief.seed, world, played.score).rows.slice(0, 50);
    }

    return ghostBoard(brief.seed).slice(0, 50);
  }, [brief.seed, world, played]);

  const total = seededCount(world);
  const tier = tierOf(profile.era.points);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Button onClick={onBack} size="sm" variant="ghost">
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("common.back")}
        </Button>
        <span className="inline-flex items-center gap-1.5 font-mono text-seed-muted text-xs uppercase tracking-[0.18em]">
          <span className="size-1.5 rounded-full bg-seed-success motion-safe:animate-pulse-dot" />
          {t("boards.seededToday", { count: total.toLocaleString() })}
        </span>
      </header>

      <h1 className="font-bold font-display text-3xl tracking-tight sm:text-4xl">
        {t("boards.title")}
      </h1>

      <div className="mt-5 flex gap-2">
        {(["daily", "era"] as const).map((option) => (
          <button
            className={cn(
              "flex-1 rounded-xl border px-3 py-2.5 font-display font-semibold text-sm transition-colors",
              tab === option
                ? "border-seed-gold-edge bg-seed-gold-tint text-seed-gold"
                : "border-seed-line text-seed-muted hover:border-seed-line-strong"
            )}
            key={option}
            onClick={() => setTab(option)}
            type="button"
          >
            {option === "daily"
              ? t("boards.tabDaily", { world })
              : t("boards.tabEra")}
          </button>
        ))}
      </div>

      {tab === "daily" ? (
        <section className="mt-4 rounded-xl border border-seed-line bg-seed-panel shadow-panel">
          {played ? null : (
            <p className="border-seed-line border-b p-4 text-seed-muted text-sm">
              {t("boards.notPlayed")}
            </p>
          )}
          <ol className="divide-y divide-seed-line">
            {rows.map((row) => (
              <li
                className={cn(
                  "flex items-center justify-between px-4 py-2.5",
                  row.you && "bg-seed-gold-tint"
                )}
                key={`${row.rank}-${row.name}`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-8 font-mono text-sm tabular-nums",
                      row.rank <= 3 ? "text-seed-gold" : "text-seed-muted"
                    )}
                  >
                    {row.rank}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      row.you && "font-semibold text-seed-gold"
                    )}
                  >
                    {row.you ? t("boards.you") : row.name}
                  </span>
                </span>
                <span className="font-mono text-sm tabular-nums">
                  {row.score.toLocaleString()}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="mt-4 space-y-4">
          <div className="rounded-xl border border-seed-line-strong bg-seed-panel-raised p-5 shadow-raised">
            <div className="flex items-center justify-between">
              <p className="font-display font-semibold text-lg">
                {t(`eras.names.${eraNameKey(eraIdAt(Date.now()))}`)}
              </p>
              <Badge variant="gold">{t(`tiers.${TIER_KEYS[tier]}`)}</Badge>
            </div>
            <p className="mt-1 text-seed-muted text-sm">
              {t("boards.eraLine", {
                points: profile.era.points,
                days: daysLeftInEra(Date.now()),
              })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-seed-bg">
              <div
                className="h-full rounded-full bg-linear-to-r from-seed-teal to-seed-gold"
                style={{
                  width: `${Math.round(tierProgress(profile.era.points) * 100)}%`,
                }}
              />
            </div>
          </div>

          <ol className="space-y-2">
            {TIER_KEYS.map((key, index) => (
              <li
                className={cn(
                  "flex items-center justify-between rounded-xl border px-4 py-3",
                  index === tier
                    ? "border-seed-gold-edge bg-seed-gold-tint"
                    : "border-seed-line bg-seed-panel",
                  index < tier && "opacity-60"
                )}
                key={key}
              >
                <span
                  className={cn(
                    "font-display font-semibold",
                    index === tier && "text-seed-gold"
                  )}
                >
                  {t(`tiers.${key}`)}
                </span>
                <span className="flex items-center gap-4">
                  <span className="font-mono text-seed-muted text-xs tabular-nums">
                    {TIER_FLOORS[index].toLocaleString()}+
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-seed-violet text-sm tabular-nums">
                    <GemIcon className="size-3.5" />
                    {TIER_GEMS[index]}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="text-center text-seed-muted text-sm">
            {t("boards.eraNote")}
          </p>
        </section>
      )}
    </div>
  );
}
