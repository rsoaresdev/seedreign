"use client";

import { ArrowDown } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { useLenis } from "@/components/layout/lenis-provider";
import { Button } from "@/components/ui/button";

/** Room left for the sticky header once it has shrunk, in pixels. */
const HEADER_OFFSET = 72;

/**
 * The quiet call to action: walks the reader down to the next section.
 *
 * It stays a real anchor, so it works with a middle click, with the keyboard
 * and before the smooth scrolling chunk has loaded. The handler only takes
 * over when there is something better to do than the browser's instant jump.
 */
export function HeroScrollCta({
  targetId,
  className,
  children,
}: {
  targetId: string;
  className?: string;
  children: ReactNode;
}) {
  const lenis = useLenis();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(targetId);

    if (!target) return;

    event.preventDefault();

    if (lenis) lenis.scrollTo(target, { offset: -HEADER_OFFSET });
    else target.scrollIntoView({ block: "start" });

    // Seeing the section is not enough: keyboard and screen reader users have
    // to actually land in it, otherwise the next Tab starts back at the top.
    target.focus({ preventScroll: true });
  };

  return (
    <Button asChild variant="outline" size="xl" className={className}>
      <a href={`#${targetId}`} onClick={handleClick}>
        {children}
        <ArrowDown />
      </a>
    </Button>
  );
}
