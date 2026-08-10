"use client";

/**
 * The living map: terrain, territory, walls, spoils, banners, the Collapse.
 *
 * Two components on purpose. WorldLayers paints everything the simulation
 * owns and is memoised on the sim's version counter, so it repaints at sim
 * rate. MatchStage wraps it with the pointer surface (tap, drag, pinch,
 * wheel, arrow keys) and the aim ring, which move at pointer rate without
 * ever re-merging a single hex path.
 */

import {
  memo,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { Commander } from "@/components/game/art/commander";
import { MapDefs } from "@/components/game/art/defs";
import { StructureGlyph } from "@/components/game/art/structures";
import { TerrainLayer } from "@/components/game/art/terrain";
import { TerritoryLayer } from "@/components/game/art/territory";
import { hexPath } from "@/components/game/hex";
import type { Tile, World } from "@/components/game/world";
import { cn } from "@/lib/utils";

import type { Skin } from "../meta/commanders";
import { type MatchState, PLAYER } from "../sim/types";
import { SkinPatternDefs, skinPatternId } from "./patterns";

const SCENE = "match";
const SEAM = 1.004;

/** How far a press may travel and still count as a tap. */
const TAP_SLOP = 8;

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/** Tiles about to fall, drawn as a warning rim ahead of the Collapse. */
const DOOM_PREVIEW = 14;

const HOUSE_STROKE = [
  "stroke-seed-gold",
  "stroke-seed-teal",
  "stroke-seed-violet",
  "stroke-destructive",
] as const;

export type StageView = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function stageView(world: World): StageView {
  return {
    x: world.minX,
    y: world.minY,
    width: world.width,
    height: world.height,
  };
}

function viewBoxOf(view: StageView): string {
  return `${view.x.toFixed(3)} ${view.y.toFixed(3)} ${view.width.toFixed(3)} ${view.height.toFixed(3)}`;
}

/** Pixel to axial with cube rounding, the inverse of hexCenter at size 1. */
function pickTile(world: World, x: number, y: number): Tile | undefined {
  const rf = y / 1.5;
  const qf = x / Math.sqrt(3) - rf / 2;
  const sf = -qf - rf;

  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);

  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);

  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;

  return world.byKey.get(`${q},${r}`);
}

/** Merged hex fill for a set of tile keys. */
function mergedPath(world: World, keys: Iterable<string>): string {
  const parts: string[] = [];

  for (const key of keys) {
    const tile = world.byKey.get(key);

    if (tile) parts.push(hexPath(tile.x, tile.y, SEAM));
  }

  return parts.join(" ");
}

type WorldLayersProps = {
  state: MatchState;
  /** Sim tick version. The memo below repaints only when this moves. */
  version: number;
  skin: Skin;
  animate: boolean;
};

/**
 * Everything the sim owns, painted fresh whenever the version moves. The
 * custom comparator is the whole performance story: pointer-rate renders of
 * the parent never reach this tree.
 */
const WorldLayers = memo(
  function WorldLayers({ state, skin, animate }: WorldLayersProps) {
    const { world } = state;
    const view = stageView(world);

    const mine: string[] = [];

    for (const [key, holder] of state.owners) {
      if (holder === PLAYER) mine.push(key);
    }

    const skinOverlay = mergedPath(world, mine);
    const floodPath = mergedPath(world, state.flooded.keys());
    const ashPath = mergedPath(world, state.collapsed);

    const wallKeys: string[] = [];

    for (const [key, until] of state.walls) {
      if (until > state.tick) wallKeys.push(key);
    }

    const walls = mergedPath(world, wallKeys);

    const collapseStart = Math.floor(state.config.duration * 0.7);
    const soon: string[] = [];

    if (state.tick >= collapseStart - 40) {
      for (
        let index = state.collapseIndex;
        index < world.collapseOrder.length && soon.length < DOOM_PREVIEW;
        index += 1
      ) {
        const key = world.collapseOrder[index];

        if (!state.collapsed.has(key)) soon.push(key);
      }
    }

    const doomPath = mergedPath(world, soon);

    const spoils: { key: string; tile: Tile; kind: "camp" | "chest" }[] = [];

    for (const key of state.camps.keys()) {
      const tile = world.byKey.get(key);

      if (tile && !state.collapsed.has(key) && !state.flooded.has(key)) {
        spoils.push({ key, tile, kind: "camp" });
      }
    }

    for (const key of state.chests) {
      const tile = world.byKey.get(key);

      if (tile && !state.collapsed.has(key) && !state.flooded.has(key)) {
        spoils.push({ key, tile, kind: "chest" });
      }
    }

    const statics: { key: string; tile: Tile; kind: "city" | "port" }[] = [];

    for (const tile of world.tiles) {
      if (tile.structure === "city" || tile.structure === "port") {
        statics.push({ key: tile.key, tile, kind: tile.structure });
      }
    }

    const forgeTile = state.forgeKey ? world.byKey.get(state.forgeKey) : null;
    const wonderTile = state.wonderKey
      ? world.byKey.get(state.wonderKey)
      : null;

    const bounty = state.pulses.find(
      (pulse) =>
        pulse.id === "bounty" && pulse.fired && pulse.until > state.tick
    );
    const bountyCapital =
      bounty && bounty.markedHouse >= 0
        ? state.houses[bounty.markedHouse].capital
        : null;
    const bountyTile = bountyCapital ? world.byKey.get(bountyCapital) : null;

    return (
      <svg
        aria-hidden="true"
        className="block h-full w-full"
        viewBox={viewBoxOf(view)}
      >
        <MapDefs scene={SCENE} />
        <SkinPatternDefs />

        <rect
          className="fill-seed-map-abyss"
          height={view.height}
          width={view.width}
          x={view.x}
          y={view.y}
        />

        <TerrainLayer scene={SCENE} world={world} />

        {floodPath === "" ? null : (
          <path
            className="fill-seed-map-shelf"
            d={floodPath}
            fillOpacity={0.92}
          />
        )}

        <TerritoryLayer owners={state.owners} world={world} />

        {skinOverlay === "" ? null : (
          <path
            d={skinOverlay}
            fill={`url(#${skinPatternId(skin.pattern)})`}
            fillOpacity={0.55}
            style={{ color: `var(--${skin.accent})` }}
          />
        )}

        {walls === "" ? null : (
          <g>
            <path
              className="stroke-seed-map-abyss"
              d={walls}
              fill="none"
              strokeLinejoin="round"
              strokeOpacity={0.5}
              strokeWidth={0.2}
            />
            <path
              className="stroke-seed-sun"
              d={walls}
              fill="none"
              strokeLinejoin="round"
              strokeOpacity={0.85}
              strokeWidth={0.08}
            />
          </g>
        )}

        <g>
          {statics.map((glyph) => (
            <g
              key={glyph.key}
              transform={`translate(${glyph.tile.x} ${glyph.tile.y})`}
            >
              <StructureGlyph kind={glyph.kind} scene={SCENE} />
            </g>
          ))}
          {spoils.map((glyph) => (
            <g
              key={glyph.key}
              transform={`translate(${glyph.tile.x} ${glyph.tile.y})`}
            >
              <StructureGlyph kind={glyph.kind} scene={SCENE} />
            </g>
          ))}
          {forgeTile ? (
            <g transform={`translate(${forgeTile.x} ${forgeTile.y})`}>
              <StructureGlyph kind="forge" scene={SCENE} />
            </g>
          ) : null}
          {wonderTile ? (
            <g transform={`translate(${wonderTile.x} ${wonderTile.y})`}>
              <StructureGlyph kind="wonder" scene={SCENE} />
            </g>
          ) : null}
        </g>

        {ashPath === "" ? null : (
          <path
            className="fill-seed-map-abyss"
            d={ashPath}
            fillOpacity={0.94}
          />
        )}

        {doomPath === "" ? null : (
          <path
            className={cn(
              "fill-destructive",
              animate && "motion-safe:animate-pulse"
            )}
            d={doomPath}
            fillOpacity={0.16}
          />
        )}

        {state.houses.map((house, index) => {
          if (!house.alive || !house.capital) return null;

          const tile = world.byKey.get(house.capital);

          if (!tile || state.collapsed.has(tile.key)) return null;

          return (
            <g key={house.capital} transform={`translate(${tile.x} ${tile.y})`}>
              <Commander house={index} />
            </g>
          );
        })}

        {state.fronts.map((front) => {
          const tile = world.byKey.get(front.targetKey);

          if (!tile) return null;

          return (
            <path
              className={cn(
                HOUSE_STROKE[front.house],
                animate && "motion-safe:animate-pulse"
              )}
              d={hexPath(tile.x, tile.y, 0.82)}
              fill="none"
              key={front.id}
              strokeLinejoin="round"
              strokeOpacity={0.85}
              strokeWidth={0.09}
            />
          );
        })}

        {bountyTile ? (
          <path
            className={cn(
              "stroke-destructive",
              animate && "motion-safe:animate-pulse"
            )}
            d={hexPath(bountyTile.x, bountyTile.y, 1.35)}
            fill="none"
            strokeDasharray="0.22 0.14"
            strokeWidth={0.11}
          />
        ) : null}
      </svg>
    );
  },
  (previous, next) =>
    previous.version === next.version &&
    previous.skin === next.skin &&
    previous.animate === next.animate &&
    previous.state === next.state
);

type StageProps = {
  state: MatchState;
  /** Sim tick version; bumps whenever the ground may have changed. */
  version: number;
  skin: Skin;
  /** True while a card or ability waits for a target. */
  armed: boolean;
  animate: boolean;
  onTap: (key: string) => void;
  /** Accessible name for the map surface. */
  label: string;
  className?: string;
  /** Overlays that pan and zoom with the map, the FX canvas among them. */
  children?: React.ReactNode;
};

export function MatchStage({
  state,
  version,
  skin,
  armed,
  animate,
  onTap,
  label,
  className,
  children,
}: StageProps) {
  const { world } = state;
  const view = useMemo(() => stageView(world), [world]);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const [aim, setAim] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    startX: 0,
    startY: 0,
    moved: false,
    pinch: 0,
    zoom: 1,
  });

  const clampPan = useCallback((x: number, y: number, scale: number) => {
    const box = boxRef.current;

    if (!box) return { x, y };

    const limitX = (box.clientWidth * (scale - 1)) / 2;
    const limitY = (box.clientHeight * (scale - 1)) / 2;

    return {
      x: Math.max(-limitX, Math.min(limitX, x)),
      y: Math.max(-limitY, Math.min(limitY, y)),
    };
  }, []);

  /** Client point to a tile key, honouring letterboxing and the transform. */
  const tileAt = useCallback(
    (clientX: number, clientY: number): Tile | undefined => {
      const box = boxRef.current?.firstElementChild;

      if (!box) return undefined;

      const rect = box.getBoundingClientRect();
      const scale = Math.min(
        rect.width / view.width,
        rect.height / view.height
      );
      const originX = rect.left + (rect.width - view.width * scale) / 2;
      const originY = rect.top + (rect.height - view.height * scale) / 2;
      const x = view.x + (clientX - originX) / scale;
      const y = view.y + (clientY - originY) / scale;

      return pickTile(world, x, y);
    },
    [world, view]
  );

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    // Secondary mouse buttons never aim; touch and pen contacts report 0.
    if (event.button !== 0) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture is a nicety for drags that leave the element; a pointer the
      // browser will not capture can still tap.
    }

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    const grab = gesture.current;

    if (pointers.current.size === 1) {
      grab.startX = event.clientX;
      grab.startY = event.clientY;
      grab.moved = false;
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];

      grab.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      // A gesture that ever held two fingers is never a tap.
      grab.moved = true;
    }
  }, []);

  const onPointerMove = useCallback(
    (event: ReactPointerEvent) => {
      const held = pointers.current.get(event.pointerId);
      const grab = gesture.current;

      if (!held) {
        const tile = tileAt(event.clientX, event.clientY);

        setAim(tile?.land ? tile.key : null);

        return;
      }

      const dx = event.clientX - held.x;
      const dy = event.clientY - held.y;

      held.x = event.clientX;
      held.y = event.clientY;

      if (
        !grab.moved &&
        Math.hypot(event.clientX - grab.startX, event.clientY - grab.startY) >
          TAP_SLOP
      ) {
        grab.moved = true;
      }

      if (pointers.current.size === 1 && grab.moved) {
        setPan((current) =>
          clampPan(current.x + dx, current.y + dy, grab.zoom)
        );
      }

      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const spread = Math.hypot(a.x - b.x, a.y - b.y);

        if (grab.pinch > 0) {
          const next = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, grab.zoom * (spread / grab.pinch))
          );

          grab.zoom = next;
          grab.pinch = spread;
          setZoom(next);
          setPan((current) => clampPan(current.x, current.y, next));
        }

        grab.moved = true;
      }
    },
    [tileAt, clampPan]
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      if (!pointers.current.delete(event.pointerId)) return;

      const grab = gesture.current;

      if (pointers.current.size === 0 && !grab.moved) {
        const tile = tileAt(event.clientX, event.clientY);

        if (tile?.land) onTap(tile.key);
      }
    },
    [tileAt, onTap]
  );

  /** A cancelled gesture clears itself and never commits an attack. */
  const onPointerCancel = useCallback((event: ReactPointerEvent) => {
    pointers.current.delete(event.pointerId);
    gesture.current.moved = true;
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent) => {
      const grab = gesture.current;
      const next = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, grab.zoom * (event.deltaY < 0 ? 1.12 : 0.9))
      );

      grab.zoom = next;
      setZoom(next);
      setPan((current) => clampPan(current.x, current.y, next));
    },
    [clampPan]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const cursor = aim ?? state.houses[PLAYER].capital;

      if (!cursor) return;

      const tile = world.byKey.get(cursor);

      if (!tile) return;

      // All six hex directions: arrows cover four, PageUp and PageDown take
      // the NW and SE diagonals a square keyboard has no arrows for.
      const steps: Record<string, [number, number]> = {
        ArrowRight: [1, 0],
        ArrowLeft: [-1, 0],
        ArrowUp: [1, -1],
        ArrowDown: [-1, 1],
        PageUp: [0, -1],
        PageDown: [0, 1],
      };
      const step = steps[event.key];

      if (step) {
        event.preventDefault();

        // Step over open water so islands stay reachable from the keyboard.
        let q = tile.q + step[0];
        let r = tile.r + step[1];
        let next = world.byKey.get(`${q},${r}`);

        while (next && !next.land) {
          q += step[0];
          r += step[1];
          next = world.byKey.get(`${q},${r}`);
        }

        if (next?.land) setAim(next.key);

        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onTap(cursor);
      }
    },
    [aim, state, world, onTap]
  );

  const aimTile = aim ? world.byKey.get(aim) : null;
  const dusk = Math.min(1, state.tick / state.config.duration);

  return (
    <div
      className={cn(
        "relative touch-none overflow-hidden bg-seed-map-abyss outline-none focus-visible:ring-3 focus-visible:ring-ring",
        className
      )}
      aria-label={label}
      onKeyDown={onKeyDown}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
      ref={boxRef}
      role="application"
    >
      <div
        className="h-full w-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="relative h-full w-full">
          <WorldLayers
            animate={animate}
            skin={skin}
            state={state}
            version={version}
          />

          {/* The aim ring rides its own tiny svg at pointer rate. */}
          {aimTile ? (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 block h-full w-full"
              viewBox={viewBoxOf(view)}
            >
              <path
                className={armed ? "fill-seed-gold" : "fill-seed-sun"}
                d={hexPath(aimTile.x, aimTile.y, 0.98)}
                fillOpacity={0.12}
              />
              <path
                className={armed ? "stroke-seed-gold" : "stroke-seed-sun"}
                d={hexPath(aimTile.x, aimTile.y, 0.9)}
                fill="none"
                strokeLinejoin="round"
                strokeOpacity={0.9}
                strokeWidth={0.075}
              />
            </svg>
          ) : null}

          {children}
        </div>
      </div>

      {/* Day falling into dusk: a grade that deepens as the clock runs out. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgb(20 8 34 / 0.55), transparent 55%), linear-gradient(to bottom, rgb(10 6 20 / 0.35), transparent 40%)",
          opacity: dusk ** 1.6,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgb(4 6 11 / 0.8))",
          opacity: Math.max(0, (dusk - 0.7) / 0.3) * 0.9,
        }}
      />
    </div>
  );
}
