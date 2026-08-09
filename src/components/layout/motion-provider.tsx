"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Global Motion policy.
 *
 * `reducedMotion="user"` makes every `motion/react` animation in the app honour
 * the OS "reduce motion" setting automatically: transform and layout
 * animations are disabled while opacity and colour still cross fade, so nothing
 * simply disappears.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
