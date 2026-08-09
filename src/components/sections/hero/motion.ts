/**
 * Timing shared by every part of the hero reveal, so the badge, the headline,
 * the pitch and the buttons all land on one rhythm instead of three.
 *
 * `MotionProvider` already forces `reducedMotion: "user"` app wide, so these
 * durations only ever drive an opacity cross fade for readers who asked for
 * less motion.
 */

/**
 * A soft deceleration. Fast at the start, long and quiet at the end.
 *
 * Typed as a mutable tuple because Motion's `ease` option rejects a readonly
 * one, which is what `as const` would produce.
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Seconds before the first element moves. */
export const REVEAL_DELAY = 0.1;

/** Seconds between two consecutive words of the headline. */
export const WORD_STAGGER = 0.055;

export const WORD_DURATION = 0.55;

export const REVEAL_DURATION = 0.6;
