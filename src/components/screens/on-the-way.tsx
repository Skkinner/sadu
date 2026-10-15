"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { Stamp } from "@/components/sadu/brand";
import { JourneyThread } from "@/components/sadu/journey-thread";
import { LayerBadge, OriginNote } from "@/components/sadu/layers";
import { NarrationPlayer } from "@/components/sadu/narration-player";
import { RouteDiagram } from "@/components/sadu/route-diagram";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { getPavilion, type Pavilion } from "@/data/pavilions";
import { useBridge } from "@/lib/ai-client";
import { clock } from "@/lib/format";
import { actions, activeStops, journeyMetrics, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// D20, D40, D44, D48, D52 / M20… · On the way: optimized route, narrative bridge from the previous stop
export function OnTheWayScreen({ pavilion: p }: { pavilion: Pavilion }) {
  const { t, fmt, href, l, locale } = useI18n();
  const router = useRouter();
  const stops = useStore(activeStops);
  const allStops = useStore((s) => s.journey.stops);
  const gate = useStore((s) => s.plan.gate);
  const position = useStore((s) => s.journey.position);
  const metrics = useStore(journeyMetrics);
  const narration = useStore((s) => s.plan.narrationLang ?? locale);
  const idx = stops.findIndex((s) => s.id === p.id);
  const stop = stops[idx];
  // the bridge follows the actual route: from the last completed stop to this one
  const previous = [...stops.slice(0, Math.max(idx, 0))].reverse().find((s) => s.status === "done") ?? null;
  const bridge = useBridge(previous?.id ?? null, p.id, narration);
  const directionIcons: IconName[] = ["arrow-right", "navigate", "check-circle"];

  useEffect(() => {
    actions.startJourney();
  }, []);

  const arrive = () => {
    actions.arrive(p.id);
    router.push(href(`/pavilion/${p.id}`));
  };

  const meta = stop ? fmt(t.smart.stop.legMeta, { walk: stop.walkMin, time: clock(stop.arriveAt, locale) }) : t.smart.stop.notInPlan;

  const nextStop = (
    <div className="flex items-center gap-3 rounded-[20px] border border-line bg-card p-3.5">
      <Stamp id={p.id} size={52} />
      <div className="min-w-0 flex-1">
        <p className="t-overline text-gold-text">{t.onTheWay.nextStop}</p>
        <p className="t-body-strong text-ink">{l(p.title)}</p>
        <p className="t-caption text-ink-2">{meta}</p>
      </div>
    </div>
  );

  const story = (
    <div className="flex flex-col gap-3 rounded-[20px] bg-night p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 t-overline text-saffron">{t.smart.bridge.title}</p>
        {bridge.status === "ready" && <OriginNote origin={bridge.data.origin} model={bridge.data.model} notice={bridge.data.notice} className="[&_span.t-caption]:text-cream/70" />}
      </div>
      {!previous ? (
        <p className="t-body text-cream" lang={narration}>
          {fmt(t.smart.bridge.first, { place: l(p.place) })}
        </p>
      ) : bridge.status === "ready" ? (
        <>
          <p className="t-body-l text-cream" lang={narration} dir={narration === "ar" ? "rtl" : "ltr"}>
            {bridge.data.data.text}
          </p>
          <NarrationPlayer dark parts={[{ text: bridge.data.data.text }]} lang={narration} request={() => ({ kind: "bridge", fromId: previous.id, toId: p.id, lang: narration })} />
        </>
      ) : (
        <p className="flex items-center gap-2 t-body text-cream/80" role="status">
          <span aria-hidden className="size-4 rounded-full border-2 border-cream/30 border-t-saffron animate-[sadu-spin_1s_linear_infinite]" />
          {t.smart.bridge.loading}
        </p>
      )}
      {previous && <p className="t-caption text-cream/60">{fmt(t.smart.bridge.from, { from: l(getPavilion(previous.id)!.shortTitle) })}</p>}
    </div>
  );

  return (
    <PageShell
      header={{ type: "back", title: t.onTheWay.appTitle, backHref: href("/journey") }}
      actionBar={
        <Button size="lg" block leading="navigate" onClick={arrive}>
          {t.smart.sim.arrivedLong}
        </Button>
      }
    >
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[712px] lg:flex-1">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between t-label text-ink-2">
              <span>{idx >= 0 ? fmt(t.common.stopOf, { n: idx + 1, total: stops.length }) : t.smart.stop.notInPlan}</span>
              <span className="flex items-center gap-1.5">
                {fmt(t.onTheWay.left, { n: Math.max(0, metrics.remainingBudget) })}
                <LayerBadge layer="sim" />
              </span>
            </div>
            {stops.length > 0 && <JourneyThread total={stops.length} current={Math.max(idx, 0)} done={(i) => stops[i]?.status === "done"} />}
          </div>

          <RouteDiagram stops={allStops} gate={gate} position={position} />

          <div className="lg:hidden">{nextStop}</div>
          <div className="lg:hidden">{story}</div>

          <section className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <h2 className="flex-1 t-h3 text-ink">{t.onTheWay.directions}</h2>
              <LayerBadge layer="sim" />
            </div>
            <ol className="divide-y divide-line overflow-hidden rounded-[18px] border border-line">
              {p.route.directions.map((d, i) => (
                <li key={d.en} className={cn("flex items-center gap-3 px-3.5 py-3", i === 0 ? "bg-action-subtle" : "bg-card")}>
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-[14px]", i === 0 ? "bg-action text-on-action" : "bg-muted text-ink")}>
                    <Icon name={directionIcons[i]} size={18} />
                  </span>
                  <span className={cn(i === 0 ? "t-body-strong text-ink" : "t-body text-ink-2")}>{l(d)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="sticky top-28 hidden w-[440px] shrink-0 flex-col gap-6 lg:flex">
          {nextStop}
          {story}
          <Button size="lg" block leading="navigate" onClick={arrive}>
            {t.smart.sim.arrivedLong}
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}
