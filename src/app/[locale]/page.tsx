import type { LucideIcon } from "lucide-react";
import { Sprout, Timer, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { DailyWorld } from "@/components/layout/daily-world";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { resolveLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/routing";
import { absoluteUrl, site } from "@/lib/site";

function Perk({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-seed-line bg-seed-panel/60 px-4 py-3 text-left">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-seed-teal" />
      <div className="min-w-0">
        <div className="text-[0.625rem] text-seed-muted uppercase tracking-[0.18em]">
          {label}
        </div>
        <div className="truncate font-medium text-sm">{value}</div>
      </div>
    </li>
  );
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);

  const [t, brand, meta] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Brand"),
    getTranslations("Metadata"),
  ]);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: brand("name"),
    url: absoluteUrl(localePath(locale)),
    description: meta("description"),
    inLanguage: locale,
    genre: ["Strategy", "Multiplayer online battle"],
    gamePlatform: ["Web browser", "Android", "iOS"],
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <main className="flex flex-1 items-center justify-center px-5 pt-4 pb-20 sm:pb-28">
      <script
        type="application/ld+json"
        // Serialised from a literal object above, so there is no user input.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has no other injection point.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Container size="sm" className="flex flex-col items-center gap-10">
        <Badge variant="gold" className="uppercase tracking-[0.18em]">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-seed-gold motion-safe:animate-pulse-dot"
          />
          {t("status")}
        </Badge>

        <SectionHeading
          as="h1"
          size="hero"
          align="center"
          title={brand("name")}
          description={t("tagline")}
        />

        <DailyWorld />

        <div className="flex flex-col items-center gap-3">
          <Button variant="play" size="xl">
            {t("play")}
          </Button>
          <p className="text-seed-muted text-xs">{t("playNote")}</p>
        </div>

        <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Perk
            icon={Timer}
            label={t("perks.runLabel")}
            value={t("perks.runValue")}
          />
          <Perk
            icon={Sprout}
            label={t("perks.seedLabel")}
            value={t("perks.seedValue")}
          />
          <Perk
            icon={Zap}
            label={t("perks.asyncLabel")}
            value={t("perks.asyncValue")}
          />
        </ul>
      </Container>
    </main>
  );
}
