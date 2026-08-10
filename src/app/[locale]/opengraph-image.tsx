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

      <div style={{ display: "flex", marginBottom: 6 }}>
        <svg
          width="104"
          height="104"
          viewBox="0 0 32 32"
          role="img"
          aria-label="Seedreign"
        >
          <path
            d="M16 30.72C21.76 28.8 25.6 22.72 25.6 16.96C25.6 14.4 24.64 12.8 22.72 11.2L23.36 4.8 19.52 9.6 16 2.24 12.48 9.6 8.64 4.8 9.28 11.2C7.36 12.8 6.4 14.4 6.4 16.96C6.4 22.72 10.24 28.8 16 30.72Z"
            fill="#f6b73c"
          />
          <path
            d="M25.6 17C25.6 22.72 21.76 28.8 16 30.72C10.24 28.8 6.4 22.72 6.4 17Z"
            fill="#16243d"
          />
          <path
            d="M12.48 17C12.48 15.056 14.056 13.48 16 13.48C17.944 13.48 19.52 15.056 19.52 17Z"
            fill="#fff2d0"
          />
        </svg>
      </div>

      <div
        style={{
          marginTop: 10,
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
