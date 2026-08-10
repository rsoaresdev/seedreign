"use client";

/**
 * The Armory: three commanders, twelve skins, zero power.
 *
 * Each wardrobe starts with a free piece; the rest unlock with Shards earned
 * on the field, and the crown piece of each line with Gems from Era rewards.
 * Every card shows exactly what a skin changes: the portrait, the banner
 * trim, and the pattern painted over held ground.
 */

import { Check, ChevronLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { COMMANDERS, type Skin, skinsOf } from "../meta/commanders";
import type { Profile } from "../meta/profile";
import { buySkin, equipSkin, ownsSkin } from "../meta/profile";
import { SkinPatternDefs, skinPatternId } from "../render/patterns";
import { CommanderPortrait } from "../render/portrait";
import type { CommanderId } from "../sim/types";
import { CurrencyChips } from "./hub";
import { GemIcon, ShardIcon } from "./icons";

type ArmoryProps = {
  profile: Profile;
  updateProfile: (mutate: (profile: Profile) => Profile) => void;
  onBack: () => void;
};

export function ArmoryScreen({ profile, updateProfile, onBack }: ArmoryProps) {
  const t = useTranslations("Play");
  const [tab, setTab] = useState<CommanderId>(profile.commander);

  const skins = skinsOf(tab);
  const equippedId = profile.equipped[tab];

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-16 sm:px-6">
      {/* Paint servers for the pattern swatches below. */}
      <svg aria-hidden="true" className="absolute size-0">
        <SkinPatternDefs />
      </svg>

      <header className="flex items-center justify-between py-5">
        <Button onClick={onBack} size="sm" variant="ghost">
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("common.back")}
        </Button>
        <CurrencyChips profile={profile} />
      </header>

      <h1 className="font-bold font-display text-3xl tracking-tight sm:text-4xl">
        {t("armory.title")}
      </h1>
      <p className="mt-2 max-w-prose text-seed-muted">{t("armory.subtitle")}</p>

      <div className="mt-5 flex gap-2">
        {COMMANDERS.map((commander) => (
          <button
            className={cn(
              "flex-1 rounded-xl border px-3 py-2.5 font-display font-semibold text-sm transition-colors",
              tab === commander.id
                ? "border-seed-gold-edge bg-seed-gold-tint text-seed-gold"
                : "border-seed-line text-seed-muted hover:border-seed-line-strong"
            )}
            key={commander.id}
            onClick={() => setTab(commander.id)}
            type="button"
          >
            {t(`commanders.${commander.id}.name`)}
          </button>
        ))}
      </div>

      {/* Kit primer: what this Seeded actually does on the field. */}
      <section className="mt-4 rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel">
        <p className="font-display font-semibold">
          {t(`commanders.${tab}.title`)}
        </p>
        <p className="mt-1 text-seed-muted text-sm">
          <span className="text-seed-gold">
            {t(`commanders.${tab}.abilityName`)}:
          </span>{" "}
          {t(`commanders.${tab}.ability`)}
        </p>
        <p className="mt-1 text-seed-muted text-sm">
          <span className="text-seed-teal">{t("armory.passive")}:</span>{" "}
          {t(`commanders.${tab}.passive`)}
        </p>
      </section>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {skins.map((skin) => (
          <SkinCard
            equipped={equippedId === skin.id}
            key={skin.id}
            onBuy={() => updateProfile((current) => buySkin(current, skin.id))}
            onEquip={() =>
              updateProfile((current) => equipSkin(current, skin.id))
            }
            owned={ownsSkin(profile, skin.id)}
            profile={profile}
            skin={skin}
          />
        ))}
      </ul>

      <p className="mt-6 text-center text-seed-muted text-sm">
        {t("armory.gemsNote")}
      </p>
    </div>
  );
}

function SkinCard({
  skin,
  owned,
  equipped,
  profile,
  onBuy,
  onEquip,
}: {
  skin: Skin;
  owned: boolean;
  equipped: boolean;
  profile: Profile;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const t = useTranslations("Play");
  const affordable =
    skin.tier === "shards"
      ? profile.shards >= skin.cost
      : skin.tier === "gems"
        ? profile.gems >= skin.cost
        : true;

  return (
    <li
      className={cn(
        "overflow-hidden rounded-xl border bg-seed-panel shadow-panel transition-colors",
        equipped ? "border-seed-gold-edge" : "border-seed-line"
      )}
    >
      <div className="relative flex items-center gap-4 p-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-seed-line-strong bg-seed-panel-raised">
          <CommanderPortrait
            className="size-full"
            commander={skin.commander}
            skin={skin}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-display font-semibold">
              {t(`skins.${skin.id}`)}
            </p>
            {skin.tier === "gems" ? (
              <Badge size="sm" variant="violet">
                {t("armory.tierGems")}
              </Badge>
            ) : skin.tier === "free" ? (
              <Badge size="sm" variant="teal">
                {t("armory.tierFree")}
              </Badge>
            ) : null}
          </div>

          {/* The pattern this skin paints over held ground. */}
          <svg
            aria-hidden="true"
            className="mt-2 h-6 w-full rounded-md border border-seed-line"
            preserveAspectRatio="none"
            viewBox="0 0 12 3"
          >
            <rect className="fill-seed-map-plain" height={3} width={12} />
            <rect
              fill={`url(#${skinPatternId(skin.pattern)})`}
              height={3}
              style={{ color: `var(--${skin.accent})` }}
              width={12}
            />
          </svg>

          <div className="mt-2.5">
            {equipped ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-seed-gold text-xs uppercase tracking-[0.18em]">
                <Check aria-hidden="true" className="size-3.5" />
                {t("armory.equipped")}
              </span>
            ) : owned ? (
              <Button onClick={onEquip} size="sm" variant="secondary">
                {t("armory.equip")}
              </Button>
            ) : (
              <Button
                disabled={!affordable}
                onClick={onBuy}
                size="sm"
                variant={affordable ? "default" : "outline"}
              >
                {affordable ? null : (
                  <Lock aria-hidden="true" className="size-3.5" />
                )}
                {skin.tier === "gems" ? (
                  <GemIcon className="size-3.5" />
                ) : (
                  <ShardIcon className="size-3.5" />
                )}
                {skin.cost.toLocaleString()}
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
