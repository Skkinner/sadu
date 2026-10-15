"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { SaduBand, Stamp } from "@/components/sadu/brand";
import { OriginNote, SourceList } from "@/components/sadu/layers";
import { NarrationPlayer } from "@/components/sadu/narration-player";
import { Button } from "@/components/ui/button";
import { StatusBanner } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import type { Pavilion } from "@/data/pavilions";
import { useContent } from "@/lib/ai-client";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ContentSkeleton } from "./pavilion";

const SPEEDS = [0.75, 1, 1.25, 1.5];

// D21, D41, D45, D49, D53 / M21… · Now playing: AI story for the depth being visited, read by a neural voice
export function ListenScreen({ pavilion: p }: { pavilion: Pavilion }) {
  const { t, fmt, href, l, locale } = useI18n();
  const router = useRouter();
  const captions = useStore((s) => s.prefs.captions);
  const speed = useStore((s) => s.prefs.speed);
  const narration = useStore((s) => s.plan.narrationLang ?? locale);
  const stop = useStore((s) => s.journey.stops.find((x) => x.id === p.id) ?? null);
  const preferred = useStore((s) => s.plan.depth);
  const depth = stop?.depth ?? preferred;
  const content = useContent(p.id, depth, narration);
  const [part, setPart] = useState(0);
  const [transcript, setTranscript] = useState(false);
  const sections = content.status === "ready" ? content.data.data.sections : [];
  const dir = narration === "ar" ? "rtl" : "ltr";

  const done = () => {
    if (stop && stop.status !== "done" && stop.status !== "removed") actions.complete(p.id);
    router.push(href(`/pavilion/${p.id}/quiz`));
  };
  const cycleSpeed = () => actions.setPrefs({ speed: SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length] ?? 1 });

  const artwork = (
    <div className="relative mx-auto grid aspect-square w-full max-w-[300px] place-items-center overflow-hidden rounded-[36px] bg-night shadow-sheet">
      {[
        [-30, -20],
        [90, -20],
        [210, -20],
        [-30, 230],
        [90, 230],
        [210, 230],
      ].map(([x, y], i) => (
        <span key={i} aria-hidden className="absolute size-[16.5%] rotate-45 rounded-lg bg-saffron/[0.07]" style={{ left: `${((x + 10) / 300) * 100}%`, top: `${((y + 10) / 300) * 100}%` }} />
      ))}
      <Stamp id={p.id} size={190} className="relative h-auto w-[63%]" />
      <SaduBand count={20} size={10} gap={8} palette={["#F4EFE6", "#E2A33A", "#A3232E"]} className="absolute inset-x-0 bottom-4 justify-center" />
    </div>
  );
  const doneLabel = stop && stop.status !== "done" ? t.smart.sim.doneLong : t.player.done;

  return (
    <PageShell
      header={{ type: "close", title: t.player.appTitle, backHref: href(`/pavilion/${p.id}`) }}
      actionBar={
        <Button size="lg" block trailing="arrow-right" onClick={done}>
          {doneLabel}
        </Button>
      }
    >
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 lg:mx-0 lg:max-w-[692px] lg:flex-1">
          <div className="lg:hidden">{artwork}</div>
          <div className="flex flex-col gap-1">
            <h1 className="t-h1 text-ink" lang={narration} dir={dir}>
              {content.status === "ready" ? content.data.data.title : l(p.title)}
            </h1>
            <p className="t-body text-ink-2">{fmt(t.smart.content.listenMeta, { place: l(p.place), depth: t.depth[depth], lang: t.plan.narrationLangs[narration] })}</p>
          </div>

          {content.status === "loading" && <ContentSkeleton label={t.smart.content.loading} />}
          {content.status === "error" && <StatusBanner type="error" title={t.smart.content.error} />}
          {content.status === "ready" && (
            <>
              <OriginNote origin={content.data.origin} model={content.data.model} notice={content.data.notice} />
              <div className="rounded-[22px] border border-line bg-card p-4">
                <NarrationPlayer
                  parts={sections.map((s) => ({ heading: s.heading, text: s.text }))}
                  lang={narration}
                  request={(i) => ({ kind: "content", stationId: p.id, depth, lang: narration, section: i })}
                  onPart={setPart}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <ChipButton icon="clock" onClick={cycleSpeed}>
                  {fmt(t.player.speed, { s: speed })}
                </ChipButton>
                <ChipButton icon="captions" on={captions} onClick={() => actions.setPrefs({ captions: !captions })}>
                  {t.player.captions}
                </ChipButton>
                <ChipButton icon="summary" on={transcript} onClick={() => setTranscript((v) => !v)}>
                  {t.player.transcript}
                </ChipButton>
              </div>

              {captions && sections[part] && (
                <div className="flex flex-col gap-2 rounded-[22px] bg-muted p-[18px]" aria-live="polite" lang={narration} dir={dir}>
                  <p className="t-label text-gold-text">{sections[part].heading}</p>
                  <p className="t-body-l text-ink">{sections[part].text}</p>
                </div>
              )}
              {!captions && <p className="rounded-[22px] bg-muted p-[18px] t-caption text-ink-2">{t.player.captionsOff}</p>}

              {transcript && (
                <section className="flex flex-col gap-3 rounded-[22px] border border-line p-[18px]" lang={narration} dir={dir}>
                  <h2 className="t-h3 text-ink">{t.player.transcriptTitle}</h2>
                  {sections.map((s, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <p className="t-label text-gold-text">
                        {i + 1}. {s.heading}
                      </p>
                      <p className="t-body text-ink-2">{s.text}</p>
                    </div>
                  ))}
                </section>
              )}

              <section className="flex flex-col gap-2.5">
                <h2 className="t-h3 text-ink">{t.player.chapters}</h2>
                <ol className="divide-y divide-line overflow-hidden rounded-[18px] border border-line" lang={narration} dir={dir}>
                  {sections.map((s, i) => (
                    <li key={i} className={cn("flex items-center gap-3 px-3.5 py-3", i === part ? "bg-gold-subtle" : "bg-card")}>
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-[14px]", i < part ? "bg-action-subtle text-action" : i === part ? "bg-gold text-night" : "bg-muted text-ink")}>
                        <Icon name={i < part ? "check" : i === part ? "volume" : "play"} size={16} directional={false} />
                      </span>
                      <span className={cn("flex-1", i === part ? "t-body-strong text-ink" : "t-body text-ink")}>{s.heading}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <SourceList references={content.data.references} />
            </>
          )}
        </div>

        <aside className="sticky top-28 hidden w-[460px] shrink-0 flex-col gap-6 pt-1 lg:flex">
          {artwork}
          <Button size="lg" block trailing="arrow-right" onClick={done}>
            {doneLabel}
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

function ChipButton({ icon, on, onClick, children }: { icon: "clock" | "captions" | "summary"; on?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("flex h-9 items-center gap-1.5 rounded-full px-3 t-label transition-colors", on ? "bg-action-subtle text-action" : "bg-muted text-ink hover:bg-line")}
    >
      <Icon name={icon} size={18} />
      {children}
    </button>
  );
}
