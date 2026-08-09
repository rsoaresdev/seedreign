import { getTranslations } from "next-intl/server";

import { SECTION_LINKS } from "@/components/layout/nav-links";
import {
  type GlyphPattern,
  PillarGlyph,
} from "@/components/sections/what-is-it/pillar-glyph";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * The four things a newcomer has to understand before anything else makes
 * sense. `key` indexes the `WhatIsIt.pillars` messages, so a renamed pillar
 * fails to compile instead of rendering a missing translation.
 */
const PILLARS = [
  { key: "daily", pattern: "sow" },
  { key: "skill", pattern: "claim" },
  { key: "living", pattern: "collapse" },
  { key: "share", pattern: "share" },
] as const satisfies readonly { key: string; pattern: GlyphPattern }[];

/** Seconds between two cards arriving once the row is in view. */
const STAGGER = 0.08;

export async function WhatIsIt() {
  const t = await getTranslations("WhatIsIt");

  return (
    <section
      id={SECTION_LINKS[0].hash}
      // The hero's second call to action sends focus here, so the section has
      // to be able to receive it.
      tabIndex={-1}
      className="scroll-mt-24 py-20 outline-none sm:py-28"
    >
      <Container
        size="lg"
        className="flex flex-col items-center gap-12 sm:gap-16"
      >
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, index) => (
            <Reveal as="li" key={pillar.key} delay={index * STAGGER}>
              <Card className="h-full gap-4 p-6">
                <PillarGlyph pattern={pillar.pattern} />

                <h3 className="font-display font-semibold text-lg leading-tight">
                  {t(`pillars.${pillar.key}.title`)}
                </h3>

                <p className="text-pretty text-muted-foreground text-sm">
                  {t(`pillars.${pillar.key}.body`)}
                </p>
              </Card>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
