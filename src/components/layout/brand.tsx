import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** The brand mark, drawn inline so it inherits colour and needs no request. */
export function SeedMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className={cn("size-7", className)}
    >
      {/* The seed, crowned by its rays. Painted in the sky first so the
          silhouette carries the sky itself: no clip, and nothing to collide
          with when the mark renders more than once on a page. */}
      <path
        d="M50 96 C68 90 80 71 80 53 C80 45 77 40 71 35 L73 15 L61 30 L50 7 L39 30 L27 15 L29 35 C23 40 20 45 20 53 C20 71 32 90 50 96 Z"
        className="fill-seed-gold"
      />
      {/* The world reborn: a sun cresting the horizon. */}
      <path d="M39 56 A11 11 0 0 1 61 56 Z" className="fill-seed-sun" />
      {/* The husk, below the horizon. Its curve is the silhouette's own outline
          cut at y=56, so the two edges land on each other exactly. */}
      <path
        d="M20.11 56 C21.35 73.07 33 90.33 50 96 C67 90.33 78.65 73.07 79.89 56 Z"
        className="fill-seed-bark"
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
