import type { ReactNode } from "react";

import type { OrderArt } from "@/components/game/cards/orders";

/**
 * The vignette that fills a card's art window.
 *
 * Each one is a small scene rather than an icon: a moment on a map, drawn in
 * the ground palette with the card's own colour doing the talking. Everything
 * is authored in the same 100 by 60 window and lit from the top left, so seven
 * of them side by side read as one world seen seven times.
 *
 * Gradient ids carry their card's name because several cards share a page, and
 * an `url(#sky)` collision would have one card quietly borrowing another's sky.
 */
function Scene({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-full w-full"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 100 60"
    >
      {children}
    </svg>
  );
}

/** A border cresting a ridge, with the rest of the range still to take. */
function ExpandArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="expand-sky" x1="0" x2="0.3" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-abyss)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
        <linearGradient id="expand-ridge" x1="0" x2="1" y1="0" y2="0.4">
          <stop offset="0" stopColor="var(--seed-map-hill)" />
          <stop offset="1" stopColor="var(--seed-map-plain)" />
        </linearGradient>
      </defs>

      <rect fill="url(#expand-sky)" height="60" width="100" x="0" y="0" />

      <path
        className="fill-seed-map-peak"
        d="M0 24 L12 17 L24 22 L38 13 L52 20 L68 11 L84 19 L100 15 L100 30 L0 30 Z"
        opacity="0.3"
      />

      <path
        d="M0 36 L18 28 L28 32 L42 23 L54 27 L70 21 L86 27 L100 23 L100 60 L0 60 Z"
        fill="url(#expand-ridge)"
      />
      <path
        className="stroke-seed-map-snow"
        d="M0 36 L18 28 L28 32 L42 23 L54 27 L70 21 L86 27 L100 23"
        fill="none"
        opacity="0.28"
        strokeLinejoin="round"
        strokeWidth="0.8"
      />

      {/* A nearer fold, so the ground under the claim is still two tones and
          not one flat plate of colour. */}
      <path
        className="fill-seed-map-forest"
        d="M0 46 L14 42 L30 47 L44 41 L58 45 L74 40 L88 45 L100 42 L100 60 L0 60 Z"
      />

      <path
        className="fill-seed-gold"
        d="M0 36 L18 28 L28 32 L42 23 L54 27 L51.5 36 L55.5 45 L52.5 56 L52.5 60 L0 60 Z"
        opacity="0.2"
      />
      <path
        className="stroke-seed-gold"
        d="M0 36 L18 28 L28 32 L42 23 L54 27 L51.5 36 L55.5 45 L52.5 56"
        fill="none"
        opacity="0.16"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        className="stroke-seed-gold"
        d="M0 36 L18 28 L28 32 L42 23 L54 27 L51.5 36 L55.5 45 L52.5 56"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      {/* Where the line is still moving: the crest it has not reached yet. */}
      <path
        className="stroke-seed-gold"
        d="M54 27 L70 21 L86 27 L100 23"
        fill="none"
        opacity="0.45"
        strokeDasharray="3 4"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        className="stroke-seed-sun"
        d="M54 27 L51.5 36 L55.5 45 L52.5 56"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
        strokeWidth="2.4"
      />

      <path
        className="fill-seed-map-abyss"
        d="M0 60 L0 53 L20 49 L42 54 L64 48 L84 53 L100 50 L100 60 Z"
        opacity="0.9"
      />
    </Scene>
  );
}

/** A spearhead of light tearing across open ground, ahead of its own dust. */
function BlitzArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="blitz-sky" x1="0" x2="0.4" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-abyss)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
        <linearGradient id="blitz-ground" x1="0" x2="0.3" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-plain)" />
          <stop offset="1" stopColor="var(--seed-map-forest)" />
        </linearGradient>
        <linearGradient id="blitz-spear" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--seed-gold)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--seed-gold)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--seed-sun)" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="blitz-flare">
          <stop offset="0" stopColor="var(--seed-sun)" stopOpacity="0.7" />
          <stop offset="1" stopColor="var(--seed-sun)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect fill="url(#blitz-sky)" height="60" width="100" x="0" y="0" />
      <rect fill="url(#blitz-ground)" height="40" width="100" x="0" y="20" />
      <path
        className="fill-seed-map-plain"
        d="M0 20 L18 17 L38 20 L58 16 L78 19 L100 16 L100 23 L0 23 Z"
        opacity="0.55"
      />

      {/* Ground the charge has already crossed, and the dust still hanging. */}
      <path
        className="fill-seed-map-abyss"
        d="M2 42.6 L74 33.4 L88 31.6 L74 36.6 L2 44.8 Z"
        opacity="0.55"
      />
      <path
        className="stroke-seed-gold"
        d="M0 30.6 L58 24.6 M0 44.4 L54 38.4 M0 26.8 L40 22.4"
        fill="none"
        opacity="0.28"
        strokeLinecap="round"
        strokeWidth="0.8"
      />

      <circle cx="92" cy="28" fill="url(#blitz-flare)" r="15" />
      <path
        d="M2 38.8 L70 28.4 L79 23.8 L94 28 L79 33.4 L70 31.8 L2 40.6 Z"
        fill="url(#blitz-spear)"
      />

      {/* Turf thrown clear of the furrow, still falling. */}
      <path
        className="fill-seed-map-abyss"
        d="M20 44.6 L25 43.2 L22.4 46.8 Z M41 41.6 L46 40.2 L43.4 43.8 Z M62 38.2 L67 36.8 L64.4 40.4 Z"
        opacity="0.7"
      />
    </Scene>
  );
}

/** A wall section with the House banner on it, seen from the foot of it. */
function FortifyArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="fortify-sky" x1="0" x2="0.3" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-abyss)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
      </defs>

      <rect fill="url(#fortify-sky)" height="24" width="100" x="0" y="0" />
      <path
        className="fill-seed-map-plain"
        d="M0 22 L12 17 L26 20 L40 15 L56 19 L70 14 L84 19 L100 16 L100 24 L0 24 Z"
        opacity="0.5"
      />

      {/* Merlons, then the face below them. The light catches the top and the
          left cheek of every block. */}
      <path
        className="fill-seed-map-hill"
        d="M0 10 H16 V22 H0 Z M21 10 H37 V22 H21 Z M42 10 H58 V22 H42 Z M63 10 H79 V22 H63 Z M84 10 H100 V22 H84 Z"
      />
      <path
        className="fill-seed-map-peak"
        d="M0 10 H16 V12.4 H0 Z M21 10 H37 V12.4 H21 Z M42 10 H58 V12.4 H42 Z M63 10 H79 V12.4 H63 Z M84 10 H100 V12.4 H84 Z"
      />
      <path
        className="fill-seed-map-peak"
        d="M0 10 H2.4 V22 H0 Z M21 10 H23.4 V22 H21 Z M42 10 H44.4 V22 H42 Z M63 10 H65.4 V22 H63 Z M84 10 H86.4 V22 H84 Z"
        opacity="0.5"
      />
      <path
        className="stroke-seed-sun"
        d="M0 10 H16 M21 10 H37 M42 10 H58 M63 10 H79 M84 10 H100"
        opacity="0.26"
        strokeWidth="0.9"
      />

      <rect
        className="fill-seed-map-hill"
        height="38"
        width="100"
        x="0"
        y="22"
      />
      <rect
        className="fill-seed-map-peak"
        height="2"
        width="100"
        x="0"
        y="22"
      />
      <path
        className="stroke-seed-map-plain"
        d="M0 30.5 H100 M0 39 H100 M0 47.5 H100 M0 56 H100"
        opacity="0.85"
        strokeWidth="1"
      />
      <path
        className="stroke-seed-map-plain"
        d="M12 24 V30 M36 24 V30 M60 24 V30 M84 24 V30 M24 31 V38.5 M48 31 V38.5 M72 31 V38.5 M96 31 V38.5 M12 40 V47 M36 40 V47 M60 40 V47 M84 40 V47"
        opacity="0.7"
        strokeWidth="0.9"
      />

      <rect
        className="fill-seed-map-peak"
        height="2"
        width="32"
        x="58"
        y="12"
      />
      <path
        className="fill-seed-teal"
        d="M62 14 L86 14 L86 38 L74 44 L62 38 Z"
      />
      <path
        className="fill-seed-map-abyss"
        d="M76 14 L86 14 L86 38 L76 43 Z"
        opacity="0.22"
      />
      {/* The House mark: the sun cresting the horizon, same as the banner. */}
      <path
        className="fill-seed-sun"
        d="M68 28 A6 6 0 0 1 80 28 Z"
        opacity="0.9"
      />
      <path
        className="stroke-seed-map-abyss"
        d="M67 28.6 H81"
        opacity="0.35"
        strokeWidth="1"
      />
    </Scene>
  );
}

/** Hulls coming out of dark water onto a beach the front line cannot see. */
function LandingArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="landing-sky" x1="0" x2="0.3" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-abyss)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
        <linearGradient id="landing-sea" x1="0" x2="0.2" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-shelf)" />
          <stop offset="1" stopColor="var(--seed-map-abyss)" />
        </linearGradient>
      </defs>

      <rect fill="url(#landing-sky)" height="24" width="100" x="0" y="0" />
      <path
        className="fill-seed-map-forest"
        d="M0 22 L0 15 L16 11 L34 14 L52 9 L72 13 L88 10 L100 13 L100 22 Z"
      />
      <path
        className="stroke-seed-map-hill"
        d="M0 15 L16 11 L34 14 L52 9 L72 13 L88 10 L100 13"
        fill="none"
        opacity="0.7"
        strokeLinejoin="round"
        strokeWidth="1"
      />

      <rect fill="url(#landing-sea)" height="38" width="100" x="0" y="22" />
      <path
        className="fill-seed-map-shore"
        d="M0 20.5 L100 20.5 L100 24.6 Q86 27.4 72 25.6 Q56 23.6 40 25.6 Q24 27.4 10 25.6 L0 26.4 Z"
      />
      <path
        className="stroke-seed-map-snow"
        d="M100 24.6 Q86 27.4 72 25.6 Q56 23.6 40 25.6 Q24 27.4 10 25.6 L0 26.4"
        fill="none"
        opacity="0.45"
        strokeWidth="0.9"
      />

      <path
        className="stroke-seed-map-snow"
        d="M12 53 L26 46 L40 53 M50 42.5 L58 38 L66 42.5"
        fill="none"
        opacity="0.15"
        strokeLinejoin="round"
        strokeWidth="1.1"
      />

      <Hull scale={0.7} x={80} y={28} />
      <Hull scale={1.05} x={58} y={37} />
      <Hull scale={1.5} x={26} y={45} />

      {/* The first crew already off the sand and moving inland. */}
      <g className="fill-seed-teal" opacity="0.85">
        <circle cx="86.4" cy="24.8" r="0.9" />
        <circle cx="89.6" cy="24" r="0.8" />
        <circle cx="83.4" cy="25.6" r="0.8" />
      </g>
    </Scene>
  );
}

/** One boat, drawn once and set down three times at three distances. */
function Hull({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        className="fill-seed-map-plain"
        d="M-11 -5.6 C-9.6 -3 -9 -2.6 -8.4 -2.4 L8.4 -2.4 C9 -2.6 9.6 -3 11 -5.6 C10.4 0.8 6 4 0 4 C-6 4 -10.4 0.8 -11 -5.6 Z"
      />
      <path
        className="stroke-seed-map-hill"
        d="M-8.4 -2.4 L8.4 -2.4"
        fill="none"
        strokeWidth="1"
      />
      <path
        className="stroke-seed-map-hill"
        d="M-6.6 0.6 L-10 3.8 M-2.6 2 L-6 5.2 M1.4 2.6 L-2 5.8"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <path
        className="stroke-seed-map-hill"
        d="M0 -2.4 L0 -12"
        strokeLinecap="round"
        strokeWidth="0.8"
      />
      <path className="fill-seed-teal" d="M0.6 -12 L7.4 -10 L0.6 -8 Z" />
    </g>
  );
}

/** A supply line cut where it was thinnest, under a violet night. */
function SabotageArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="sabotage-sky" x1="0" x2="0.2" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-violet)" stopOpacity="0.32" />
          <stop offset="1" stopColor="var(--seed-violet)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sabotage-ground" x1="0" x2="0.2" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-forest)" />
          <stop offset="1" stopColor="var(--seed-map-abyss)" />
        </linearGradient>
      </defs>

      <rect
        className="fill-seed-map-abyss"
        height="60"
        width="100"
        x="0"
        y="0"
      />
      <rect fill="url(#sabotage-sky)" height="32" width="100" x="0" y="0" />
      <rect fill="url(#sabotage-ground)" height="32" width="100" x="0" y="28" />
      <path
        className="fill-seed-map-forest"
        d="M0 30 L14 25 L30 28 L46 22 L62 26 L78 20 L92 25 L100 22 L100 34 L0 34 Z"
      />

      {/* The depot at the far end, still lit, still waiting on a convoy. */}
      <g className="fill-seed-gold" opacity="0.6">
        <circle cx="85" cy="18.4" r="0.8" />
        <circle cx="88.6" cy="19.4" r="0.7" />
      </g>

      <path
        className="stroke-seed-map-shore"
        d="M2 60 L20 49 L34 42 L44 37.6"
        fill="none"
        opacity="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        className="stroke-seed-map-shore"
        d="M57 31.4 L70 27 L84 22.6"
        fill="none"
        opacity="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
      <path
        className="stroke-seed-map-snow"
        d="M4 58.6 L43 38.2 M58 31 L83 22.8"
        fill="none"
        opacity="0.2"
        strokeDasharray="3 4"
        strokeWidth="0.7"
      />

      <Crate rotate={-12} scale={1} x={40} y={46} />
      <Crate rotate={22} scale={0.85} x={52} y={43} />
      <Crate rotate={-6} scale={0.7} x={61} y={49} />

      {/* Both severed ends, and the cut itself, thickest where it bit. */}
      <path
        className="stroke-seed-violet"
        d="M43.5 35.5 L45.5 39.7 M56 29.3 L58 33.5"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
      <path
        className="fill-seed-violet"
        d="M42.4 48.6 L51.7 37.9 L58.6 25.4 L49.3 36.1 Z"
      />
      <path
        className="stroke-seed-sun"
        d="M45.4 43.8 L55.6 29"
        fill="none"
        opacity="0.55"
        strokeLinecap="round"
        strokeWidth="0.6"
      />
    </Scene>
  );
}

/** Cargo off the back of the line, lit on the top and the left like the rest. */
function Crate({
  x,
  y,
  rotate,
  scale,
}: {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect
        className="fill-seed-map-plain"
        height="6"
        width="8"
        x="-4"
        y="-3"
      />
      <rect
        className="fill-seed-map-hill"
        height="1.6"
        width="8"
        x="-4"
        y="-3"
      />
      <rect
        className="fill-seed-map-abyss"
        height="6"
        opacity="0.45"
        width="1.6"
        x="2.4"
        y="-3"
      />
    </g>
  );
}

/** A storm front breaking over a coast, with the light still out at sea. */
function StormArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="storm-sky" x1="0" x2="0.3" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-abyss)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
        <linearGradient id="storm-sea" x1="0" x2="0.2" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-shelf)" />
          <stop offset="1" stopColor="var(--seed-map-sea)" />
        </linearGradient>
        <linearGradient id="storm-cloud" x1="0" x2="0.55" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-peak)" />
          <stop offset="1" stopColor="var(--seed-map-shelf)" />
        </linearGradient>
        <radialGradient id="storm-gap">
          <stop offset="0" stopColor="var(--seed-sun)" stopOpacity="0.3" />
          <stop offset="1" stopColor="var(--seed-sun)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect fill="url(#storm-sky)" height="60" width="100" x="0" y="0" />
      <ellipse cx="86" cy="40" fill="url(#storm-gap)" rx="22" ry="9" />
      <rect fill="url(#storm-sea)" height="20" width="100" x="0" y="40" />

      <path
        d="M0 0 H70 C64 3 62 9 56 9 C50 9 48 15 42 15 C36 15 34 20 28 20 C22 20 20 25 14 25 C8 25 6 29 0 29 Z"
        fill="url(#storm-cloud)"
      />
      <path
        className="fill-seed-map-snow"
        d="M0 0 H46 C41 2 39.5 7 34 7 C28.5 7 27 12 21 12 C15 12 13.5 16 0 18 Z"
        opacity="0.14"
      />
      <path
        className="stroke-seed-map-abyss"
        d="M70 0 C64 3 62 9 56 9 C50 9 48 15 42 15 C36 15 34 20 28 20 C22 20 20 25 14 25 C8 25 6 29 0 29"
        fill="none"
        opacity="0.35"
        strokeWidth="1.6"
      />

      <path
        className="stroke-seed-map-snow"
        d="M8 30 L12 42 M16 27 L20 39 M24 24.5 L28 37 M32 21.5 L36 34 M40 19 L44 31 M48 16 L52 28 M56 13 L60 25"
        fill="none"
        opacity="0.18"
        strokeLinecap="round"
        strokeWidth="0.6"
      />

      <path
        className="fill-seed-teal"
        d="M30 20 L22 30 L26.4 30.6 L20 40 L28 29.6 L23.6 29 Z"
      />
      <path
        className="stroke-seed-sun"
        d="M29.4 20.8 L22.6 29.4"
        fill="none"
        opacity="0.75"
        strokeLinecap="round"
        strokeWidth="0.5"
      />

      <path
        className="stroke-seed-map-snow"
        d="M6 46 H12 M22 50 H30 M44 45 H51 M60 52 H66 M16 55 H25"
        opacity="0.22"
        strokeLinecap="round"
        strokeWidth="0.8"
      />

      <path
        className="fill-seed-map-forest"
        d="M62 60 L68 48 L78 43 L88 47 L100 42 L100 60 Z"
      />
      <path
        className="stroke-seed-map-hill"
        d="M62 60 L68 48 L78 43 L88 47 L100 42"
        fill="none"
        opacity="0.85"
        strokeLinejoin="round"
        strokeWidth="0.9"
      />
    </Scene>
  );
}

/** A column of light a long way off, and the ring already on its way here. */
function NukeArt() {
  return (
    <Scene>
      <defs>
        <linearGradient id="nuke-ground" x1="0" x2="0.2" y1="0" y2="1">
          <stop offset="0" stopColor="var(--seed-map-plain)" />
          <stop offset="1" stopColor="var(--seed-map-forest)" />
        </linearGradient>
        <linearGradient id="nuke-halo" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--seed-violet)" stopOpacity="0" />
          <stop
            offset="0.5"
            stopColor="var(--seed-violet)"
            stopOpacity="0.55"
          />
          <stop offset="1" stopColor="var(--seed-violet)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nuke-core" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--seed-sun)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--seed-sun)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--seed-sun)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nuke-bloom">
          <stop offset="0" stopColor="var(--seed-sun)" stopOpacity="0.8" />
          <stop
            offset="0.55"
            stopColor="var(--seed-violet)"
            stopOpacity="0.4"
          />
          <stop offset="1" stopColor="var(--seed-violet)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect
        className="fill-seed-map-abyss"
        height="60"
        width="100"
        x="0"
        y="0"
      />
      <rect fill="url(#nuke-ground)" height="20" width="100" x="0" y="40" />
      <path
        className="fill-seed-map-hill"
        d="M0 40 L16 36 L34 39 L52 35 L70 38 L86 35 L100 38 L100 41 L0 41 Z"
        opacity="0.35"
      />

      <ellipse cx="40" cy="12" fill="url(#nuke-bloom)" rx="26" ry="11" />
      <path d="M30 40 L24 8 L56 8 L50 40 Z" fill="url(#nuke-halo)" />
      <path d="M37.5 40 L35 10 L45 10 L42.5 40 Z" fill="url(#nuke-core)" />
      <ellipse
        className="fill-seed-map-shelf"
        cx="40"
        cy="40.5"
        opacity="0.7"
        rx="14"
        ry="3.4"
      />

      <ellipse
        className="stroke-seed-violet"
        cx="40"
        cy="41"
        fill="none"
        opacity="0.6"
        rx="22"
        ry="4.5"
        strokeWidth="1.2"
      />
      <ellipse
        className="stroke-seed-violet"
        cx="40"
        cy="42.5"
        fill="none"
        opacity="0.3"
        rx="37"
        ry="7.5"
        strokeWidth="1"
      />
      <ellipse
        className="stroke-seed-violet"
        cx="40"
        cy="44.5"
        fill="none"
        opacity="0.14"
        rx="54"
        ry="11"
        strokeWidth="0.9"
      />

      <g className="fill-seed-violet" opacity="0.45">
        <circle cx="28" cy="25" r="0.7" />
        <circle cx="54" cy="20" r="0.6" />
        <circle cx="24" cy="15" r="0.5" />
      </g>

      <path
        className="fill-seed-map-abyss"
        d="M0 60 L0 52 L14 48 L30 54 L48 47 L66 53 L84 48 L100 53 L100 60 Z"
      />
      <path
        className="stroke-seed-violet"
        d="M0 52 L14 48 L30 54 L48 47 L66 53 L84 48 L100 53"
        fill="none"
        opacity="0.22"
        strokeLinejoin="round"
        strokeWidth="0.9"
      />
    </Scene>
  );
}

const ART: Record<OrderArt, () => ReactNode> = {
  expand: ExpandArt,
  blitz: BlitzArt,
  fortify: FortifyArt,
  landing: LandingArt,
  sabotage: SabotageArt,
  storm: StormArt,
  nuke: NukeArt,
};

export function CardArt({ art }: { art: OrderArt }) {
  const Art = ART[art];

  return <Art />;
}
