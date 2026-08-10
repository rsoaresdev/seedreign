import { mapPaint } from "@/components/game/art/defs";
import type { StructureKind, World } from "@/components/game/world";

/** The scene whose `MapDefs` the firelight and the lore glow come out of. */
type SceneProps = { scene: string };

/**
 * Everything that stands on the ground is built from the same two tones, lit
 * from the top left like the rest of the map, so a row of them reads as one
 * settled world rather than as six unrelated icons.
 */
const STONE_DARK = "fill-seed-map-shore";
const STONE_LIGHT = "fill-seed-map-snow";
const TIMBER_DARK = "fill-seed-bark-deep";
const TIMBER_LIGHT = "fill-seed-bark";

/* Three towers stepping down to the right, the tallest one holding the keep. */
const CITY_DARK =
  "M -0.25 0.15 L -0.25 -0.26 L -0.06 -0.26 L -0.06 0.15 Z " +
  "M -0.05 0.15 L -0.05 -0.16 L 0.09 -0.16 L 0.09 0.15 Z " +
  "M 0.1 0.15 L 0.1 -0.07 L 0.25 -0.07 L 0.25 0.15 Z";

/* The lit face of each tower, and the merlons catching the same light. */
const CITY_LIGHT =
  "M -0.25 -0.26 L -0.185 -0.26 L -0.185 0.15 L -0.25 0.15 Z " +
  "M -0.05 -0.16 L -0.005 -0.16 L -0.005 0.15 L -0.05 0.15 Z " +
  "M 0.1 -0.07 L 0.155 -0.07 L 0.155 0.15 L 0.1 0.15 Z " +
  "M -0.25 -0.3 L -0.2 -0.3 L -0.2 -0.26 L -0.25 -0.26 Z " +
  "M -0.18 -0.3 L -0.13 -0.3 L -0.13 -0.26 L -0.18 -0.26 Z " +
  "M -0.11 -0.3 L -0.06 -0.3 L -0.06 -0.26 L -0.11 -0.26 Z " +
  "M -0.05 -0.2 L 0.005 -0.2 L 0.005 -0.16 L -0.05 -0.16 Z " +
  "M 0.035 -0.2 L 0.09 -0.2 L 0.09 -0.16 L 0.035 -0.16 Z " +
  "M 0.1 -0.11 L 0.16 -0.11 L 0.16 -0.07 L 0.1 -0.07 Z " +
  "M 0.19 -0.11 L 0.25 -0.11 L 0.25 -0.07 L 0.19 -0.07 Z";

/* Lit windows. The one detail that says somebody lives here. */
const CITY_LAMPS =
  "M -0.155 -0.16 L -0.115 -0.16 L -0.115 -0.1 L -0.155 -0.1 Z " +
  "M -0.155 -0.04 L -0.115 -0.04 L -0.115 0.02 L -0.155 0.02 Z " +
  "M 0.185 0 L 0.22 0 L 0.22 0.05 L 0.185 0.05 Z";

/* Deck, two piles, the mast, and a hull moored against the end of it. */
const PORT_TIMBER =
  "M -0.29 0 L 0.02 0 L 0.02 0.05 L -0.29 0.05 Z " +
  "M -0.25 0.05 L -0.22 0.05 L -0.22 0.17 L -0.25 0.17 Z " +
  "M -0.09 0.05 L -0.06 0.05 L -0.06 0.17 L -0.09 0.17 Z " +
  "M 0.115 -0.3 L 0.14 -0.3 L 0.14 0.01 L 0.115 0.01 Z " +
  "M 0 0.01 L 0.29 0.01 L 0.24 0.14 L 0.06 0.14 Z";

/* The top strake, where the sun lands on the hull. */
const PORT_STRAKE = "M 0 0.01 L 0.29 0.01 L 0.28 0.045 L 0.005 0.045 Z";

const PORT_SAIL =
  "M 0.15 -0.29 L 0.28 -0.02 L 0.15 -0.02 Z " +
  "M 0.105 -0.22 L 0.035 -0.02 L 0.105 -0.02 Z";

const FORGE_BLOCK = "M -0.17 0.15 L -0.13 0.01 L 0.13 0.01 L 0.17 0.15 Z";

const FORGE_LIGHT =
  "M -0.17 0.15 L -0.13 0.01 L -0.05 0.01 L -0.08 0.15 Z " +
  "M -0.2 -0.12 L 0.17 -0.12 L 0.17 -0.065 L 0.06 -0.065 " +
  "L 0.07 0.01 L -0.1 0.01 L -0.09 -0.065 L -0.2 -0.065 Z";

const FORGE_SHADE = "M 0.05 -0.12 L 0.17 -0.12 L 0.17 -0.065 L 0.05 -0.065 Z";

/* An eight point spark, struck off the anvil. */
const FORGE_SPARK =
  "M 0.11 -0.27 L 0.038 -0.252 L 0.02 -0.18 L 0.002 -0.252 " +
  "L -0.07 -0.27 L 0.002 -0.288 L 0.02 -0.36 L 0.038 -0.288 Z";

/* Two steps and a tapering shaft. */
const WONDER_DARK =
  "M -0.25 0.15 L -0.21 0.08 L 0.21 0.08 L 0.25 0.15 Z " +
  "M -0.16 0.08 L -0.13 0.02 L 0.13 0.02 L 0.16 0.08 Z " +
  "M -0.075 0.02 L -0.045 -0.3 L 0.045 -0.3 L 0.075 0.02 Z";

const WONDER_LIGHT =
  "M -0.25 0.15 L -0.21 0.08 L -0.09 0.08 L -0.12 0.15 Z " +
  "M -0.16 0.08 L -0.13 0.02 L -0.04 0.02 L -0.06 0.08 Z " +
  "M -0.075 0.02 L -0.045 -0.3 L 0 -0.3 L 0 0.02 Z";

const WONDER_TIP = "M 0 -0.42 L 0.05 -0.35 L 0 -0.28 L -0.05 -0.35 Z";

const CAMP_DARK =
  "M -0.3 0.08 L -0.14 -0.24 L 0.02 0.08 Z " +
  "M 0.04 0.08 L 0.16 -0.11 L 0.28 0.08 Z";

const CAMP_LIGHT =
  "M -0.14 -0.24 L -0.3 0.08 L -0.125 0.08 Z " +
  "M 0.16 -0.11 L 0.04 0.08 L 0.17 0.08 Z";

/* The way in. Without it a tent is the same triangle as a summit. */
const CAMP_DOOR = "M -0.2 0.08 L -0.14 -0.07 L -0.08 0.08 Z";

const CHEST_DARK = "M -0.22 -0.02 L 0.22 -0.02 L 0.22 0.14 L -0.22 0.14 Z";

/* A low lid, and the two bands holding the box shut. */
const CHEST_LIGHT =
  "M -0.22 -0.02 Q -0.22 -0.16 0 -0.16 Q 0.22 -0.16 0.22 -0.02 Z " +
  "M -0.16 -0.02 L -0.11 -0.02 L -0.11 0.14 L -0.16 0.14 Z " +
  "M 0.11 -0.02 L 0.16 -0.02 L 0.16 0.14 L 0.11 0.14 Z";

const CHEST_SEAM =
  "M -0.23 -0.04 L 0.23 -0.04 L 0.23 0.015 L -0.23 0.015 Z " +
  "M -0.045 -0.07 L 0.045 -0.07 L 0.045 0.06 L -0.045 0.06 Z";

/**
 * The ground a structure stands on. Two flat rings rather than a blur: a
 * filter here would run once per structure on every frame the map moves.
 */
function Footing({ at, span }: { at: number; span: number }) {
  return (
    <>
      <ellipse
        className="fill-seed-map-abyss"
        cy={at}
        fillOpacity={0.18}
        rx={span}
        ry={span * 0.3}
      />
      <ellipse
        className="fill-seed-map-abyss"
        cy={at}
        fillOpacity={0.32}
        rx={span * 0.62}
        ry={span * 0.19}
      />
    </>
  );
}

function City() {
  return (
    <>
      <Footing at={0.15} span={0.3} />
      <path className={STONE_DARK} d={CITY_DARK} />
      <path className={STONE_LIGHT} d={CITY_LIGHT} />
      <path className="fill-seed-gold" d={CITY_LAMPS} fillOpacity={0.85} />
    </>
  );
}

function Port() {
  return (
    <>
      <Footing at={0.16} span={0.3} />
      <path className={TIMBER_DARK} d={PORT_TIMBER} />
      <path className={TIMBER_LIGHT} d={PORT_STRAKE} />
      <path className={STONE_LIGHT} d={PORT_SAIL} />
    </>
  );
}

function Forge({ scene }: SceneProps) {
  return (
    <>
      <Footing at={0.15} span={0.24} />
      <path className={STONE_DARK} d={FORGE_BLOCK} />
      <path className={STONE_LIGHT} d={FORGE_LIGHT} />
      <path className={STONE_DARK} d={FORGE_SHADE} />
      <circle cy={-0.27} fill={mapPaint(scene, "ember")} r={0.16} />
      <path className="fill-seed-sun" d={FORGE_SPARK} />
    </>
  );
}

function Wonder({ scene }: SceneProps) {
  return (
    <>
      <Footing at={0.15} span={0.3} />
      <path className={STONE_DARK} d={WONDER_DARK} />
      <path className={STONE_LIGHT} d={WONDER_LIGHT} />
      <circle cy={-0.35} fill={mapPaint(scene, "halo")} r={0.22} />
      <path className="fill-seed-violet" d={WONDER_TIP} />
    </>
  );
}

function Camp({ scene }: SceneProps) {
  return (
    <>
      <Footing at={0.1} span={0.3} />
      <path className={STONE_DARK} d={CAMP_DARK} />
      <path className={STONE_LIGHT} d={CAMP_LIGHT} />
      <path className="fill-seed-map-abyss" d={CAMP_DOOR} fillOpacity={0.6} />
      <circle cy={0.14} fill={mapPaint(scene, "ember")} r={0.14} />
      <circle className="fill-destructive" cy={0.14} r={0.045} />
      <circle className="fill-seed-sun" cy={0.13} r={0.018} />
    </>
  );
}

function Chest() {
  return (
    <>
      <Footing at={0.14} span={0.24} />
      <path className={STONE_DARK} d={CHEST_DARK} />
      <path className={STONE_LIGHT} d={CHEST_LIGHT} />
      <path className="fill-seed-gold" d={CHEST_SEAM} />
    </>
  );
}

/** Path data is written in hex units and scaled later, so keep it short. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * One thing standing on the ground, drawn around its own origin and roughly
 * half a hex tall.
 *
 * Everything here has to survive at about twelve pixels, which is what rules
 * out outlines, gradients inside the form and any detail thinner than a
 * merlon. Two tones and a silhouette carry it.
 */
export function StructureGlyph({
  kind,
  scene,
}: SceneProps & { kind: StructureKind }) {
  switch (kind) {
    case "city":
      return <City />;
    case "port":
      return <Port />;
    case "forge":
      return <Forge scene={scene} />;
    case "wonder":
      return <Wonder scene={scene} />;
    case "camp":
      return <Camp scene={scene} />;
    case "chest":
      return <Chest />;
  }
}

/** Every structure on the map, moved onto the tile it was placed on. */
export function StructureLayer({
  world,
  scene,
}: SceneProps & { world: World }) {
  return (
    <g>
      {world.tiles.map((tile) => {
        const kind = tile.structure;

        if (kind === null) return null;

        return (
          <g
            key={tile.key}
            transform={`translate(${round(tile.x)} ${round(tile.y)})`}
          >
            <StructureGlyph kind={kind} scene={scene} />
          </g>
        );
      })}
    </g>
  );
}
