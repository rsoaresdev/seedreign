import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** The brand mark, drawn inline so it inherits colour and needs no request. */
export function SeedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7", className)}
    >
      <path
        d="M16 4.5c5 3.5 7.8 7.4 7.8 11.6 0 4.5-3.5 8.1-7.8 8.1s-7.8-3.6-7.8-8.1C8.2 11.9 11 8 16 4.5Z"
        className="fill-seed-gold"
      />
      <path
        d="M16 12.2c2 1.5 3.1 3.1 3.1 5 0 2.1-1.4 3.7-3.1 3.7s-3.1-1.6-3.1-3.7c0-1.9 1.1-3.5 3.1-5Z"
        className="fill-seed-bg"
      />
      <path
        d="M16 24.2v3.3"
        className="stroke-seed-teal"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Mark plus wordmark, linked home. No `aria-label`: the wordmark is real text,
 * so the link already announces itself and stays translatable.
 */
export function Brand({
  className,
  markClassName,
  wordmarkClassName,
  onClick,
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  onClick?: () => void;
}) {
  const t = useTranslations("Brand");

  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "group inline-flex shrink-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <SeedMark className={markClassName} />
      <span
        className={cn(
          "font-bold font-display text-base tracking-tight sm:text-lg",
          wordmarkClassName
        )}
      >
        {t("name")}
      </span>
    </Link>
  );
}
