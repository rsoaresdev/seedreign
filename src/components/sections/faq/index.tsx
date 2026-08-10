import { getTranslations } from "next-intl/server";

import { SECTION_LINKS } from "@/components/layout/nav-links";
import { FaqList } from "@/components/sections/faq/faq-list";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { site } from "@/lib/site";

export async function Faq() {
  const t = await getTranslations("Faq");

  return (
    <section className="scroll-mt-24 py-20 sm:py-28" id={SECTION_LINKS[3].hash}>
      <Container className="flex flex-col gap-12 sm:gap-16">
        <Reveal>
          <SectionHeading
            align="center"
            description={t("description")}
            eyebrow={t("eyebrow")}
            title={t("title")}
          />
        </Reveal>

        <FaqList />

        <Reveal className="text-center">
          <p className="text-muted-foreground text-sm">
            {t("more")}{" "}
            <a
              className="font-medium text-seed-teal underline-offset-4 hover:underline"
              href={site.social.discord}
              rel="noreferrer"
              target="_blank"
            >
              {t("discord")}
            </a>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
