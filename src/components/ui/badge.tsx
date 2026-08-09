import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors [&_svg:not([class*='size-'])]:size-3.5 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-seed-line-strong bg-seed-panel-raised text-seed-text",
        // Pre-mixed tint tokens, not `/10` alpha modifiers. See globals.css.
        gold: "border-seed-gold-edge bg-seed-gold-tint text-seed-gold",
        teal: "border-seed-teal-edge bg-seed-teal-tint text-seed-teal",
        violet: "border-seed-violet-edge bg-seed-violet-tint text-seed-violet",
        success: "border-seed-success-edge bg-seed-success-tint text-success",
        danger: "border-seed-danger-edge bg-seed-danger-tint text-destructive",
        outline: "border-border bg-transparent text-muted-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem]",
        default: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
