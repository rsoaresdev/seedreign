/** The paint servers a map scene sets up for its own layers to draw with. */
export type MapPaint = "grain" | "sun-fall" | "deep" | "halo" | "ember";

function paintId(scene: string, paint: MapPaint): string {
  return `sr-${scene}-${paint}`;
}

/**
 * What a layer writes into a `fill` to reach one of them.
 *
 * Every caller has to hand over the same scene name it gave `MapDefs`, because
 * a fill url is resolved against the whole document: several maps on one page
 * sharing an id is invalid, and the first one rendered would quietly paint for
 * all of them the moment one of these definitions was tuned for a single
 * scene.
 */
export function mapPaint(scene: string, paint: MapPaint): string {
  return `url(#${paintId(scene, paint)})`;
}

/**
 * Paint the map layers share, kept in one place because none of it belongs to
 * a single tile.
 *
 * The grain and the light wash are what stop a few hundred flat polygons from
 * reading as a spreadsheet, the falloff sinks the map into the page at its
 * edges, and the two glows are for the few things standing on the ground that
 * give off light of their own.
 */
export function MapDefs({ scene }: { scene: string }) {
  return (
    <defs>
      {/*
        Authored in hex units and deliberately out of step with the grid, so
        the texture never settles into a rhythm the eye can follow back to the
        tiles underneath it.
      */}
      <pattern
        height={1.79}
        id={paintId(scene, "grain")}
        patternUnits="userSpaceOnUse"
        width={2.37}
      >
        <circle
          className="fill-seed-map-snow"
          cx={0.42}
          cy={0.51}
          fillOpacity={0.035}
          r={0.08}
        />
        <circle
          className="fill-seed-map-snow"
          cx={1.63}
          cy={0.24}
          fillOpacity={0.028}
          r={0.055}
        />
        <circle
          className="fill-seed-map-snow"
          cx={1.02}
          cy={1.36}
          fillOpacity={0.03}
          r={0.09}
        />
        <circle
          className="fill-seed-map-snow"
          cx={2.11}
          cy={1.12}
          fillOpacity={0.024}
          r={0.065}
        />
        <circle
          className="fill-seed-map-abyss"
          cx={1.29}
          cy={0.86}
          fillOpacity={0.05}
          r={0.11}
        />
        <circle
          className="fill-seed-map-abyss"
          cx={0.18}
          cy={1.64}
          fillOpacity={0.04}
          r={0.08}
        />
      </pattern>

      {/* One sun, top left, the same one every raised form is lit by. */}
      <linearGradient
        id={paintId(scene, "sun-fall")}
        x1="0"
        x2="0.82"
        y1="0"
        y2="1"
      >
        <stop
          className="[stop-color:var(--seed-sun)]"
          offset="0"
          stopOpacity="0.055"
        />
        <stop
          className="[stop-color:var(--seed-sun)]"
          offset="0.5"
          stopOpacity="0.014"
        />
        <stop
          className="[stop-color:var(--seed-sun)]"
          offset="1"
          stopOpacity="0"
        />
      </linearGradient>

      {/* The world falling away into open water at its own edges. */}
      <radialGradient cx="0.5" cy="0.5" id={paintId(scene, "deep")} r="0.74">
        <stop
          className="[stop-color:var(--seed-map-abyss)]"
          offset="0.45"
          stopOpacity="0"
        />
        <stop
          className="[stop-color:var(--seed-map-abyss)]"
          offset="0.82"
          stopOpacity="0.24"
        />
        <stop
          className="[stop-color:var(--seed-map-abyss)]"
          offset="1"
          stopOpacity="0.58"
        />
      </radialGradient>

      {/* Lore light: what a wonder gives off at its tip. */}
      <radialGradient id={paintId(scene, "halo")}>
        <stop
          className="[stop-color:var(--seed-violet)]"
          offset="0"
          stopOpacity="0.72"
        />
        <stop
          className="[stop-color:var(--seed-violet)]"
          offset="0.4"
          stopOpacity="0.26"
        />
        <stop
          className="[stop-color:var(--seed-violet)]"
          offset="1"
          stopOpacity="0"
        />
      </radialGradient>

      {/* Firelight: the forge spark and a camp after dark. */}
      <radialGradient id={paintId(scene, "ember")}>
        <stop
          className="[stop-color:var(--seed-sun)]"
          offset="0"
          stopOpacity="0.8"
        />
        <stop
          className="[stop-color:var(--seed-gold)]"
          offset="0.45"
          stopOpacity="0.34"
        />
        <stop
          className="[stop-color:var(--seed-gold)]"
          offset="1"
          stopOpacity="0"
        />
      </radialGradient>
    </defs>
  );
}
