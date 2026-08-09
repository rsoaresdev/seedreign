import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Link } from "@/i18n/navigation";

/** The brand mark, drawn inline so it inherits colour and needs no request. */
function SeedMark() {
  return (
    <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
      <title>Seedreign</title>
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

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
      <Link
        href="/"
        className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SeedMark />
      </Link>

      <LocaleSwitcher />
    </header>
  );
}
