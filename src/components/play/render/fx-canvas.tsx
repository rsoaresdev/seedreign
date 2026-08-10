"use client";

/**
 * The juice layer: bursts, sparks, shockwaves, embers and floating spoils.
 *
 * A single canvas floats over the map and drains the sim's event feed by
 * serial, so the engine never learns that particles exist. Colour comes from
 * the stylesheet at mount, positions come from the same letterbox maths the
 * SVG uses, and the whole layer simply declines to exist for readers who
 * asked for reduced motion.
 */

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import type { World } from "@/components/game/world";

import type { Skin, TokenName } from "../meta/commanders";
import type { MatchState } from "../sim/types";
import { PLAYER } from "../sim/types";
import { stageView } from "./stage";

const HOUSE_TOKEN: readonly TokenName[] = [
  "seed-gold",
  "seed-teal",
  "seed-violet",
  "seed-danger",
];

const PARTICLE_CAP = 420;

/** How long a stalled requestAnimationFrame waits before the fallback paints. */
const WATCHDOG_MS = 400;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  size: number;
  color: string;
  kind: "spark" | "ring" | "ember" | "text";
  text?: string;
};

function readToken(name: TokenName): string {
  if (typeof window === "undefined") return "#f6b73c";

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();

  return value || "#f6b73c";
}

export function FxCanvas({ state, skin }: { state: MatchState; skin: Skin }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    // The preference reads as null before it is known; only an explicit "no
    // preference" turns the layer on, the same guard the landing uses.
    if (reduced !== false) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    const world: World = state.world;
    const view = stageView(world);
    const palette = new Map<TokenName, string>();
    const colorOf = (token: TokenName): string => {
      let color = palette.get(token);

      if (!color) {
        color = readToken(token);
        palette.set(token, color);
      }

      return color;
    };

    const particles: Particle[] = [];
    let lastSerial = state.nextSerial;
    let raf = 0;
    let lastPaint = performance.now();
    let disposed = false;

    const metrics = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      const scale = Math.min(width / view.width, height / view.height);
      const originX = (width - view.width * scale) / 2;
      const originY = (height - view.height * scale) / 2;

      return { width, height, dpr, scale, originX, originY };
    };

    const toPx = (
      m: ReturnType<typeof metrics>,
      wx: number,
      wy: number
    ): [number, number] => [
      m.originX + (wx - view.x) * m.scale,
      m.originY + (wy - view.y) * m.scale,
    ];

    const spawn = (particle: Particle) => {
      if (particles.length >= PARTICLE_CAP) particles.shift();

      particles.push(particle);
    };

    const burst = (
      wx: number,
      wy: number,
      color: string,
      count: number,
      speed: number,
      size: number
    ) => {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const pace = speed * (0.4 + Math.random() * 0.6);

        spawn({
          x: wx,
          y: wy,
          vx: Math.cos(angle) * pace,
          vy: Math.sin(angle) * pace - speed * 0.3,
          life: 0.5 + Math.random() * 0.5,
          age: 0,
          size: size * (0.6 + Math.random() * 0.8),
          color,
          kind: "spark",
        });
      }
    };

    const ring = (wx: number, wy: number, color: string, size: number) => {
      spawn({
        x: wx,
        y: wy,
        vx: 0,
        vy: 0,
        life: 0.9,
        age: 0,
        size,
        color,
        kind: "ring",
      });
    };

    const floatText = (wx: number, wy: number, color: string, text: string) => {
      spawn({
        x: wx,
        y: wy,
        vx: 0,
        vy: -1.4,
        life: 1.4,
        age: 0,
        size: 0.55,
        color,
        kind: "text",
        text,
      });
    };

    const drain = () => {
      for (const event of state.events) {
        if (event.serial <= lastSerial) continue;

        lastSerial = event.serial;

        const tile = event.key ? world.byKey.get(event.key) : undefined;
        const wx = tile?.x ?? view.x + view.width / 2;
        const wy = tile?.y ?? view.y + view.height / 2;
        const houseColor =
          event.house >= 0 && event.house < HOUSE_TOKEN.length
            ? colorOf(HOUSE_TOKEN[event.house])
            : colorOf("seed-sun");
        const accent = colorOf(skin.accent);

        switch (event.type) {
          case "claim":
          case "loss":
            burst(
              wx,
              wy,
              event.house === PLAYER ? accent : houseColor,
              event.house === PLAYER ? 6 : 3,
              2.2,
              0.09
            );
            break;
          case "chest":
            burst(wx, wy, colorOf("seed-gold"), 14, 3, 0.1);
            floatText(
              wx,
              wy - 0.4,
              colorOf("seed-gold"),
              `+${event.detail ?? ""}`
            );
            break;
          case "camp":
            burst(wx, wy, colorOf("seed-bark"), 10, 2.4, 0.11);
            break;
          case "forge":
            ring(wx, wy, colorOf("seed-violet"), 2.6);
            burst(wx, wy, colorOf("seed-violet"), 16, 3, 0.1);
            break;
          case "wonder":
            ring(wx, wy, colorOf("seed-gold"), 3.4);
            break;
          case "pulse":
            ring(wx, wy, colorOf("seed-teal"), 4.2);
            break;
          case "flood":
            if (Math.random() < 0.3) {
              burst(wx, wy, colorOf("seed-teal"), 4, 1.8, 0.09);
            }
            break;
          case "restore":
            if (Math.random() < 0.4) {
              burst(wx, wy, colorOf("seed-teal"), 3, 1.4, 0.07);
            }
            break;
          case "collapse":
            spawn({
              x: wx,
              y: wy,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -1 - Math.random() * 1.4,
              life: 1.6,
              age: 0,
              size: 0.12,
              color: colorOf("seed-danger"),
              kind: "ember",
            });
            break;
          case "elimination":
            ring(wx, wy, houseColor, 4.6);
            burst(wx, wy, houseColor, 26, 4, 0.13);
            break;
          case "order":
          case "ability":
            ring(wx, wy, accent, 2.2);
            burst(wx, wy, accent, 12, 2.6, 0.09);
            break;
          case "relic":
            ring(wx, wy, colorOf("seed-violet"), 3);
            break;
        }
      }
    };

    let previous = performance.now();

    const paint = (now: number) => {
      lastPaint = now;

      const dt = Math.min(0.1, (now - previous) / 1000);

      previous = now;
      drain();

      const m = metrics();

      context.setTransform(m.dpr, 0, 0, m.dpr, 0, 0);
      context.clearRect(0, 0, m.width, m.height);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];

        particle.age += dt;

        if (particle.age >= particle.life) {
          particles.splice(index, 1);
          continue;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;

        if (particle.kind === "spark") particle.vy += 3.4 * dt;

        const fade = 1 - particle.age / particle.life;
        const [px, py] = toPx(m, particle.x, particle.y);

        context.globalAlpha = fade;

        if (particle.kind === "ring") {
          const grow = (particle.age / particle.life) * particle.size * m.scale;

          context.strokeStyle = particle.color;
          context.lineWidth = Math.max(1, 0.06 * m.scale * fade);
          context.beginPath();
          context.arc(px, py, Math.max(0.5, grow), 0, Math.PI * 2);
          context.stroke();
        } else if (particle.kind === "text" && particle.text) {
          context.fillStyle = particle.color;
          context.font = `600 ${Math.max(10, particle.size * m.scale)}px ui-monospace, monospace`;
          context.textAlign = "center";
          context.fillText(particle.text, px, py);
        } else {
          context.fillStyle = particle.color;
          context.beginPath();
          context.arc(
            px,
            py,
            Math.max(0.6, particle.size * m.scale * fade),
            0,
            Math.PI * 2
          );
          context.fill();
        }
      }

      context.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (disposed) return;

      paint(now);
      raf = window.requestAnimationFrame(loop);
    };

    raf = window.requestAnimationFrame(loop);

    // Some embedded webviews starve requestAnimationFrame while the page is
    // considered hidden; a slow interval keeps the layer honest there.
    const watchdog = window.setInterval(() => {
      const now = performance.now();

      if (now - lastPaint > WATCHDOG_MS) paint(now);
    }, WATCHDOG_MS);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.clearInterval(watchdog);
    };
  }, [state, skin, reduced]);

  if (reduced !== false) return null;

  return (
    <canvas
      className="pointer-events-none absolute inset-0 h-full w-full"
      ref={canvasRef}
    />
  );
}
