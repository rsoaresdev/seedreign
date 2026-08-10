"use client";

import { useTranslations } from "next-intl";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/ui/reveal";

/**
 * The questions people actually ask before their first world. `key` indexes
 * the `Faq.items` messages, so a renamed question fails to compile instead of
 * rendering a missing translation.
 */
const QUESTIONS = [
  "free",
  "install",
  "fair",
  "mobile",
  "length",
  "account",
] as const;

/** Seconds between two rows arriving once the list is in view. */
const STAGGER = 0.05;

/**
 * The FAQ itself. `collapsible` with a single open panel: two open answers at
 * once turn the list into a wall of text, which is the thing it exists to
 * avoid.
 */
export function FaqList() {
  const t = useTranslations("Faq.items");

  return (
    <Accordion collapsible type="single">
      {QUESTIONS.map((question, index) => (
        <Reveal delay={index * STAGGER} key={question}>
          <AccordionItem value={question}>
            <AccordionTrigger>{t(`${question}.question`)}</AccordionTrigger>
            <AccordionContent>{t(`${question}.answer`)}</AccordionContent>
          </AccordionItem>
        </Reveal>
      ))}
    </Accordion>
  );
}
