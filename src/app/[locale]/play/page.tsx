import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlayApp } from "@/components/play/play-app";
import { resolveLocale } from "@/i18n/locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/play">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "Play.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function PlayPage({
  params,
}: PageProps<"/[locale]/play">) {
  await resolveLocale(params);

  return <PlayApp />;
}
