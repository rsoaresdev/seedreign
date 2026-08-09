/**
 * The landing page sections the header and the footer both point at.
 *
 * `key` indexes the `Nav.links` message namespace, so a renamed section fails
 * to compile instead of silently rendering a missing translation. `hash` is the
 * `id` the matching section has to carry.
 */
export const SECTION_LINKS = [
  { key: "game", hash: "game" },
  { key: "howToPlay", hash: "how-to-play" },
  { key: "modes", hash: "modes" },
  { key: "faq", hash: "faq" },
] as const;

export type SectionLink = (typeof SECTION_LINKS)[number];

/** Where the game itself lives. */
export const PLAY_PATH = "/play";

/** Where signing in lives. */
export const LOGIN_PATH = "/login";
