"use client";

import type Lenis from "lenis";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import "lenis/dist/lenis.css";

const LenisContext = createContext<Lenis | null>(null);

/**
 * The live Lenis instance, or `null` whenever smooth scrolling is not running:
 * the reader prefers reduced motion, or the chunk has not loaded yet. Anything
 * that scrolls programmatically has to handle both, because `null` means the
 * document scrolls natively.
 */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

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
  const [lenis, setLenis] = useState<Lenis | null>(null);

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

      const instance = new Lenis({ autoRaf: false });
      instance.on("scroll", () => ScrollTrigger.update());

      // gsap.ticker reports time in SECONDS, Lenis expects MILLISECONDS.
      const raf = (time: number) => instance.raf(time * 1000);

      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      setLenis(instance);

      teardown = () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        instance.destroy();
        setLenis(null);
      };
    })();

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [reducedMotion]);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
