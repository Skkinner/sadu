"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { PassportStamp, Stamp } from "@/components/sadu/brand";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { WhyLine } from "@/components/sadu/explain";
import { getPavilion, pavilions } from "@/data/pavilions";
import { rankStations } from "@/lib/engine";
import { longDate } from "@/lib/format";
import { actions, activeStops, currentStop, journeyMetrics, session, stampCount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const subscribeNoop = () => () => {};

export function HomeScreen() {
  const { t, fmt, href, l, locale } = useI18n();
  const router = useRouter();
  const name = useStore((s) => s.user?.firstName ?? "");
  const planMinutes = useStore((s) => s.plan.minutes);
  const journey = useStore((s) => s.journey);
  const left = Math.max(0, useStore(journeyMetrics).remainingBudget);
  const stops = useStore(activeStops);
  const next = useStore(currentStop);
  const prefs = useStore((s) => s.plan);
  const forYou = useMemo(() => rankStations(prefs).slice(0, 3), [prefs]);
  const stamps = useStore((s) => s.journey.stamps);
  const count = useStore(stampCount);

  // date/greeting are client-only so server HTML never disagrees with the visitor's clock
  const now = useSyncExternalStore(subscribeNoop, () => new Date().toDateString(), () => "");
  const date = now ? new Date() : null;
  const hour = date?.getHours() ?? 18;
  const greetingKey = hour < 12 ? "greetingMorning" : hour < 17 ? "greetingAfternoon" : "greetingEvening";

  const active = journey.status === "active" || journey.status === "ready";
  const current = next ? getPavilion(next.id)! : null;
  const currentN = next ? stops.findIndex((s) => s.id === next.id) + 1 : 0;

  const pickTime = (m: number) => actions.setPlan({ minutes: m });
  const plan = () => router.push(href("/plan"));
  const switchUser = async () => {
    await session.switchUser();
    router.push(href("/start"));
  };

  const passport = (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title={t.home.passportTitle}
        action={
          <Link href={href("/passport")} className="t-body-strong text-action hover:underline">
            {t.home.openPassport}
          </Link>
        }
      />
      <Link
        href={href("/passport")}
        className="flex flex-col gap-3 rounded-[20px] border border-line bg-card p-4 shadow-card transition-shadow hover:shadow-raised"
      >
        <div className="flex flex-wrap justify-center gap-2">
          {pavilions.map((p) => (
            <PassportStamp key={p.id} id={p.id} locked={!stamps[p.id]} width={52} className="max-w-[18%]" />
          ))}
        </div>
        <p className="flex items-center gap-2 t-caption text-ink-2">
          <Icon name="award" size={18} className="text-gold-text" />
          {fmt(t.home.passportCount, { n: count, total: pavilions.length })}
        </p>
      </Link>
    </section>
  );

  const help = (
    <section className="flex flex-col gap-3">
      <h2 className="t-h2 text-ink">{t.home.helpTitle}</h2>
      <div className="grid grid-cols-2 gap-2.5">
        <Link href={href("/faq")} className="flex items-center gap-2.5 rounded-[18px] bg-muted p-3.5 t-body-strong text-ink hover:bg-line">
          <Icon name="quiz" size={22} />
          {t.common.nav.faq}
        </Link>
        <Link href={href("/contact")} className="flex items-center gap-2.5 rounded-[18px] bg-muted p-3.5 t-body-strong text-ink hover:bg-line">
          <Icon name="mail" size={22} />
          {t.common.nav.contact}
        </Link>
      </div>
    </section>
  );

  return (
    <PageShell header={{ type: "logo" }} tab="home">
      <div className="page-container grid gap-7 pb-8 pt-2 lg:grid-cols-[minmax(0,712fr)_minmax(0,440fr)] lg:gap-12 lg:pb-[88px] lg:pt-12">
        <div className="flex min-w-0 flex-col gap-7">
          <div className="flex flex-col gap-0.5">
            <p className="min-h-5 t-caption text-ink-2">{date ? fmt(t.home.date, { date: longDate(date, locale) }) : " "}</p>
            <h1 className="t-h1 text-ink">{fmt(t.home[greetingKey], { name: name || "👋" })}</h1>
            <p className="t-caption text-ink-2">
              {fmt(t.auth.switchUser.notYou, { name })}{" "}
              <button type="button" onClick={switchUser} className="t-label text-action underline underline-offset-4">
                {t.auth.switchUser.action}
              </button>
            </p>
          </div>

          {/* Plan card (dark) */}
          <section className="relative overflow-hidden rounded-[28px] bg-inverse p-[22px] shadow-raised">
            <div className="absolute -top-3.5 end-[-6px] rotate-12 rtl:-rotate-12 max-lg:end-[-4px] max-lg:top-[-14px]">
              <PassportStamp id={active && current ? current.id : "japan"} width={115} />
            </div>
            <div className="relative flex flex-col gap-3.5">
              <p className="t-overline text-gold">
                {active ? t.home.planOverlineActive : t.home.planOverline}
              </p>
              <div className="flex flex-col gap-1.5 pe-[90px]">
                <h2 className="t-h2 text-on-inverse">
                  {active && current
                    ? fmt(t.home.resumeTitle, { n: currentN, total: stops.length, name: l(current.shortTitle) })
                    : t.home.planTitle}
                </h2>
                <p className="t-body text-on-inverse/80">
                  {active ? fmt(t.home.resumeLead, { left }) : t.home.planLead}
                </p>
              </div>
              {!active && (
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.home.planTitle}>
                  {[60, 120, 180].map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={planMinutes === m}
                      onClick={() => pickTime(m)}
                      className={cn(
                        "h-9 rounded-full px-3.5 t-label transition-colors",
                        planMinutes === m ? "bg-gold text-night" : "bg-on-inverse/12 text-on-inverse hover:bg-on-inverse/20",
                      )}
                    >
                      {t.home.timeChips[i]}
                    </button>
                  ))}
                </div>
              )}
              {active ? (
                <Button asChild size="lg" block>
                  <Link href={href("/journey")}>
                    {t.home.resumeCta}
                    <Icon name="arrow-right" size={20} />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" block trailing="arrow-right" onClick={plan}>
                  {t.home.planCta}
                </Button>
              )}
            </div>
          </section>

          <div className="lg:hidden">{passport}</div>

          {/* Today at Expo */}
          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t.home.todayTitle}
              action={
                <Link href={href("/map")} className="t-body-strong text-action hover:underline">
                  {t.home.seeAll}
                </Link>
              }
            />
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 lg:mx-0 lg:px-0">
              {t.home.events.slice(0, 2).map((ev, i) => (
                <article
                  key={ev.title}
                  className={cn(
                    "flex w-[220px] shrink-0 flex-col gap-2.5 rounded-[20px] p-4",
                    i === 0 ? "bg-gold-subtle" : i === 1 ? "bg-action-subtle" : "bg-muted",
                    i === 2 && "lg:hidden xl:flex",
                  )}
                >
                  <p className="flex items-center gap-1.5 t-label text-ink">
                    <Icon name="clock" size={16} />
                    {ev.time}
                  </p>
                  <h3 className="t-h3 text-ink">{ev.title}</h3>
                  <p className="mt-auto flex items-center gap-1.5 t-caption text-ink-2">
                    <Icon name="navigate" size={16} />
                    {ev.place}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* Pavilions you'll love */}
          <section className="flex flex-col gap-3">
            <SectionHeader
              title={t.home.pavilionsTitle}
              action={
                <Link href={href("/map")} className="t-body-strong text-action hover:underline">
                  {t.home.map}
                </Link>
              }
            />
            {forYou.map((score) => {
              const p = getPavilion(score.id)!;
              return (
                <Link
                  key={p.id}
                  href={href(`/pavilion/${p.id}`)}
                  className="flex items-center gap-3 rounded-[18px] border border-line bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <Stamp id={p.id} size={56} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="t-body-strong text-ink">{l(p.shortTitle)}</p>
                    <WhyLine score={score} />
                  </div>
                  <Icon name="chevron-right" size={20} className="text-ink-2" />
                </Link>
              );
            })}
          </section>

          <div className="lg:hidden">{help}</div>
        </div>

        <aside className="hidden flex-col gap-6 lg:flex">
          {passport}
          {help}
        </aside>
      </div>
    </PageShell>
  );
}
