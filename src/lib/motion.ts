/**
 * Motion values shared by every section, so the whole page decelerates on one
 * curve instead of each block inventing its own.
 *
 * `MotionProvider` already forces `reducedMotion: "user"` app wide, so these
 * only ever drive an opacity cross fade for readers who asked for less motion.
 */

/**
 * A soft deceleration. Fast at the start, long and quiet at the end.
 *
 * Typed as a mutable tuple because Motion's `ease` option rejects a readonly
 * one, which is what `as const` would produce.
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Seconds a block takes to fade up into place. */
export const REVEAL_DURATION = 0.6;
