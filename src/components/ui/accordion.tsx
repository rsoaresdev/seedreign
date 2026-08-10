"use client";

import { ChevronDown } from "lucide-react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Accordion({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      // Nothing clips here on purpose. The trigger fills this box exactly and
      // its focus ring is painted outside itself, so a hidden overflow would
      // swallow the ring whole and leave the question with no focus state.
      className={cn(
        "rounded-xl border border-border bg-card shadow-panel transition-[border-color,box-shadow] duration-300 hover:border-seed-line-strong data-[state=open]:border-seed-line-strong data-[state=open]:shadow-raised",
        className
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between gap-4 rounded-xl p-5 text-left font-display font-semibold text-base outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring data-[state=open]:text-seed-gold sm:p-6",
          className
        )}
        {...props}
      >
        {children}

        {/* Keyed off the trigger it sits inside, which is what carries the
            open state, so the chevron needs no state of its own. */}
        <ChevronDown
          aria-hidden="true"
          className="size-5 shrink-0 text-seed-muted transition-[transform,color] duration-300 [[data-state=open]>&]:rotate-180 [[data-state=open]>&]:text-seed-gold"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      // Height is animated on the wrapper, padding on the inner block, so the
      // text never gets squashed on the way open.
      className="overflow-hidden motion-safe:data-[state=closed]:animate-accordion-up motion-safe:data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div
        className={cn(
          "text-pretty px-5 pb-5 text-muted-foreground text-sm sm:px-6 sm:pb-6",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
