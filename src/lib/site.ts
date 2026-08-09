/**
 * Single source of truth for anything that describes the site itself.
 *
 * Values are written out literally on purpose. No environment variables and no
 * fallbacks: if a value has to change per environment, it gets changed here.
 */
export const site = {
  url: "https://seedreign.io",
  name: "Seedreign",
  handle: "@seedreign",
  themeColor: "#0a0e16",
  locales: {
    en: "en_US",
    pt: "pt_PT",
  },
  /** Where the community lives. Absolute URLs, they leave the site. */
  social: {
    discord: "https://discord.gg/seedreign",
    x: "https://x.com/seedreign",
    youtube: "https://www.youtube.com/@seedreign",
  },
} as const;

/** Absolute URL for a site relative path. */
export function absoluteUrl(path: string): string {
  return path === "/" ? site.url : `${site.url}${path}`;
}
