"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CelebrateArt } from "@/components/brand/art";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { LayerBadge, OriginNote } from "@/components/sadu/layers";
import { PassportStamp, SaduBand, Stamp } from "@/components/sadu/brand";
import { Button } from "@/components/ui/button";
import { SectionHeader, StatusBanner, Tag } from "@/components/ui/controls";
import { Icon, type IconName } from "@/components/ui/icon";
import { getPavilion, pavilions } from "@/data/pavilions";
import { requestSummary } from "@/lib/ai-client";
import { rankMissed } from "@/lib/engine";
import { clockFromDate } from "@/lib/format";
import { actions, activeStops, correctAnswers, fullName, level, points, stampCount, useStore, visitorPrefs } from "@/lib/store";
import { cn } from "@/lib/utils";

function useShare() {
  const toast = useToast();
  const { t } = useI18n();
  return async (text: string) => {
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.origin });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
        toast(t.common.toast.copied);
      }
    } catch {
      /* user cancelled */
    }
  };
}

// D25 / M25 · Your essence: real session stats + the AI-written personal summary
export function EssenceScreen() {
  const { t, fmt, href } = useI18n();
  const toast = useToast();
  const share = useShare();
  const stops = useStore(activeStops);
  const pts = useStore(points);
  const correct = useStore(correctAnswers);
  const answered = useStore((s) => Object.keys(s.journey.answers).length);
  const email = useStore((s) => s.user?.email ?? "");
  const elapsed = useStore((s) => s.journey.clock.elapsed);
  const done = stops.filter((s) => s.status === "done");

  const stats: { icon: IconName; value: string | number; label: string }[] = [
    { icon: "route", value: done.length, label: t.essence.stats.stops },
    { icon: "clock", value: elapsed, label: t.smart.summary.simMinutes },
    { icon: "award", value: pts, label: t.essence.stats.points },
    { icon: "quiz", value: `${correct}/${answered}`, label: t.essence.stats.correct },
  ];

  const buttons = (
    <>
      <Button size="lg" block onClick={() => toast(email ? fmt(t.essence.emailed, { email }) : t.common.toast.sent)}>
        {t.essence.email}
      </Button>
      <Button variant="ghost" block onClick={() => share(fmt(t.essence.shareText, { n: done.length, min: elapsed }))}>
        {t.essence.share}
      </Button>
    </>
  );

  return (
    <PageShell header={{ type: "back", title: t.essence.appTitle, backHref: href("/home") }} actionBar={buttons}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[712px] lg:flex-1">
          <div className="flex flex-col items-center gap-2 text-center lg:items-center">
            <CelebrateArt className="h-[190px] w-60" />
            <h1 className="t-h1 text-ink">{t.essence.title}</h1>
            <p className="t-body text-ink-2">{done.length ? fmt(t.essence.lead, { n: done.length, min: elapsed }) : t.essence.empty}</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:hidden">
            {stats.map((s) => (
              <StatTile key={s.label} {...s} />
            ))}
          </div>

          {done.length > 0 && <SummaryCard />}

          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t.essence.stamps}
              action={
                <Link href={href("/passport")} className="t-body-strong text-action hover:underline">
                  {t.essence.open}
                </Link>
              }
            />
            <div className="flex flex-wrap justify-center gap-1.5">
              {stops.map((s) => (
                <PassportStamp key={s.id} id={s.id} locked={s.status !== "done"} width={61} className="max-w-[19%]" />
              ))}
            </div>
          </section>

          <div className="lg:hidden">
            <MissedCard />
          </div>
        </div>

        <aside className="sticky top-28 hidden w-[440px] shrink-0 flex-col gap-6 lg:flex">
          <div className="grid grid-cols-2 gap-2.5">
            {stats.map((s) => (
              <StatTile key={s.label} {...s} />
            ))}
          </div>
          <MissedCard />
          <div className="flex flex-col gap-2.5">{buttons}</div>
        </aside>
      </div>
    </PageShell>
  );
}

/** Personal summary written by the LLM from this journey (requested once, saved to the account). */
function SummaryCard() {
  const { t, l, locale } = useI18n();
  const journeyId = useStore((s) => s.journey.id);
  const status = useStore((s) => s.journey.status);
  const summary = useStore((s) => s.journey.summary);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const asked = useRef(false);

  const generate = async () => {
    if (!journeyId) return;
    setPending(true);
    setFailed(false);
    try {
      actions.saveSummary(await requestSummary(journeyId, locale));
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  };

  // at the end of a journey, the summary is written automatically (once)
  useEffect(() => {
    if (status === "complete" && !summary && !asked.current) {
      asked.current = true;
      void generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, summary]);

  const s = summary?.data;
  const wrongLang = summary && summary.lang !== locale;
  return (
    <section className="flex flex-col gap-4 rounded-[24px] border border-line bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h2 text-ink">{t.smart.summary.title}</h2>
        {summary && <OriginNote origin={summary.origin} model={summary.model} notice={summary.notice} />}
      </div>
      {pending && (
        <p className="flex items-center gap-2 t-body text-ink-2" role="status">
          <span aria-hidden className="size-4 rounded-full border-2 border-line border-t-action animate-[sadu-spin_1s_linear_infinite]" />
          {t.smart.summary.generating}
        </p>
      )}
      {failed && <StatusBanner type="error" title={t.smart.content.error} />}
      {s && !pending && (
        <div className="flex flex-col gap-4" lang={summary.lang} dir={summary.lang === "ar" ? "rtl" : "ltr"}>
          <p className="t-body-l text-ink">{s.recap}</p>
          {s.themes.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="t-label text-ink-2">{t.smart.summary.themes}</h3>
              <div className="flex flex-wrap gap-2">
                {s.themes.map((th) => (
                  <Tag key={th} type="depth">
                    {th}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {s.highlights.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="t-label text-ink-2">{t.smart.summary.highlights}</h3>
              <ul className="flex flex-col gap-2.5">
                {s.highlights.map((h) => (
                  <li key={h.stationId} className="flex items-start gap-3">
                    <Stamp id={h.stationId} size={36} />
                    <p className="t-body text-ink">
                      <span className="t-body-strong">{l(getPavilion(h.stationId)!.shortTitle)}: </span>
                      {h.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.understood.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="t-label text-ink-2">{t.smart.summary.understood}</h3>
              <ul className="flex flex-col gap-1.5">
                {s.understood.map((u) => (
                  <li key={u} className="flex gap-2.5 t-body text-ink">
                    <Icon name="check-circle" size={20} className="mt-0.5 shrink-0 text-action" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.exploreNext.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="t-label text-ink-2">{t.smart.summary.exploreNext}</h3>
              <ul className="flex flex-col gap-1.5">
                {s.exploreNext.map((x) => (
                  <li key={x.stationId} className="flex gap-2.5 t-body text-ink">
                    <span className="mt-2 size-[7px] shrink-0 rotate-45 bg-gold" />
                    <span>
                      <span className="t-body-strong">{l(getPavilion(x.stationId)!.shortTitle)}: </span>
                      {x.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="t-body-strong text-ink">{s.closing}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {(!s || wrongLang || summary?.origin === "fallback") && !pending && (
          <Button onClick={generate} leading="sparkle">
            {s ? t.smart.summary.regenerate : t.smart.summary.generate}
          </Button>
        )}
        {s && <p className="t-caption text-action">{t.smart.summary.saved}</p>}
      </div>
      <p className="flex items-start gap-1.5 t-caption text-ink-3">
        <Icon name="lock" size={14} className="mt-0.5 shrink-0" />
        {t.smart.summary.privacy}
      </p>
    </section>
  );
}

function StatTile({ icon, value, label }: { icon: IconName; value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[18px] bg-muted p-3.5">
      <Icon name={icon} size={22} className="text-ink" directional={false} />
      <span className="t-h1 text-ink">{value}</span>
      <span className="t-caption text-ink-2">{label}</span>
    </div>
  );
}

function MissedCard() {
  const { t, href } = useI18n();
  return (
    <Link href={href("/missed")} className="flex items-center gap-3 rounded-[18px] bg-action-subtle p-3.5 transition-colors hover:brightness-[0.98]">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-action text-on-action">
        <Icon name="bookmark" size={22} />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="t-body-strong text-ink">{t.essence.missedTitle}</span>
        <span className="t-caption text-ink-2">{t.smart.missed.cardBody}</span>
      </span>
      <Icon name="chevron-right" size={20} className="text-ink-2" />
    </Link>
  );
}

// D26 / M26 · My passport
export function PassportScreen() {
  const { t, fmt, l, locale, href } = useI18n();
  const share = useShare();
  const stamps = useStore((s) => s.journey.stamps);
  const badgeAt = useStore((s) => s.journey.badgeAt);
  const name = useStore((s) => fullName(s.user));
  const count = useStore(stampCount);
  const lv = level(useStore(points));

  const cover = (
    <div className="flex flex-col gap-2.5 overflow-hidden rounded-3xl bg-inverse p-5 shadow-raised">
      <p className="t-overline text-gold">{t.passport.overline}</p>
      <p className="t-h1 text-on-inverse">{name || "—"}</p>
      <p className="t-body text-on-inverse/80">{fmt(t.passport.count, { n: count, total: pavilions.length, level: lv.n, levelName: t.account.levels[lv.index] })}</p>
      <SaduBand count={40} size={8} gap={7} palette={["#A3232E", "#E2A33A", "#F4EFE6"]} />
    </div>
  );
  const shareBtn = (
    <Button size="lg" block onClick={() => share(fmt(t.passport.shareText, { n: count, total: pavilions.length }))}>
      {t.passport.share}
    </Button>
  );

  return (
    <PageShell header={{ type: "back", title: t.passport.appTitle }} actionBar={shareBtn}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-4 lg:mx-0 lg:max-w-[732px] lg:flex-1">
          <div className="lg:hidden">{cover}</div>
          <h1 className="sr-only">{t.passport.appTitle}</h1>
          <div className="grid grid-cols-2 gap-3">
            {pavilions.map((p) => {
              const at = stamps[p.id];
              return (
                <Link
                  key={p.id}
                  href={href(`/pavilion/${p.id}`)}
                  className="flex flex-col items-center gap-2 rounded-[20px] border border-line bg-card px-2 py-3.5 text-center transition-shadow hover:shadow-card"
                >
                  <PassportStamp id={p.id} locked={!at} width={119} className="max-w-[80%]" />
                  <span className={cn("t-caption", at ? "text-action" : "text-ink-3")}>
                    {at ? fmt(t.passport.collected, { time: clockFromDate(new Date(at), locale) }) : t.passport.locked}
                  </span>
                  <span className="sr-only">{l(p.stampName)}</span>
                </Link>
              );
            })}
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-[20px] px-2 py-3.5 text-center",
                badgeAt ? "border-2 border-action bg-action-subtle" : "border border-dashed border-line-strong bg-muted",
              )}
            >
              <span className={cn("grid size-16 place-items-center rounded-[14px]", badgeAt ? "bg-gold text-night" : "bg-line text-ink-3")}>
                <Icon name={badgeAt ? "award" : "lock"} size={30} />
              </span>
              <span className="t-body-strong text-ink">{t.passport.badge}</span>
              <span className={cn("t-caption", badgeAt ? "text-gold-text" : "text-ink-3")}>
                {badgeAt ? fmt(t.passport.badgeUnlocked, { time: clockFromDate(new Date(badgeAt), locale) }) : t.passport.badgeLocked}
              </span>
            </div>
          </div>
        </div>
        <aside className="sticky top-28 hidden w-[420px] shrink-0 flex-col gap-6 lg:flex">
          {cover}
          {shareBtn}
        </aside>
      </div>
    </PageShell>
  );
}


// D27 / M27 · What you missed: deterministic ranking (skipped ≠ visited at a shorter depth ≠ never planned)
export function MissedScreen() {
  const { t, fmt, href, l } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const nextVisit = useStore((s) => s.nextVisit);
  const plan = useStore((s) => s.plan);
  const stops = useStore((s) => s.journey.stops);
  const items = rankMissed(visitorPrefs(plan), stops).slice(0, 6);
  const themes = [...new Set(items.slice(0, 3).flatMap((i) => i.newThemes))].slice(0, 3);

  const next = (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-gold-subtle p-[18px]">
      <p className="t-overline text-gold-text">{t.missed.nextOverline}</p>
      <p className="t-h3 text-ink">{themes.length ? fmt(t.smart.missed.nextTitle, { list: themes.map((x) => t.interestsShort[x as keyof typeof t.interestsShort]).join(" · ") }) : t.missed.nextTitle}</p>
      <Button
        variant="secondary"
        block
        trailing="arrow-right"
        onClick={() => {
          if (themes.length) actions.setPlan({ interests: themes as typeof plan.interests });
          router.push(href("/plan"));
        }}
      >
        {t.missed.planNext}
      </Button>
    </div>
  );
  return (
    <PageShell header={{ type: "back", title: t.missed.appTitle }}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[732px] lg:flex-1">
          <div className="flex flex-col gap-2">
            <h1 className="t-h1 text-ink">{t.missed.title}</h1>
            <p className="t-body text-ink-2">{t.smart.missed.lead}</p>
            <div className="flex flex-wrap items-center gap-2">
              <LayerBadge layer="algo" />
              <span className="t-caption text-ink-2">{t.smart.missed.rankNote}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const p = getPavilion(item.id)!;
              const added = nextVisit.includes(item.id);
              return (
                <article key={item.id} className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <Stamp id={item.id} size={56} />
                    <div className="min-w-0 flex-1">
                      <h2 className="t-body-strong text-ink">{l(p.shortTitle)}</h2>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Tag type={item.kind === "skipped" ? "error" : item.kind === "shortened" ? "depth" : "audio"}>
                          {item.kind === "shortened" ? fmt(t.smart.missed.shortened, { depth: t.depth[item.experienced!] }) : t.smart.missed[item.kind]}
                        </Tag>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button asChild>
                      <Link href={href(`/pavilion/${item.id}`)}>{t.missed.listen}</Link>
                    </Button>
                    <Button
                      variant="secondary"
                      leading={added ? "check" : undefined}
                      onClick={() => {
                        actions.addNextVisit(item.id);
                        toast(t.missed.added);
                      }}
                      aria-pressed={added}
                    >
                      {t.missed.nextVisit}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="lg:hidden">{next}</div>
        </div>
        <aside className="hidden w-[420px] shrink-0 lg:block">{next}</aside>
      </div>
    </PageShell>
  );
}

