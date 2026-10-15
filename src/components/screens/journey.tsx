"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { SaduBand } from "@/components/sadu/brand";
import { LayerBadge } from "@/components/sadu/layers";
import { RouteMapCard, RouteMapPreview, stopStatus } from "@/components/sadu/maps";
import { SimulationPanel } from "@/components/sadu/simulation-panel";
import { StationCard } from "@/components/sadu/station-card";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { PERSONALIZATION } from "@/config/personalization";
import { queueSlot } from "@/config/queue-estimates";
import { getPavilion } from "@/data/pavilions";
import type { Change } from "@/lib/engine";
import { clock, durationLabel } from "@/lib/format";
import { actions, activeStops, currentStop, journeyMinutes, useHydrated, useStore } from "@/lib/store";

// D13 / M13 · Your journey: the personalized plan, its explanation, and the demo simulation controls
export function JourneyScreen() {
  const { t, fmt, href, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const name = useStore((s) => s.user?.firstName ?? "");
  const plan = useStore((s) => s.plan);
  const journey = useStore((s) => s.journey);
  const total = useStore(journeyMinutes);
  const stops = useStore(activeStops);
  const current = useStore(currentStop);

  if (hydrated && journey.status === "none") return <EmptyJourney />;

  const start = PERSONALIZATION.demoStartMinute;
  const end = start + journey.clock.delay + total;
  const active = journey.status === "active";
  const complete = journey.status === "complete";
  const sum = (k: "walkMin" | "queueMin" | "experienceMin") => stops.reduce((n, s) => n + s[k], 0);
  const lastAdjustment = journey.adjustments.at(-1);

  const go = () => {
    if (complete || !current) return router.push(href("/essence"));
    actions.startJourney();
    router.push(href(current.status === "arrived" ? `/pavilion/${current.id}` : `/pavilion/${current.id}/route`));
  };
  const cta = complete ? t.badge.essence : active ? t.journey.resume : t.journey.start;
  const buffer = Math.max(0, journey.budget - total - journey.clock.delay);

  return (
    <PageShell header={{ type: "logo" }} tab="journey">
      <div className="page-container flex items-start gap-10 pb-10 pt-2 lg:pb-24 lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[640px] lg:flex-1">
          <div className="flex flex-col gap-2">
            <h1 className="t-h1 text-ink lg:t-display">{fmt(active || complete ? t.journey.titleActive : t.journey.title, { name: name || "" }).replace(/[,،] ?$|يا $/, "")}</h1>
            <p className="t-body text-ink-2 lg:t-body-l">{fmt(t.journey.lead, { n: stops.length, time: durationLabel(journey.budget, locale), gate: t.plan.gates[plan.gate] })}</p>
          </div>

          <section className="rounded-3xl bg-inverse text-on-inverse shadow-raised">
            <div className="hidden items-center gap-8 px-7 py-6 lg:flex">
              <Stat value={stops.length} label={t.journey.stopsUnit} />
              <Stat value={total} label={t.journey.minutesUnit} />
              <Stat value={buffer} label={t.journey.bufferUnit} />
              <div className="min-w-0 flex-1">
                <p className="t-caption text-on-inverse/75">{t.journey.timing}</p>
                <p className="t-body-strong" dir="ltr">
                  <bdi>{clock(start, locale)}</bdi> → <bdi>{clock(end, locale)}</bdi>
                </p>
              </div>
              <Button size="lg" className="shrink-0" trailing="arrow-right" onClick={go}>
                {cta}
              </Button>
            </div>
            <div className="flex flex-col gap-5 p-5 lg:hidden">
              <div className="grid grid-cols-3">
                <Stat value={stops.length} label={t.journey.stopsUnit} />
                <Stat value={total} label={t.journey.minutesUnit} />
                <Stat value={buffer} label={t.journey.bufferUnit} />
              </div>
              <SaduBand count={24} size={8} gap={7} palette={["rgb(244 239 230 / 0.35)", "rgb(244 239 230 / 0.35)", "#E2A33A"]} />
              <p className="flex items-center gap-2.5 t-body-strong">
                <Icon name="clock" size={20} />
                <bdi>{clock(start, locale)}</bdi>
                <Icon name="arrow-right" size={18} />
                <bdi>{clock(end, locale)}</bdi>
              </p>
              <Button size="lg" block trailing="arrow-right" onClick={go}>
                {cta}
              </Button>
            </div>
          </section>

          {complete && journey.endReason === "timeUp" && <StatusBanner type="warning" title={t.smart.adjust.endedTitle}>{t.smart.adjust.ended}</StatusBanner>}
          {lastAdjustment && !lastAdjustment.ended && <AdjustmentNotice changes={lastAdjustment.changes} delay={journey.clock.delay} />}

          <div className="lg:hidden">
            <SimulationPanel />
          </div>
          <RouteMapPreview className="lg:hidden" />

          <TimeBreakdown experience={sum("experienceMin")} walking={sum("walkMin")} queue={sum("queueMin")} total={total} budget={journey.budget} />

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="t-h2 text-ink lg:t-h1">{t.journey.yourStops}</h2>
              <Button asChild variant="secondary" className="max-lg:h-12 max-lg:border-0 max-lg:bg-transparent max-lg:px-2 max-lg:text-action">
                <Link href={href("/plan")}>
                  <span className="lg:hidden">{t.journey.editShort}</span>
                  <span className="max-lg:hidden">{t.journey.edit}</span>
                </Link>
              </Button>
            </div>
            <ol className="flex flex-col gap-3.5 lg:gap-4">
              {journey.stops.map((stop) => {
                const status = stopStatus(journey.stops, stop, journey.status);
                const n = stops.findIndex((s) => s.id === stop.id) + 1;
                const isCurrent = status === "current" && !complete;
                return (
                  <li key={stop.id}>
                    <StationCard
                      stop={stop}
                      n={n}
                      status={status}
                      href={href(`/pavilion/${stop.id}`)}
                      actions={
                        isCurrent ? (
                          stop.status === "arrived" ? (
                            <>
                              <Button size="sm" onClick={() => router.push(href(`/pavilion/${stop.id}/listen`))} leading="headphones">
                                {t.smart.stop.listen}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                leading="check"
                                onClick={() => {
                                  actions.complete(stop.id);
                                  router.push(href(`/pavilion/${stop.id}/quiz`));
                                }}
                              >
                                {t.smart.sim.done}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              leading="navigate"
                              onClick={() => {
                                actions.arrive(stop.id);
                                router.push(href(`/pavilion/${stop.id}`));
                              }}
                            >
                              {t.smart.sim.arrived}
                            </Button>
                          )
                        ) : undefined
                      }
                    />
                  </li>
                );
              })}
            </ol>
            {journey.excluded.length > 0 && <Excluded />}
          </section>
        </div>

        <aside className="sticky top-28 hidden w-[480px] shrink-0 flex-col gap-5 lg:flex">
          <RouteMapCard />
          <RouteStats />
          <SimulationPanel />
        </aside>
      </div>
    </PageShell>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="t-display">{value}</span>
      <span className="t-caption text-on-inverse/75">{label}</span>
    </div>
  );
}

/** "Your journey has been adjusted" with the reason for every downgrade / removal. */
export function AdjustmentNotice({ changes, delay }: { changes: Change[]; delay: number }) {
  const { t, fmt, l } = useI18n();
  if (!changes.length) return null;
  const place = (id: Change["id"]) => l(getPavilion(id)!.shortTitle);
  return (
    <section className="flex flex-col gap-2.5 rounded-2xl bg-gold-subtle p-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name="timer" size={20} className="text-gold-text" />
        <h2 className="flex-1 t-body-strong text-gold-text">{t.smart.adjust.title}</h2>
        <span className="flex gap-1.5">
          <span className="inline-flex"><AlgoBadge /></span>
        </span>
      </div>
      <p className="t-caption text-ink">{fmt(t.smart.adjust.why, { n: delay })}</p>
      <ul className="flex flex-col gap-1">
        {changes.map((c) => (
          <li key={c.id} className="flex items-start gap-2 t-body text-ink">
            <span className="mt-2 size-[7px] shrink-0 rotate-45 bg-gold" />
            {c.type === "downgraded"
              ? fmt(t.smart.adjust.downgraded, { place: place(c.id), from: t.depth[c.from], to: t.depth[c.to] })
              : fmt(t.smart.adjust.removed, { place: place(c.id) })}
          </li>
        ))}
      </ul>
    </section>
  );
}

const AlgoBadge = () => <LayerBadge layer="algo" />;

function TimeBreakdown({ experience, walking, queue, total, budget }: { experience: number; walking: number; queue: number; total: number; budget: number }) {
  const { t, fmt, locale } = useI18n();
  const delay = useStore((s) => s.journey.clock.delay);
  const rows: [string, number, boolean?][] = [
    [t.smart.time.experience, experience],
    [t.smart.time.walking, walking],
    [t.smart.time.queue, queue, true],
  ];
  if (delay) rows.push([t.smart.time.delay, delay, true]);
  const slot = t.smart.time.slots[queueSlot(PERSONALIZATION.demoStartMinute)];
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h3 text-ink">{t.smart.time.title}</h2>
        <LayerBadge layer="algo" />
      </div>
      <dl className="flex flex-col gap-1.5">
        {rows.map(([label, n, sim]) => (
          <div key={label} className="flex items-center justify-between gap-3 t-body text-ink-2">
            <dt className="flex items-center gap-2">
              {label}
              {sim && <LayerBadge layer="sim" />}
            </dt>
            <dd className="tabular-nums text-ink">{fmt(t.smart.time.min, { n })}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-line pt-2 t-body-strong text-ink">
          <dt>{t.smart.time.total}</dt>
          <dd className="tabular-nums">
            {fmt(t.smart.time.ofBudget, { n: total + delay, budget: durationLabel(budget, locale) })}
          </dd>
        </div>
      </dl>
      <p className="t-caption text-ink-3">
        {fmt(t.smart.time.assumptions, { speed: PERSONALIZATION.walkingMetresPerMinute, kmh: (PERSONALIZATION.walkingMetresPerMinute * 0.06).toFixed(1), slot })}
      </p>
    </section>
  );
}

function RouteStats() {
  const { t, fmt } = useI18n();
  const route = useStore((s) => s.journey.route);
  if (!route) return null;
  return (
    <section className="flex flex-col gap-2 rounded-[22px] border border-line bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h3 text-ink">{t.smart.route.title}</h2>
        <LayerBadge layer="algo" />
      </div>
      <p className="t-body text-ink-2">{fmt(t.smart.route.stats, { nn: route.nearestNeighbourM, opt: route.optimizedM })}</p>
      <p className="t-caption text-ink-3">{route.improvedBy > 0 ? fmt(t.smart.route.saved, { n: route.improvedBy }) : t.smart.route.same}</p>
    </section>
  );
}

function Excluded() {
  const { t, l } = useI18n();
  const excluded = useStore((s) => s.journey.excluded);
  return (
    <details className="group rounded-[20px] border border-dashed border-line px-4 py-3">
      <summary className="flex cursor-pointer list-none items-center gap-2 t-label text-ink-2">
        <span className="flex-1">
          {t.smart.excluded.title} ({excluded.length})
        </span>
        <Icon name="chevron-down" size={18} className="transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-2 flex flex-col gap-1.5">
        {excluded.map((e) => (
          <li key={e.id} className="flex justify-between gap-3 t-caption text-ink-2">
            <span className="text-ink">{l(getPavilion(e.id)!.shortTitle)}</span>
            <span>{t.smart.excluded[e.why]}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function EmptyJourney() {
  const { t, href } = useI18n();
  return (
    <PageShell header={{ type: "logo" }} tab="journey">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center">
        <span className="grid size-16 place-items-center rounded-[14px] bg-gold-subtle text-gold-text">
          <Icon name="route" size={30} />
        </span>
        <h1 className="t-h1 text-ink">{t.journey.empty.title}</h1>
        <p className="max-w-md t-body text-ink-2">{t.journey.empty.body}</p>
        <Button asChild size="lg">
          <Link href={href("/plan")}>
            {t.journey.empty.cta}
            <Icon name="arrow-right" size={20} />
          </Link>
        </Button>
      </div>
    </PageShell>
  );
}
