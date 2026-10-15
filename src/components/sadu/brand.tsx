"use client";

import { LogoArabic, LogoEnglish, LogoMark } from "@/components/brand/art";
import { useI18n } from "@/components/providers/i18n-provider";
import type { PavilionId } from "@/data/pavilions";
import { getPavilion } from "@/data/pavilions";
import { cn } from "@/lib/utils";

/** "SADU" wordmark in English, "سدو" in Arabic (Figma › Logos & Icons). */
export function Logo({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  return (
    <span role="img" aria-label={t.common.logoAlt} className={cn("inline-flex", className)}>
      {locale === "ar" ? <LogoArabic className="h-10 w-auto" /> : <LogoEnglish className="h-9 w-auto" />}
    </span>
  );
}

export { LogoMark };

/** Round country stamp (Figma › Stamp/Saudi … Stamp/Korea). */
export function Stamp({ id, size = 56, className, style }: { id: PavilionId; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/stamps/${id}.svg`} alt="" width={size} height={size} className={cn("shrink-0 select-none", className)} style={style} draggable={false} />
  );
}

/**
 * Perforated passport stamp (Figma › Passport Stamp, Collected / Locked).
 * The artwork is an SVG; the country label and year are HTML so they follow the page language & fonts.
 */
export function PassportStamp({
  id,
  locked = false,
  width = 132,
  className,
  style,
}: {
  id: PavilionId;
  locked?: boolean;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { l } = useI18n();
  const p = getPavilion(id)!;
  return (
    <span
      className={cn("relative inline-block shrink-0 select-none [container-type:inline-size]", className)}
      style={{ width, aspectRatio: "141 / 177", ...style }}
      role="img"
      aria-label={l(p.stampName)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/passport/${id}-${locked ? "locked" : "collected"}.svg`} alt="" className="absolute inset-0 size-full" draggable={false} />
      <span
        dir="auto"
        className="absolute left-[10%] top-[79%] font-bold leading-none text-night [font-size:9.9cqw] [font-family:var(--font-plex),var(--font-noto-arabic),sans-serif]"
        style={{ opacity: locked ? 0.55 : 1 }}
      >
        {l(p.stampName)}
      </span>
      <span
        className="absolute right-[10%] top-[78.3%] leading-none tracking-[0.08em] text-[#8A590A] [font-size:7.8cqw] [font-family:var(--font-space-grotesk),sans-serif]"
        style={{ opacity: locked ? 0.55 : 1 }}
      >
        2030
      </span>
    </span>
  );
}

/** Small rotated square used throughout the Sadu pattern. */
export function Diamond({ size = 10, color, className, style }: { size?: number; color: string; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rotate-45 rounded-[1px]", className)}
      style={{ width: size * 0.72, height: size * 0.72, margin: size * 0.14, background: color, ...style }}
    />
  );
}

/** Row of diamonds in the Sadu colours (CTA band, passport cover, player artwork). */
export function SaduBand({
  count = 40,
  size = 10,
  gap = 10,
  palette = ["rgb(244 239 230 / 0.35)", "#E2A33A", "#A3232E"],
  className,
}: {
  count?: number;
  size?: number;
  gap?: number;
  palette?: string[];
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("flex items-center overflow-hidden", className)} style={{ gap: gap - size * 0.28 }}>
      {Array.from({ length: count }, (_, i) => (
        <Diamond key={i} size={size} color={palette[i % palette.length]} />
      ))}
    </div>
  );
}

/** Depth markers: Glimpse ◇ · Visit ◈ · Deep dive ◆ (Figma › Depth Option). */
export function DepthMarker({ depth, size = 28, className }: { depth: "glimpse" | "visit" | "deep"; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className={cn("shrink-0", className)}>
      {depth === "deep" ? (
        <>
          <rect x="8.7" y="8.7" width="22.6" height="22.6" transform="rotate(45 20 20)" fill="currentColor" rx="1" />
          <rect x="14.3" y="14.3" width="11.3" height="11.3" transform="rotate(45 20 20)" fill="var(--surface-card)" />
          <rect x="17.5" y="17.5" width="5" height="5" transform="rotate(45 20 20)" fill="currentColor" />
        </>
      ) : (
        <>
          <rect x="9.6" y="9.6" width="20.8" height="20.8" transform="rotate(45 20 20)" fill="none" stroke="currentColor" strokeWidth="2.5" rx="1" />
          {depth === "visit" && <rect x="15" y="15" width="10" height="10" transform="rotate(45 20 20)" fill="currentColor" />}
        </>
      )}
    </svg>
  );
}

/** Numbered diamond used for journey stops (Station Card node, map pins). */
export function StationNode({
  n,
  state = "upcoming",
  size = 40,
  className,
}: {
  n?: number | string;
  state?: "upcoming" | "current" | "done" | "dark";
  size?: number;
  className?: string;
}) {
  const fill = { upcoming: "var(--surface-card)", current: "var(--action)", done: "var(--action)", dark: "var(--text-primary)" }[state];
  const stroke = state === "upcoming" ? "var(--text-primary)" : "none";
  const text = { upcoming: "text-ink", current: "text-on-action", done: "text-on-action", dark: "text-canvas" }[state];
  return (
    <span className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 40 40" className="absolute inset-0 size-full" aria-hidden>
        <rect x="7.5" y="7.5" width="25" height="25" rx="2.5" transform="rotate(45 20 20)" fill={fill} stroke={stroke} strokeWidth="1.6" />
      </svg>
      <span className={cn("relative t-body-strong", text)} style={{ fontSize: size < 32 ? "0.8125rem" : undefined }}>
        {state === "done" ? "✓" : n}
      </span>
    </span>
  );
}
