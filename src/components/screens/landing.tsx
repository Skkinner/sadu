"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JourneyHeroArt } from "@/components/brand/art";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { DepthMarker, SaduBand, StationNode } from "@/components/sadu/brand";
import { TimeOption } from "@/components/sadu/options";
import { Button } from "@/components/ui/button";
import { StatusBanner, Tag } from "@/components/ui/controls";
import { Icon, type IconName } from "@/components/ui/icon";
import { mmss } from "@/lib/format";
import { actions, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LandingScreen() {
  const { t, href } = useI18n();
  const router = useRouter();
  const signedIn = useStore((s) => s.auth === "user");
  const planMinutes = useStore((s) => s.plan.minutes);

  // First visit on a phone starts at "Choose your language" (M01), like the mobile prototype.
  useEffect(() => {
    try {
      if (!localStorage.getItem("sadu-lang-chosen") && window.matchMedia("(max-width: 1023px)").matches) {
        router.replace(href("/language"));
      }
    } catch {}
  }, [router, href]);

  const start = () => {
    if (signedIn) router.push(href("/plan"));
    else router.push(href("/start"));
  };

  return (
    <PageShell
      header={{ type: "logo" }}
      actionBar={
        <Button size="lg" block trailing="arrow-right" onClick={start}>
          {t.landing.mCreate}
        </Button>
      }
    >
      <MobileWelcome />
      <div className="hidden lg:block">
        <Hero planMinutes={planMinutes} onStart={start} />
        <WhySection />
        <HowSection />
        <DepthSection />
        <AudioSection />
        <CtaBand onStart={start} />
      </div>
    </PageShell>
  );
}

// ------------------------------------------------------------ mobile (M02 · Welcome)
function MobileWelcome() {
  const { t } = useI18n();
  const icons: IconName[] = ["clock", "headphones", "award"];
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-[18px] pb-8 lg:hidden">
      <div className="flex justify-center px-5">
        <JourneyHeroArt className="h-[210px] w-auto" />
      </div>
      <div className="flex flex-col gap-2 px-5">
        <p className="t-overline text-gold-text">{t.landing.mOverline}</p>
        <h1 className="t-h1 text-ink">{t.landing.mTitle}</h1>
        <p className="t-body text-ink-2">{t.landing.mLead}</p>
      </div>
      <ul className="flex flex-col gap-2.5 px-5">
        {t.landing.mPoints.map((p, i) => (
          <li key={p} className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-action-subtle text-action">
              <Icon name={icons[i]} size={20} />
            </span>
            <span className="t-body-strong text-ink">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------ desktop (D01 · Landing)
function Hero({ planMinutes, onStart }: { planMinutes: number; onStart: () => void }) {
  const { t } = useI18n();
  const [minutes, setMinutes] = useState(planMinutes >= 60 && planMinutes <= 180 && planMinutes % 60 === 0 ? planMinutes : 120);
  const pick = (m: number) => {
    setMinutes(m);
    actions.setPlan({ minutes: m });
  };
  return (
    <section className="page-container flex items-center gap-16 pb-[88px] pt-[72px]">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full bg-gold-subtle px-3.5 py-1.5 t-label text-gold-text">
          <span aria-hidden className="size-[7px] rotate-45 bg-gold" />
          {t.landing.pill}
        </span>
        <h1 className="whitespace-pre-line t-display-xl text-ink">{t.landing.title}</h1>
        <p className="t-body-l text-ink-2">{t.landing.lead}</p>
        <div className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-5 shadow-raised">
          <p className="t-h3 text-ink" id="hero-time">
            {t.landing.timeQuestion}
          </p>
          <div className="flex items-stretch gap-3" role="radiogroup" aria-labelledby="hero-time">
            {[60, 120, 180].map((m) => (
              <TimeOption
                key={m}
                value={m / 60}
                unit={m === 60 ? t.common.hour : t.common.hours}
                selected={minutes === m}
                onSelect={() => pick(m)}
                className="max-w-[104px]"
              />
            ))}
            <Button className="h-auto flex-[1.8] px-4" trailing="arrow-right" onClick={onStart}>
              {t.common.startJourney}
            </Button>
          </div>
        </div>
        <ul className="flex flex-wrap items-center gap-6">
          {t.landing.perks.map((perk) => (
            <li key={perk} className="flex items-center gap-1.5 t-label text-ink-2">
              <Icon name="check-circle" size={18} className="text-action" />
              {perk}
            </li>
          ))}
        </ul>
      </div>
      <HeroVisual />
    </section>
  );
}

function HeroVisual() {
  const { t } = useI18n();
  return (
    <div className="relative grid aspect-square w-[min(560px,42vw)] shrink-0 place-items-center rounded-[40px] bg-gold-subtle">
      <JourneyHeroArt className="w-[87%]" />
      <div className="absolute start-[-20px] top-[73%] flex w-[330px] gap-3.5 rounded-[20px] border-2 border-action bg-card p-4 shadow-sheet">
        <StationNode n={2} state="current" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <p className="t-h3 text-ink">{t.landing.heroCard.title}</p>
          <p className="flex items-center gap-1.5 t-caption text-ink-2">
            <Icon name="clock" size={16} className="text-ink-3" />
            {t.landing.heroCard.meta}
          </p>
          <div className="flex gap-1.5">
            <Tag type="now" icon="navigate">
              {t.landing.heroCard.now}
            </Tag>
            <Tag type="depth" icon="depth">
              {t.landing.heroCard.tag}
            </Tag>
          </div>
        </div>
        <Icon name="chevron-right" size={20} className="mt-2.5 text-ink-3" />
      </div>
      <StatusBanner type="success" title={t.landing.heroStatus.title} className="absolute end-[-20px] top-[-24px] w-[300px] shadow-raised">
        {t.landing.heroStatus.body}
      </StatusBanner>
    </div>
  );
}

function Overline({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("t-overline text-gold-text", className)}>{children}</p>;
}

function WhySection() {
  const { t } = useI18n();
  return (
    <section className="bg-subtle">
      <div className="page-container flex flex-col gap-10 py-[72px]">
        <div className="flex flex-col gap-3">
          <Overline>{t.landing.whyOverline}</Overline>
          <h2 className="t-display text-ink">{t.landing.whyTitle}</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {t.landing.stats.map((s) => (
            <div key={s.value} className="flex flex-col gap-2 rounded-3xl border border-line bg-card p-7">
              <p className="t-display text-ink">{s.value}</p>
              <p className="t-body text-ink-2">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowSection() {
  const { t } = useI18n();
  const icons: IconName[] = ["clock", "route", "headphones"];
  return (
    <section id="how" className="scroll-mt-24">
      <div className="page-container flex flex-col items-center gap-12 py-24">
        <div className="flex flex-col items-center gap-3 text-center">
          <Overline>{t.landing.howOverline}</Overline>
          <h2 className="t-display text-ink">{t.landing.howTitle}</h2>
          <p className="t-body-l text-ink-2">{t.landing.howLead}</p>
        </div>
        <ol className="grid w-full grid-cols-3 gap-6">
          {t.landing.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-3xl border border-line bg-card p-7 shadow-card">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-[14px] bg-action-subtle text-action">
                  <Icon name={icons[i]} size={24} />
                </span>
                <StationNode n={i + 1} state="dark" size={36} />
              </div>
              <h3 className="t-h2 text-ink">{step.title}</h3>
              <p className="t-body text-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DepthSection() {
  const { t } = useI18n();
  const depths = [
    { id: "glimpse", min: t.depth.duration.glimpse, desc: t.depth.glimpseDesc },
    { id: "visit", min: t.depth.duration.visit, desc: t.depth.visitDesc },
    { id: "deep", min: t.depth.duration.deep, desc: t.depth.deepDesc },
  ] as const;
  const [active, setActive] = useState<(typeof depths)[number]["id"]>("visit");
  return (
    <section className="bg-subtle">
      <div className="page-container flex items-center gap-16 py-24">
        <div className="flex w-[416px] shrink-0 flex-col gap-3">
          <Overline>{t.landing.depthOverline}</Overline>
          <h2 className="t-display text-ink">{t.landing.depthTitle}</h2>
          <p className="t-body-l text-ink-2">{t.landing.depthLead}</p>
        </div>
        <div className="grid flex-1 grid-cols-3 gap-4" role="radiogroup" aria-label={t.landing.depthTitle}>
          {depths.map((d) => {
            const on = active === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setActive(d.id)}
                className={cn(
                  "flex flex-col gap-3 rounded-3xl bg-card p-6 text-start transition-all",
                  on ? "border-2 border-gold p-[23px] shadow-raised" : "border border-line hover:border-line-strong",
                )}
              >
                <DepthMarker depth={d.id} size={40} className="text-gold-text" />
                <span className="t-h2 text-ink">{t.depth[d.id]}</span>
                <span className="flex items-center gap-1.5 t-label text-ink-2">
                  <Icon name="clock" size={16} />
                  {d.min}
                </span>
                <span className="t-body text-ink-2">{d.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AudioSection() {
  const { t, fmt } = useI18n();
  const icons: IconName[] = ["globe", "captions", "navigate"];
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(72);
  const [captions, setCaptions] = useState(true);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setPos((p) => (p >= 180 ? 0 : p + 1)), 1000);
    return () => window.clearInterval(id);
  }, [playing]);
  return (
    <section>
      <div className="page-container flex items-center gap-16 py-24">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Overline>{t.landing.audioOverline}</Overline>
            <h2 className="t-display text-ink">{t.landing.audioTitle}</h2>
            <p className="t-body-l text-ink-2">{t.landing.audioLead}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {t.landing.audioPoints.map((p, i) => (
              <li key={p} className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-action-subtle text-action">
                  <Icon name={icons[i]} size={24} directional={false} />
                </span>
                <span className="t-body-strong text-ink">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex w-[min(560px,42vw)] shrink-0 flex-col gap-4 rounded-[40px] bg-night p-10">
          <div className={cn("flex flex-col gap-2 rounded-[20px] bg-cream/8 p-5 transition-opacity", !captions && "opacity-40")}>
            <p className="t-overline text-cream/70">{t.landing.captionsLabel}</p>
            <p className="t-h3 text-cream">{t.landing.captionQuote}</p>
          </div>
          <div className="flex flex-col gap-2.5 rounded-[20px] bg-night px-3 pb-3.5 pt-3 shadow-raised">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? t.player.pause : t.player.play}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-saffron text-night"
              >
                <Icon name={playing ? "pause" : "play"} size={22} directional={false} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="t-body-strong text-cream">{t.landing.playerTitle}</p>
                <p className="t-caption text-cream">{fmt(t.landing.playerSub, { time: mmss(pos) })}</p>
              </div>
              <button
                type="button"
                onClick={() => setCaptions((c) => !c)}
                aria-pressed={captions}
                aria-label={t.player.captions}
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-cream text-cream",
                  captions && "bg-cream/15",
                )}
              >
                <Icon name="captions" size={20} />
              </button>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-cream">
              <div className="h-full rounded-full bg-saffron transition-[width] duration-1000 ease-linear" style={{ width: `${(pos / 180) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaBand({ onStart }: { onStart: () => void }) {
  const { t } = useI18n();
  return (
    <section className="page-container pb-24">
      <div className="flex flex-col items-center gap-5 rounded-[40px] bg-inverse p-16 text-center">
        <h2 className="t-display text-on-inverse">{t.landing.ctaTitle}</h2>
        <p className="t-body-l text-on-inverse/80">{t.landing.ctaLead}</p>
        <Button size="lg" className="w-[260px]" trailing="arrow-right" onClick={onStart}>
          {t.common.startJourney}
        </Button>
        <SaduBand count={40} className="pt-2" />
      </div>
    </section>
  );
}
