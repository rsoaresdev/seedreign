"use client";

import { motion, type Variants } from "motion/react";
import { Fragment } from "react";

import {
  EASE_OUT,
  REVEAL_DELAY,
  WORD_DURATION,
  WORD_STAGGER,
} from "@/components/sections/hero/motion";
import { titleVariants } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const wordVariants: Variants = {
  hidden: { opacity: 0, y: "0.4em" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: WORD_DURATION, ease: EASE_OUT },
  },
};

function lineVariants(delay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: { delayChildren: delay, staggerChildren: WORD_STAGGER },
    },
  };
}

/**
 * One line of the headline, revealed a word at a time.
 *
 * The spaces are text nodes between the spans rather than part of them, so the
 * line still breaks and collapses where a normal sentence would.
 */
function Line({
  text,
  delay,
  className,
}: {
  text: string;
  delay: number;
  className?: string;
}) {
  const parts = text.split(" ");
  const words = parts.map((word, index) => ({
    // A stable key that is not the bare index, since the same word can repeat.
    id: `${index}-${word}`,
    word,
    last: index === parts.length - 1,
  }));

  return (
    <motion.span
      variants={lineVariants(delay)}
      initial="hidden"
      animate="visible"
      className={cn("block", className)}
    >
      {words.map(({ id, word, last }) => (
        <Fragment key={id}>
          <motion.span variants={wordVariants} className="inline-block">
            {word}
          </motion.span>
          {last ? null : " "}
        </Fragment>
      ))}
    </motion.span>
  );
}

/**
 * The hero headline.
 *
 * Splitting a sentence into one element per word leaves assistive tech to
 * stitch it back together, so the whole thing is spelled out once in
 * `aria-label`. A screen reader only duplicate would do the same job, but it
 * would also land in the clipboard twice on a copy.
 */
export function HeroTitle({
  lead,
  accent,
  className,
}: {
  lead: string;
  accent: string;
  className?: string;
}) {
  const accentDelay = REVEAL_DELAY + lead.split(" ").length * WORD_STAGGER;

  return (
    <h1
      aria-label={`${lead} ${accent}`}
      className={cn(titleVariants({ size: "hero" }), className)}
    >
      <Line text={lead} delay={REVEAL_DELAY} />
      <Line text={accent} delay={accentDelay} className="text-seed-gold" />
    </h1>
  );
}
