"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Icon } from "@/components/ui/icon";
import { PERSONALIZATION } from "@/config/personalization";
import type { Reason, ScoreComponents, StationScore } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { LayerBadge } from "./layers";

/** Plain-language reasons from the scoring engine, e.g. "You selected history and architecture". */
export function useReasonText() {
  const { t, fmt, locale } = useI18n();
  const list = (items: string[]) => new Intl.ListFormat(locale === "ar" ? "ar" : "en", { type: "conjunction" }).format(items);
  return (r: Reason) => {
    switch (r.code) {
      case "interests":
        return fmt(t.smart.why.reasons.interests, { list: list(r.interests.map((i) => t.interestsShort[i])) });
      case "experiences":
        return fmt(t.smart.why.reasons.experiences, { list: list(r.experiences.map((e) => t.smart.experiences[e].toLowerCase())) });
      case "newThemes":
        return fmt(t.smart.why.reasons.newThemes, { list: list(r.interests.map((i) => t.interestsShort[i])) });
      default:
        return t.smart.why.reasons[r.code];
    }
  };
}

/** One-line "Recommended because …" built from the strongest reasons. */
export function WhyLine({ score, className }: { score: StationScore; className?: string }) {
  const { t, fmt } = useI18n();
  const text = useReasonText();
  const top = score.reasons.slice(0, 2).map(text);
  if (!top.length) return null;
  return <p className={cn("t-caption text-ink-2", className)}>{fmt(t.smart.why.because, { reasons: top.join(" · ") })}</p>;
}

const KEYS: (keyof ScoreComponents)[] = ["interest", "cultural", "preference", "diversity", "accessibility"];

/** Expandable breakdown: each weighted component of the deterministic score. No confidence percentages. */
export function ScoreBreakdown({ score, className }: { score: StationScore; className?: string }) {
  const { t, fmt } = useI18n();
  const text = useReasonText();
  return (
    <details className={cn("group rounded-2xl bg-muted/70 px-3.5 py-3", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 t-label text-ink">
        <span className="flex-1">{t.smart.why.title}</span>
        <LayerBadge layer="algo" />
        <Icon name="chevron-down" size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-3 flex flex-col gap-1.5">
        {score.reasons.map((r, i) => (
          <li key={i} className="flex items-start gap-2 t-caption text-ink">
            <Icon name="check" size={14} className="mt-0.5 shrink-0 text-action" />
            {text(r)}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2" dir="ltr">
        {KEYS.map((k) => (
          <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="t-caption text-ink-2" dir="auto">
              {t.smart.why.components[k]} <span className="text-ink-3">× {PERSONALIZATION.weights[k]}</span>
            </span>
            <span className="t-caption tabular-nums text-ink">{score.weighted[k].toFixed(2)}</span>
            <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-card">
              <span className="block h-full rounded-full bg-action" style={{ width: `${(score.components[k] * 100).toFixed(0)}%` }} />
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-2 t-label text-ink">
          <span dir="auto">{t.smart.why.total}</span>
          <span className="tabular-nums">{score.total.toFixed(2)}</span>
        </div>
      </div>
      <p className="mt-2 t-caption text-ink-3">{fmt(t.smart.why.note, {})}</p>
    </details>
  );
}
