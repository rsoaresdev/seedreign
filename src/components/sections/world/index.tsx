import { getTranslations } from "next-intl/server";

import { WorldStage } from "@/components/sections/world/world-stage";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

export async function World() {
  const t = await getTranslations("World");

  return (
    <section className="scroll-mt-24 py-20 sm:py-28" id="world">
      <Container
        className="flex flex-col items-center gap-10 sm:gap-14"
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

        <Reveal className="w-full">
          <WorldStage />
        </Reveal>

        <Reveal>
          <p className="max-w-prose text-balance text-center text-muted-foreground text-sm">
            {t("note")}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
