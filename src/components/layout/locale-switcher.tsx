"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { localeName, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Language switcher. `usePathname` returns the locale-stripped path, so the
 * user stays on the page they were reading instead of being sent home.
 */
export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="flex items-center gap-1 text-sm">
      {routing.locales.map((locale) => {
        const isCurrent = locale === current;

        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            lang={locale}
            aria-current={isCurrent ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCurrent
                ? "bg-seed-teal font-medium text-seed-bg"
                : "text-seed-muted hover:bg-seed-panel hover:text-seed-text"
            )}
          >
            {localeName(locale)}
          </Link>
        );
      })}
    </nav>
  );
}
