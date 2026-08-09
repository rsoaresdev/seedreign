"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { dailySeed } from "@/lib/daily";

/** Milliseconds until the world collapses, which is the next local midnight. */
function msUntilCollapse(from: Date): number {
  const midnight = new Date(from);
  midnight.setHours(24, 0, 0, 0);

  return midnight.getTime() - from.getTime();
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return `${hh}:${mm}:${ss}`;
}

/**
 * The live HUD for the current world.
 *
 * Everything here depends on the reader's own clock, so it stays `null` until
 * the first tick on the client. That keeps the page statically rendered and
 * avoids a hydration mismatch.
 */
export function DailyWorld() {
  const t = useTranslations("Home.hud");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const seed = now ? `#${dailySeed(now)}` : null;
  const countdown = now ? formatCountdown(msUntilCollapse(now)) : null;

  return (
    <Card variant="raised" className="w-full max-w-sm overflow-hidden">
      <div className="flex items-center gap-2 border-seed-line border-b px-5 py-3">
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-seed-teal motion-safe:animate-pulse-dot"
        />
        <span className="font-medium text-[0.6875rem] text-seed-muted uppercase tracking-[0.22em]">
          {t("label")}
        </span>
      </div>

      <dl className="grid grid-cols-2 divide-x divide-seed-line">
        <div className="px-5 py-4 text-left">
          <dt className="text-[0.625rem] text-seed-muted uppercase tracking-[0.18em]">
            {t("seed")}
          </dt>
          <dd className="mt-1 font-mono text-lg text-seed-gold tabular-nums sm:text-xl">
            {seed ?? <span className="text-seed-muted">{t("loading")}</span>}
          </dd>
        </div>

        <div className="px-5 py-4 text-left">
          <dt className="text-[0.625rem] text-seed-muted uppercase tracking-[0.18em]">
            {t("collapse")}
          </dt>
          <dd className="mt-1 font-mono text-lg tabular-nums sm:text-xl">
            {countdown ?? <span className="text-seed-muted">00:00:00</span>}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
