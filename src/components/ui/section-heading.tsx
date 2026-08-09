import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The title ramp. Each variant emits a COMPLETE responsive ramp on purpose:
 * a caller supplied override would only merge per breakpoint, so a partial
 * override such as `text-6xl sm:text-7xl` would leave a stale `lg:` step
 * behind and the heading would shrink on large screens.
 */
const titleVariants = cva("font-bold font-display tracking-tight", {
  variants: {
    size: {
      hero: "text-5xl sm:text-6xl lg:text-7xl",
      page: "text-4xl sm:text-5xl",
      section: "text-3xl sm:text-4xl",
      sub: "text-xl sm:text-2xl",
    },
  },
  defaultVariants: {
    size: "section",
  },
});

/** Visual size follows the heading level unless `size` says otherwise. */
const SIZE_FOR_LEVEL = {
  h1: "page",
  h2: "section",
  h3: "sub",
} as const;

type SectionHeadingProps = Omit<React.ComponentProps<"div">, "title"> &
  VariantProps<typeof titleVariants> & {
    /**
     * Short uppercase kicker above the title. It carries its own colour and
     * letter spacing, so for a pill render a `Badge` above the heading instead.
     */
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    align?: "start" | "center";
    /** Heading level, semantics only. Use `h1` once per page. */
    as?: "h1" | "h2" | "h3";
    /** Put an id on the heading itself, for anchors and `aria-labelledby`. */
    titleId?: string;
  };

/** Eyebrow, title and description: the standard way sections are introduced. */
function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  as: Heading = "h2",
  size,
  titleId,
  className,
  ...props
}: SectionHeadingProps) {
  return (
    <div
      data-slot="section-heading"
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow ? (
        <div className="font-medium text-seed-teal text-xs uppercase tracking-[0.22em]">
          {eyebrow}
        </div>
      ) : null}

      <Heading
        id={titleId}
        className={titleVariants({ size: size ?? SIZE_FOR_LEVEL[Heading] })}
      >
        {title}
      </Heading>

      {description ? (
        <p
          className={cn(
            "max-w-prose text-pretty text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export { SectionHeading, titleVariants };
