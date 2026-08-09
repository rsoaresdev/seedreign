"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Brand } from "@/components/layout/brand";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  LOGIN_PATH,
  PLAY_PATH,
  SECTION_LINKS,
} from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Past this much scroll the bar stops floating and becomes a real surface. */
const SCROLL_THRESHOLD = 12;

export function Navbar() {
  const t = useTranslations("Nav");
  const tLinks = useTranslations("Nav.links");
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > SCROLL_THRESHOLD);
  });

  // A restored scroll position (reload, back navigation) fires no scroll
  // event, so without this the bar would start transparent on top of content.
  useEffect(() => {
    setScrolled(scrollY.get() > SCROLL_THRESHOLD);
  }, [scrollY]);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        // The blur is tied to the scrolled state on purpose: at rest there is
        // only the page's own grid behind the bar, and blurring that reads as
        // a smudge rather than as glass.
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-seed-line bg-seed-glass shadow-panel backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      {/* The padding has to be repeated under `focus:`: `not-sr-only` resets
          padding to zero, so a plain `px-4 py-2` would be undone the moment
          the link becomes visible. */}
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-seed-panel-raised font-medium text-seed-text text-sm shadow-raised ring-2 ring-ring focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2"
      >
        {t("skipToContent")}
      </a>

      <Container size="lg">
        <div
          className={cn(
            "flex items-center gap-3 duration-300 motion-safe:transition-[height]",
            scrolled ? "h-16" : "h-20"
          )}
        >
          <div className="flex flex-1 items-center">
            <Brand />
          </div>

          <nav aria-label={t("label")} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {SECTION_LINKS.map((item) => (
                <li key={item.key}>
                  <Link
                    href={{ pathname: "/", hash: item.hash }}
                    className="rounded-lg px-3 py-2 font-medium text-seed-muted text-sm transition-colors hover:bg-seed-panel hover:text-seed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {tLinks(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <LocaleSwitcher size="sm" className="hidden md:inline-flex" />

            <Link
              href={LOGIN_PATH}
              className="hidden rounded-lg px-3 py-2 font-medium text-seed-muted text-sm transition-colors hover:bg-seed-panel hover:text-seed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-block"
            >
              {t("login")}
            </Link>

            <Button asChild variant="play" size="lg" className="h-10 px-4">
              <Link href={PLAY_PATH}>{t("play")}</Link>
            </Button>

            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  );
}
