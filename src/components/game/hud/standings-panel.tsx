/**
 * Who is holding what, four banners deep. The shares never add up to the whole
 * world, and that is the point: everything missing is still on the table.
 */

import { useFormatter, useTranslations } from "next-intl";

import { HOUSES, type House } from "@/components/game/world";
import { cn } from "@/lib/utils";

/** Banner colours in the world's own order. Index 0 is always the player. */
const HOUSE_FILL: Record<House, string> = {
  gold: "bg-seed-gold",
  teal: "bg-seed-teal",
  violet: "bg-seed-violet",
  danger: "bg-destructive",
};

const HOUSE_TEXT: Record<House, string> = {
  gold: "text-seed-gold",
  teal: "text-seed-teal",
  violet: "text-seed-violet",
  danger: "text-destructive",
};

export type StandingsRow = {
  house: House;
  /** Share of the world's ground held, 0 to 1. */
  share: number;
};

export type StandingsPanelProps = {
  /** Rendered in the order given, so the caller decides whether it ranks. */
  rows: readonly StandingsRow[];
  className?: string;
};

function clampShare(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function StandingsPanel({ rows, className }: StandingsPanelProps) {
  const t = useTranslations("Game.hud");
  const format = useFormatter();

  return (
    <section
      aria-label={t("standings.label")}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-seed-line bg-seed-glass-raised px-3 py-2.5 shadow-panel",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-3 font-mono text-[0.625rem] text-seed-muted uppercase tracking-[0.22em]">
        <span>{t("standings.title")}</span>
        <span>{t("standings.held")}</span>
      </div>

      <ol className="flex flex-col gap-2">
        {rows.map((row) => {
          const share = clampShare(row.share);
          const you = row.house === HOUSES[0];

          return (
            <li className="flex flex-col gap-1" key={row.house}>
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-3.5 w-1 shrink-0 rounded-full",
                    HOUSE_FILL[row.house]
                  )}
                />

                <span
                  className={cn(
                    "flex-1 truncate text-sm",
                    you ? "font-semibold text-seed-text" : "text-seed-muted"
                  )}
                >
                  {t(`standings.houses.${row.house}`)}
                </span>

                {you ? (
                  <span className="shrink-0 font-mono text-[0.5625rem] text-seed-gold uppercase tracking-[0.18em]">
                    {t("standings.you")}
                  </span>
                ) : null}

                <span
                  className={cn(
                    "font-bold font-display text-sm tabular-nums",
                    you ? HOUSE_TEXT[row.house] : "text-seed-muted"
                  )}
                >
                  {format.number(share, { style: "percent" })}
                </span>
              </div>

              <span
                aria-hidden="true"
                className="block h-1 overflow-hidden rounded-full bg-seed-line"
              >
                <span
                  className={cn(
                    "block h-full rounded-full",
                    HOUSE_FILL[row.house]
                  )}
                  style={{ width: `${share * 100}%` }}
                />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
