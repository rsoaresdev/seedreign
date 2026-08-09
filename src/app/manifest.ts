import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Seedreign",
    short_name: "Seedreign",
    description:
      "A new world is sown every dawn. Conquer it before it collapses at nightfall.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: site.themeColor,
    theme_color: site.themeColor,
    categories: ["games", "strategy"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
