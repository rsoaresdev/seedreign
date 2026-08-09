import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * Per request i18n config, auto detected by `createNextIntlPlugin()`.
 *
 * `requestLocale` is a Promise and MUST be awaited. The older
 * `({ locale }) => ...` signature belongs to next-intl v3: in v4 that param is
 * `undefined` on a normal request and throws "No locale was returned from
 * `getRequestConfig`".
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // Pinned explicitly. Without it next-intl falls back to the server's zone,
    // which would bake the build machine's timezone into prerendered pages.
    timeZone: "UTC",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
