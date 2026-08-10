import { cva } from "class-variance-authority";
import { useTranslations } from "next-intl";

import { CardArt } from "@/components/game/cards/card-art";
import type { Order } from "@/components/game/cards/orders";
import { cn } from "@/lib/utils";

/**
 * The card body. Everything inside is phrasing content, because the same
 * markup has to be legal inside a `<button>` when the card can be drafted.
 */
const frameVariants = cva(
  "group/order relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-seed-line bg-card text-left shadow-panel",
  {
    variants: {
      interactive: {
        true: "cursor-pointer outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-seed-line-strong hover:shadow-raised focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring motion-safe:[@media(hover:hover)]:hover:-translate-y-0.5",
        false: "",
      },
      selected: {
        true: "border-seed-gold shadow-glow-gold hover:border-seed-gold",
        false: "",
      },
    },
    defaultVariants: {
      interactive: false,
      selected: false,
    },
  }
);

/**
 * The rarity edge: a hairline just inside the frame. It sits low so it reads as
 * a material, not as a status light, and comes up to full under the pointer.
 */
const edgeVariants = cva(
  "pointer-events-none absolute inset-0 rounded-[inherit] border transition-opacity duration-200 group-hover/order:opacity-100",
  {
    variants: {
      rarity: {
        common: "border-seed-line-strong opacity-70",
        uncommon: "border-seed-teal opacity-50",
        rare: "border-seed-violet opacity-55",
      },
    },
    defaultVariants: {
      rarity: "common",
    },
  }
);

/**
 * One order card: art window, cost, name, and the single line that says what
 * taking it costs you elsewhere.
 *
 * With `onSelect` it is a real toggle button and reports whether it is in the
 * hand. Without one it is a plain figure, because a card on display should not
 * land in the tab order pretending it can be picked.
 */
export function OrderCard({
  order,
  selected = false,
  onSelect,
  className,
}: {
  order: Order;
  /** Already drafted into the hand. */
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}) {
  const t = useTranslations("Game.cards");

  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(edgeVariants({ rarity: order.rarity }))}
      />

      <span className="relative block aspect-5/3 w-full overflow-hidden bg-seed-map-abyss">
        <CardArt art={order.art} />

        {/* The scene is a window in the frame, not a picture stuck on it, so
            it loses its own edges into the panel colour on every side. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_88%_at_50%_16%,transparent_38%,var(--seed-panel)_100%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-b from-transparent to-seed-panel"
        />

        <span
          aria-hidden="true"
          className="absolute top-2 left-2 flex size-6 items-center justify-center rounded-full bg-seed-gold font-bold font-display text-[0.6875rem] text-seed-bg tabular-nums"
        >
          {order.cost}
        </span>
      </span>

      <span className="relative flex flex-1 flex-col gap-1 px-3 pt-2.5 pb-3">
        <span className="font-display font-semibold text-sm leading-tight">
          {t(`${order.key}.name`)}
        </span>

        {/* Cost and rarity are shape and colour on screen, so they are spelled
            out here for anyone who gets the card read to them. */}
        <span className="sr-only">
          {t("meta", {
            rarity: t(`rarity.${order.rarity}`),
            cost: order.cost,
          })}
        </span>

        <span className="text-pretty text-seed-muted text-xs leading-snug">
          {t(`${order.key}.effect`)}
        </span>
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button
        aria-pressed={selected}
        className={cn(
          frameVariants({ interactive: true, selected }),
          className
        )}
        onClick={onSelect}
        type="button"
      >
        {body}
      </button>
    );
  }

  return (
    <figure className={cn(frameVariants({ selected }), className)}>
      {body}
    </figure>
  );
}
