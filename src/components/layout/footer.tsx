import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import {
  LOGIN_PATH,
  PLAY_PATH,
  SECTION_LINKS,
} from "@/components/layout/nav-links";
import {
  DiscordIcon,
  XIcon,
  YoutubeIcon,
} from "@/components/layout/social-icons";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const LINK_CLASS =
  "-mx-2 inline-block rounded-md px-2 py-1 text-seed-muted text-sm transition-colors hover:text-seed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium font-sans text-[0.6875rem] text-seed-muted uppercase tracking-[0.22em]">
        {title}
      </h2>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  );
}

export async function Footer() {
  const t = await getTranslations("Footer");
  const tLinks = await getTranslations("Nav.links");
  const tLocale = await getTranslations("LocaleSwitcher");

  // Passed as a string: through ICU a bare number would be formatted with a
  // thousands separator and the year would render as "2,026".
  const year = String(new Date().getUTCFullYear());

  const socials = [
    { key: "discord", href: site.social.discord, Icon: DiscordIcon },
    { key: "x", href: site.social.x, Icon: XIcon },
    { key: "youtube", href: site.social.youtube, Icon: YoutubeIcon },
  ] as const;

  return (
    <footer className="mt-auto border-seed-line border-t bg-seed-panel/40">
      <Container size="lg">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col items-start gap-5 lg:col-span-2">
            <Brand wordmarkClassName="text-lg sm:text-xl" />

            <p className="max-w-xs text-pretty text-seed-muted text-sm">
              {t("tagline")}
            </p>

            <Button asChild variant="secondary" size="lg" className="h-10 px-4">
              <a
                href={site.social.discord}
                target="_blank"
                rel="noreferrer noopener"
              >
                <DiscordIcon />
                {t("discord")}
              </a>
            </Button>

            <ul aria-label={t("social.label")} className="flex items-center">
              {socials.map(({ key, href, Icon }) => (
                <li key={key}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={t(`social.${key}`)}
                    className="inline-flex size-10 items-center justify-center rounded-lg text-seed-muted transition-colors hover:bg-seed-panel-raised hover:text-seed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-4.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn title={t("columns.game")}>
            {SECTION_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={{ pathname: "/", hash: item.hash }}
                  className={LINK_CLASS}
                >
                  {tLinks(item.key)}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn title={t("columns.play")}>
            <li>
              <Link href={PLAY_PATH} className={LINK_CLASS}>
                {t("play")}
              </Link>
            </li>
            <li>
              <Link href={LOGIN_PATH} className={LINK_CLASS}>
                {t("login")}
              </Link>
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-col-reverse items-center gap-6 border-seed-line border-t py-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-x-6 gap-y-2 sm:flex-row">
            <p className="text-seed-muted text-xs">
              {t("legal.copyright", { year })}
            </p>

            <ul className="flex items-center gap-4">
              <li>
                <Link href="/privacy" className={cn(LINK_CLASS, "text-xs")}>
                  {t("legal.privacy")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={cn(LINK_CLASS, "text-xs")}>
                  {t("legal.terms")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium text-[0.6875rem] text-seed-muted uppercase tracking-[0.18em]">
              {tLocale("label")}
            </span>
            <LocaleSwitcher size="sm" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
