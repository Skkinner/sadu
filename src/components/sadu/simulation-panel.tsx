"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { clock } from "@/lib/format";
import { actions, journeyMetrics, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LayerBadge } from "./layers";

/**
 * Presenter controls for the demo: advance a SIMULATED clock. Advancing runs the real journey-compression
 * algorithm (src/lib/engine/compression.ts). The system clock is never touched.
 */
export function SimulationPanel({ className }: { className?: string }) {
  const { t, fmt, locale } = useI18n();
  const toast = useToast();
  const metrics = useStore(journeyMetrics);
  const elapsed = useStore((s) => s.journey.clock.elapsed);
  const delay = useStore((s) => s.journey.clock.delay);
  const status = useStore((s) => s.journey.status);
  const finished = status === "complete";

  const advance = (n: number) => {
    const r = actions.advanceClock(n);
    if (r.ended) toast(t.smart.adjust.ended);
    else if (r.changes.length) toast(fmt(t.smart.adjust.toastChanged, { n: r.changes.length }));
    else toast(t.smart.adjust.toastFine);
  };

  return (
    <section className={cn("flex flex-col gap-3 rounded-[22px] border-2 border-dashed border-gold bg-gold-subtle/60 p-4", className)} aria-label={t.smart.sim.title}>
      <div className="flex flex-wrap items-center gap-2">
        <LayerBadge layer="sim" />
        <h2 className="t-label text-ink">{t.smart.sim.title}</h2>
      </div>
      <p className="t-caption text-ink-2">{t.smart.sim.lead}</p>
      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-card p-3 text-center">
        <div>
          <p className="t-h3 tabular-nums text-ink" dir="ltr">
            {clock(metrics.now, locale)}
          </p>
          <p className="t-caption text-ink-2">{t.smart.sim.clock}</p>
        </div>
        <div>
          <p className="t-h3 tabular-nums text-ink">{elapsed}</p>
          <p className="t-caption text-ink-2">{fmt(t.smart.sim.elapsed, { n: delay })}</p>
        </div>
        <div>
          <p className={cn("t-h3 tabular-nums", metrics.behind ? "text-error" : "text-action")}>{Math.max(0, metrics.remainingBudget)}</p>
          <p className="t-caption text-ink-2">{fmt(t.smart.sim.remaining, { n: metrics.remainingPlan })}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" disabled={finished || status === "none"} onClick={() => advance(10)}>
          {t.smart.sim.add10}
        </Button>
        <Button variant="secondary" disabled={finished || status === "none"} onClick={() => advance(20)}>
          {t.smart.sim.add20}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            actions.resetSimulation();
            toast(t.smart.sim.resetDone);
          }}
        >
          <Icon name="refresh" size={18} />
          {t.smart.sim.reset}
        </Button>
      </div>
      <p className="flex items-start gap-1.5 t-caption text-ink-2">
        <Icon name="navigate" size={16} className="mt-0.5 shrink-0" />
        {t.smart.sim.position}
      </p>
    </section>
  );
}
