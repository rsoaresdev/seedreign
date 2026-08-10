"use client";

/**
 * The playable world: one map, one Seeded, four order cards and a HUD that
 * tells the truth about what has actually been taken.
 *
 * The world is generated once from a fixed number, so the server and the
 * browser paint the same ground and nothing hydrates into a different map. The
 * whole thing is a toy sitting on top of a scene that is already finished:
 * nothing else on the page needs it to work.
 */

import { useTranslations } from "next-intl";
import type { KeyboardEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { OrderCard } from "@/components/game/cards/order-card";
import {
  ORDERS,
  type Order,
  type OrderKey,
} from "@/components/game/cards/orders";
import { GameViewport, worldView } from "@/components/game/game-viewport";
import { ForceSlider } from "@/components/game/hud/force-slider";
import { Minimap } from "@/components/game/hud/minimap";
import { StandingsPanel } from "@/components/game/hud/standings-panel";
import {
  type Decree,
  type VictoryCondition,
  WorldBar,
} from "@/components/game/hud/world-bar";
import {
  PLAYABLE_ORDERS,
  useWorldPlay,
} from "@/components/game/use-world-play";
import {
  generateWorld,
  HOUSES,
  neighbourOf,
  type Tile,
} from "@/components/game/world";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * One world, fixed.
 *
 * The number is the world, so nothing here is allowed to reach for a clock or
 * for `Math.random`: the map has to come out identical on the server and on
 * hydration or the page repaints into a world nobody was looking at.
 */
const WORLD_SEED = 500;

/**
 * Small enough that a hex is still a comfortable target on a phone, big enough
 * that the coastline has something to say.
 */
const WORLD_COLS = 12;
const WORLD_ROWS = 9;

/** What this world asks of you, and what the Sowing changed about it. */
const CONDITION: VictoryCondition = "conquest";
const DECREE: Decree = "swiftOrders";

/** Daylight left before the Collapse takes it, in seconds. */
const DAYLIGHT = 11 * 60 + 40;

/** One hex across, and the pitch between two rows. */
const CELL_WIDTH = Math.sqrt(3);
const CELL_HEIGHT = 1.5;

/**
 * Arrow keys on a hex grid.
 *
 * Pointy-top hexes have no neighbour straight up or straight down, so up leans
 * left and down leans right, and left and right fall back onto the diagonals on
 * their own side. Each pair is made of opposite directions, so a key and its
 * mirror always walk you back to the tile you left. Every land tile stays
 * reachable without asking anybody to learn six directions.
 */
const ARROW_STEPS: Record<string, readonly number[]> = {
  ArrowRight: [0, 1, 5],
  ArrowLeft: [3, 2, 4],
  ArrowUp: [2, 1],
  ArrowDown: [5, 4],
};

const ORDER_BY_KEY = new Map<OrderKey, Order>(
  ORDERS.map((order) => [order.key, order])
);

export function WorldStage() {
  const t = useTranslations("World");
  const houses = useTranslations("Game.hud.standings.houses");
  const reducedMotion = useReducedMotion();

  // `=== false` on purpose: `null` means the preference has not been read yet,
  // and until it has, orders resolve on the spot rather than crawl.
  const animate = reducedMotion === false;

  const world = useMemo(
    () => generateWorld(WORLD_SEED, WORLD_COLS, WORLD_ROWS),
    []
  );
  const land = useMemo(() => world.tiles.filter((tile) => tile.land), [world]);
  const view = useMemo(() => worldView(world), [world]);

  const play = useWorldPlay(world, animate);
  const [aim, setAim] = useState<string | null>(null);

  // The board is one stop on the way down the page, not sixty. Tab reaches the
  // tile last left off at, or the Seeded, and the arrow keys do the walking
  // from there.
  const [entry, setEntry] = useState<string | null>(null);
  const entryKey = entry ?? play.commanderKey;

  /** Every tile's button, so the arrow keys can hand focus along the grid. */
  const cells = useRef(new Map<string, HTMLButtonElement>());

  const holderOf = useCallback(
    (key: string) => {
      const house = play.owners.get(key);

      if (house === undefined) return t("holder.neutral");
      if (house === 0) return t("holder.you");

      const banner = HOUSES[house];

      return banner
        ? t("holder.rival", { house: houses(banner) })
        : t("holder.neutral");
    },
    [play.owners, t, houses]
  );

  const nameOf = useCallback(
    (tile: Tile) => {
      const terrain = t(`terrain.${tile.terrain}`);
      const holder = holderOf(tile.key);
      const here = tile.key === play.commanderKey;

      if (!tile.structure) {
        return here
          ? t("tile.commander", { terrain, holder })
          : t("tile.plain", { terrain, holder });
      }

      const structure = t(`structure.${tile.structure}`);

      return here
        ? t("tile.both", { terrain, holder, structure })
        : t("tile.structure", { terrain, holder, structure });
    },
    [holderOf, play.commanderKey, t]
  );

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    tile: Tile
  ) => {
    if (event.key === "Escape") {
      if (!play.armed) return;

      play.arm(null);
      event.preventDefault();
      return;
    }

    const steps = ARROW_STEPS[event.key];

    if (!steps) return;

    for (const direction of steps) {
      const next = neighbourOf(world, tile, direction);
      const cell = next?.land ? cells.current.get(next.key) : undefined;

      if (!cell) continue;

      cell.focus();
      event.preventDefault();
      return;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <WorldBar
        condition={CONDITION}
        decree={DECREE}
        secondsToDusk={DAYLIGHT}
        world={WORLD_SEED}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Edge to edge on a phone. The map is the point, the gutter is not. */}
          <div className="-mx-5 overflow-x-auto border-seed-line border-y bg-seed-map-abyss shadow-panel sm:mx-0 sm:rounded-lg sm:border-x">
            <div className="relative min-w-88">
              <GameViewport
                aim={aim}
                animate={animate}
                armed={play.armed !== null}
                commanderKey={play.commanderKey}
                marks={play.marks}
                owners={play.owners}
                wards={play.wards}
                world={world}
              />

              {/* A real grouping element, so the board is announced once and
                  then walked tile by tile instead of read as loose buttons. */}
              <fieldset
                aria-busy={play.busy}
                aria-label={t("board")}
                className="pointer-events-none absolute inset-0"
              >
                {land.map((tile) => (
                  <button
                    aria-label={nameOf(tile)}
                    // A dark band under the ring: teal on its own washes out
                    // against snow, and against any ground the gold already
                    // holds, which is most of what anybody focuses.
                    className={cn(
                      "pointer-events-auto absolute rounded-xs outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-seed-map-abyss",
                      play.armed ? "cursor-crosshair" : "cursor-pointer"
                    )}
                    key={tile.key}
                    onBlur={() => setAim(null)}
                    onClick={() => play.aimAt(tile.key)}
                    onFocus={() => {
                      setAim(tile.key);
                      setEntry(tile.key);
                    }}
                    onKeyDown={(event) => handleKeyDown(event, tile)}
                    onPointerEnter={() => setAim(tile.key)}
                    onPointerLeave={() => setAim(null)}
                    ref={(node) => {
                      if (node) cells.current.set(tile.key, node);
                      else cells.current.delete(tile.key);
                    }}
                    style={{
                      left: `${
                        ((tile.x - CELL_WIDTH / 2 - view.x) / view.width) * 100
                      }%`,
                      top: `${
                        ((tile.y - CELL_HEIGHT / 2 - view.y) / view.height) *
                        100
                      }%`,
                      width: `${(CELL_WIDTH / view.width) * 100}%`,
                      height: `${(CELL_HEIGHT / view.height) * 100}%`,
                    }}
                    tabIndex={tile.key === entryKey ? 0 : -1}
                    type="button"
                  />
                ))}
              </fieldset>
            </div>
          </div>

          <p className="text-pretty text-seed-muted text-sm">{t("help")}</p>

          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-mono text-[0.625rem] text-seed-muted uppercase tracking-[0.22em]">
              {t("orders")}
            </span>

            {play.armed ? (
              <span className="flex items-center gap-2 font-medium text-seed-gold text-xs">
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-seed-gold motion-safe:animate-pulse-dot"
                />
                {t("aim")}
              </span>
            ) : null}
          </div>

          {/* A rail on a phone, four across once there is room for them. */}
          <div className="-m-1 flex snap-x gap-3 overflow-x-auto p-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
            {PLAYABLE_ORDERS.map((key) => {
              const order = ORDER_BY_KEY.get(key);

              if (!order) return null;

              return (
                <OrderCard
                  className="w-36 shrink-0 snap-start sm:w-auto"
                  key={key}
                  onSelect={() => play.arm(play.armed === key ? null : key)}
                  order={order}
                  selected={play.armed === key}
                />
              );
            })}
          </div>

          <p
            aria-live="polite"
            className="flex min-h-5 text-pretty text-seed-muted text-sm"
          >
            {play.report ? (
              <span className="flex items-start gap-2" key={play.report.serial}>
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-seed-gold"
                />
                {t(`report.${play.report.order}`, {
                  count: play.report.taken,
                })}
              </span>
            ) : null}
          </p>
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <StandingsPanel rows={play.standings} />

          <div className="rounded-lg border border-seed-line bg-seed-glass-raised p-2.5 shadow-panel">
            <Minimap owners={play.owners} world={world} />
          </div>

          <ForceSlider onChange={play.setAttack} value={play.attack} />

          <Button onClick={play.reset} size="lg" variant="outline">
            {t("reset")}
          </Button>
        </aside>
      </div>
    </div>
  );
}
