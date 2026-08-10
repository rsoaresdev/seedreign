/**
 * The strip across the top of the world: which world this is, what today asks
 * of you, what the Sowing changed about it, and how long it has left.
 */

import { useFormatter, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** The day's victory condition. Keys index `Game.hud.conditions`. */
export const VICTORY_CONDITIONS = [
  "conquest",
  "domination",
  "relicHunt",
  "blitz",
  "lastBanner",
  "wonders",
  "secretOrders",
] as const;

export type VictoryCondition = (typeof VICTORY_CONDITIONS)[number];

/** The day's modifier. Keys index the `Game.hud.decrees` messages. */
export const DECREES = [
  "twinRelics",
  "longNight",
  "swiftOrders",
  "guardedSpoils",
] as const;

export type Decree = (typeof DECREES)[number];

export type WorldBarProps = {
  /** The day's world number, the same one every player is looking at. */
  world: number;
  condition: VictoryCondition;
  decree: Decree;
  /** Seconds of daylight left before the Collapse takes the world. */
  secondsToDusk: number;
  className?: string;
};

const MINUTE = 60;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Minutes and seconds, with the minutes left uncapped: a world runs for well
 * under an hour, and a clock that rolled over at 60 would read as a lie on the
 * day something keeps one open longer.
 */
function clock(seconds: number): string {
  const left = Math.max(0, Math.floor(seconds));

  return `${pad(Math.floor(left / MINUTE))}:${pad(left % MINUTE)}`;
}

/** One label and its reading. */
function Reading({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="font-mono text-[0.625rem] text-seed-muted uppercase leading-none tracking-[0.22em]">
        {label}
      </span>

      <span
        className={cn(
          "truncate font-bold font-display text-sm tabular-nums leading-none",
          tone
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** A hairline between two readings. Gone on a phone, where the gap does it. */
function Divider() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-7 w-px bg-seed-line sm:block"
    />
  );
}

export function WorldBar({
  className,
  condition,
  decree,
  secondsToDusk,
  world,
}: WorldBarProps) {
  const t = useTranslations("Game.hud");
  const format = useFormatter();

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-seed-line bg-seed-glass-raised px-3 py-2 shadow-panel sm:gap-x-5 sm:px-4",
        className
      )}
    >
      <Reading label={t("world")} value={format.number(world)} />

      <Divider />

      <Reading label={t("condition")} value={t(`conditions.${condition}`)} />

      <Divider />

      <Reading
        label={t("decree")}
        tone="text-seed-violet"
        value={t(`decrees.${decree}`)}
      />

      <div className="ml-auto flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-seed-gold motion-safe:animate-pulse-dot"
        />

        <Reading
          label={t("dusk")}
          tone="text-seed-gold"
          value={clock(secondsToDusk)}
        />
      </div>
    </div>
  );
}
