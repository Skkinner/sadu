"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "@/components/sadu/brand";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LanguageSwitch, ThemeToggle } from "./toggles";

// Figma › Site Nav (State = Guest / Signed in), desktop ≥ 1024px
export function SiteNav() {
  const { t, href } = useI18n();
  const pathname = usePathname();
  const signedIn = useStore((s) => s.auth === "user");
  const name = useStore((s) => s.user?.firstName ?? "");
  const journeyStatus = useStore((s) => s.journey.status);
  const homeHref = signedIn ? href("/home") : href("/");

  const links = [
    { label: t.common.nav.home, href: homeHref },
    { label: t.common.nav.howItWorks, href: `${href("/")}#how` },
    { label: t.common.nav.faq, href: href("/faq") },
    { label: t.common.nav.contact, href: href("/contact") },
  ];

  return (
    <header className="sticky top-0 z-40 hidden h-20 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/85 lg:block">
      <div className="page-container flex h-full items-center">
        <Link href={homeHref} className="shrink-0 rounded-md">
          <Logo />
        </Link>
        <nav className="flex flex-1 justify-center" aria-label="Main">
          <ul className="flex items-center gap-7 xl:gap-9">
            {links.map((link) => {
              const active = !link.href.includes("#") && pathname === link.href;
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "t-body-strong text-ink hover:text-action",
                      active && "text-ink",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <ThemeToggle />
          <LanguageSwitch />
          {signedIn ? (
            <>
              <Button asChild>
                <Link href={journeyStatus === "none" ? href("/plan") : href("/journey")}>{t.common.myJourney}</Link>
              </Button>
              <Link
                href={href("/account")}
                aria-label={t.common.openMenu}
                className="grid size-11 place-items-center rounded-full bg-inverse t-body-strong text-on-inverse"
              >
                {name.trim().charAt(0).toUpperCase() || "·"}
              </Link>
            </>
          ) : (
            <Button asChild>
              <Link href={href("/start")}>
                {t.common.startJourney}
                <Icon name="arrow-right" size={20} />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
