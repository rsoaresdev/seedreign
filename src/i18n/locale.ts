import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { routing } from "./routing";

/**
 * Validates the `[locale]` route param and opts the segment into static
 * rendering. Call this at the top of every layout, page and `generateMetadata`
 * under `src/app/[locale]`.
 *
 * `params` is a Promise in Next 16, and its `locale` is typed as a plain
 * `string`. `hasLocale` is the type guard that narrows it to a real locale, so
 * an unknown one returns a 404 instead of silently rendering the default
 * language.
 */
export async function resolveLocale(
  params: Promise<{ locale: string }>
): Promise<Locale> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return locale;
}
