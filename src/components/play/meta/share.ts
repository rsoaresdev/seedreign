/**
 * The spoiler-free grid. Six by six, one letter per cell, the same alphabet
 * the landing page shows off: ground you held, ground a rival held, where a
 * Pulse landed, what the Collapse took, and open nothing. Shape only; the
 * route stays yours.
 */

import { gridText } from "@/components/sections/share/result";

import { type MatchState, PLAYER } from "../sim/types";

const GRID = 6;

export function buildShareGrid(state: MatchState): string[] {
  const { world } = state;
  const rows: string[] = [];

  for (let row = 0; row < GRID; row += 1) {
    let line = "";

    for (let col = 0; col < GRID; col += 1) {
      const x0 = state.world.minX + (col / GRID) * world.width;
      const x1 = state.world.minX + ((col + 1) / GRID) * world.width;
      const y0 = state.world.minY + (row / GRID) * world.height;
      const y1 = state.world.minY + ((row + 1) / GRID) * world.height;

      let land = 0;
      let mine = 0;
      let rival = 0;
      let eaten = 0;
      let pulsed = 0;

      for (const tile of world.tiles) {
        if (tile.x < x0 || tile.x >= x1 || tile.y < y0 || tile.y >= y1) {
          continue;
        }
        if (!tile.land) continue;

        land += 1;

        if (state.pulseMarks.has(tile.key)) pulsed += 1;
        if (state.collapsed.has(tile.key)) {
          eaten += 1;
          continue;
        }

        const holder = state.owners.get(tile.key);

        if (holder === PLAYER) mine += 1;
        else if (holder !== undefined) rival += 1;
      }

      if (land < 2) {
        line += ".";
        continue;
      }

      if (eaten / land > 0.5) {
        line += "x";
      } else if (pulsed >= 2 && mine < land / 2) {
        line += "v";
      } else if (mine >= rival && mine > 0) {
        line += "g";
      } else if (rival > 0) {
        line += "t";
      } else {
        line += ".";
      }
    }

    rows.push(line);
  }

  return rows;
}

export function shareText(
  rows: readonly string[],
  title: string,
  line: string,
  url: string
): string {
  return `${title}\n${line}\n\n${gridText(rows)}\n\n${url}`;
}
