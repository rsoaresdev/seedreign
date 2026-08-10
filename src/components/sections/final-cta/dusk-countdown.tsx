"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/** Milliseconds in a day, an hour and a minute. */
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

/** What the clock reads before the browser has told us what time it is. */
const PLACEHOLDER = "--:--:--";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Time left until the world unravels, which is midnight UTC. */
function untilDusk(now: number): string {
  const left = DAY - (now % DAY);

  return [
    pad(Math.floor(left / HOUR)),
    pad(Math.floor((left % HOUR) / MINUTE)),
    pad(Math.floor((left % MINUTE) / 1000)),
  ].join(":");
}

/**
 * The clock counting down to the Collapse.
 *
 * Midnight UTC is the same instant everywhere, so every reader is looking at
 * the same number, which is the whole point of a world that is sown once a day
 * for the entire planet.
 *
 * Renders the placeholder on the server and on the first client pass: the
 * remaining time is not knowable at build time, and rendering it during
 * hydration would mismatch.
 */
export function DuskCountdown() {
  const t = useTranslations("FinalCta");
  const [left, setLeft] = useState(PLACEHOLDER);

  useEffect(() => {
    const tick = () => setLeft(untilDusk(Date.now()));

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[0.625rem] text-seed-muted uppercase tracking-[0.22em]">
        {t("hud.dusk")}
      </span>

      <span className="font-bold font-display text-seed-gold text-xl tabular-nums sm:text-3xl">
        {left}
      </span>
    </div>
  );
}
