/**
 * Currency glyphs. Shards are splinters of collapsed worlds, Gems are cut
 * stones; both are drawn inline so they inherit the chip's colour.
 */

export function ShardIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 16 16">
      <path
        d="M 8 1 L 12.5 6 L 10 15 L 6 15 L 3.5 6 Z"
        fill="currentColor"
        opacity={0.9}
      />
      <path d="M 8 1 L 12.5 6 L 8 8.5 Z" fill="currentColor" opacity={0.5} />
    </svg>
  );
}

export function GemIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 16 16">
      <path
        d="M 4 2 L 12 2 L 15 6 L 8 14.5 L 1 6 Z"
        fill="currentColor"
        opacity={0.9}
      />
      <path
        d="M 4 2 L 8 6 L 12 2 Z M 1 6 L 8 6 L 8 14.5 Z"
        fill="currentColor"
        opacity={0.45}
      />
    </svg>
  );
}
