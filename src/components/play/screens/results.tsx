"use client";

/**
 * The tally: score counting up, the day's standings, medals, spoils earned
 * and the spoiler-free grid ready for the group chat. For an official daily
 * this is also where the board position and Era points land.
 */

import { Check, Copy } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

import { shareText } from "../meta/share";
import type { MatchReport } from "../play-app";
import { PLAYER } from "../sim/types";
import { GemIcon, ShardIcon } from "./icons";

const HOUSE_KEYS = ["gold", "teal", "violet", "danger"] as const;

const HOUSE_TEXT = [
  "text-seed-gold",
  "text-seed-teal",
  "text-seed-violet",
  "text-seed-danger",
] as const;

/** How each grid letter paints on screen. The emoji alphabet stays its own. */
const CELL_CLASS: Record<string, string> = {
  g: "bg-seed-gold",
  t: "bg-seed-success",
  v: "bg-seed-violet",
  x: "bg-seed-map-abyss border border-seed-line",
  ".": "bg-seed-muted opacity-40",
};

function useCountUp(target: number, animate: boolean): number {
  const [value, setValue] = useState(animate ? 0 : target);

  useEffect(() => {
    if (!animate) {
      setValue(target);

      return;
    }

    let raf = 0;
    const start = performance.now();
    const run = (now: number) => {
      const t = Math.min(1, (now - start) / 1200);
      const eased = 1 - (1 - t) ** 3;

      setValue(Math.round(target * eased));

      if (t < 1) raf = window.requestAnimationFrame(run);
    };

    raf = window.requestAnimationFrame(run);

    return () => window.cancelAnimationFrame(raf);
  }, [target, animate]);

  return value;
}

type ResultsProps = {
  report: MatchReport;
  onHub: () => void;
  onAgain: () => void;
  onBoards: () => void;
};

export function ResultsScreen({
  report,
  onHub,
  onAgain,
  onBoards,
}: ResultsProps) {
  const t = useTranslations("Play");
  const tGame = useTranslations("Game.hud");
  const reduced = useReducedMotion();
  const animate = reduced === false;
  const score = useCountUp(report.outcome.playerScore, animate);
  const [copied, setCopied] = useState(false);

  const shareBody = useMemo(() => {
    const title =
      report.world !== null
        ? t("results.shareTitle", { world: report.world })
        : t("results.shareTitleCasual", {
            mode: t(`modes.${report.intent.mode}.title`),
          });
    const line = t("results.shareLine", {
      condition: tGame(`conditions.${report.outcome.condition}`),
      territory: Math.round(report.outcome.playerShare * 100),
      score: report.outcome.playerScore,
    });

    return shareText(report.grid, title, line, site.url);
  }, [report, t, tGame]);

  const copyGrid = async () => {
    try {
      await navigator.clipboard.writeText(shareBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be denied; the grid is still on screen to screenshot.
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6">
      <header className="py-6 text-center">
        <p className="font-medium text-seed-teal text-xs uppercase tracking-[0.22em]">
          {report.world !== null
            ? t("results.kickerWorld", { world: report.world })
            : t(`modes.${report.intent.mode}.title`)}
        </p>
        <h1
          className={cn(
            "mt-2 font-bold font-display text-4xl tracking-tight sm:text-5xl",
            report.outcome.victory ? "text-seed-gold" : "text-seed-text"
          )}
        >
          {report.outcome.victory
            ? t("results.titleWin")
            : t("results.titlePlace", { place: report.outcome.placement })}
        </h1>
        <p className="mt-2 text-seed-muted">
          {tGame(`conditions.${report.outcome.condition}`)}
          {report.intent.mode === "daily" && !report.official
            ? ` · ${t("match.practice")}`
            : null}
        </p>
      </header>

      {/* Score */}
      <section className="rounded-2xl border border-seed-line-strong bg-seed-panel-raised p-6 text-center shadow-raised">
        <p className="text-seed-muted text-xs uppercase tracking-[0.22em]">
          {t("results.score")}
        </p>
        <p className="mt-1 font-bold font-display text-6xl text-seed-gold tabular-nums">
          {score.toLocaleString()}
        </p>

        {report.percentile !== null ? (
          <p className="mt-2 text-seed-muted text-sm">
            {t("results.rankLine", {
              rank: report.rank ?? 0,
              total: (report.totalSeeded ?? 0).toLocaleString(),
              percent: report.percentile,
            })}
          </p>
        ) : null}

        {report.outcome.medals.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {report.outcome.medals.map((medal) => (
              <Badge
                key={medal}
                title={t(`medals.${medal}.desc`)}
                variant="gold"
              >
                {t(`medals.${medal}.name`)}
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      {/* Standings */}
      <section className="mt-4 rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel">
        <ol className="space-y-2">
          {report.outcome.standings.map((row, index) => (
            <li
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2",
                row.house === PLAYER && "bg-seed-gold-tint"
              )}
              key={row.house}
            >
              <span className="flex items-center gap-3">
                <span className="w-5 font-mono text-seed-muted text-sm tabular-nums">
                  {index + 1}
                </span>
                <span
                  className={cn(
                    "font-display font-semibold",
                    HOUSE_TEXT[row.house],
                    !row.alive && "line-through opacity-50"
                  )}
                >
                  {row.house === PLAYER
                    ? tGame("standings.you")
                    : tGame(`standings.houses.${HOUSE_KEYS[row.house]}`)}
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums">
                {row.score.toLocaleString()}
                <span className="ml-2 text-seed-muted text-xs">
                  {Math.round(row.share * 100)}%
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Spoils */}
      <section className="mt-4 rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel">
        <p className="text-seed-muted text-xs uppercase tracking-[0.22em]">
          {t("results.spoils")}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <RewardRow
            label={t("results.reward.base")}
            value={report.reward.base}
          />
          {report.reward.score > 0 ? (
            <RewardRow
              label={t("results.reward.score")}
              value={report.reward.score}
            />
          ) : null}
          {report.reward.placement > 0 ? (
            <RewardRow
              label={t("results.reward.placement")}
              value={report.reward.placement}
            />
          ) : null}
          {report.reward.firstOfDay > 0 ? (
            <RewardRow
              label={t("results.reward.firstOfDay")}
              value={report.reward.firstOfDay}
            />
          ) : null}
          {report.reward.streak > 0 ? (
            <RewardRow
              label={t("results.reward.streak")}
              value={report.reward.streak}
            />
          ) : null}
          {report.heatBonus > 0 ? (
            <RewardRow
              label={t("results.reward.heat")}
              value={report.heatBonus}
            />
          ) : null}
        </ul>
        <div className="mt-3 flex items-center justify-between border-seed-line border-t pt-3">
          <span className="font-display font-semibold">
            {t("results.reward.total")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-seed-gold tabular-nums">
            <ShardIcon className="size-3.5" />+
            {(report.reward.total + report.heatBonus).toLocaleString()}
          </span>
        </div>
        {report.eraPoints > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-seed-violet text-sm">
            <GemIcon className="size-3.5" />
            {t("results.eraPoints", { points: report.eraPoints })}
          </p>
        ) : null}
      </section>

      {/* The grid */}
      <section className="mt-4 rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-display font-semibold">
              {t("results.gridTitle")}
            </p>
            <p className="text-seed-muted text-sm">{t("results.gridNote")}</p>
          </div>
          <Button onClick={copyGrid} size="sm" variant="secondary">
            {copied ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            <span aria-live="polite">
              {copied ? t("results.copied") : t("results.copy")}
            </span>
          </Button>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="grid grid-cols-6 gap-1.5">
            {report.grid.flatMap((row, rowIndex) =>
              Array.from(row, (cell, colIndex) => (
                <span
                  className={cn(
                    "size-7 rounded-md sm:size-8",
                    animate && "motion-safe:animate-grid-drop",
                    CELL_CLASS[cell] ?? CELL_CLASS["."]
                  )}
                  // biome-ignore lint/suspicious/noArrayIndexKey: the grid is a fixed six-by-six snapshot.
                  key={`${rowIndex}-${colIndex}`}
                  style={
                    animate
                      ? {
                          animationDelay: `${(rowIndex * 6 + colIndex) * 0.04}s`,
                        }
                      : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button className="flex-1" onClick={onHub} size="lg" variant="outline">
          {t("results.backHub")}
        </Button>
        {report.official ? (
          <Button
            className="flex-1"
            onClick={onBoards}
            size="lg"
            variant="secondary"
          >
            {t("results.board")}
          </Button>
        ) : null}
        <Button className="flex-1" onClick={onAgain} size="lg" variant="play">
          {report.official ? t("results.practice") : t("results.again")}
        </Button>
      </div>
    </div>
  );
}

function RewardRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-seed-muted">{label}</span>
      <span className="font-mono tabular-nums">+{value.toLocaleString()}</span>
    </li>
  );
}
