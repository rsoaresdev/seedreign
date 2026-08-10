import { Flag, Layers, Share2, Sunset, Waves } from "lucide-react";

import type { StepPattern } from "@/components/sections/how-to-play/step-board";
import type { IconTone } from "@/components/ui/icon-tile";

/**
 * One day, from the draft to the share. `key` indexes the `HowToPlay.steps`
 * messages, so a renamed step fails to compile instead of rendering a missing
 * translation.
 */
export const STEPS = [
  { key: "draft", icon: Layers, pattern: "draft", tone: "teal" },
  { key: "expand", icon: Flag, pattern: "expand", tone: "gold" },
  { key: "pulse", icon: Waves, pattern: "pulse", tone: "violet" },
  { key: "collapse", icon: Sunset, pattern: "collapse", tone: "danger" },
  { key: "share", icon: Share2, pattern: "share", tone: "gold" },
] as const satisfies readonly {
  key: string;
  icon: typeof Flag;
  pattern: StepPattern;
  tone: IconTone;
}[];
