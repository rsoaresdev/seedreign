"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ResultScene } from "@/components/game/result-scene";
import { gridText, RESULT } from "@/components/sections/share/result";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Milliseconds the button stays on its confirmed state before reverting. */
const CONFIRM = 2000;

/** One reading off the finished world, in the world's own voice. */
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
      <span className="font-mono text-[0.625rem] text-seed-muted uppercase leading-none tracking-[0.18em]">
        {label}
      </span>

      <span
        className={cn(
          "truncate font-bold font-display text-base tabular-nums leading-none",
          tone
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The card a run ends on: the world as the Collapse left it, what that came to
 * in numbers, and the one button that puts it in somebody else's group chat.
 *
 * The picture is the day. The grid that gets copied is the day too, only
 * spoiler free, which is why it lives on the clipboard and not on the card.
 */
export function ResultCard() {
  const t = useTranslations("Share.result");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = window.setTimeout(() => setCopied(false), CONFIRM);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const text = [
      t("shareTitle", { world: RESULT.world }),
      t("shareLine", { territory: RESULT.territory, time: RESULT.time }),
      "",
      gridText(RESULT.rows),
      "",
      site.url,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard access can be refused outright, over http or under a strict
      // permissions policy. Nothing to recover: the button simply stays put.
    }
  };

  return (
    <Card
      className="relative isolate h-full gap-0 overflow-hidden border-seed-line-strong bg-seed-panel-raised shadow-raised"
      variant="raised"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(30rem_20rem_at_50%_-10%,var(--seed-gold-tint),transparent_70%)]"
      />

      <div className="relative">
        <ResultScene />

        {/* Two washes over the world: one so the chrome up top always has
            something to sit on, one so the map gives out into the panel
            instead of stopping on a line. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-linear-to-b from-seed-scrim to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-seed-panel-raised"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
          <span className="font-mono text-[0.6875rem] text-seed-text uppercase tracking-[0.2em]">
            {t("label", { world: RESULT.world })}
          </span>

          <Badge size="sm" variant="gold">
            {t("condition")}
          </Badge>
        </div>
      </div>

      {/* Lifted over the foot of the map, the way the HUD sits in a world. */}
      <div className="relative -mt-7 px-4 sm:px-5">
        <div className="grid grid-cols-3 gap-3 rounded-lg border border-seed-line bg-seed-glass-raised p-3 shadow-panel">
          <Reading
            label={t("territory")}
            tone="text-seed-gold"
            value={`${RESULT.territory}%`}
          />
          <Reading label={t("time")} value={RESULT.time} />
          <Reading label={t("percentile")} value={`${RESULT.percentile}%`} />
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-3 p-5 sm:p-6">
        <Button
          className="w-full sm:w-auto"
          onClick={handleCopy}
          size="lg"
          variant="outline"
        >
          {copied ? <Check /> : <Copy />}
          {/* The label swaps on click with nothing else moving, so it is
              announced rather than changing silently. */}
          <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
        </Button>

        <p className="text-center text-seed-muted text-xs">{t("note")}</p>
      </div>
    </Card>
  );
}
