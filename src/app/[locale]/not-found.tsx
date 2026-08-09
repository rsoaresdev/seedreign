import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 scroll-mt-24 items-center justify-center px-5 py-20 outline-none"
    >
      <Container size="sm" className="flex flex-col items-center gap-8">
        <div
          aria-hidden="true"
          className="font-black font-display text-7xl text-seed-line-strong leading-none tracking-tighter sm:text-8xl"
        >
          {t("code")}
        </div>

        <SectionHeading
          as="h1"
          size="page"
          align="center"
          title={t("title")}
          description={t("description")}
        />

        <Button asChild variant="play" size="xl">
          <Link href="/">{t("cta")}</Link>
        </Button>
      </Container>
    </main>
  );
}
