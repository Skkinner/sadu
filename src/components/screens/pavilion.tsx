"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { PassportStamp, Stamp } from "@/components/sadu/brand";
import { ScoreBreakdown, WhyLine } from "@/components/sadu/explain";
import { IllustrativeNote, LayerBadge, OriginNote, SourceList } from "@/components/sadu/layers";
import { DepthPicker } from "@/components/sadu/options";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { STATIONS } from "@/data/stations";
import type { Pavilion } from "@/data/pavilions";
import { useContent } from "@/lib/ai-client";
import { actions, activeStops, journeyMetrics, journeyMinutes, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

// D15–D19 / M15–M19 · Station: AI story at the planned depth, explanation, simulated arrival
export function PavilionScreen({ pavilion: p }: { pavilion: Pavilion }) {
  const { t, fmt, href, l, locale } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const stop = useStore((s) => s.journey.stops.find((x) => x.id === p.id) ?? null);
  const stops = useStore(activeStops);
  const total = useStore(journeyMinutes);
  const metrics = useStore(journeyMetrics);
  const saved = useStore((s) => s.saved.includes(p.id));
  const collected = useStore((s) => !!s.journey.stamps[p.id]);
  const answered = useStore((s) => !!s.journey.answers[p.id]);
  const narration = useStore((s) => s.plan.narrationLang ?? locale);
  const preferred = useStore((s) => s.plan.depth);
  const inPlan = !!stop && stop.status !== "removed";
  const depth = stop?.depth ?? preferred;
  const content = useContent(p.id, depth, narration);
  const n = stops.findIndex((s) => s.id === p.id) + 1;
  const access = STATIONS[p.id].access;

  const save = () => {
    actions.toggleSaved(p.id);
    toast(saved ? t.common.toast.saved : t.pavilion.saved);
  };
  const arrive = () => {
    actions.startJourney();
    actions.arrive(p.id);
  };
  const done = () => {
    actions.complete(p.id);
    router.push(href(`/pavilion/${p.id}/quiz`));
  };

  const primary = !inPlan ? (
    <Button asChild size="lg" block>
      <Link href={href("/journey")}>{t.smart.stop.backToJourney}</Link>
    </Button>
  ) : stop.status === "upcoming" ? (
    <Button size="lg" block leading="navigate" onClick={arrive}>
      {t.smart.sim.arrivedLong}
    </Button>
  ) : stop.status === "arrived" ? (
    <Button size="lg" block trailing="arrow-right" onClick={() => router.push(href(`/pavilion/${p.id}/listen`))}>
      {t.pavilion.start}
    </Button>
  ) : (
    <Button size="lg" block trailing="arrow-right" onClick={() => router.push(href(answered ? "/journey" : `/pavilion/${p.id}/quiz`))}>
      {answered ? t.smart.stop.backToJourney : t.smart.quiz.take}
    </Button>
  );
  const actionsNode = (
    <>
      {primary}
      {inPlan && stop.status === "arrived" && (
        <Button variant="secondary" size="lg" block leading="check" onClick={done}>
          {t.smart.sim.doneLong}
        </Button>
      )}
      <Button variant="ghost" block onClick={save} leading={saved ? "bookmark" : undefined} aria-pressed={saved}>
        {saved ? t.pavilion.unsave : t.pavilion.save}
      </Button>
    </>
  );

  const cover = (
    <div className="relative grid h-[200px] place-items-center overflow-hidden rounded-[28px] lg:h-[360px]" style={{ background: p.cover }}>
      {[
        [-20, -10],
        [65, 110],
        [150, -10],
        [235, 110],
        [320, -10],
        [405, 110],
        [490, -10],
      ].map(([x, y], i) => (
        <span key={i} aria-hidden className="absolute size-[42px] rotate-45 rounded-md bg-white/[0.06]" style={{ insetInlineStart: x + 9, top: y + 9 }} />
      ))}
      <Stamp id={p.id} size={240} className="relative size-[150px] lg:size-[240px]" />
      <span className="absolute bottom-4 end-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 t-label text-night shadow-card">
        <Icon name="headphones" size={16} />
        {t.depth[depth]}
      </span>
    </div>
  );

  const collect = (
    <div className="flex items-center gap-3.5 rounded-[20px] bg-gold-subtle p-3.5">
      <PassportStamp id={p.id} locked={!collected} width={73} />
      <div className="flex flex-col gap-1">
        <p className="t-h3 text-ink">{collected ? t.pavilion.collected : fmt(t.pavilion.collect, { country: l(p.collectName) })}</p>
        <p className="t-caption text-ink-2">{collected ? t.pavilion.collectedBody : t.pavilion.collectBody}</p>
      </div>
    </div>
  );

  const heading = inPlan ? fmt(t.common.stopOf, { n, total: stops.length }) : t.smart.stop.notInPlan;

  return (
    <PageShell header={{ type: "back", title: heading, backHref: href("/journey") }} actionBar={actionsNode}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[632px] lg:flex-1">
          <div className="lg:hidden">{cover}</div>
          <nav aria-label="Breadcrumb" className="hidden items-center gap-2 t-body-strong lg:flex">
            <Link href={href("/journey")} className="text-action hover:underline">
              {t.pavilion.breadcrumb}
            </Link>
            <span className="text-ink-2">/</span>
            <span className="text-ink-2">{heading}</span>
          </nav>
          <div className="flex flex-col gap-2.5">
            <h1 className="t-h1 text-ink">{l(p.title)}</h1>
            <ul className="flex flex-wrap items-center gap-x-3.5 gap-y-1 t-caption text-ink-2">
              {inPlan && (
                <>
                  <li className="flex items-center gap-1">
                    <Icon name="navigate" size={16} />
                    {fmt(t.pavilion.walk, { n: stop.walkMin })}
                  </li>
                  <li className="flex items-center gap-1">
                    <Icon name="timer" size={16} />
                    {fmt(t.smart.stop.queue, { n: stop.queueMin })}
                    <LayerBadge layer="sim" />
                  </li>
                </>
              )}
              <li className="flex items-center gap-1">
                <Icon name="station" size={16} />
                {l(p.floor)}
              </li>
              {access.stepFree && (
                <li className="flex items-center gap-1">
                  <Icon name="check-circle" size={16} />
                  {t.smart.stop.stepFree}
                </li>
              )}
            </ul>
            <IllustrativeNote />
          </div>

          {inPlan && stop.status === "arrived" && (
            <StatusBanner type="success" title={t.smart.stop.arrivedTitle} icon="navigate">
              {t.smart.stop.arrivedBody}
            </StatusBanner>
          )}
          {inPlan && stop.change?.type === "downgraded" && (
            <StatusBanner type="warning" title={fmt(t.smart.adjust.shortenedTag, { from: t.depth[stop.change.from] })}>
              {t.smart.adjust.shortenedBody}
            </StatusBanner>
          )}

          {inPlan && (stop.status === "upcoming" || stop.status === "arrived") && (
            <section className="flex flex-col gap-3">
              <h2 className="t-h3 text-ink">{t.pavilion.chooseDepth}</h2>
              {stop.status === "upcoming" ? (
                <DepthPicker value={stop.depth} onChange={(d) => actions.setDepth(p.id, d)} label={t.pavilion.chooseDepth} />
              ) : (
                <p className="t-body text-ink-2">{fmt(t.smart.stop.depthLocked, { depth: t.depth[stop.depth] })}</p>
              )}
              <p
                className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 t-label", metrics.behind ? "bg-error-subtle text-error" : "bg-action-subtle text-action")}
                aria-live="polite"
              >
                <Icon name={metrics.behind ? "timer" : "check-circle"} size={18} />
                {metrics.behind ? fmt(t.smart.stop.overBudget, { n: metrics.remainingPlan, left: metrics.remainingBudget }) : fmt(t.pavilion.stillMin, { n: total })}
              </p>
            </section>
          )}

          {inPlan && (
            <section className="flex flex-col gap-2">
              <WhyLine score={stop.score} />
              <ScoreBreakdown score={stop.score} />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="t-h3 text-ink">{fmt(t.smart.content.storyAt, { depth: t.depth[depth] })}</h2>
              <span className="t-caption text-ink-2">{t.plan.narrationLangs[narration]}</span>
            </div>
            {content.status === "ready" ? (
              <>
                <OriginNote origin={content.data.origin} model={content.data.model} notice={content.data.notice} />
                <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4" lang={narration} dir={narration === "ar" ? "rtl" : "ltr"}>
                  <p className="t-h3 text-ink">{content.data.data.title}</p>
                  <ul className="flex flex-col gap-2.5">
                    {content.data.data.takeaways.map((item) => (
                      <li key={item} className="flex gap-2.5 t-body text-ink">
                        <span className="grid h-[25px] w-5 shrink-0 place-items-center">
                          <span className="size-[7px] rotate-45 bg-gold" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <ol className="divide-y divide-line overflow-hidden rounded-[18px] border border-line">
                    {content.data.data.sections.map((s, i) => (
                      <li key={i} className="flex items-center gap-3 bg-card px-3.5 py-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted t-label text-ink">{i + 1}</span>
                        <span className="flex-1 t-body-strong text-ink">{s.heading}</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <SourceList references={content.data.references} />
              </>
            ) : content.status === "error" ? (
              <StatusBanner type="error" title={t.smart.content.error} />
            ) : (
              <ContentSkeleton label={t.smart.content.loading} />
            )}
          </section>

          <div className="lg:hidden">{collect}</div>
        </div>

        <aside className="sticky top-28 hidden w-[480px] shrink-0 flex-col gap-6 lg:flex">
          {cover}
          {collect}
          <div className="flex flex-col gap-2.5">{actionsNode}</div>
        </aside>
      </div>
    </PageShell>
  );
}

export function ContentSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4" role="status" aria-live="polite">
      <p className="flex items-center gap-2 t-label text-ink-2">
        <span aria-hidden className="size-4 rounded-full border-2 border-line border-t-action animate-[sadu-spin_1s_linear_infinite]" />
        {label}
      </p>
      {[90, 75, 82].map((w, i) => (
        <span key={i} className="h-3 animate-pulse rounded-full bg-muted" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
