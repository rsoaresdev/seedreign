import { getTranslations } from "next-intl/server";

import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { Hero } from "@/components/sections/hero";
import { HowToPlay } from "@/components/sections/how-to-play";
import { Modes } from "@/components/sections/modes";
import { Share } from "@/components/sections/share";
import { WhatIsIt } from "@/components/sections/what-is-it";
import { World } from "@/components/sections/world";
import { resolveLocale } from "@/i18n/locale";
import { localePath } from "@/i18n/routing";
import { absoluteUrl, site } from "@/lib/site";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);

  const [brand, meta] = await Promise.all([
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
    <main
      id="main-content"
      // Focusable so the header's skip link actually moves focus, and offset
      // so the sticky bar never covers the landing spot.
      tabIndex={-1}
      className="flex flex-1 scroll-mt-24 flex-col outline-none"
    >
      <script
        type="application/ld+json"
        // Serialised from a literal object above, so there is no user input.
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has no other injection point.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Hero />
      <WhatIsIt />
      <HowToPlay />
      <World />
      <Modes />
      <Share />
      <Faq />
      <FinalCta />
    </main>
  );
}
