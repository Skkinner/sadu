"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Icon } from "@/components/ui/icon";
import type { Depth } from "@/data/pavilions";
import { cn } from "@/lib/utils";
import { DepthMarker } from "./brand";

// Figma › Components › Time Option (Off / On)
export function TimeOption({
  value,
  unit,
  selected,
  onSelect,
  className,
}: {
  value: ReactNode;
  unit: ReactNode;
  selected: boolean;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "relative flex h-28 min-w-0 flex-1 flex-col items-center justify-center rounded-[20px] border-[1.5px] transition-colors",
        selected ? "border-action bg-action text-on-action" : "border-line bg-card text-ink hover:border-line-strong",
        className,
      )}
    >
      <span className="t-display">{value}</span>
      <span className={cn("t-label", selected ? "text-on-action" : "text-ink-2")}>{unit}</span>
      {selected && (
        <span className="absolute end-2 top-2 grid size-6 place-items-center rounded-full bg-white text-oasis">
          <Icon name="check" size={16} />
        </span>
      )}
    </button>
  );
}

// Figma › Components › Depth Option (Glimpse / Visit / Deep, Off / On)
export function DepthOption({ depth, selected, onSelect }: { depth: Depth; selected: boolean; onSelect: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-[120px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-[1.5px] px-2 py-3.5 transition-colors",
        selected ? "border-2 border-gold bg-gold-subtle text-gold-text" : "border-line bg-card text-ink hover:border-line-strong",
      )}
    >
      <DepthMarker depth={depth} />
      <span className="h-1" />
      <span className="t-body-strong">{t.depth[depth]}</span>
      <span className="t-caption text-ink-2">{t.depth.duration[depth]}</span>
    </button>
  );
}

export function DepthPicker({ value, onChange, label }: { value: Depth; onChange: (d: Depth) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2.5">
      {(["glimpse", "visit", "deep"] as const).map((d) => (
        <DepthOption key={d} depth={d} selected={value === d} onSelect={() => onChange(d)} />
      ))}
    </div>
  );
}

// Figma › Components › Answer Option (Default / Selected / Correct / Wrong)
export type AnswerState = "default" | "selected" | "correct" | "wrong" | "muted";

export function AnswerOption({ state, children, onSelect, disabled }: { state: AnswerState; children: ReactNode; onSelect: () => void; disabled?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === "selected" || state === "correct" || state === "wrong"}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-2xl border-[1.5px] p-4 text-start transition-colors",
        state === "default" && "border-line bg-card hover:border-line-strong",
        state === "muted" && "border-line bg-card opacity-70",
        state === "selected" && "border-2 border-action bg-card p-[15.5px]",
        state === "correct" && "border-2 border-action bg-action-subtle p-[15.5px]",
        state === "wrong" && "border-2 border-error bg-error-subtle p-[15.5px]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full",
          (state === "default" || state === "muted") && "border-2 border-line-strong",
          state === "selected" && "border-2 border-action",
          state === "correct" && "bg-action text-on-action",
          state === "wrong" && "bg-error text-white",
        )}
      >
        {state === "selected" && <span className="size-3 rounded-full bg-action" />}
        {state === "correct" && <Icon name="check" size={16} />}
        {state === "wrong" && <Icon name="close" size={14} />}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="t-body text-ink">{children}</span>
        {state === "correct" && <span className="t-label text-action">{t.quiz.correct}</span>}
        {state === "wrong" && <span className="t-label text-error">{t.quiz.wrong}</span>}
      </span>
    </button>
  );
}
