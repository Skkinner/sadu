"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoMark } from "@/components/brand/art";
import { PageShell } from "@/components/layout/page-shell";
import { ThemeToggle } from "@/components/layout/toggles";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

// Figma › M01 · Choose language (first screen of the mobile prototype)
export function LanguageScreen() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const [choice, setChoice] = useState<Locale>(locale);

  const options = [
    { id: "ar" as const, badge: "ع", title: t.language.arabic, sub: t.language.arabicSub, titleLang: "ar", subLang: "en" },
    { id: "en" as const, badge: "EN", title: t.language.english, sub: t.language.englishSub, titleLang: "en", subLang: "ar" },
  ];

  const next = () => {
    try {
      localStorage.setItem("sadu-lang-chosen", "1");
    } catch {}
    if (choice === locale) router.push(`/${choice}`);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- locales use separate root layouts
    else window.location.assign(`/${choice}`);
  };

  return (
    <PageShell
      header={{ type: "none" }}
      actionBar={
        <Button size="lg" block trailing="arrow-right" onClick={next}>
          {choice === "ar" ? "متابعة" : "Continue"}
        </Button>
      }
    >
      <div className="flex justify-end px-4 pt-4 lg:hidden">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-6 px-5 pb-10 pt-6 lg:pt-16">
        <LogoMark className="size-24" />
        <h1 className="text-center text-ink">
          <span lang="ar" className="block font-[family-name:var(--font-readex)] text-[2.5rem] font-bold leading-[1.2]">
            {t.language.welcomeAr}
          </span>
          <span lang="en" className="block font-[family-name:var(--font-space-grotesk)] text-[2.5rem] font-bold leading-[1.1]">
            {t.language.welcome}
          </span>
        </h1>
        <p className="text-center t-body-l text-ink-2">{t.language.question}</p>
        <div role="radiogroup" aria-label={t.language.question} className="flex w-full flex-col gap-3">
          {options.map((o) => {
            const on = choice === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setChoice(o.id)}
                className={cn(
                  "flex items-center gap-3.5 rounded-[20px] p-4 text-start transition-colors",
                  on ? "border-2 border-action bg-action-subtle p-[15px]" : "border-[1.5px] border-line bg-card hover:border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-[14px] text-lg font-medium",
                    on ? "bg-action text-on-action" : "bg-muted text-ink",
                  )}
                >
                  {o.badge}
                </span>
                <span className="flex flex-1 flex-col">
                  <span lang={o.titleLang} className="t-h3 text-ink">
                    {o.title}
                  </span>
                  <span lang={o.subLang} className="t-caption text-ink-2">
                    {o.sub}
                  </span>
                </span>
                <Radio on={on} />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => toast(t.language.moreSoon)}
            className="flex items-center gap-3.5 rounded-[20px] border-[1.5px] border-line bg-card p-4 text-start hover:border-line-strong"
          >
            <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-muted text-lg font-medium text-ink">+</span>
            <span className="flex flex-1 flex-col">
              <span lang="ar" dir="rtl" className="self-start t-h3 text-ink">
                {t.language.more}
              </span>
              <span lang="en" className="t-caption text-ink-2">
                {t.language.moreSub}
              </span>
            </span>
            <Radio on={false} />
          </button>
        </div>
        <p className="text-center t-caption text-ink-3">{t.language.hint}</p>
        <Button size="lg" block trailing="arrow-right" onClick={next} className="hidden lg:inline-flex">
          {choice === "ar" ? "متابعة" : "Continue"}
        </Button>
      </div>
    </PageShell>
  );
}

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("grid size-6 shrink-0 place-items-center rounded-full", on ? "bg-action text-on-action" : "border-2 border-line-strong")}
    >
      {on && <Icon name="check" size={14} />}
    </span>
  );
}
