import type { ReactNode } from "react";

import { Footer } from "@/components/layout/footer";
import { LenisProvider } from "@/components/layout/lenis-provider";
import { Navbar } from "@/components/layout/navbar";

/**
 * Chrome for the marketing site only. The game at /play owns its whole
 * viewport, so the navbar, the footer and Lenis smooth scrolling live in this
 * group instead of the locale root.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <LenisProvider>
      <Navbar />
      {children}
      <Footer />
    </LenisProvider>
  );
}
