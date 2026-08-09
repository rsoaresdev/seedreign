import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale aware navigation. Always import `Link` and `redirect` from here rather
 * than from `next/link` and `next/navigation`, so the active locale prefix is
 * applied automatically.
 *
 * `usePathname` and `useRouter` are hooks, so they are Client Components only.
 */
export const {
  Link,
  redirect,
  permanentRedirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
