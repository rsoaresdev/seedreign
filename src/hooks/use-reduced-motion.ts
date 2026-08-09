"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Tracks the user's "reduce motion" preference, and keeps tracking it, so the
 * value updates live if they change the OS setting.
 *
 * Returns `null` until the media query has actually been read, which is the
 * case on the server and on the very first client render. Callers decide what
 * that means for them:
 *
 *  - gating animation: treat `null` as "reduced", that is `!== false`, so
 *    nothing moves before the preference is known;
 *  - displaying the preference: render a neutral state, because `null` means
 *    "not known yet" rather than "reduced".
 */
export function useReducedMotion(): boolean | null {
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const sync = () => setReducedMotion(media.matches);

    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reducedMotion;
}
