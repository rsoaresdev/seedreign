"use client";

import {
  type MotionValue,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { StepBoard } from "@/components/sections/how-to-play/step-board";
import { STEPS } from "@/components/sections/how-to-play/steps";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * The line down the viewport a step has to cross to become the active one.
 * Below the middle, so the step being read is the step that is lit.
 */
const ACTIVATION = "62%";

/** Two digits, so the counter never changes width as it counts. */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** One filled bar of the progress rail. */
function Segment({
  index,
  progress,
}: {
  index: number;
  progress: MotionValue<number>;
}) {
  const scaleX = useTransform(progress, [index, index + 1], [0, 1]);

  return (
    <span className="block h-1 flex-1 overflow-hidden rounded-full bg-seed-line">
      <motion.span
        className="block h-full origin-left rounded-full bg-seed-gold"
        style={{ scaleX }}
      />
    </span>
  );
}

/**
 * The bar that rides along with the reader: where the day is, out of five, and
 * what is happening right now. Everything it says is already in the list below
 * it, so it stays out of the accessibility tree.
 */
function DayHud({
  active,
  progress,
}: {
  active: number;
  progress: MotionValue<number>;
}) {
  const t = useTranslations("HowToPlay");

  return (
    <Card
      aria-hidden="true"
      // Sticks under the header on a phone and under the sticky heading on a
      // desktop, so the day's progress is always on screen while reading.
      className="sticky top-18 z-10 mb-6 gap-3 border-seed-line-strong bg-seed-panel-raised p-4 shadow-raised lg:top-28"
    >
      <div className="flex items-center justify-between font-mono text-[0.6875rem] text-seed-muted uppercase tracking-[0.22em]">
        <span>{t("hud.dawn")}</span>
        <span>{t("hud.dusk")}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {STEPS.map((step, index) => (
          <Segment index={index} key={step.key} progress={progress} />
        ))}
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-bold font-display text-seed-gold text-sm tabular-nums">
          {pad(active + 1)}
          <span className="text-seed-muted">/{pad(STEPS.length)}</span>
        </span>
        <span className="truncate font-medium text-sm">
          {t(`steps.${STEPS[active].key}.title`)}
        </span>
      </div>
    </Card>
  );
}

/**
 * The five steps of a day, read against a heading that stays put.
 *
 * The heading is pinned with `position: sticky` rather than with a GSAP pin:
 * the visual result is the same and the browser does it without a pin spacer,
 * without re-measuring on every refresh and without fighting Lenis. GSAP is
 * left doing the one thing CSS cannot, which is telling us which step the
 * reader is on and how far into it they are.
 *
 * None of it runs under prefers-reduced-motion. There the heading scrolls with
 * the page, the steps are a plain stacked list, every card is lit, and neither
 * GSAP nor the progress bar is loaded at all.
 */
export function HowToPlaySequence() {
  const t = useTranslations("HowToPlay");
  const reducedMotion = useReducedMotion();
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  /**
   * How far down the sequence the reader is, in steps: 2.5 is half way through
   * the third one. A motion value rather than state, so the bar repaints on
   * every scroll frame without re-rendering the five cards underneath it.
   */
  const progress = useMotionValue(0);

  // `!== false` on purpose: `null` means the preference has not been read yet,
  // and until it has, nothing sticks and nothing is driven by scroll.
  const scrollDriven = reducedMotion === false;

  useEffect(() => {
    if (!scrollDriven) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      // Imported here rather than at the top of the file so GSAP stays out of
      // the bundle for readers who never get any of this.
      const { ScrollTrigger } = await import("@/lib/gsap");

      if (cancelled) return;

      const triggers: (ReturnType<typeof ScrollTrigger.create> | null)[] = [];

      /**
       * Read the whole rail rather than trust the trigger that just fired.
       *
       * The last step the reader has entered at all is the active one, so a
       * step keeps the rail until the next one takes it, and a page opened
       * half way down the section starts on the right step. Deriving it beats
       * reacting to enter and leave events, which arrive out of order during a
       * ScrollTrigger refresh.
       */
      const sync = () => {
        let current = 0;

        for (let index = 0; index < triggers.length; index += 1) {
          if ((triggers[index]?.progress ?? 0) > 0) current = index;
        }

        setActive(current);
        progress.set(current + (triggers[current]?.progress ?? 0));
      };

      for (const [index, element] of items.current.entries()) {
        triggers[index] = element
          ? ScrollTrigger.create({
              trigger: element,
              start: `top ${ACTIVATION}`,
              end: `bottom ${ACTIVATION}`,
              onUpdate: sync,
              onRefresh: sync,
            })
          : null;
      }

      sync();

      teardown = () => {
        for (const trigger of triggers) trigger?.kill();
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [scrollDriven, progress]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-16">
      <div
        className={cn("lg:self-start", scrollDriven && "lg:sticky lg:top-28")}
      >
        <Reveal>
          <SectionHeading
            description={t("description")}
            eyebrow={t("eyebrow")}
            title={t("title")}
          />
        </Reveal>
      </div>

      <div>
        {scrollDriven ? <DayHud active={active} progress={progress} /> : null}

        <ol className="flex flex-col gap-3">
          {STEPS.map((step, index) => {
            const lit = !scrollDriven || index === active;
            const Icon = step.icon;

            return (
              <li
                className={cn(
                  scrollDriven &&
                    "flex min-h-[24svh] items-center lg:min-h-[32svh]"
                )}
                key={step.key}
                ref={(element) => {
                  items.current[index] = element;
                }}
              >
                <Card
                  className={cn(
                    "relative grid w-full gap-5 overflow-hidden p-6 transition-[border-color,box-shadow] duration-500 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-7 sm:p-7 sm:pr-40",
                    lit && "border-seed-line-strong shadow-raised"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-y-0 left-0 w-1 transition-colors duration-500",
                      lit ? "bg-seed-gold" : "bg-transparent"
                    )}
                  />

                  {/* Behind the copy and fading into the card edge, so the
                      board reads as the texture of the step rather than as a
                      fourth thing competing for the reader's eye. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mask-[linear-gradient(to_left,black_35%,transparent)] pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-5 transition-opacity duration-500 sm:flex",
                      lit ? "opacity-20" : "opacity-[0.07]"
                    )}
                  >
                    <StepBoard pattern={step.pattern} />
                  </span>

                  <div className="flex items-center gap-4 sm:flex-col sm:items-start sm:gap-4">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "font-bold font-display text-4xl tabular-nums leading-none transition-colors duration-500",
                        lit ? "text-seed-gold" : "text-seed-line-strong"
                      )}
                    >
                      {pad(index + 1)}
                    </span>

                    <IconTile tone={step.tone}>
                      <Icon />
                    </IconTile>
                  </div>

                  <div className="flex flex-col items-start gap-2.5">
                    <h3 className="font-display font-semibold text-lg leading-tight">
                      {t(`steps.${step.key}.title`)}
                    </h3>

                    <Badge size="sm" variant={step.tone}>
                      {t(`steps.${step.key}.meta`)}
                    </Badge>

                    <p className="text-pretty text-muted-foreground text-sm">
                      {t(`steps.${step.key}.body`)}
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
