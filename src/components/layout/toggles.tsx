"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/components/providers/i18n-provider";
import { Icon } from "@/components/ui/icon";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Locale } from "@/i18n/config";

// Figma › Shared › Theme Toggle (44px, moon → dark / sun → light)
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const theme = useStore((s) => s.prefs.theme);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => actions.setPrefs({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? t.common.themeToLight : t.common.themeToDark}
      title={dark ? t.common.themeToLight : t.common.themeToDark}
      className={cn("grid size-11 shrink-0 place-items-center rounded-full bg-muted text-ink transition-colors hover:bg-line", className)}
    >
      <Icon name={dark ? "sun" : "moon"} size={22} />
    </button>
  );
}

export function useSwitchLocale() {
  const pathname = usePathname();
  return (target: Locale) => {
    const rest = pathname.replace(/^\/(ar|en)(?=\/|$)/, "");
    const query = typeof window !== "undefined" ? window.location.search + window.location.hash : "";
    try {
      window.localStorage.setItem("sadu-lang-chosen", "1");
    } catch {}
    // different root layout (lang/dir) → full document load rather than a client transition
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- locales use separate root layouts
    window.location.assign(`/${target}${rest}${query}`);
  };
}

// Figma › Shared › Language Switch (96×44, ع | EN)
export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const switchTo = useSwitchLocale();
  const seg = (active: boolean) =>
    cn(
      "grid h-[38px] w-11 place-items-center rounded-full transition-colors",
      active ? "bg-card text-ink shadow-card" : "text-ink-2 hover:text-ink",
    );
  return (
    <div
      role="group"
      aria-label={t.common.languageSwitch}
      dir="ltr"
      className={cn("flex h-11 w-24 shrink-0 items-center gap-0.5 rounded-full bg-muted p-[3px]", className)}
    >
      <button
        type="button"
        lang="ar"
        aria-pressed={locale === "ar"}
        aria-label="العربية"
        onClick={() => locale !== "ar" && switchTo("ar")}
        className={cn(seg(locale === "ar"), "font-[family-name:var(--font-noto-arabic)] text-base font-semibold")}
      >
        ع
      </button>
      <button
        type="button"
        lang="en"
        aria-pressed={locale === "en"}
        aria-label="English"
        onClick={() => locale !== "en" && switchTo("en")}
        className={cn(seg(locale === "en"), "font-[family-name:var(--font-plex)] text-base font-semibold")}
      >
        EN
      </button>
    </div>
  );
}
