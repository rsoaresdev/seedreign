import type { MetadataRoute } from "next";

import { localePath, routing } from "@/i18n/routing";
import { absoluteUrl } from "@/lib/site";

/** Every indexable path, listed once per locale with full hreflang alternates. */
const PATHS = ["/"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(localePath(locale, path)),
      changeFrequency: "daily" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((alternate) => [
            alternate,
            absoluteUrl(localePath(alternate, path)),
          ])
        ),
      },
    }))
  );
}
