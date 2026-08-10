/**
 * The order cards a day can deal.
 *
 * Every entry is a different way to spend a turn, never a bigger version of the
 * one beside it, so `cost` and `rarity` are pacing and flavour rather than a
 * power curve: rare means situational, common means simple and strong.
 */

export type OrderRarity = "common" | "uncommon" | "rare";

/** Which of the three brand colours the card and its vignette are lit in. */
export type OrderTone = "gold" | "teal" | "violet";

export type OrderArt =
  | "expand"
  | "blitz"
  | "fortify"
  | "landing"
  | "sabotage"
  | "storm"
  | "nuke";

/**
 * `key` indexes the `Game.cards` messages, so a renamed card fails to compile
 * instead of rendering a missing translation.
 */
export const ORDERS = [
  { key: "expand", cost: 1, rarity: "common", tone: "gold", art: "expand" },
  { key: "blitz", cost: 2, rarity: "common", tone: "gold", art: "blitz" },
  { key: "fortify", cost: 1, rarity: "common", tone: "teal", art: "fortify" },
  { key: "landing", cost: 2, rarity: "uncommon", tone: "teal", art: "landing" },
  {
    key: "sabotage",
    cost: 2,
    rarity: "uncommon",
    tone: "violet",
    art: "sabotage",
  },
  { key: "storm", cost: 3, rarity: "rare", tone: "teal", art: "storm" },
  { key: "nuke", cost: 3, rarity: "rare", tone: "violet", art: "nuke" },
] as const satisfies readonly {
  key: string;
  cost: number;
  rarity: OrderRarity;
  tone: OrderTone;
  art: OrderArt;
}[];

export type Order = (typeof ORDERS)[number];

export type OrderKey = Order["key"];
