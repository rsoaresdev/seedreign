import { getTranslations } from "next-intl/server";

import { PLAY_PATH } from "@/components/layout/nav-links";
import { DuskCountdown } from "@/components/sections/final-cta/dusk-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";

/**
 * The last thing on the page: the time the world has left, and the one button
 * that matters.
 */
export async function FinalCta() {
  const t = await getTranslations("FinalCta");

  return (
    // `isolate` keeps the backdrop's negative z-index inside the section
    // instead of dropping it behind the page background.
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_36rem_at_50%_120%,var(--seed-gold-tint),transparent_70%),radial-gradient(44rem_28rem_at_50%_-20%,var(--seed-violet-tint),transparent_70%)]"
      />

      {/* The horizon the world sets behind. Two hairlines rather than a border,
          so the section reads as a place instead of as a box. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-linear-to-r from-transparent via-seed-line-strong to-transparent"
      />

      <Container className="flex flex-col items-center gap-8 text-center">
        <Reveal>
          <Badge className="uppercase tracking-[0.18em]" variant="gold">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-seed-gold motion-safe:animate-pulse-dot"
            />
            {t("eyebrow")}
          </Badge>
        </Reveal>

        <Reveal delay={0.06}>
          <h2 className="max-w-3xl text-balance font-bold font-display text-4xl tracking-tight sm:text-5xl lg:text-6xl">
            {t("title")}
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="max-w-xl text-balance text-seed-muted sm:text-lg">
            {t("description")}
          </p>
        </Reveal>

        <Reveal
          className="flex w-full max-w-xs flex-col items-center gap-4"
          delay={0.18}
        >
          {/* The halo is a separate blurred layer rather than an animated
              box-shadow, so the pulse stays on the compositor. */}
          <span className="relative inline-flex w-full sm:w-auto">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-seed-gold opacity-50 blur-xl motion-safe:animate-glow-pulse"
            />
            <Button
              asChild
              className="relative w-full sm:w-auto sm:px-14"
              size="xl"
              variant="play"
            >
              <Link href={PLAY_PATH}>{t("play")}</Link>
            </Button>
          </span>

          <p className="text-seed-muted text-xs">{t("note")}</p>
        </Reveal>

        {/* The rule is held to the width of the button above it, so the clock
            reads as the last line of the call to action and not as a stray
            row. */}
        <Reveal
          className="flex w-full max-w-xs justify-center border-seed-line border-t pt-8"
          delay={0.24}
        >
          <DuskCountdown />
        </Reveal>
      </Container>
    </section>
  );
}
