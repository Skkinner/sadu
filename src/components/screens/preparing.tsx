"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WeavingArt } from "@/components/brand/art";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { ProgressBar } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { durationLabel } from "@/lib/format";
import { actions, activeStops, useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// D12 / M12 · Weaving your journey…
export function PreparingScreen() {
  const { t, fmt, href, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const minutes = useStore((s) => s.plan.minutes);
  const status = useStore((s) => s.journey.status);
  const narration = useStore((s) => s.plan.narrationLang ?? locale);
  const stops = useStore(activeStops).length;
  const [phase, setPhase] = useState(0); // 0..3

  useEffect(() => {
    if (!hydrated) return;
    if (status === "none") actions.buildJourney();
    const timers = [900, 1800, 3000].map((ms, i) => window.setTimeout(() => setPhase(i + 1), ms));
    const done = window.setTimeout(() => router.replace(href("/journey")), 3700);
    return () => [...timers, done].forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const langName = locale === "ar" ? (narration === "ar" ? "بالعربية" : "بالإنجليزية") : narration === "ar" ? "Arabic" : "English";
  const steps = t.preparing.steps.map((s) => fmt(s, { n: stops, lang: langName }));

  return (
    <PageShell header={{ type: "none" }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-7 px-5 py-16 lg:pb-24 lg:pt-[72px]">
        <WeavingArt className="h-40 w-60 animate-[sadu-fade-in_.6s_ease-out]" />
        <div className="flex max-w-[520px] flex-col items-center gap-2 text-center">
          <h1 className="t-h1 text-ink">{t.preparing.title}</h1>
          <p className="t-body text-ink-2">{fmt(t.preparing.lead, { n: stops, time: durationLabel(minutes, locale) })}</p>
        </div>
        <div className="flex w-full max-w-[520px] flex-col gap-3.5 rounded-[20px] border border-line bg-card p-5 shadow-card" aria-live="polite">
          {steps.map((s, i) => {
            const done = phase > i;
            const working = phase === i;
            return (
              <p
                key={s}
                className={cn(
                  "flex items-center gap-3 t-body transition-opacity",
                  done ? "text-ink-2" : working ? "t-body-strong text-ink" : "text-ink-3 opacity-60",
                )}
              >
                <Icon
                  name={done ? "check-circle" : "refresh"}
                  size={22}
                  className={cn(done ? "text-action" : "text-ink-2", working && "animate-[sadu-spin_1.2s_linear_infinite]")}
                />
                {i === 2 && done ? t.preparing.done : s}
              </p>
            );
          })}
          <ProgressBar value={Math.min(1, (phase + 0.6) / 3.4)} tone="action" label={t.preparing.title} />
        </div>
        <p className="t-caption text-ink-3">{t.preparing.note}</p>
      </div>
    </PageShell>
  );
}
