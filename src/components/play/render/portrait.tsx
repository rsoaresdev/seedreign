/**
 * Commander portraits: one bust per Seeded, drawn as layered silhouettes so a
 * skin can recolour trim and glow without new artwork. Authored in a 100 by
 * 100 box and legible down to about 40 pixels, which is what the HUD chip
 * needs.
 */

import type { Skin } from "../meta/commanders";
import type { CommanderId } from "../sim/types";

/** Body and hood, shared: the Seeded are one order under different banners. */
function Bust({ accent }: { accent: string }) {
  return (
    <>
      <path
        className="fill-seed-panel-raised"
        d="M 18 96 Q 20 66 38 58 L 62 58 Q 80 66 82 96 Z"
      />
      <path
        d="M 18 96 Q 20 66 38 58 L 44 62 L 56 62 L 62 58 Q 80 66 82 96 Z"
        fill={accent}
        opacity={0.16}
      />
      <path
        className="fill-seed-bg"
        d="M 34 60 Q 34 30 50 28 Q 66 30 66 60 Q 58 66 50 66 Q 42 66 34 60 Z"
      />
    </>
  );
}

function WardenHelm({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path
        className="fill-seed-panel"
        d="M 32 58 Q 30 28 50 24 Q 70 28 68 58 L 62 54 Q 62 36 50 34 Q 38 36 38 54 Z"
      />
      <path d="M 47 8 L 53 8 L 55 26 L 45 26 Z" fill={accent} />
      <path d="M 50 30 L 54 40 L 50 62 L 46 40 Z" fill={accent} opacity={0.9} />
      <path
        d="M 38 44 L 44 46 L 44 52 L 38 50 Z M 62 44 L 56 46 L 56 52 L 62 50 Z"
        fill={glow}
        opacity={0.8}
      />
      <circle cx={50} cy={20} fill={glow} opacity={0.5} r={3} />
    </>
  );
}

function ReaverHelm({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path
        className="fill-seed-panel"
        d="M 33 58 Q 30 30 50 26 Q 70 30 67 58 L 60 52 Q 61 38 50 36 Q 39 38 40 52 Z"
      />
      <path
        d="M 33 40 Q 22 30 24 14 Q 34 22 38 34 Z M 67 40 Q 78 30 76 14 Q 66 22 62 34 Z"
        fill={accent}
      />
      <path d="M 42 46 L 48 44 L 48 52 L 42 52 Z" fill={glow} opacity={0.85} />
      <path d="M 58 46 L 52 44 L 52 52 L 58 52 Z" fill={glow} opacity={0.85} />
      <path d="M 44 58 L 50 64 L 56 58 L 50 60 Z" fill={accent} opacity={0.7} />
    </>
  );
}

function TideHelm({ accent, glow }: { accent: string; glow: string }) {
  return (
    <>
      <path
        className="fill-seed-panel"
        d="M 33 58 Q 31 30 50 25 Q 69 30 67 58 L 61 53 Q 62 37 50 35 Q 38 37 39 53 Z"
      />
      <path
        d="M 50 6 Q 62 14 58 28 Q 54 22 50 22 Q 46 22 42 28 Q 38 14 50 6 Z"
        fill={accent}
      />
      <path
        d="M 34 50 Q 28 46 28 38 Q 34 40 36 46 Z M 66 50 Q 72 46 72 38 Q 66 40 64 46 Z"
        fill={accent}
        opacity={0.85}
      />
      <path
        d="M 41 46 Q 46 42 48 48 Q 45 50 41 50 Z M 59 46 Q 54 42 52 48 Q 55 50 59 50 Z"
        fill={glow}
        opacity={0.85}
      />
    </>
  );
}

export function CommanderPortrait({
  commander,
  skin,
  className,
}: {
  commander: CommanderId;
  skin: Skin;
  className?: string;
}) {
  const accent = `var(--${skin.accent})`;
  const glow = `var(--${skin.glow})`;

  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 100 100">
      <defs>
        <radialGradient cy="35%" id={`sr-halo-${skin.id}`} r="70%">
          <stop offset="0%" stopColor={glow} stopOpacity={0.45} />
          <stop offset="60%" stopColor={accent} stopOpacity={0.12} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect fill={`url(#sr-halo-${skin.id})`} height={100} width={100} />
      <Bust accent={accent} />
      {commander === "warden" ? (
        <WardenHelm accent={accent} glow={glow} />
      ) : commander === "reaver" ? (
        <ReaverHelm accent={accent} glow={glow} />
      ) : (
        <TideHelm accent={accent} glow={glow} />
      )}
    </svg>
  );
}
