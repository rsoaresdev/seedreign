import { defineRouting } from "next-intl/routing";

/**
 * Locale routing.
 *
 * English is the default and is served WITHOUT a prefix (`/`), Portuguese at
 * `/pt`. To add a language: create `messages/xx.json` and add `"xx"` below.
 *
 * Do not annotate `locales` with an explicit type. `defineRouting` relies on
 * `const` generics to infer the literal tuple, and widening it to `string[]`
 * loses all locale type safety across the app.
 */
export const routing = defineRouting({
  locales: ["en", "pt"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/**
 * The public URL for a path in a given locale, honouring `as-needed` (the
 * default locale carries no prefix). Used for canonical and hreflang metadata.
 *
 * Pure and dependency free, so it is safe in both Server and Client Components.
 */
export function localePath(locale: Locale, pathname: string = "/"): string {
  const suffix = pathname === "/" ? "" : pathname;
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;

  return `${prefix}${suffix}` || "/";
}

/**
 * A locale's own name for itself ("English", "Português"), taken from the
 * runtime's CLDR data rather than a hand maintained translation key, so adding
 * a language never requires editing the existing message catalogues.
 */
export function localeName(locale: Locale): string {
  const name =
    new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;

  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}
