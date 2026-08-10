"use client";

/**
 * The one control the whole game turns on: how much of the army goes forward
 * and how much stays on the line.
 */

import { useFormatter, useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

/** Whole points, so the readings never show a fraction of an army. */
const MIN = 0;
const MAX = 100;
const STEP = 1;

/**
 * The handle and the two tracks a range input only exposes through vendor
 * pseudo elements, which no utility class can reach.
 *
 * Both native tracks are cleared out and the bar underneath is drawn as real
 * elements instead, so the split can be two colours meeting at the handle. The
 * handle is as tall as the control on purpose: it is dragged with a thumb, on a
 * phone, in the middle of a fight.
 */
const THUMB_CSS = `
.seed-force-slider {
  -webkit-appearance: none;
  appearance: none;
}

.seed-force-slider::-webkit-slider-runnable-track {
  height: 100%;
  background: transparent;
}

.seed-force-slider::-moz-range-track {
  height: 100%;
  background: transparent;
}

.seed-force-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  box-sizing: border-box;
  width: 1.25rem;
  height: 2.5rem;
  border: 2px solid var(--seed-bg);
  border-radius: 9999px;
  background: var(--seed-text);
  box-shadow: 0 2px 10px var(--seed-scrim);
  cursor: grab;
}

.seed-force-slider::-moz-range-thumb {
  box-sizing: border-box;
  width: 1.25rem;
  height: 2.5rem;
  border: 2px solid var(--seed-bg);
  border-radius: 9999px;
  background: var(--seed-text);
  box-shadow: 0 2px 10px var(--seed-scrim);
  cursor: grab;
}

.seed-force-slider:active::-webkit-slider-thumb {
  cursor: grabbing;
}

.seed-force-slider:active::-moz-range-thumb {
  cursor: grabbing;
}
`;

function clampShare(value: number): number {
  return Math.round(Math.min(MAX, Math.max(MIN, value)));
}

export function ForceSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("Game.hud");
  const format = useFormatter();
  const attack = clampShare(value);
  const hold = MAX - attack;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(clampShare(Number(event.currentTarget.value)));
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-seed-line bg-seed-glass-raised px-3 py-2.5 shadow-panel">
      <style href="seed-force-slider" precedence="default">
        {THUMB_CSS}
      </style>

      {/* The slider already reports both numbers through `aria-valuetext`, so
          the readings stay out of the accessibility tree. */}
      <div
        aria-hidden="true"
        className="flex items-baseline justify-between gap-4"
      >
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-[0.625rem] text-seed-muted uppercase tracking-[0.22em]">
            {t("force.attack")}
          </span>

          <span className="font-bold font-display text-seed-gold text-sm tabular-nums">
            {format.number(attack / MAX, { style: "percent" })}
          </span>
        </span>

        <span className="flex items-baseline gap-1.5">
          <span className="font-bold font-display text-seed-teal text-sm tabular-nums">
            {format.number(hold / MAX, { style: "percent" })}
          </span>

          <span className="font-mono text-[0.625rem] text-seed-muted uppercase tracking-[0.22em]">
            {t("force.hold")}
          </span>
        </span>
      </div>

      <div className="relative flex h-10 items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 my-auto flex h-3 overflow-hidden rounded-full border border-seed-line bg-seed-panel"
        >
          {/* The push takes what it is given, the line takes the rest, so the
              two always meet exactly under the handle. */}
          <span
            className="h-full bg-seed-gold"
            style={{ width: `${attack}%` }}
          />
          <span className="h-full flex-1 bg-seed-teal" />
        </span>

        <input
          aria-label={t("force.label")}
          aria-valuetext={t("force.value", { attack, hold })}
          className="seed-force-slider relative h-10 w-full cursor-grab rounded-full bg-transparent outline-none focus-visible:ring-3 focus-visible:ring-ring active:cursor-grabbing"
          max={MAX}
          min={MIN}
          onChange={handleChange}
          step={STEP}
          type="range"
          value={attack}
        />
      </div>
    </div>
  );
}
