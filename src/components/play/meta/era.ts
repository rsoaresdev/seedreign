/**
 * Eras: the monthly seasons. Points earned from daily percentiles pile up all
 * month; when the calendar turns, the Era closes and pays out Gems by the tier
 * the Seeded reached. Gems otherwise only ever arrive through the store, and
 * the store is cosmetics only.
 */

export const TIER_COUNT = 6;

/** Era points needed to sit in each tier, bronze first. Legend is tuned to
 * stay reachable in a February of near-perfect days, and no easier. */
export const TIER_FLOORS = [0, 250, 700, 1500, 2600, 3400] as const;

/** Gems paid when the Era closes, by final tier. */
export const TIER_GEMS = [8, 15, 25, 40, 60, 90] as const;

/** Names rotate yearly, one per month. */
export const ERA_NAME_KEYS = [
  "frost",
  "thaw",
  "bloom",
  "storm",
  "ember",
  "zenith",
  "harvest",
  "dusk",
  "mist",
  "hollow",
  "long-night",
  "rebirth",
] as const;

export function eraIdAt(now: number): string {
  const date = new Date(now);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function eraNameKey(eraId: string): (typeof ERA_NAME_KEYS)[number] {
  const month = Number.parseInt(eraId.slice(5), 10) || 1;

  return ERA_NAME_KEYS[(month - 1) % ERA_NAME_KEYS.length];
}

/** Sequential Era number since the first Sowing, for the roman badge. */
export function eraNumber(eraId: string): number {
  const year = Number.parseInt(eraId.slice(0, 4), 10);
  const month = Number.parseInt(eraId.slice(5), 10);

  return (year - 2026) * 12 + month;
}

export function daysLeftInEra(now: number): number {
  const date = new Date(now);
  const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);

  return Math.max(1, Math.ceil((next - now) / 86_400_000));
}

export function tierOf(points: number): number {
  let tier = 0;

  for (let index = 0; index < TIER_FLOORS.length; index += 1) {
    if (points >= TIER_FLOORS[index]) tier = index;
  }

  return tier;
}

/** Progress 0..1 through the current tier, for the ladder rail. */
export function tierProgress(points: number): number {
  const tier = tierOf(points);

  if (tier >= TIER_FLOORS.length - 1) return 1;

  const floor = TIER_FLOORS[tier];
  const ceiling = TIER_FLOORS[tier + 1];

  return Math.min(1, (points - floor) / (ceiling - floor));
}

/** Era points one daily run is worth. Percentile pays, victory tops it up. */
export function eraPointsFor(percentile: number, victory: boolean): number {
  const base = Math.max(5, Math.round(105 - percentile));

  return victory ? Math.round(base * 1.25) : base;
}
