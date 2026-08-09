"use client";

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useState } from "react";

import { Brand } from "@/components/layout/brand";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import {
  LOGIN_PATH,
  PLAY_PATH,
  SECTION_LINKS,
} from "@/components/layout/nav-links";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * The panel slides in and the scrim fades. `MotionConfig reducedMotion="user"`
 * drops the slide for readers who asked for less motion and keeps the fade, so
 * the drawer never simply appears out of nowhere.
 */
const SCRIM = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

const PANEL = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
  transition: { type: "spring", stiffness: 340, damping: 36, mass: 0.9 },
} as const;

export function MobileNav() {
  const t = useTranslations("Nav");
  const tLinks = useTranslations("Nav.links");
  const tLocale = useTranslations("LocaleSwitcher");
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="size-10 md:hidden"
          aria-label={t("openMenu")}
        >
          <Menu />
        </Button>
      </Dialog.Trigger>

      {/* `forceMount` hands unmounting to AnimatePresence so the exit
          animation gets to finish. Radix still untraps focus and releases the
          scroll lock the moment `open` flips to false. */}
      <AnimatePresence>
        {open ? (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-seed-scrim backdrop-blur-sm md:hidden"
                {...SCRIM}
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              forceMount
              // The drawer is a list of links, so a description would only
              // repeat the title.
              aria-describedby={undefined}
            >
              <motion.div
                className="fixed inset-y-0 right-0 z-50 flex w-[min(20rem,86vw)] flex-col border-seed-line border-l bg-seed-glass-raised shadow-raised backdrop-blur-xl md:hidden"
                {...PANEL}
              >
                <VisuallyHidden.Root asChild>
                  <Dialog.Title>{t("menu")}</Dialog.Title>
                </VisuallyHidden.Root>

                <div className="flex h-20 shrink-0 items-center justify-between gap-4 border-seed-line border-b px-5">
                  <Brand onClick={close} />

                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      className="size-10"
                      aria-label={t("closeMenu")}
                    >
                      <X />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
                  <nav aria-label={t("label")}>
                    <ul className="flex flex-col gap-1">
                      {SECTION_LINKS.map((item) => (
                        <li key={item.key}>
                          <Link
                            href={{ pathname: "/", hash: item.hash }}
                            onClick={close}
                            className="block rounded-lg px-3 py-3 font-display font-semibold text-lg text-seed-text transition-colors hover:bg-seed-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {tLinks(item.key)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  <div className="flex flex-col gap-3 border-seed-line border-t pt-6">
                    <Button asChild variant="play" size="xl" className="w-full">
                      <Link href={PLAY_PATH} onClick={close}>
                        {t("play")}
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-11 w-full"
                    >
                      <Link href={LOGIN_PATH} onClick={close}>
                        {t("login")}
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-seed-line border-t px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <span className="font-medium text-[0.6875rem] text-seed-muted uppercase tracking-[0.18em]">
                    {tLocale("label")}
                  </span>
                  <LocaleSwitcher onSelect={close} />
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        ) : null}
      </AnimatePresence>
    </Dialog.Root>
  );
}
