"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";

import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Degrees the card leans when the pointer is at an edge. */
const TILT = 5;

/** How far the glow under the pointer reaches. */
const GLOW_RADIUS = "15rem";

const SPRING = { stiffness: 240, damping: 26, mass: 0.5 };

export type TiltTone = "gold" | "teal" | "violet";

const TONE_GLOW: Record<TiltTone, string> = {
  gold: "var(--seed-gold-tint)",
  teal: "var(--seed-teal-tint)",
  violet: "var(--seed-violet-tint)",
};

/**
 * A card that leans away from the pointer and carries a glow under it.
 *
 * Mouse only, and only when motion is welcome: a touch pointer would just snap
 * the card to wherever the reader last tapped and leave it there.
 */
export function TiltCard({
  tone = "gold",
  className,
  children,
}: {
  tone?: TiltTone;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  // Pointer position, as a fraction of the card from its middle.
  const offsetX = useMotionValue(0);
  const offsetY = useMotionValue(0);

  // Pointer position in pixels, which is where the glow is centred.
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const rotateX = useSpring(
    useTransform(offsetY, [-0.5, 0.5], [TILT, -TILT]),
    SPRING
  );
  const rotateY = useSpring(
    useTransform(offsetX, [-0.5, 0.5], [-TILT, TILT]),
    SPRING
  );

  const glow = useMotionTemplate`radial-gradient(${GLOW_RADIUS} ${GLOW_RADIUS} at ${glowX}px ${glowY}px, ${TONE_GLOW[tone]}, transparent 70%)`;

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    // `!== false` on purpose: nothing tilts until the motion preference has
    // positively been read.
    if (reducedMotion !== false || event.pointerType !== "mouse") return;

    const bounds = ref.current?.getBoundingClientRect();

    if (!bounds) return;

    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    glowX.set(x);
    glowY.set(y);
    offsetX.set(x / bounds.width - 0.5);
    offsetY.set(y / bounds.height - 0.5);
  };

  const handlePointerLeave = () => {
    offsetX.set(0);
    offsetY.set(0);
  };

  return (
    <motion.div
      className="group/tilt h-full"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden transition-[border-color,box-shadow] duration-300 group-hover/tilt:border-seed-line-strong group-hover/tilt:shadow-raised",
          className
        )}
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
          style={{ backgroundImage: glow }}
        />

        <div className="relative flex h-full flex-col gap-4">{children}</div>
      </Card>
    </motion.div>
  );
}
