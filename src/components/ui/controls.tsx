"use client";

import * as SwitchPrimitive from "@radix-ui/react-switch";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./icon";

// Figma › Shared › Toggle (52×32). Thumb sits at the reading end when on, so it mirrors in RTL.
export function Switch({
  checked,
  onCheckedChange,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className={cn(
        "flex h-8 w-[52px] shrink-0 items-center rounded-full p-[3px] transition-colors",
        checked ? "justify-end bg-action" : "justify-start border-[1.5px] border-line-strong bg-muted p-[1.5px]",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="grid size-[26px] place-items-center rounded-full bg-white text-oasis shadow-card">
        {checked && <Icon name="check" size={14} />}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

// Figma › Components › Chip (Off: + icon, On: ✓ icon, 48 tall)
export function Chip({
  selected,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-12 items-center gap-2 rounded-full px-[18px] t-body-strong transition-colors",
        selected ? "border-2 border-action bg-action-subtle px-[17.5px] text-action" : "border-[1.5px] border-line bg-card text-ink hover:bg-muted",
        className,
      )}
      {...props}
    >
      <Icon name={selected ? "check" : "plus"} size={20} />
      {children}
    </button>
  );
}

// Figma › Components › Tag (Depth / Audio / Now / Done)
const tagStyles = {
  depth: "bg-gold-subtle text-gold-text",
  audio: "bg-muted text-ink",
  now: "bg-action text-on-action",
  done: "bg-action-subtle text-action",
  error: "bg-error-subtle text-error",
} as const;

export function Tag({ type, icon, children, className }: { type: keyof typeof tagStyles; icon?: IconName; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full px-2.5 t-label", tagStyles[type], className)}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </span>
  );
}

export function PointsPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-9 items-center gap-1.5 rounded-full bg-gold-subtle px-3 t-body-strong text-gold-text", className)}>
      <Icon name="award" size={18} />
      {children}
    </span>
  );
}

// Figma › Components › Status Banner (On time / Late / Info / Error)
const bannerStyles = {
  success: { box: "bg-action-subtle", title: "text-action", icon: "check-circle" as IconName, iconColor: "text-action" },
  warning: { box: "bg-gold-subtle", title: "text-gold-text", icon: "timer" as IconName, iconColor: "text-gold-text" },
  info: { box: "bg-muted", title: "text-ink", icon: "headphones" as IconName, iconColor: "text-ink" },
  error: { box: "bg-error-subtle", title: "text-error", icon: "info" as IconName, iconColor: "text-error" },
};

export function StatusBanner({
  type,
  title,
  children,
  icon,
  className,
}: {
  type: keyof typeof bannerStyles;
  title: ReactNode;
  children?: ReactNode;
  icon?: IconName;
  className?: string;
}) {
  const s = bannerStyles[type];
  return (
    <div className={cn("flex gap-3 rounded-2xl px-4 py-3.5", s.box, className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card">
        <Icon name={icon ?? s.icon} size={20} className={s.iconColor} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className={cn("t-body-strong", s.title)}>{title}</p>
        {children && <p className="t-caption text-ink-2">{children}</p>}
      </div>
    </div>
  );
}

// Figma › Components › Progress Stepper
export function ProgressStepper({ label, step, total = 3, className }: { label: string; step: number; total?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <p className="t-label text-ink-2">{label}</p>
      <div className="flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={label}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i < step ? "bg-action" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

/** Thin horizontal progress bar (passport, level, preparing). */
export function ProgressBar({ value, tone = "gold", className, label }: { value: number; tone?: "gold" | "action"; className?: string; label?: string }) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", tone === "gold" ? "bg-gold" : "bg-action")}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </div>
  );
}

/** Section heading row: "Today at Expo ……… See all" */
export function SectionHeader({ title, action, as: As = "h2", className }: { title: ReactNode; action?: ReactNode; as?: "h2" | "h3"; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <As className="t-h2 text-ink">{title}</As>
      {action}
    </div>
  );
}
