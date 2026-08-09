import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-full px-5 sm:px-6 lg:px-8", {
  variants: {
    size: {
      sm: "max-w-2xl",
      default: "max-w-5xl",
      lg: "max-w-7xl",
      full: "max-w-none",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

/** Horizontal page gutter + max width. The only place page width is decided. */
function Container({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof containerVariants>) {
  return (
    <div
      data-slot="container"
      className={cn(containerVariants({ size, className }))}
      {...props}
    />
  );
}

export { Container, containerVariants };
