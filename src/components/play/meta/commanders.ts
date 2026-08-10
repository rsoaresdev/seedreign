/**
 * The Seeded and their wardrobes.
 *
 * Every commander is a sidegrade: one active, one passive, no stats. Skins are
 * pure identity: a territory pattern the whole map can see, a particle trail,
 * a portrait. The first skin of every commander is free; the rest are bought
 * with Shards earned by playing, and the crown piece of each wardrobe with
 * Gems. Nothing in here touches power, by law of the fairness firewall.
 */

import type { CommanderId } from "../sim/types";

/** How a skin is paid for. */
export type SkinTier = "free" | "shards" | "gems";

/** Pattern painted over the player's territory while the skin is worn. */
export type SkinPattern =
  | "sigils"
  | "runes"
  | "leaves"
  | "rays"
  | "embers"
  | "ridges"
  | "waves"
  | "pearls"
  | "bloom"
  | "shards"
  | "current"
  | "thorns";

/**
 * Colour tokens by name, resolved against the stylesheet at draw time so the
 * catalogue never carries a raw hex value.
 */
export type TokenName =
  | "seed-gold"
  | "seed-sun"
  | "seed-teal"
  | "seed-violet"
  | "seed-danger"
  | "seed-success"
  | "seed-bark"
  | "seed-text"
  | "seed-map-snow";

type SkinDef = {
  id: string;
  commander: CommanderId;
  tier: SkinTier;
  /** Shards or Gems, depending on the tier. Zero for the free skin. */
  cost: number;
  pattern: SkinPattern;
  /** Drives particles, the banner and the portrait trim. */
  accent: TokenName;
  glow: TokenName;
};

export type Commander = {
  id: CommanderId;
  /** Tone the portrait and hub art lean on. */
  tone: TokenName;
};

export const COMMANDERS: readonly Commander[] = [
  { id: "warden", tone: "seed-gold" },
  { id: "reaver", tone: "seed-danger" },
  { id: "tidecaller", tone: "seed-teal" },
];

export const SKINS = [
  {
    id: "warden-dawn",
    commander: "warden",
    tier: "free",
    cost: 0,
    pattern: "sigils",
    accent: "seed-gold",
    glow: "seed-sun",
  },
  {
    id: "warden-gilded",
    commander: "warden",
    tier: "shards",
    cost: 900,
    pattern: "runes",
    accent: "seed-sun",
    glow: "seed-gold",
  },
  {
    id: "warden-verdant",
    commander: "warden",
    tier: "shards",
    cost: 2200,
    pattern: "leaves",
    accent: "seed-success",
    glow: "seed-teal",
  },
  {
    id: "warden-solar",
    commander: "warden",
    tier: "gems",
    cost: 45,
    pattern: "rays",
    accent: "seed-gold",
    glow: "seed-violet",
  },
  {
    id: "reaver-ashmarch",
    commander: "reaver",
    tier: "free",
    cost: 0,
    pattern: "ridges",
    accent: "seed-danger",
    glow: "seed-bark",
  },
  {
    id: "reaver-emberwake",
    commander: "reaver",
    tier: "shards",
    cost: 900,
    pattern: "embers",
    accent: "seed-bark",
    glow: "seed-danger",
  },
  {
    id: "reaver-thornveil",
    commander: "reaver",
    tier: "shards",
    cost: 2200,
    pattern: "thorns",
    accent: "seed-violet",
    glow: "seed-danger",
  },
  {
    id: "reaver-crimson",
    commander: "reaver",
    tier: "gems",
    cost: 45,
    pattern: "shards",
    accent: "seed-danger",
    glow: "seed-sun",
  },
  {
    id: "tide-brine",
    commander: "tidecaller",
    tier: "free",
    cost: 0,
    pattern: "waves",
    accent: "seed-teal",
    glow: "seed-text",
  },
  {
    id: "tide-pearl",
    commander: "tidecaller",
    tier: "shards",
    cost: 900,
    pattern: "pearls",
    accent: "seed-text",
    glow: "seed-teal",
  },
  {
    id: "tide-undertow",
    commander: "tidecaller",
    tier: "shards",
    cost: 2200,
    pattern: "current",
    accent: "seed-violet",
    glow: "seed-teal",
  },
  {
    id: "tide-aurora",
    commander: "tidecaller",
    tier: "gems",
    cost: 45,
    pattern: "bloom",
    accent: "seed-teal",
    glow: "seed-violet",
  },
] as const satisfies readonly SkinDef[];

/** Skin ids stay literal so message keys like `skins.warden-dawn` typecheck. */
export type Skin = (typeof SKINS)[number];

export type SkinId = Skin["id"];

export function skinsOf(commander: CommanderId): Skin[] {
  return SKINS.filter((skin) => skin.commander === commander);
}

export function skinById(id: string): Skin | undefined {
  return SKINS.find((skin) => skin.id === id);
}

/** The wardrobe piece everyone starts with, per commander. */
export function freeSkinOf(commander: CommanderId): Skin {
  const free = SKINS.find(
    (skin) => skin.commander === commander && skin.tier === "free"
  );

  if (!free) throw new Error(`No free skin for ${commander}`);

  return free;
}
