import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { LenisProvider } from "@/components/layout/lenis-provider";
import { MotionProvider } from "@/components/layout/motion-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { resolveLocale } from "@/i18n/locale";
import { localePath, routing } from "@/i18n/routing";
import { site } from "@/lib/site";
import "@/styles/globals.css";

/** Body copy: clean and highly legible at small sizes. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/** Display face for titles: geometric and heavy at the top end. */
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: site.themeColor,
  colorScheme: "dark",
};

/** Pre-render every locale at build time. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Metadata" });

  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(site.url),
    title: {
      default: t("titleDefault"),
      // Child routes render as "Page · Seedreign".
      template: t("titleTemplate", { page: "%s" }),
    },
    description,
    applicationName: site.name,
    keywords: t("keywords").split(", "),
    alternates: {
      canonical: localePath(locale),
      languages: {
        ...Object.fromEntries(
          routing.locales.map((l) => [l, localePath(l)] as const)
        ),
        "x-default": localePath(routing.defaultLocale),
      },
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("titleDefault"),
      description,
      locale: site.locales[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => site.locales[l]),
      url: localePath(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: t("titleDefault"),
      description,
      creator: site.handle,
      site: site.handle,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    formatDetection: {
      telephone: false,
      address: false,
      email: false,
    },
    other: {
      "apple-mobile-web-app-title": title,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);

  return (
    <html
      lang={locale}
      // Next 16 no longer forces `scroll-behavior: smooth` during navigation.
      data-scroll-behavior="smooth"
      // `dark` keeps shadcn's `dark:` utilities active. The theme itself is
      // dark only, defined once on :root.
      className={`${inter.variable} ${sora.variable} dark antialiased`}
    >
      {/*
        `min-h-dvh` rather than `h-full` or `min-h-full`: Lenis ships
        `html.lenis, html.lenis body { height: auto }`, which defeats any
        percentage height chain the moment smooth scrolling activates.
      */}
      <body className="flex min-h-dvh flex-col">
        {/* Rendered from a Server Component, so locale and messages are filled
            in automatically and must not be passed manually. */}
        <NextIntlClientProvider>
          <MotionProvider>
            <LenisProvider>
              <SiteHeader />
              {children}
            </LenisProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
