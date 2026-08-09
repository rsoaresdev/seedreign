import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import { resolveLocale } from "@/i18n/locale";
import { routing } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Seedreign";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Satori ships a single weight, so the display face is loaded from disk. The
 * file is committed to the repo so the build never depends on the network.
 */
async function displayFont() {
  return readFile(join(process.cwd(), "src/assets/fonts/sora-extrabold.ttf"));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const [pitch, brand, sora] = await Promise.all([
    getTranslations({ locale, namespace: "WhatIsIt" }),
    getTranslations({ locale, namespace: "Brand" }),
    displayFont(),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background:
          "radial-gradient(1100px 700px at 6% -14%, #2e2716 0%, #0a0e16 56%), radial-gradient(900px 620px at 96% 2%, #0f3532 0%, #0a0e16 58%)",
        color: "#e7eef7",
        fontFamily: "Sora",
      }}
    >
      {/* Brand grid, drawn as two repeating gradients. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(231,238,247,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(231,238,247,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <div
        style={{
          marginTop: 26,
          fontSize: 168,
          letterSpacing: -6,
          lineHeight: 1,
        }}
      >
        {brand("name")}
      </div>

      <div
        style={{
          marginTop: 34,
          maxWidth: 900,
          fontSize: 37,
          lineHeight: 1.35,
          color: "#9db0c7",
        }}
      >
        {pitch("description")}
      </div>

      {/* Gold underline, echoing the play button glow. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: "100%",
          height: 10,
          background:
            "linear-gradient(90deg, #f6b73c 0%, #43c7bd 60%, #b48cf0 100%)",
        }}
      />
    </div>,
    {
      ...size,
      fonts: [{ name: "Sora", data: sora, weight: 800, style: "normal" }],
    }
  );
}
