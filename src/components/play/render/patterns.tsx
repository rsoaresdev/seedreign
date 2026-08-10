/**
 * Skin patterns: the mark a Seeded leaves on every tile they hold.
 *
 * Each pattern is an SVG paint server in hex units (the world is authored at a
 * circumradius of 1), tiled with userSpaceOnUse so the motif flows across the
 * territory instead of restarting inside every hex. Colour comes in through
 * currentColor, so one defs block serves every skin.
 */

import type { SkinPattern } from "../meta/commanders";

export function skinPatternId(pattern: SkinPattern): string {
  return `sr-skin-${pattern}`;
}

const STROKE = 0.07;
const FAINT = 0.5;

/**
 * Every motif at once. Rendered once per stage; a skin picks its pattern by
 * fill url and its colour by the `color` on the consuming path.
 */
export function SkinPatternDefs() {
  return (
    <defs>
      <pattern
        height={1.4}
        id={skinPatternId("sigils")}
        patternUnits="userSpaceOnUse"
        width={1.4}
      >
        <path
          d="M 0.7 0.35 L 0.95 0.7 L 0.7 1.05 L 0.45 0.7 Z"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      </pattern>

      <pattern
        height={1.6}
        id={skinPatternId("runes")}
        patternUnits="userSpaceOnUse"
        width={1.6}
      >
        <path
          d="M 0.4 0.4 L 0.4 1 M 0.4 0.55 L 0.85 0.4 M 0.4 0.75 L 0.8 1"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
        <circle
          cx={1.2}
          cy={1.25}
          fill="currentColor"
          opacity={FAINT}
          r={0.06}
        />
      </pattern>

      <pattern
        height={1.5}
        id={skinPatternId("leaves")}
        patternUnits="userSpaceOnUse"
        width={1.5}
      >
        <path
          d="M 0.5 1.1 Q 0.4 0.7 0.75 0.45 Q 1.1 0.7 1 1.1 Q 0.75 1.25 0.5 1.1 Z"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
        <path
          d="M 0.75 0.5 L 0.75 1.15"
          opacity={FAINT * 0.7}
          stroke="currentColor"
          strokeWidth={STROKE * 0.8}
        />
      </pattern>

      <pattern
        height={1.2}
        id={skinPatternId("rays")}
        patternTransform="rotate(-24)"
        patternUnits="userSpaceOnUse"
        width={1.2}
      >
        <path
          d="M 0 0.3 H 1.2 M 0 0.9 H 1.2"
          opacity={FAINT * 0.8}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      </pattern>

      <pattern
        height={1.3}
        id={skinPatternId("embers")}
        patternUnits="userSpaceOnUse"
        width={1.3}
      >
        <circle
          cx={0.35}
          cy={0.4}
          fill="currentColor"
          opacity={FAINT}
          r={0.08}
        />
        <circle
          cx={0.95}
          cy={0.85}
          fill="currentColor"
          opacity={FAINT * 0.7}
          r={0.055}
        />
        <circle
          cx={0.6}
          cy={1.1}
          fill="currentColor"
          opacity={FAINT * 0.5}
          r={0.04}
        />
      </pattern>

      <pattern
        height={1.2}
        id={skinPatternId("ridges")}
        patternUnits="userSpaceOnUse"
        width={1.4}
      >
        <path
          d="M 0.2 0.8 L 0.7 0.35 L 1.2 0.8"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={STROKE}
        />
      </pattern>

      <pattern
        height={1.1}
        id={skinPatternId("waves")}
        patternUnits="userSpaceOnUse"
        width={1.6}
      >
        <path
          d="M 0 0.6 Q 0.4 0.3 0.8 0.6 T 1.6 0.6"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
      </pattern>

      <pattern
        height={1.4}
        id={skinPatternId("pearls")}
        patternUnits="userSpaceOnUse"
        width={1.4}
      >
        <circle
          cx={0.7}
          cy={0.7}
          fill="none"
          opacity={FAINT}
          r={0.16}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
        <circle
          cx={0.7}
          cy={0.7}
          fill="currentColor"
          opacity={FAINT * 0.6}
          r={0.05}
        />
      </pattern>

      <pattern
        height={1.6}
        id={skinPatternId("bloom")}
        patternUnits="userSpaceOnUse"
        width={1.6}
      >
        <path
          d="M 0.8 0.45 Q 0.95 0.65 0.8 0.8 Q 0.65 0.65 0.8 0.45 M 0.45 0.8 Q 0.65 0.95 0.8 0.8 M 0.8 0.8 Q 0.95 0.95 1.15 0.8 M 0.8 0.8 Q 0.65 1 0.8 1.15"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={STROKE * 0.9}
        />
      </pattern>

      <pattern
        height={1.4}
        id={skinPatternId("shards")}
        patternUnits="userSpaceOnUse"
        width={1.4}
      >
        <path
          d="M 0.5 0.35 L 0.85 0.5 L 0.6 0.95 Z"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth={STROKE}
        />
        <path
          d="M 1 1.05 L 1.2 1.2 L 0.95 1.3 Z"
          fill="currentColor"
          opacity={FAINT * 0.55}
        />
      </pattern>

      <pattern
        height={1.2}
        id={skinPatternId("current")}
        patternTransform="rotate(18)"
        patternUnits="userSpaceOnUse"
        width={1.8}
      >
        <path
          d="M 0 0.4 Q 0.9 0.15 1.8 0.4 M 0.2 0.95 Q 1 0.7 1.8 0.95"
          fill="none"
          opacity={FAINT * 0.9}
          stroke="currentColor"
          strokeWidth={STROKE * 0.9}
        />
      </pattern>

      <pattern
        height={1.4}
        id={skinPatternId("thorns")}
        patternUnits="userSpaceOnUse"
        width={1.4}
      >
        <path
          d="M 0.3 1 Q 0.7 0.85 0.75 0.4 M 0.75 0.4 L 0.6 0.62 M 0.75 0.4 L 0.92 0.6"
          fill="none"
          opacity={FAINT}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
      </pattern>
    </defs>
  );
}
