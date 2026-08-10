/** Index 0 is the player. */
const HOUSE_BANNER = [
  "fill-seed-gold",
  "fill-seed-teal",
  "fill-seed-violet",
  "fill-destructive",
] as const;

/* A standard planted at the commander's shoulder, tall enough to be found. */
const POLE = "M 0.31 0.02 L 0.26 -1.16";

const PENNANT =
  "M 0.265 -1.13 L 0.68 -1.01 L 0.575 -0.93 L 0.68 -0.85 L 0.27 -0.87 Z";

/* The underside of the cloth, so the pennant has a near side and a far one. */
const PENNANT_FOLD = "M 0.27 -0.9 L 0.62 -0.885 L 0.68 -0.85 L 0.27 -0.87 Z";

/* Shoulders down to a hem that flares where it meets the ground. */
const CLOAK =
  "M -0.3 0 L -0.22 -0.7 Q -0.2 -0.8 -0.1 -0.82 L 0.1 -0.82 " +
  "Q 0.2 -0.8 0.22 -0.7 L 0.3 0 Q 0 0.14 -0.3 0 Z";

const CLOAK_LIGHT =
  "M -0.3 0 L -0.22 -0.7 Q -0.2 -0.8 -0.1 -0.82 L -0.05 -0.79 " +
  "L -0.11 -0.68 L -0.14 0.055 Q -0.22 0.06 -0.3 0 Z";

const PAULDRONS =
  "M -0.24 -0.8 Q -0.32 -0.72 -0.26 -0.62 L -0.11 -0.7 Z " +
  "M 0.24 -0.8 Q 0.3 -0.72 0.25 -0.62 L 0.11 -0.7 Z";

/* The house sigil, worn where a tabard would sit. */
const SIGIL = "M 0 -0.62 L 0.075 -0.52 L 0 -0.42 L -0.075 -0.52 Z";

const HELM =
  "M -0.15 -0.88 Q -0.15 -1.1 0 -1.1 Q 0.15 -1.1 0.15 -0.88 " +
  "L 0.125 -0.83 L -0.125 -0.83 Z";

/* The one place on the figure the sun lands square. */
const HELM_LIGHT =
  "M -0.15 -0.94 Q -0.15 -1.1 0 -1.1 L 0 -1.06 Q -0.11 -1.06 -0.11 -0.94 Z";

const VISOR = "M -0.125 -0.955 L 0.125 -0.955 L 0.125 -0.915 L -0.125 -0.915 Z";

/**
 * The player's Seeded, standing on their own hex with the ground at the
 * origin and a little over one hex of height above it.
 *
 * Built to be read at a glance while it walks: a silhouette that is cloak,
 * shoulders and helm, one bright note where the sun catches the steel, and
 * the house colour flown high enough to clear everything else on the tile.
 */
export function Commander({ house = 0 }: { house?: number }) {
  // Anything outside the four houses flies the player's own colour.
  const banner =
    house >= 0 && house < HOUSE_BANNER.length
      ? HOUSE_BANNER[house]
      : HOUSE_BANNER[0];

  return (
    <g>
      <ellipse
        className="fill-seed-map-abyss"
        fillOpacity={0.18}
        rx={0.34}
        ry={0.1}
      />
      <ellipse
        className="fill-seed-map-abyss"
        fillOpacity={0.32}
        rx={0.21}
        ry={0.062}
      />

      <path
        className="stroke-seed-bark-deep"
        d={POLE}
        fill="none"
        strokeLinecap="round"
        strokeWidth={0.05}
      />
      <path className={banner} d={PENNANT} />
      <path
        className="fill-seed-map-abyss"
        d={PENNANT_FOLD}
        fillOpacity={0.22}
      />
      <circle className={banner} cx={0.26} cy={-1.16} r={0.038} />

      <path className="fill-seed-panel-raised" d={CLOAK} />
      <path className="fill-seed-line-strong" d={CLOAK_LIGHT} />
      <path className={banner} d={SIGIL} fillOpacity={0.9} />
      <path className="fill-seed-line-bright" d={PAULDRONS} />

      <path className="fill-seed-line-bright" d={HELM} />
      <path className="fill-seed-sun" d={HELM_LIGHT} fillOpacity={0.92} />
      <path className="fill-seed-map-abyss" d={VISOR} fillOpacity={0.85} />
    </g>
  );
}
