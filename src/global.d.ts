import type { routing } from "@/i18n/routing";
import type messages from "../messages/en.json";

/**
 * Makes next-intl strict across the whole app:
 *
 *  - `Locale` narrows every locale value to "en" | "pt"
 *  - `Messages` type checks translation KEYS against messages/en.json, the
 *    source of truth, so a typo in `t("...")` becomes a compile error.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
