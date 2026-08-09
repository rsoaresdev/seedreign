"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { localeName, routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const switcherVariants = cva(
  "inline-flex items-center rounded-full border border-seed-line bg-seed-panel/60 p-0.5",
  {
    variants: {
      size: {
        sm: "gap-0.5",
        default: "gap-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const optionVariants = cva(
  "rounded-full font-medium uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      size: {
        sm: "px-2.5 py-1 text-[0.6875rem] tracking-[0.12em]",
        default: "px-3 py-1.5 text-xs tracking-[0.12em]",
      },
      current: {
        true: "bg-seed-teal text-seed-bg",
        false:
          "text-seed-muted hover:bg-seed-panel-raised hover:text-seed-text",
      },
    },
    defaultVariants: {
      size: "default",
      current: false,
    },
  }
);

/**
 * Language switcher, rendered as a segmented control of real links so it works
 * with the keyboard, with a middle click and without JavaScript.
 *
 * `usePathname` returns the locale-stripped path, so the reader stays on the
 * page they were on instead of being sent home. next-intl writes the
 * `NEXT_LOCALE` cookie on click, so the choice survives the next visit.
 */
export function LocaleSwitcher({
  className,
  size,
  onSelect,
}: VariantProps<typeof switcherVariants> & {
  className?: string;
  /** Lets a container react to the choice, for instance closing the drawer. */
  onSelect?: () => void;
}) {
  const t = useTranslations("LocaleSwitcher");
  const current = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("label")}
      className={cn(switcherVariants({ size }), className)}
    >
      {routing.locales.map((locale) => {
        const isCurrent = locale === current;

        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            hrefLang={locale}
            onClick={onSelect}
            aria-current={isCurrent ? "true" : undefined}
            className={optionVariants({ size, current: isCurrent })}
          >
            {locale}
            {/* Keeps the accessible name meaningful while the visible label
                stays a two letter code. */}
            <span className="sr-only"> {localeName(locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
