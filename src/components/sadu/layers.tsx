"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { Icon, type IconName } from "@/components/ui/icon";
import type { Reference } from "@/data/sources";
import type { AiNotice, Origin } from "@/lib/ai-types";
import { cn } from "@/lib/utils";

/**
 * The three technical layers, always labelled so nobody mistakes one for another:
 * AI (real model output) · Algorithmic (deterministic engine) · Simulated (stand-in for future Expo data).
 */
export type Layer = "ai" | "cached" | "fallback" | "algo" | "sim";

const STYLE: Record<Layer, { box: string; icon: IconName }> = {
  ai: { box: "bg-inverse text-on-inverse", icon: "sparkle" },
  cached: { box: "bg-inverse/85 text-on-inverse", icon: "sparkle" },
  fallback: { box: "bg-muted text-ink-2", icon: "summary" },
  algo: { box: "bg-action-subtle text-action", icon: "route" },
  sim: { box: "border border-dashed border-gold bg-gold-subtle text-gold-text", icon: "timer" },
};

export function LayerBadge({ layer, label, className }: { layer: Layer; label?: string; className?: string }) {
  const { t } = useI18n();
  const s = STYLE[layer];
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[0.75rem] font-semibold leading-none", s.box, className)}>
      <Icon name={s.icon} size={14} directional={false} />
      {label ?? t.smart.layers[layer]}
    </span>
  );
}

export const originLayer = (o: Origin): Layer => (o === "ai" ? "ai" : o === "cache" ? "cached" : "fallback");

/** Badge + one-line explanation for a generated item. */
export function OriginNote({ origin, model, notice, className }: { origin: Origin; model?: string; notice?: AiNotice; className?: string }) {
  const { t, fmt } = useI18n();
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <LayerBadge layer={originLayer(origin)} />
      <span className="t-caption text-ink-2">
        {origin === "fallback" ? t.smart.notices[notice ?? "api_error"] : fmt(t.smart.layers.byModel, { model: model ?? "Claude" })}
      </span>
    </div>
  );
}

export function SourceList({ references, className }: { references: Reference[]; className?: string }) {
  const { t } = useI18n();
  if (!references.length) return null;
  return (
    <details className={cn("group rounded-2xl border border-line bg-card px-4 py-3", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 t-label text-ink">
        <Icon name="summary" size={18} />
        <span className="flex-1">
          {t.smart.sources.title} ({references.length})
        </span>
        <Icon name="chevron-down" size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-2 t-caption text-ink-2">{t.smart.sources.note}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {references.map((r) => (
          <li key={r.id} className="t-caption text-ink" dir="ltr">
            <a href={r.url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-action">
              {r.title}
            </a>{" "}
            <span className="text-ink-2">
              · {r.publisher}
              {r.year ? `, ${r.year}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function IllustrativeNote({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <p className={cn("flex items-start gap-2 t-caption text-ink-2", className)}>
      <Icon name="info" size={16} className="mt-0.5 shrink-0" />
      {t.smart.illustrative}
    </p>
  );
}
