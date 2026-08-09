"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT, REVEAL_DURATION } from "@/lib/motion";

/**
 * Fades a block of the hero up into place on load. Everything above the fold
 * is visible immediately, so this runs on mount rather than on scroll.
 */
export function HeroReveal({
  delay,
  className,
  children,
}: {
  /** Seconds to wait, so callers can order themselves down the page. */
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: REVEAL_DURATION, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
