"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "@/components/sadu/brand";
import { Icon, type IconName } from "@/components/ui/icon";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";
import { LanguageSwitch, ThemeToggle } from "./toggles";

export type Tab = "home" | "journey" | "map" | "account";

type MobileHeader =
  | { type: "logo" }
  | { type: "back" | "close"; title?: ReactNode; backHref?: string; onBack?: () => void }
  | { type: "plain" } // theme + language only (M01)
  | { type: "none" };

/**
 * Responsive page chrome.
 * ≥1024px: Site Nav + Site Footer (desktop frames D01–D58).
 * <1024px: App Bar, optional bottom Tab Bar and a sticky Bottom bar for the main action (mobile frames M01–M58).
 */
export function PageShell({
  children,
  header = { type: "logo" },
  tab,
  actionBar,
  className,
  bleed = false,
}: {
  children: ReactNode;
  header?: MobileHeader;
  tab?: Tab;
  /** mobile-only sticky action area (Figma "Bottom bar"); hidden on desktop */
  actionBar?: ReactNode;
  className?: string;
  /** remove default mobile bottom padding (e.g. full-screen map) */
  bleed?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <SiteNav />
      <MobileAppBar header={header} />
      <main
        id="main"
        className={cn(
          "flex flex-1 flex-col",
          !bleed && tab && "pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-0",
          !bleed && actionBar && "pb-[calc(var(--action-bar-h,140px)+16px)] lg:pb-0",
          className,
        )}
      >
        {children}
      </main>
      {actionBar && <MobileActionBar withTabs={!!tab}>{actionBar}</MobileActionBar>}
      {tab && <TabBar active={tab} />}
      <SiteFooter />
    </div>
  );
}

function MobileAppBar({ header }: { header: MobileHeader }) {
  const { t, href } = useI18n();
  const router = useRouter();
  if (header.type === "none") return null;
  const actionsNode = (
    <div className="flex shrink-0 items-center gap-2">
      <ThemeToggle />
      <LanguageSwitch />
    </div>
  );
  if (header.type === "plain") {
    return <div className="flex h-16 items-center justify-end px-4 lg:hidden">{actionsNode}</div>;
  }
  if (header.type === "logo") {
    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-canvas/95 px-4 backdrop-blur lg:hidden">
        <Link href={href("/home")} aria-label={t.common.nav.home}>
          <Logo className="[&_svg]:h-8" />
        </Link>
        {actionsNode}
      </header>
    );
  }
  const goBack = () => {
    if (header.onBack) header.onBack();
    else if (header.backHref) router.push(header.backHref);
    else if (window.history.length > 1) router.back();
    else router.push(href("/home"));
  };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-canvas/95 px-4 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={goBack}
        aria-label={header.type === "close" ? t.common.close : t.common.back}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-ink hover:bg-line"
      >
        <Icon name={header.type === "close" ? "close" : "chevron-left"} size={22} />
      </button>
      <h1 className="line-clamp-2 min-w-0 flex-1 text-center t-h3 text-ink">{header.title}</h1>
      {actionsNode}
    </header>
  );
}

function MobileActionBar({ children, withTabs }: { children: ReactNode; withTabs: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // expose the bar height so <main> can reserve exactly that much space
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const ro = new ResizeObserver(() => root.style.setProperty("--action-bar-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--action-bar-h");
    };
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-x-0 z-30 border-t border-line bg-canvas px-5 pt-3 lg:hidden",
        withTabs ? "bottom-[calc(95px+env(safe-area-inset-bottom))] pb-3" : "bottom-0 pb-[calc(28px+env(safe-area-inset-bottom))]",
      )}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-2">{children}</div>
    </div>
  );
}

// Figma › Tab Bar (Home · Journey · Map · Account)
export function TabBar({ active }: { active: Tab }) {
  const { t, href } = useI18n();
  const status = useStore((s) => s.journey.status);
  const tabs: { id: Tab; icon: IconName; label: string; href: string }[] = [
    { id: "home", icon: "home", label: t.common.tabs.home, href: href("/home") },
    { id: "journey", icon: "route", label: t.common.tabs.journey, href: status === "none" ? href("/plan") : href("/journey") },
    { id: "map", icon: "map", label: t.common.tabs.map, href: href("/map") },
    { id: "account", icon: "user", label: t.common.tabs.account, href: href("/account") },
  ];
  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card px-2 pb-[calc(22px+env(safe-area-inset-bottom))] pt-2 lg:hidden"
    >
      <ul className="mx-auto flex max-w-2xl">
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <li key={tab.id} className="flex-1">
              <Link
                href={tab.href}
                aria-current={on ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 py-1 t-label", on ? "text-action" : "text-ink-2")}
              >
                <span className={cn("grid h-8 w-[60px] place-items-center rounded-full transition-colors", on && "bg-action-subtle")}>
                  <Icon name={tab.icon} size={24} directional={false} />
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Redirect-free "is this the active route" helper for nav highlighting. */
export function useIsPath(path: string) {
  const pathname = usePathname();
  const { href } = useI18n();
  return pathname === href(path);
}
