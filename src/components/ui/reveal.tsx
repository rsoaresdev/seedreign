"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { EASE_OUT, REVEAL_DURATION } from "@/lib/motion";

/** Fraction of the block that has to be on screen before it starts. */
const VIEWPORT = { once: true, amount: 0.25 } as const;

/**
 * Fades a block up the first time it is scrolled into view.
 *
 * `once` on purpose: a block that replays every time it crosses the fold reads
 * as a glitch on the way back up, and it keeps the observer alive for the whole
 * session for no reason.
 */
export function Reveal({
  delay = 0,
  as = "div",
  className,
  children,
}: {
  /** Seconds to wait, so a row of blocks can arrive one after another. */
  delay?: number;
  /** Use `li` inside a list, where a `div` would not be valid markup. */
  as?: "div" | "li";
  className?: string;
  children: ReactNode;
}) {
  const Tag = as === "li" ? motion.li : motion.div;

  return (
    <Tag
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: REVEAL_DURATION, delay, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </Tag>
  );
}
