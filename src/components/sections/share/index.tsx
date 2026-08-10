import { getFormatter, getTranslations } from "next-intl/server";
import {
  CURRENT_TIER,
  SEEDED_TODAY,
  STANDINGS,
  TIERS,
} from "@/components/sections/share/result";
import { ResultCard } from "@/components/sections/share/result-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

/** The anchor the section carries. Not in the nav, but linkable. */
export const SHARE_HASH = "proof";

/** Seconds between the two blocks arriving once the row is in view. */
const STAGGER = 0.08;

/** Where today's board sits on the ladder, as a fraction of the whole rail. */
const LADDER_FILL = ((CURRENT_TIER + 1) / TIERS.length) * 100;

export async function Share() {
  const [t, format] = await Promise.all([
    getTranslations("Share"),
    getFormatter(),
  ]);

  return (
    <section className="scroll-mt-24 py-20 sm:py-28" id={SHARE_HASH}>
      <Container
        className="flex flex-col items-center gap-12 sm:gap-16"
        size="lg"
      >
        <Reveal>
          <SectionHeading
            align="center"
            description={t("description")}
            eyebrow={t("eyebrow")}
            title={t("title")}
          />
        </Reveal>

        <div className="grid w-full gap-4 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
          <Reveal>
            <ResultCard />
          </Reveal>

          <Reveal delay={STAGGER}>
            <Card className="h-full gap-6 p-6 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-seed-teal text-xs uppercase tracking-[0.22em]">
                    {t("board.eyebrow")}
                  </span>

                  <h3 className="font-display font-semibold text-lg leading-tight">
                    {t("board.title")}
                  </h3>
                </div>

                <Badge size="sm" variant="teal">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-seed-teal motion-safe:animate-pulse-dot"
                  />
                  {t("board.live", { count: format.number(SEEDED_TODAY) })}
                </Badge>
              </div>

              <ol className="flex flex-col divide-y divide-seed-line">
                {STANDINGS.map((entry, index) => (
                  <li
                    className="flex items-center gap-4 py-2.5 first:pt-0 last:pb-0"
                    key={entry.id}
                  >
                    <span
                      className={cn(
                        "w-6 font-mono text-sm tabular-nums",
                        entry.you ? "text-seed-gold" : "text-seed-muted"
                      )}
                    >
                      {index + 1}
                    </span>

                    <span
                      className={cn(
                        "flex-1 truncate text-sm",
                        entry.you && "font-semibold text-seed-gold"
                      )}
                    >
                      {entry.you ? t("board.you") : entry.name}
                    </span>

                    <span
                      className={cn(
                        "font-display font-semibold text-sm tabular-nums",
                        entry.you ? "text-seed-gold" : "text-seed-muted"
                      )}
                    >
                      {format.number(entry.score)}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-col gap-2.5">
                <div
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-seed-line"
                >
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-seed-teal to-seed-gold"
                    // The fill follows the tier list, so it cannot be a static
                    // Tailwind width without hardcoding the ladder's length.
                    style={{ width: `${LADDER_FILL}%` }}
                  />
                </div>

                <ul className="flex justify-between gap-1">
                  {TIERS.map((tier, index) => {
                    const anchor =
                      index === 0 ||
                      index === CURRENT_TIER ||
                      index === TIERS.length - 1;

                    return (
                      <li
                        className={cn(
                          "font-mono text-[0.625rem] uppercase tracking-[0.12em]",
                          // Six labels do not fit across a phone, so a narrow
                          // screen keeps the two ends and the tier in play.
                          anchor ? "block" : "hidden sm:block",
                          index === CURRENT_TIER
                            ? "text-seed-gold"
                            : "text-seed-muted"
                        )}
                        key={tier}
                      >
                        {tier}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <p className="text-pretty text-muted-foreground text-sm">
                {t("board.body")}
              </p>
            </Card>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
