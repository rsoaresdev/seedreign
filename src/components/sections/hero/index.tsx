import { getTranslations } from "next-intl/server";

import { PLAY_PATH, SECTION_LINKS } from "@/components/layout/nav-links";
import { HeroBackdrop } from "@/components/sections/hero/hero-backdrop";
import { HeroReveal } from "@/components/sections/hero/hero-reveal";
import { HeroScrollCta } from "@/components/sections/hero/hero-scroll-cta";
import { HeroTitle } from "@/components/sections/hero/hero-title";
import { REVEAL_DELAY, WORD_STAGGER } from "@/components/sections/hero/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";

/** The quiet call to action walks down to whatever comes first under the fold. */
const NEXT_SECTION = SECTION_LINKS[0].hash;

/** Seconds between the headline landing and the block under it starting. */
const TRAIL = 0.12;

export async function Hero() {
  const t = await getTranslations("Hero");

  const lead = t("title.lead");
  const accent = t("title.accent");

  // The pitch and the buttons wait for the headline to finish writing itself.
  const afterTitle =
    REVEAL_DELAY + `${lead} ${accent}`.split(" ").length * WORD_STAGGER;

  return (
    // `isolate` keeps the backdrop's negative z-index inside the section
    // instead of dropping it behind the page background.
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center overflow-hidden py-16 sm:py-20">
      <HeroBackdrop />

      <Container className="flex flex-col items-center gap-7 text-center sm:gap-8">
        <HeroReveal delay={0}>
          <Badge variant="teal" className="uppercase tracking-[0.18em]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-seed-teal motion-safe:animate-pulse-dot"
            />
            {t("badge")}
          </Badge>
        </HeroReveal>

        <HeroTitle lead={lead} accent={accent} className="max-w-4xl" />

        <HeroReveal delay={afterTitle}>
          <p className="max-w-xl text-balance text-seed-muted sm:text-lg">
            {t("subtitle")}
          </p>
        </HeroReveal>

        {/* Thumb first: the two calls to action are stacked and full width on a
            phone, and only sit side by side once there is room. */}
        <HeroReveal
          delay={afterTitle + TRAIL}
          className="flex w-full max-w-xs flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:gap-4"
        >
          {/* The halo is a separate blurred layer rather than an animated
              box-shadow, so the pulse stays on the compositor. */}
          <span className="relative inline-flex">
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-xl bg-seed-gold opacity-50 blur-xl motion-safe:animate-glow-pulse"
            />
            <Button
              asChild
              variant="play"
              size="xl"
              className="relative w-full sm:w-auto"
            >
              <Link href={PLAY_PATH}>{t("play")}</Link>
            </Button>
          </span>

          <HeroScrollCta targetId={NEXT_SECTION} className="w-full sm:w-auto">
            {t("secondary")}
          </HeroScrollCta>
        </HeroReveal>

        <HeroReveal delay={afterTitle + TRAIL * 2}>
          <p className="text-seed-muted text-xs">{t("note")}</p>
        </HeroReveal>
      </Container>
    </section>
  );
}
