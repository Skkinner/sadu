"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Celebration } from "@/components/sadu/celebration";
import { LayerBadge, OriginNote, SourceList } from "@/components/sadu/layers";
import { AnswerOption, type AnswerState } from "@/components/sadu/options";
import { Button, IconButton } from "@/components/ui/button";
import { PointsPill, ProgressBar, StatusBanner } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { getPavilion, type Pavilion } from "@/data/pavilions";
import { useQuiz } from "@/lib/ai-client";
import { isCorrect, quizDepthFor } from "@/lib/engine";
import { speak } from "@/lib/speech";
import { actions, activeStops, currentStop, level, points, useStore } from "@/lib/store";
import { ContentSkeleton } from "./pavilion";

// D23… · Quick quiz: one AI-generated question for the depth the visitor completed, graded by rule
export function QuizScreen({ pavilion: p }: { pavilion: Pavilion }) {
  const { t, fmt, href, l, locale } = useI18n();
  const router = useRouter();
  const pts = useStore(points);
  const narration = useStore((s) => s.plan.narrationLang ?? locale);
  const stop = useStore((s) => s.journey.stops.find((x) => x.id === p.id) ?? null);
  const preferred = useStore((s) => s.plan.depth);
  const previous = useStore((s) => s.journey.answers[p.id] ?? null);
  const depth = stop ? quizDepthFor(stop) : preferred;
  const quiz = useQuiz(p.id, depth, narration);
  const q = quiz.status === "ready" ? quiz.data : null;
  const picked = q && previous?.questionId === q.questionId ? previous.picked : null;

  const stateFor = (i: number): AnswerState => {
    if (picked === null || !q) return "default";
    if (i === q.data.correctIndex) return "correct";
    if (i === picked) return "wrong";
    return "muted";
  };

  const pick = (i: number) => {
    if (!q || picked !== null) return;
    actions.answerQuiz(p.id, { questionId: q.questionId, depth, question: q.data.question, options: q.data.options, picked: i, correctIndex: q.data.correctIndex, origin: q.origin });
  };
  const next = () => router.push(href(`/pavilion/${p.id}/stamp`));
  const correct = picked !== null && q ? isCorrect({ picked, correctIndex: q.data.correctIndex }) : null;
  const dir = narration === "ar" ? "rtl" : "ltr";

  const nextButton = (
    <Button size="lg" block trailing="arrow-right" onClick={next} disabled={picked === null}>
      {t.quiz.finish}
    </Button>
  );

  return (
    <PageShell header={{ type: "none" }} actionBar={nextButton}>
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-5 pb-10 pt-4 lg:px-0 lg:pb-[88px] lg:pt-[58px]">
        <div className="flex items-center gap-3">
          <IconButton icon="close" label={t.quiz.exit} onClick={() => router.push(href(`/pavilion/${p.id}`))} />
          <p className="flex-1 t-body-strong text-ink">{t.quiz.title}</p>
          <PointsPill>{fmt(t.common.pts, { n: pts })}</PointsPill>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-muted px-2.5 py-1 t-label text-ink-2">
          <Icon name="station" size={16} />
          {fmt(t.smart.quiz.about, { depth: t.depth[depth], place: l(p.place) })}
        </span>

        {quiz.status === "loading" && <ContentSkeleton label={t.smart.quiz.loading} />}
        {quiz.status === "error" && <StatusBanner type="error" title={t.smart.content.error} />}
        {q && (
          <>
            <OriginNote origin={q.origin} model={q.model} notice={q.notice} />
            <div className="flex items-start gap-3" lang={narration} dir={dir}>
              <h1 className="flex-1 t-h2 text-ink" id="question">
                {q.data.question}
              </h1>
              <IconButton icon="volume" variant="outline" label={t.quiz.listen} onClick={() => speak(`${q.data.question}. ${q.data.options.join(". ")}`, { lang: narration })} />
            </div>
            <div role="radiogroup" aria-labelledby="question" className="flex flex-col gap-3" lang={narration} dir={dir}>
              {q.data.options.map((o, i) => (
                <AnswerOption key={i} state={stateFor(i)} disabled={picked !== null} onSelect={() => pick(i)}>
                  {o}
                </AnswerOption>
              ))}
            </div>
            {picked !== null && (
              <div className="flex flex-col gap-2 rounded-[18px] bg-gold-subtle p-4 motion-safe:animate-[sadu-pop-in_.3s_ease-out]" aria-live="polite">
                <p className="flex flex-wrap items-center gap-2 t-body-strong text-gold-text">
                  <Icon name={correct ? "check-circle" : "info"} size={20} />
                  <span className="flex-1">{correct ? t.quiz.correct : fmt(t.smart.quiz.wrong, { answer: q.data.options[q.data.correctIndex] })}</span>
                  <LayerBadge layer="algo" label={t.smart.quiz.graded} />
                </p>
                <p className="t-body text-ink" lang={narration} dir={dir}>
                  {q.data.explanation}
                </p>
              </div>
            )}
            <SourceList references={q.references} />
          </>
        )}
        <div className="hidden lg:block">{nextButton}</div>
      </div>
    </PageShell>
  );
}

// D24… · Stamp earned
export function StampScreen({ pavilion: p }: { pavilion: Pavilion }) {
  const { t, fmt, href, l } = useI18n();
  const router = useRouter();
  const stops = useStore(activeStops);
  const next = useStore(currentStop);
  const answer = useStore((s) => s.journey.answers[p.id] ?? null);
  const status = useStore((s) => s.journey.status);
  const badge = useStore((s) => !!s.journey.badgeAt);
  const done = stops.filter((s) => s.status === "done").length;
  const correct = answer ? answer.picked === answer.correctIndex : null;

  const buttons = (
    <>
      {status === "complete" || !next ? (
        <Button size="lg" block trailing="arrow-right" onClick={() => router.push(href(badge ? "/badge" : "/essence"))}>
          {badge ? t.stamp.unlock : t.badge.essence}
        </Button>
      ) : (
        <Button size="lg" block trailing="arrow-right" onClick={() => router.push(href(next.status === "arrived" ? `/pavilion/${next.id}` : `/pavilion/${next.id}/route`))}>
          {fmt(t.stamp.next, { place: l(getPavilion(next.id)!.place) })}
        </Button>
      )}
      <Button asChild variant="ghost" block>
        <Link href={href("/journey")}>{t.smart.stop.backToJourney}</Link>
      </Button>
      <Button
        variant="ghost"
        block
        onClick={() => {
          actions.endJourney();
          router.push(href("/essence"));
        }}
      >
        {t.stamp.end}
      </Button>
    </>
  );

  return (
    <PageShell header={{ type: "none" }} actionBar={buttons}>
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 px-5 pb-10 pt-4 lg:px-0 lg:pb-[88px] lg:pt-12">
        <div className="self-start lg:hidden">
          <IconButton icon="close" label={t.common.close} onClick={() => router.push(href("/journey"))} />
        </div>
        <Celebration stamp={p.id} />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="t-h1 text-ink">{fmt(t.stamp.title, { country: l(p.stampName) })}</h1>
          <p className="t-body text-ink-2">{correct === null ? t.stamp.body : correct ? t.smart.quiz.resultRight : t.smart.quiz.resultWrong}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5 rounded-[20px] border border-line bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="t-body-strong text-ink">{fmt(t.stamp.passport, { n: done, total: stops.length })}</p>
            <PointsPill>{fmt(t.common.plusPts, { n: correct ? 10 : 0 })}</PointsPill>
          </div>
          <ProgressBar value={stops.length ? done / stops.length : 0} label={fmt(t.stamp.passport, { n: done, total: stops.length })} />
        </div>
        <div className="hidden w-full flex-col gap-0 lg:flex">{buttons}</div>
      </div>
    </PageShell>
  );
}

// D56 / M56 · Culture Weaver badge
export function BadgeScreen() {
  const { t, fmt, href } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const pts = useStore(points);
  const lv = level(pts);
  const share = async () => {
    const text = t.badge.shareText;
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
        toast(t.common.toast.copied);
      }
    } catch {}
  };
  const buttons = (
    <>
      <Button size="lg" block trailing="arrow-right" onClick={() => router.push(href("/essence"))}>
        {t.badge.essence}
      </Button>
      <Button asChild variant="ghost" block>
        <Link href={href("/passport")}>{t.badge.open}</Link>
      </Button>
      <Button variant="ghost" block onClick={share}>
        {t.badge.share}
      </Button>
    </>
  );
  return (
    <PageShell header={{ type: "none" }} actionBar={buttons}>
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 px-5 pb-10 pt-4 lg:px-0 lg:pb-[88px] lg:pt-12">
        <div className="self-start lg:hidden">
          <IconButton icon="close" label={t.common.close} onClick={() => router.push(href("/home"))} />
        </div>
        <Celebration badge />
        <div className="flex flex-col gap-2 text-center">
          <h1 className="t-h1 text-ink">{t.badge.title}</h1>
          <p className="t-body text-ink-2">{t.badge.body}</p>
        </div>
        <div className="flex w-full flex-col gap-2.5 rounded-[20px] border border-line bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="t-body-strong text-ink">{t.badge.level}</p>
            <PointsPill>{fmt(t.common.plusPts, { n: 100 })}</PointsPill>
          </div>
          <ProgressBar value={Math.min(1, (pts - lv.floor) / (lv.next - lv.floor) || 0.6)} />
        </div>
        <div className="hidden w-full flex-col lg:flex">{buttons}</div>
      </div>
    </PageShell>
  );
}
