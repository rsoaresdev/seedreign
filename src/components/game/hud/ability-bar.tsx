"use client";

/**
 * The commander's actives, one square tile each, with the recharge drawn as a
 * shadow sweeping off the tile.
 */

import { Bomb, BrickWall, Ship, Swords } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/** Keys index the `Game.hud.abilities` messages. */
export const ABILITY_IDS = ["charge", "bombard", "wall", "fleet"] as const;

export type AbilityId = (typeof ABILITY_IDS)[number];

export type Ability = {
  id: AbilityId;
  icon: typeof Swords;
  /** The key that fires it, printed in the corner of the tile. */
  keycap: string;
  /** How much of the recharge is still to run: 0 ready, 1 just spent. */
  cooldown: number;
};

/** The four actives, ready. Callers keep the cooldowns and spread these. */
export const COMMANDER_ABILITIES = [
  { id: "charge", icon: Swords, keycap: "Q", cooldown: 0 },
  { id: "bombard", icon: Bomb, keycap: "W", cooldown: 0 },
  { id: "wall", icon: BrickWall, keycap: "E", cooldown: 0 },
  { id: "fleet", icon: Ship, keycap: "R", cooldown: 0 },
] as const satisfies readonly Ability[];

export type AbilityBarProps = {
  abilities: readonly Ability[];
  /** The ability that is armed and waiting to be aimed. */
  activeId: AbilityId | null;
  onSelect: (id: AbilityId) => void;
  className?: string;
};

const FULL_TURN = 360;

export function AbilityBar({
  abilities,
  activeId,
  onSelect,
  className,
}: AbilityBarProps) {
  const t = useTranslations("Game.hud");

  return (
    // A real grouping element, so the four actives are announced as one set
    // rather than as loose buttons floating over the map.
    <fieldset
      aria-label={t("abilities.label")}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-seed-line bg-seed-glass-raised p-2 shadow-panel",
        className
      )}
    >
      {abilities.map((ability) => {
        const Icon = ability.icon;
        const armed = ability.id === activeId;
        const cooling = ability.cooldown > 0;

        return (
          <button
            // Left focusable while it recharges: a tile that vanished from the
            // tab order every time it fired would drop the keyboard mid fight.
            aria-disabled={cooling}
            // The glyph and the keycap are both decoration, so the name of the
            // ability is the only thing left to announce it.
            aria-label={t(`abilities.${ability.id}`)}
            aria-pressed={armed}
            className={cn(
              "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-seed-panel outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring sm:size-14",
              armed
                ? "border-seed-gold bg-seed-gold-tint text-seed-gold"
                : "border-seed-line-bright text-seed-muted hover:text-seed-text"
            )}
            key={ability.id}
            onClick={() => {
              if (!cooling) onSelect(ability.id);
            }}
            type="button"
          >
            <Icon aria-hidden="true" className="size-5 sm:size-6" />

            <span
              aria-hidden="true"
              className="absolute right-1.5 bottom-1 font-mono text-[0.5625rem] text-seed-muted uppercase leading-none tracking-widest"
            >
              {ability.keycap}
            </span>

            {cooling ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                // A wedge that unwinds as the ability comes back, clipped to
                // the tile. Nothing static can express the angle.
                style={{
                  background: `conic-gradient(var(--seed-scrim) ${Math.round(
                    ability.cooldown * FULL_TURN
                  )}deg, transparent 0)`,
                }}
              />
            ) : null}
          </button>
        );
      })}
    </fieldset>
  );
}
