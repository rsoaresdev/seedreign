import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The tinted square an icon sits in. Same tint tokens the badges use, so a
 * card's icon and its badge read as the same colour family.
 */
const iconTileVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg border [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      // Pre-mixed tint tokens, not `/10` alpha modifiers. See globals.css.
      tone: {
        gold: "border-seed-gold-edge bg-seed-gold-tint text-seed-gold",
        teal: "border-seed-teal-edge bg-seed-teal-tint text-seed-teal",
        violet: "border-seed-violet-edge bg-seed-violet-tint text-seed-violet",
        danger: "border-seed-danger-edge bg-seed-danger-tint text-destructive",
        neutral: "border-seed-line-strong bg-seed-panel-raised text-seed-text",
      },
      size: {
        sm: "size-9 [&_svg:not([class*='size-'])]:size-4",
        default: "size-11 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      tone: "gold",
      size: "default",
    },
  }
);

export type IconTone = NonNullable<
  VariantProps<typeof iconTileVariants>["tone"]
>;

function IconTile({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof iconTileVariants>) {
  return (
    <span
      data-slot="icon-tile"
      data-tone={tone}
      className={cn(iconTileVariants({ tone, size, className }))}
      {...props}
    />
  );
}

export { IconTile, iconTileVariants };
