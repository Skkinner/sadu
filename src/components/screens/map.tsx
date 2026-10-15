"use client";

import Link from "next/link";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { Stamp, StationNode } from "@/components/sadu/brand";
import { LayerBadge } from "@/components/sadu/layers";
import { stopStatus } from "@/components/sadu/maps";
import { RouteDiagram } from "@/components/sadu/route-diagram";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { getPavilion } from "@/data/pavilions";
import type { JourneyStop } from "@/lib/engine";
import { activeStops, currentStop, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// M14 · Your route map: the optimized route on the illustrative site layout
export function MapScreen() {
  const { t, l, fmt } = useI18n();
  const journey = useStore((s) => s.journey);
  const gate = useStore((s) => s.plan.gate);
  const stops = useStore(activeStops);
  const current = useStore(currentStop);
  const [selected, setSelected] = useState<string | null>(null);
  const sel = stops.find((s) => s.id === selected) ?? current ?? stops[0] ?? null;

  return (
    <PageShell header={{ type: "back", title: t.map.title }} tab="map">
      <div className="page-container flex flex-col gap-6 pb-10 pt-2 lg:flex-row lg:items-start lg:gap-10 lg:pb-24 lg:pt-12">
        <div className="w-full lg:w-[520px] lg:shrink-0">
          <RouteDiagram stops={journey.stops} gate={gate} position={journey.position} />
          {journey.route && (
            <p className="mt-2 flex flex-wrap items-center gap-2 t-caption text-ink-2">
              <LayerBadge layer="algo" />
              {fmt(t.smart.route.stats, { nn: journey.route.nearestNeighbourM, opt: journey.route.optimizedM })}
            </p>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <h1 className="hidden t-display text-ink lg:block">{t.map.title}</h1>
          {stops.length === 0 && <p className="t-body text-ink-2">{t.journey.empty.body}</p>}
          {stops.map((s, i) => {
            const status = stopStatus(journey.stops, s, journey.status);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border bg-card p-3 text-start transition-colors",
                  sel?.id === s.id ? "border-2 border-action p-[11px]" : "border-line hover:bg-muted/50",
                )}
              >
                <StationNode n={i + 1} size={36} state={status === "current" ? "current" : status === "done" ? "done" : "upcoming"} />
                <span className="flex-1 t-body-strong text-ink">{l(getPavilion(s.id)!.title)}</span>
              </button>
            );
          })}
          {sel && <StopPreview stop={sel} n={stops.findIndex((s) => s.id === sel.id) + 1} isCurrent={current?.id === sel.id} />}
        </div>
      </div>
    </PageShell>
  );
}

function StopPreview({ stop, n, isCurrent, className }: { stop: JourneyStop; n: number; isCurrent: boolean; className?: string }) {
  const { t, fmt, href, l } = useI18n();
  const p = getPavilion(stop.id)!;
  return (
    <div className={cn("flex flex-col gap-3.5 rounded-3xl bg-card p-4 shadow-sheet", className)}>
      <div className="flex items-center gap-3">
        <Stamp id={p.id} size={52} />
        <div className="min-w-0 flex-1">
          <p className="t-overline text-gold-text">{isCurrent ? fmt(t.map.nearest, { n }) : fmt(t.map.stopN, { n })}</p>
          <p className="t-body-strong text-ink">{l(p.listTitle)}</p>
          <p className="t-caption text-ink-2">{fmt(t.map.meta, { walk: stop.walkMin, depth: fmt(t.depth.tag, { depth: t.depth[stop.depth], n: stop.experienceMin }).replace(" · ", " ") })}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button asChild>
          <Link href={href(`/pavilion/${p.id}/route`)}>
            {t.map.guide}
            <Icon name="arrow-right" size={20} />
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={href(`/pavilion/${p.id}`)}>{t.map.details}</Link>
        </Button>
      </div>
    </div>
  );
}
