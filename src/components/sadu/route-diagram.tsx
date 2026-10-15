"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { getPavilion, STATION_IDS } from "@/data/pavilions";
import { GATE_POSITIONS, STATIONS, type Gate, type Point } from "@/data/stations";
import type { JourneyStop } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { LayerBadge } from "./layers";

const W = 600;
const H = 800;

/**
 * The optimized route drawn from the illustrative station coordinates (metres). Done legs are solid, upcoming
 * legs dashed; stations outside the plan are faint. The visitor marker is the SIMULATED position.
 */
export function RouteDiagram({
  stops,
  gate,
  position,
  className,
  compact = false,
}: {
  stops: JourneyStop[];
  gate: Gate;
  position: Point | null;
  className?: string;
  compact?: boolean;
}) {
  const { t, l, fmt } = useI18n();
  const active = stops.filter((s) => s.status !== "removed");
  const start = GATE_POSITIONS[gate];
  const points = [start, ...active.map((s) => STATIONS[s.id].position)];
  const you = position ?? start;
  const doneCount = active.filter((s) => s.status === "done" || s.status === "arrived").length;
  const removed = new Set(stops.filter((s) => s.status === "removed").map((s) => s.id));

  return (
    <figure className={cn("relative overflow-hidden rounded-[28px] border border-line bg-muted", className)}>
      <svg viewBox={`-40 -40 ${W + 80} ${H + 80}`} className="block h-auto w-full" role="img" aria-label={t.smart.route.title}>
        <defs>
          <pattern id="sadu-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="var(--border)" strokeWidth="1" opacity="0.5" />
          </pattern>
        </defs>
        <rect x="-40" y="-40" width={W + 80} height={H + 80} fill="url(#sadu-grid)" />
        <rect x="0" y="0" width={W} height={H} rx="36" fill="none" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="6 8" />

        {(Object.keys(GATE_POSITIONS) as Gate[]).map((g) => {
          const p = GATE_POSITIONS[g];
          return <rect key={g} x={p.x - 22} y={p.y - 8} width="44" height="16" rx="8" fill={g === gate ? "var(--action)" : "var(--border-strong)"} transform={g === "east" || g === "west" ? `rotate(90 ${p.x} ${p.y})` : undefined} />;
        })}

        {/* legs: done solid, upcoming dashed */}
        {points.slice(1).map((p, i) => {
          const a = points[i];
          const done = i < doneCount;
          return <line key={i} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={done ? "var(--action)" : "var(--gold)"} strokeWidth={done ? 8 : 6} strokeLinecap="round" strokeDasharray={done ? undefined : "2 14"} />;
        })}

        {STATION_IDS.map((id) => {
          const p = STATIONS[id].position;
          const idx = active.findIndex((s) => s.id === id);
          const stop = active[idx];
          const fill = !stop ? "var(--surface-card)" : stop.status === "done" ? "var(--action)" : stop.status === "arrived" ? "var(--gold)" : "var(--surface-card)";
          const ink = stop && (stop.status === "done" || stop.status === "arrived") ? "#fff" : "var(--text-primary)";
          return (
            <g key={id} opacity={stop ? 1 : removed.has(id) ? 0.55 : 0.35}>
              <rect x={p.x - 20} y={p.y - 20} width="40" height="40" rx="5" transform={`rotate(45 ${p.x} ${p.y})`} fill={fill} stroke={stop ? "var(--text-primary)" : "var(--border-strong)"} strokeWidth="3" strokeDasharray={removed.has(id) ? "5 5" : undefined} />
              <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="20" fontWeight="700" fill={ink}>
                {stop ? (stop.status === "done" ? "✓" : idx + 1) : ""}
              </text>
              {!compact && (
                <text x={p.x} y={p.y + 50} textAnchor="middle" fontSize="19" fill="var(--text-secondary)">
                  {l(getPavilion(id)!.stampName)}
                </text>
              )}
            </g>
          );
        })}

        <circle cx={you.x} cy={you.y} r="24" fill="var(--color-oasis)" opacity="0.25" className="motion-safe:animate-pulse" />
        <circle cx={you.x} cy={you.y} r="11" fill="var(--color-oasis)" stroke="#fff" strokeWidth="4" />
      </svg>
      <figcaption className="flex flex-wrap items-center gap-2 border-t border-line bg-card px-4 py-2.5 t-caption text-ink-2">
        <LayerBadge layer="sim" />
        <span className="flex-1">{t.smart.route.illustrative}</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-oasis" />
          {fmt(t.smart.route.you, {})}
        </span>
      </figcaption>
    </figure>
  );
}
