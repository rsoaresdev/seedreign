"use client";

/**
 * The draft: six orders on the table, keep three.
 *
 * The daily deals the same six to everyone and assigns the commander; casual
 * modes deal from a throwaway seed and let the Seeded pick their own banner.
 * The card art is the same set the landing shows, so the game keeps the face
 * it was sold with.
 */

import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { OrderCard } from "@/components/game/cards/order-card";
import type { OrderKey } from "@/components/game/cards/orders";
import { ORDERS } from "@/components/game/cards/orders";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMMANDERS, skinById } from "../meta/commanders";
import { casualOffer } from "../meta/daily";
import type { Profile } from "../meta/profile";
import { chooseCommander } from "../meta/profile";
import type { MatchIntent } from "../play-app";
import { CommanderPortrait } from "../render/portrait";

const KEEP = 3;

type DraftProps = {
  intent: MatchIntent;
  profile: Profile;
  updateProfile: (mutate: (profile: Profile) => Profile) => void;
  onConfirm: (hand: readonly OrderKey[]) => void;
  onBack: () => void;
};

export function DraftScreen({
  intent,
  profile,
  updateProfile,
  onConfirm,
  onBack,
}: DraftProps) {
  const t = useTranslations("Play");
  const [kept, setKept] = useState<OrderKey[]>([]);

  const offer = useMemo<OrderKey[]>(() => {
    if (intent.mode === "daily") return [...intent.brief.offer];
    if (intent.mode === "weekly") return [...intent.brief.offer];

    return casualOffer(intent.seed);
  }, [intent]);

  const commanderLocked = intent.mode === "daily";
  const commander = commanderLocked
    ? intent.mode === "daily"
      ? intent.brief.commander
      : profile.commander
    : profile.commander;
  const skin = skinById(profile.equipped[commander]);

  const toggle = (key: OrderKey) => {
    setKept((current) => {
      if (current.includes(key)) {
        return current.filter((entry) => entry !== key);
      }

      if (current.length >= KEEP) return current;

      return [...current, key];
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-28 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Button onClick={onBack} size="sm" variant="ghost">
          <ChevronLeft aria-hidden="true" className="size-4" />
          {t("common.back")}
        </Button>
        <p className="font-mono text-seed-muted text-xs uppercase tracking-[0.22em]">
          {t("draft.kicker")}
        </p>
      </header>

      <h1 className="font-bold font-display text-3xl tracking-tight sm:text-4xl">
        {t("draft.title")}
      </h1>
      <p className="mt-2 max-w-prose text-seed-muted">
        {t("draft.subtitle", { keep: KEEP })}
      </p>

      {/* The banner marching under these orders. */}
      <section className="mt-5 rounded-xl border border-seed-line bg-seed-panel p-4 shadow-panel">
        <div className="flex items-center gap-4">
          {skin ? (
            <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-seed-line-strong bg-seed-panel-raised">
              <CommanderPortrait
                className="size-full"
                commander={commander}
                skin={skin}
              />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold">
              {t(`commanders.${commander}.name`)}
            </p>
            <p className="text-seed-muted text-sm">
              {t(`commanders.${commander}.abilityName`)}:{" "}
              {t(`commanders.${commander}.ability`)}
            </p>
            <p className="mt-0.5 text-seed-muted text-sm">
              {t(`commanders.${commander}.passive`)}
            </p>
          </div>
        </div>

        {commanderLocked ? (
          <p className="mt-3 text-seed-teal text-xs uppercase tracking-[0.18em]">
            {t("draft.assigned")}
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            {COMMANDERS.map((entry) => (
              <button
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors",
                  commander === entry.id
                    ? "border-seed-gold-edge bg-seed-gold-tint text-seed-gold"
                    : "border-seed-line text-seed-muted hover:border-seed-line-strong"
                )}
                key={entry.id}
                onClick={() =>
                  updateProfile((current) => chooseCommander(current, entry.id))
                }
                type="button"
              >
                {t(`commanders.${entry.id}.name`)}
              </button>
            ))}
          </div>
        )}
      </section>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {offer.map((key) => {
          const order = ORDERS.find((entry) => entry.key === key);

          if (!order) return null;

          return (
            <li key={key}>
              <OrderCard
                onSelect={() => toggle(key)}
                order={order}
                selected={kept.includes(key)}
              />
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 border-seed-line border-t bg-seed-glass backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <p className="font-mono text-seed-muted text-sm tabular-nums">
            {t("draft.count", { kept: kept.length, keep: KEEP })}
          </p>
          <Button
            disabled={kept.length !== KEEP}
            onClick={() => onConfirm(kept)}
            size="lg"
            variant="play"
          >
            {t("draft.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
