"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Tag } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { getPavilion } from "@/data/pavilions";
import type { JourneyStop } from "@/lib/engine";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StationNode } from "./brand";
import { ScoreBreakdown, WhyLine } from "./explain";

export type StationStatus = "upcoming" | "current" | "done" | "removed";

// Figma › Components › Station Card (Upcoming / Current / Done), driven by a planned stop from the engine
export function StationCard({
  stop,
  n,
  status,
  href,
  actions,
  className,
}: {
  stop: JourneyStop;
  n: number;
  status: StationStatus;
  href: string;
  actions?: ReactNode;
  className?: string;
}) {
  const { t, l, fmt, locale } = useI18n();
  const p = getPavilion(stop.id)!;
  const removed = status === "removed";
  return (
    <article
      className={cn(
        "relative flex gap-3.5 rounded-[20px] bg-card p-4 shadow-card",
        status === "current" ? "border-2 border-action p-[15px]" : "border border-line",
        removed && "bg-muted/60 shadow-none",
        className,
      )}
    >
      <StationNode n={removed ? "–" : n} state={status === "current" ? "current" : status === "done" ? "done" : "upcoming"} />
      <div className={cn("flex min-w-0 flex-1 flex-col gap-1.5", (status === "done" || removed) && "opacity-80")}>
        <Link href={href} className="group flex items-start gap-2">
          <span className={cn("flex-1 t-h3 text-ink group-hover:underline", removed && "line-through decoration-ink-3")}>{l(p.listTitle)}</span>
          <Icon name="chevron-right" size={20} className="mt-0.5 text-ink-3" />
        </Link>
        {!removed && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 t-caption text-ink-2">
            <span className="flex items-center gap-1">
              <Icon name="clock" size={15} className="text-ink-3" />
              <bdi>{clock(stop.arriveAt, locale)}</bdi>
            </span>
            <span>· {fmt(t.smart.stop.walk, { n: stop.walkMin })}</span>
            <span>· {fmt(t.smart.stop.queue, { n: stop.queueMin })}</span>
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {status === "current" && (
            <Tag type="now" icon="navigate">
              {t.journey.now}
            </Tag>
          )}
          {status === "done" && (
            <Tag type="done" icon="check">
              {t.journey.done}
            </Tag>
          )}
          {!removed && (
            <Tag type="depth" icon="depth">
              {fmt(t.depth.tag, { depth: t.depth[stop.depth], n: stop.experienceMin })}
            </Tag>
          )}
          {stop.change?.type === "downgraded" && (
            <Tag type="error" icon="timer">
              {fmt(t.smart.adjust.shortenedTag, { from: t.depth[stop.change.from] })}
            </Tag>
          )}
          {removed && (
            <Tag type="error" icon="timer">
              {t.smart.adjust.removedTag}
            </Tag>
          )}
        </div>
        {!removed && status !== "done" && <WhyLine score={stop.score} />}
        {!removed && status !== "done" && <ScoreBreakdown score={stop.score} className="mt-1" />}
        {actions && <div className="mt-1 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </article>
  );
}
