"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { createHeroWorld } from "@/components/sections/hero/hero-world";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** One simulation step. Slow on purpose: a map should read as a map. */
const TICK_MS = 110;

/** At or below this core count the device gets the still frame, not the loop. */
const LOW_CORE_COUNT = 4;

/** Cells are big flat blocks, so there is nothing to gain past this. */
const MAX_DPR = 1.5;

/** A world costs something to generate, so ignore small height changes. */
const RESIZE_TOLERANCE = 96;

/** Debounce for a drag resize, in milliseconds. */
const RESIZE_DELAY = 160;

/** How far the map and the glows slide with the pointer, in pixels. */
const MAP_TRAVEL = 16;
const GLOW_TRAVEL = -30;

const SPRING = { stiffness: 55, damping: 18, mass: 0.7 };

/**
 * Where the backdrop starts. Rolled per visit rather than taken from the
 * calendar: this world is scenery, not the one being played today, and a
 * reader who reloads should get a coastline they have not seen before.
 *
 * A resize keeps the seed it was given, so only the grid is rebuilt.
 */
function openingSeed(): number {
  return (Math.random() * 0x7fff_ffff) | 0;
}

/**
 * The world behind the hero: a canvas map being taken, collapsing and being
 * sown again, under two glows that drift with the pointer.
 *
 * Three things decide whether any of it moves, and all three have to say yes:
 * the reader's motion preference, their data preference, and how much machine
 * they are on. When any says no the same canvas paints a single conquered
 * frame and then never touches the CPU again, which is why the fallback is the
 * artwork itself rather than an image download.
 */
export function HeroBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();
  const [lowPower, setLowPower] = useState<boolean | null>(null);

  useEffect(() => {
    const savesData = window.matchMedia("(prefers-reduced-data: reduce)");
    const cores = navigator.hardwareConcurrency;

    setLowPower(savesData.matches || (cores > 0 && cores <= LOW_CORE_COUNT));
  }, []);

  // `null` on either means the preference has not been read yet. Nothing moves
  // until we positively know that motion and the extra frames are welcome.
  const known = reducedMotion !== null && lowPower !== null;
  const animated = reducedMotion === false && lowPower === false;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !known) return;

    const world = createHeroWorld(canvas, openingSeed());

    let frame = 0;
    let previous = 0;
    let paintedWidth = 0;
    let paintedHeight = 0;
    let resizeTimer = 0;

    const paint = () => {
      const width = Math.round(canvas.clientWidth);
      const height = Math.round(canvas.clientHeight);

      if (width < 1 || height < 1) return;
      if (
        width === paintedWidth &&
        Math.abs(height - paintedHeight) < RESIZE_TOLERANCE
      ) {
        return;
      }

      paintedWidth = width;
      paintedHeight = height;

      world.resize(
        width,
        height,
        Math.min(window.devicePixelRatio || 1, MAX_DPR)
      );

      if (!animated) world.settle();
    };

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);

      if (time - previous < TICK_MS) return;

      previous = time;
      world.tick();
    };

    const start = () => {
      if (animated && frame === 0) frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
    };

    paint();

    const onResize = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(paint, RESIZE_DELAY);
    });

    // Scrolled past, the loop is pure battery drain.
    const onScreen = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;
      if (entry.isIntersecting) start();
      else stop();
    });

    onResize.observe(canvas);
    onScreen.observe(canvas);

    return () => {
      stop();
      window.clearTimeout(resizeTimer);
      onResize.disconnect();
      onScreen.disconnect();
    };
  }, [known, animated]);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, SPRING);
  const smoothY = useSpring(pointerY, SPRING);
  const mapX = useTransform(smoothX, (value) => value * MAP_TRAVEL);
  const mapY = useTransform(smoothY, (value) => value * MAP_TRAVEL);
  const glowX = useTransform(smoothX, (value) => value * GLOW_TRAVEL);
  const glowY = useTransform(smoothY, (value) => value * GLOW_TRAVEL);

  useEffect(() => {
    // A touch pointer would only ever jump the parallax to wherever the reader
    // last tapped, so it is left out entirely.
    if (!animated || !window.matchMedia("(pointer: fine)").matches) return;

    const onPointerMove = (event: PointerEvent) => {
      pointerX.set((event.clientX / window.innerWidth) * 2 - 1);
      pointerY.set((event.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [animated, pointerX, pointerY]);

  return (
    <div
      aria-hidden="true"
      /*
        The top and bottom of the backdrop are faded with a MASK, never with a
        slab of background colour. An opaque fade would also cover the page's
        own glow inside the hero while the transparent header above still shows
        it, and that difference reads as a hard seam right under the bar.
      */
      className="mask-[linear-gradient(to_bottom,transparent,black_20%,black_78%,transparent)] pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Oversized so the parallax never drags an empty edge into view. */}
      <motion.div
        style={{ x: mapX, y: mapY }}
        className="absolute -inset-16 will-change-transform"
      >
        {/* The mask hollows out the middle, so the headline sits over the page
            background rather than over the map. */}
        <canvas
          ref={canvasRef}
          className="mask-[radial-gradient(64%_60%_at_50%_46%,transparent_16%,black_74%)] size-full"
        />
      </motion.div>

      <motion.div
        style={{ x: glowX, y: glowY }}
        className="absolute -inset-24 bg-[radial-gradient(36rem_26rem_at_18%_82%,var(--seed-glow-gold),transparent_66%),radial-gradient(32rem_24rem_at_84%_74%,var(--seed-violet-tint),transparent_66%)] will-change-transform"
      />
    </div>
  );
}
