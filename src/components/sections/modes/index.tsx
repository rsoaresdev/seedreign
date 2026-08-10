import {
  Bot,
  CalendarDays,
  Crown,
  Flame,
  Hammer,
  Palette,
  ShieldCheck,
  Sunrise,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SECTION_LINKS } from "@/components/layout/nav-links";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { IconTile, type IconTone } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { TiltCard, type TiltTone } from "@/components/ui/tilt-card";

/**
 * Every way there is to play. `key` indexes the `Modes.items` messages, so a
 * renamed mode fails to compile instead of rendering a missing translation.
 */
const MODES = [
  { key: "daily", icon: Sunrise, tone: "gold" },
  { key: "blitz", icon: Zap, tone: "teal" },
  { key: "ranked", icon: Crown, tone: "violet" },
  { key: "weekly", icon: Swords, tone: "gold" },
  { key: "forge", icon: Hammer, tone: "teal" },
  { key: "bots", icon: Bot, tone: "violet" },
] as const satisfies readonly {
  key: string;
  icon: typeof Zap;
  tone: TiltTone;
}[];

/** What keeps a player coming back, and the promise underneath all of it. */
const HOOKS = [
  { key: "ritual", icon: CalendarDays, tone: "gold" },
  { key: "streak", icon: Flame, tone: "gold" },
  { key: "leagues", icon: Trophy, tone: "teal" },
  { key: "collection", icon: Palette, tone: "violet" },
  { key: "fair", icon: ShieldCheck, tone: "neutral" },
] as const satisfies readonly {
  key: string;
  icon: typeof Flame;
  tone: IconTone;
}[];

/** Seconds between two cards arriving once the row is in view. */
const STAGGER = 0.06;

export async function Modes() {
  const t = await getTranslations("Modes");

  return (
    <section className="scroll-mt-24 py-20 sm:py-28" id={SECTION_LINKS[2].hash}>
      <Container
        className="flex flex-col items-center gap-12 sm:gap-16"
        size="lg"
      >
        <Reveal>
          <SectionHeading
            align="center"
            description={t("description")}
            eyebrow={t("eyebrow")}
            title={t("title")}
          />
        </Reveal>

        <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((mode, index) => {
            const Icon = mode.icon;

            return (
              <Reveal as="li" delay={index * STAGGER} key={mode.key}>
                <TiltCard className="p-6" tone={mode.tone}>
                  <div className="flex items-center justify-between gap-3">
                    <IconTile tone={mode.tone}>
                      <Icon />
                    </IconTile>

                    <Badge variant={mode.tone}>
                      {t(`items.${mode.key}.badge`)}
                    </Badge>
                  </div>

                  <h3 className="font-display font-semibold text-lg leading-tight">
                    {t(`items.${mode.key}.title`)}
                  </h3>

                  <p className="text-pretty text-muted-foreground text-sm">
                    {t(`items.${mode.key}.body`)}
                  </p>
                </TiltCard>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="w-full">
          <Card
            className="relative isolate w-full gap-8 overflow-hidden border-seed-line-strong bg-seed-panel-raised p-7 shadow-raised sm:p-10 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14"
            variant="raised"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(34rem_22rem_at_0%_0%,var(--seed-gold-tint),transparent_70%),radial-gradient(28rem_20rem_at_100%_100%,var(--seed-violet-tint),transparent_70%)]"
            />

            <div className="flex flex-col items-start gap-4">
              <Badge className="uppercase tracking-[0.18em]" variant="gold">
                {t("band.eyebrow")}
              </Badge>

              <h3 className="text-balance font-bold font-display text-3xl tracking-tight sm:text-4xl">
                {t("band.title")}
              </h3>

              <p className="text-pretty text-muted-foreground sm:text-lg">
                {t("band.body")}
              </p>
            </div>

            <ul className="flex flex-col divide-y divide-seed-line">
              {HOOKS.map((hook) => {
                const Icon = hook.icon;

                return (
                  <li
                    className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                    key={hook.key}
                  >
                    <IconTile size="sm" tone={hook.tone}>
                      <Icon />
                    </IconTile>

                    <div className="flex flex-col gap-1">
                      <span className="font-display font-semibold text-sm">
                        {t(`band.hooks.${hook.key}.title`)}
                      </span>

                      <span className="text-pretty text-muted-foreground text-sm">
                        {t(`band.hooks.${hook.key}.body`)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </Reveal>
      </Container>
    </section>
  );
}
