import { notFound } from "next/navigation";

/**
 * Catch all so unmatched paths resolve INSIDE the `[locale]` segment and are
 * handled by `[locale]/not-found.tsx`.
 *
 * Without it Next falls back to its built in 404, which renders `<html>` with
 * no `lang` and hardcoded English text.
 */
export default function CatchAllPage() {
  notFound();
}
