/**
 * Timing for the hero reveal, so the badge, the headline, the pitch and the
 * buttons all land on one rhythm instead of three. The curve itself is shared
 * with the rest of the page, in `@/lib/motion`.
 */

/** Seconds before the first element moves. */
export const REVEAL_DELAY = 0.1;

/** Seconds between two consecutive words of the headline. */
export const WORD_STAGGER = 0.055;

export const WORD_DURATION = 0.55;
