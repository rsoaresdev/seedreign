"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Single place where GSAP plugins are registered, so every consumer imports
 * from here and registration happens exactly once.
 *
 * The import path is `gsap/ScrollTrigger` (the ESM build). `gsap/dist/
 * ScrollTrigger` would pull the UMD bundle instead.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };
