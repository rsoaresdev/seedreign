"use client";

import { type ReactNode, useEffect } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import "lenis/dist/lenis.css";

/**
 * Smooth scrolling, driven from the GSAP ticker so Lenis and ScrollTrigger
 * share a single rAF loop.
 *
 * Disabled entirely when the reader prefers reduced motion, and Lenis plus
 * GSAP (around 130 KB) are imported dynamically, so visitors who never get
 * smooth scrolling never download them.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // `!== false` on purpose: `null` means the preference has not been read
    // yet, and nothing should move until we positively know motion is welcome.
    if (reducedMotion !== false) return;

    let cancelled = false;
    let teardown: (() => void) | undefined;

    void (async () => {
      const [{ default: Lenis }, { gsap, ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("@/lib/gsap"),
      ]);

      // The effect may have been cleaned up while the chunks were loading.
      if (cancelled) return;

      const lenis = new Lenis({ autoRaf: false });
      lenis.on("scroll", () => ScrollTrigger.update());

      // gsap.ticker reports time in SECONDS, Lenis expects MILLISECONDS.
      const raf = (time: number) => lenis.raf(time * 1000);

      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      teardown = () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
