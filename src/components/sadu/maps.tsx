"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Icon } from "@/components/ui/icon";
import type { JourneyStop } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { RouteDiagram } from "./route-diagram";
import type { StationStatus } from "./station-card";

/** Display status of each stop: the one in progress (or the next one) is "current". */
export function stopStatus(stops: JourneyStop[], stop: JourneyStop, journeyStatus: string): StationStatus {
  if (stop.status === "removed") return "removed";
  if (stop.status === "done") return "done";
  if (journeyStatus === "complete") return "upcoming";
  const current = stops.find((s) => s.status === "arrived") ?? stops.find((s) => s.status === "upcoming");
  return current?.id === stop.id ? "current" : "upcoming";
}

// D13 › Map (desktop): the optimized route on the illustrative site layout
export function RouteMapCard({ className }: { className?: string }) {
  const { t, href } = useI18n();
  const stops = useStore((s) => s.journey.stops);
  const gate = useStore((s) => s.plan.gate);
  const position = useStore((s) => s.journey.position);
  return (
    <div className={cn("relative", className)}>
      <RouteDiagram stops={stops} gate={gate} position={position} />
      <Link
        href={href("/map")}
        className="absolute inset-x-4 top-4 flex h-12 items-center gap-2 rounded-full bg-card pe-2 ps-3.5 shadow-card hover:shadow-raised"
        dir="auto"
      >
        <Icon name="map" size={18} className="text-ink" />
        <span className="flex-1 t-body-strong text-ink">{t.journey.routeMap}</span>
        <span className="grid size-9 place-items-center rounded-full bg-muted text-ink">
          <Icon name="chevron-right" size={20} />
        </span>
      </Link>
    </div>
  );
}

// M13 › Map preview
export function RouteMapPreview({ className }: { className?: string }) {
  const { t, href } = useI18n();
  const stops = useStore((s) => s.journey.stops);
  const gate = useStore((s) => s.plan.gate);
  const position = useStore((s) => s.journey.position);
  return (
    <Link href={href("/map")} className={cn("relative block overflow-hidden rounded-[20px]", className)}>
      <div className="max-h-[220px] overflow-hidden">
        <RouteDiagram stops={stops} gate={gate} position={position} compact />
      </div>
      <span className="absolute bottom-14 start-3 flex items-center gap-1.5 rounded-full bg-card px-3 py-2 t-label text-ink shadow-card">
        <Icon name="map" size={18} />
        {t.journey.openMap}
      </span>
    </Link>
  );
}
