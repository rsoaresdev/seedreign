import { hexPath } from "@/components/game/hex";
import {
  HOUSES,
  type Owners,
  territoryPaths,
  type World,
} from "@/components/game/world";

/** Matches the terrain layer: neighbours of one house must not show a seam. */
const SEAM = 1.004;

/** Index 0 is the player. */
const HOUSE_FILL = [
  "fill-seed-gold",
  "fill-seed-teal",
  "fill-seed-violet",
  "fill-destructive",
] as const;

const HOUSE_STROKE = [
  "stroke-seed-gold",
  "stroke-seed-teal",
  "stroke-seed-violet",
  "stroke-destructive",
] as const;

/** The ground has to stay readable under the colour holding it. */
const TINT = 0.22;

const BORDER_WIDTH = 0.09;
const FRONT_WIDTH = 0.16;
const FRONT_BLOOM = 0.34;

/**
 * Both houses on a front draw the same edge, so every one of these lands
 * twice. Halved here, which is what puts the finished line at the weight it
 * is meant to carry.
 */
const FRONT = 0.3;
const BLOOM = 0.1;

type Claim = {
  house: number;
  tint: string;
  border: string;
  front: string;
};

function readClaims(world: World, owners: Owners): Claim[] {
  const tints: string[][] = HOUSES.map(() => []);

  for (const tile of world.tiles) {
    const house = owners.get(tile.key);

    if (house === undefined || house < 0 || house >= HOUSES.length) continue;

    tints[house].push(hexPath(tile.x, tile.y, SEAM));
  }

  return tints
    .map((tint, house) => {
      const { border, front } = territoryPaths(world, owners, house);

      return { house, tint: tint.join(" "), border, front };
    })
    .filter((claim) => claim.tint !== "");
}

/**
 * Who holds what: a wash of house colour over the ground, an outline around
 * everything they hold, and a hot line wherever two houses actually touch.
 *
 * The wash is thin on purpose. Terrain has to stay legible underneath it,
 * because the reason a border sits where it sits is usually a river or a
 * ridge, and hiding that turns a strategy map into a colouring book.
 */
export function TerritoryLayer({
  world,
  owners,
}: {
  world: World;
  owners: Owners;
}) {
  const claims = readClaims(world, owners);

  return (
    <g>
      {claims.map((claim) => (
        <path
          className={HOUSE_FILL[claim.house]}
          d={claim.tint}
          fillOpacity={TINT}
          key={claim.house}
        />
      ))}

      {claims.map((claim) =>
        claim.border === "" ? null : (
          <path
            className={HOUSE_STROKE[claim.house]}
            d={claim.border}
            fill="none"
            key={claim.house}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={BORDER_WIDTH}
          />
        )
      )}

      {claims.map((claim) =>
        claim.front === "" ? null : (
          <path
            className="stroke-seed-sun"
            d={claim.front}
            fill="none"
            key={claim.house}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={BLOOM}
            strokeWidth={FRONT_BLOOM}
          />
        )
      )}

      {claims.map((claim) =>
        claim.front === "" ? null : (
          <path
            className="stroke-seed-sun"
            d={claim.front}
            fill="none"
            key={claim.house}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={FRONT}
            strokeWidth={FRONT_WIDTH}
          />
        )
      )}
    </g>
  );
}
