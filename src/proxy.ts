import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * Locale negotiation (what used to be `middleware.ts`).
 *
 * Next.js 16 renamed this file convention to `proxy.ts` and the export must be
 * named `proxy`. In a `src/` project the file has to live at `src/proxy.ts`,
 * because a root level one is silently ignored.
 */
export const proxy = createMiddleware(routing);

export const config = {
  /**
   * Match everything except API routes, Next internals and files with an
   * extension.
   *
   * Do NOT narrow this to `['/', '/(en|pt)/:path*']`: with
   * `localePrefix: 'as-needed'` the unprefixed English routes would never reach
   * the proxy, so the internal rewrite to `/en/...` would never happen.
   */
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
