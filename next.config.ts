import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

/**
 * Called with no argument on purpose: `./src/i18n/request.ts` is auto-detected.
 * If you ever pass an explicit path it must be RELATIVE — Turbopack (the
 * default bundler in Next 16) rejects absolute paths here.
 */
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
