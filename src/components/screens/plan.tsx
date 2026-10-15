"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { LayerBadge } from "@/components/sadu/layers";
import { DepthPicker, TimeOption } from "@/components/sadu/options";
import { Button } from "@/components/ui/button";
import { Chip, ProgressStepper, Switch } from "@/components/ui/controls";
import { SelectField } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { ListRowToggle } from "@/components/ui/list";
import { getPavilion } from "@/data/pavilions";
import { EXPERIENCE_TYPES } from "@/data/stations";
import type { Locale } from "@/i18n/config";
import { planJourney } from "@/lib/engine";
import { durationLabel, hhmm } from "@/lib/format";
import { speak } from "@/lib/speech";
import { actions, useStore, visitorPrefs, type Gate, type Interest, type Voice } from "@/lib/store";
import { cn } from "@/lib/utils";

const INTERESTS: Interest[] = ["history", "art", "food", "architecture", "music", "sustainability", "technology", "crafts"];
const GATES: Gate[] = ["north", "south", "east", "west"];

// D09 · Plan your visit (desktop: one page + live summary) / M09–M11 (mobile: three steps)
export function PlanScreen() {
  const { t, fmt, href, locale, l } = useI18n();
  const router = useRouter();
  const plan = useStore((s) => s.plan);
  const prefs = useStore((s) => s.prefs);
  const [step, setStep] = useState(1);
  const narrationLang: Locale = plan.narrationLang ?? locale;
  const enough = plan.interests.length >= 2;

  const build = () => {
    if (!enough) {
      setStep(2);
      return;
    }
    actions.buildJourney();
    router.push(href("/preparing"));
  };

  const next = () => {
    if (step === 2 && !enough) return;
    if (step < 3) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } else build();
  };

  // live preview: the same deterministic engine that builds the journey
  const preview = useMemo(() => planJourney(visitorPrefs(plan)), [plan]);
  const stops = preview.stops.length;

  return (
    <PageShell
      header={{ type: "back", title: t.plan.appTitle, onBack: step > 1 ? () => setStep(step - 1) : undefined }}
      actionBar={
        <Button size="lg" block trailing="arrow-right" onClick={next} disabled={step === 2 && !enough}>
          {step < 3 ? t.plan.next : t.plan.build}
        </Button>
      }
    >
      <div className="page-container hidden flex-col gap-2 pb-8 pt-12 lg:flex">
        <h1 className="t-display text-ink">{t.plan.pageTitle}</h1>
        <p className="t-body-l text-ink-2">{t.plan.pageLead}</p>
      </div>

      <div className="page-container flex items-start gap-8 pb-10 pt-4 lg:pb-24 lg:pt-0">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 lg:mx-0 lg:max-w-none lg:flex-1">

          {/* ---------- Q1 · time + start */}
          <Question n={1} step={step} title={t.plan.q1} lead={t.plan.q1Lead} mobileLead={t.plan.q1LeadMobile}>
            <div className="flex gap-3" role="radiogroup" aria-label={t.plan.q1}>
              {[30, 60, 120, 180, 240].map((m) => (
                <TimeOption
                  key={m}
                  value={m === 240 ? "4+" : m === 30 ? 30 : m / 60}
                  unit={m === 240 ? t.common.fullDay : m === 30 ? t.smart.plan.minutes : m === 60 ? t.common.hour : t.common.hours}
                  selected={plan.minutes === m}
                  onSelect={() => actions.setPlan({ minutes: m })}
                  className={cn(m === 240 && "hidden lg:flex")}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-[20px] bg-muted p-4 lg:hidden">
              <div className="flex-1">
                <p className="t-body-strong text-ink">{t.plan.customTitle}</p>
                <p className="t-caption text-ink-2">{t.plan.customLead}</p>
              </div>
              <button
                type="button"
                aria-label={t.plan.decrease}
                onClick={() => actions.setPlan({ minutes: Math.max(30, plan.minutes - 15) })}
                className="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-card text-ink"
              >
                <Icon name="minus" size={20} />
              </button>
              <output className="w-12 text-center t-h3 text-ink" aria-live="polite" dir="ltr">
                {hhmm(plan.minutes)}
              </output>
              <button
                type="button"
                aria-label={t.plan.increase}
                onClick={() => actions.setPlan({ minutes: Math.min(480, plan.minutes + 15) })}
                className="grid size-10 place-items-center rounded-full border-[1.5px] border-line bg-card text-ink"
              >
                <Icon name="plus" size={20} />
              </button>
            </div>
            <h3 className="mt-2 t-h3 text-ink lg:hidden">{t.plan.startQuestion}</h3>
            <SelectField
              label={
                <>
                  <span className="lg:hidden">{t.plan.entryLabel}</span>
                  <span className="max-lg:hidden">{t.plan.startLabel}</span>
                </>
              }
              icon="navigate"
              value={plan.gate}
              onChange={(e) => actions.setPlan({ gate: e.target.value as Gate })}
              helper={t.plan.startHelper}
              options={GATES.map((g) => ({ value: g, label: g === "north" ? `${t.plan.gates[g]} · ${t.plan.nearest}` : t.plan.gates[g] }))}
            />
            <p className="flex items-start gap-2 rounded-2xl bg-action-subtle px-4 py-3 t-caption text-ink lg:hidden">
              <Icon name="check-circle" size={20} className="shrink-0 text-action" />
              {t.plan.bufferNote}
            </p>
          </Question>

          {/* ---------- Q2 · interests */}
          <Question n={2} step={step} title={t.plan.q2} lead={t.plan.q2Lead} mobileLead={t.plan.q2LeadMobile}>
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map((i) => (
                <Chip key={i} selected={plan.interests.includes(i)} onClick={() => actions.toggleInterest(i)}>
                  {t.interests[i]}
                </Chip>
              ))}
            </div>
            <p className={cn("flex items-center gap-2 t-body-strong lg:hidden", enough ? "text-action" : "text-gold-text")}>
              <Icon name={enough ? "check-circle" : "info"} size={20} />
              {enough ? fmt(t.plan.selected, { n: plan.interests.length }) : t.plan.pickMore}
            </p>
            {enough && (
              <div className="flex flex-col gap-2 rounded-[20px] bg-gold-subtle p-4 lg:hidden">
                <p className="flex items-center gap-2 t-label text-gold-text">
                  <Icon name="sparkle" size={20} />
                  {t.plan.forYou}
                </p>
                <p className="t-body text-ink">{plan.interests.includes("food") ? t.plan.forYouBody : t.plan.forYouBodyGeneric}</p>
              </div>
            )}
            {!enough && <p className="hidden t-caption text-gold-text lg:block">{t.plan.pickMore}</p>}
            <div className="flex flex-col gap-2.5 border-t border-line pt-5">
              <p className="t-h3 text-ink">{t.smart.plan.experiences}</p>
              <p className="t-caption text-ink-2">{t.smart.plan.experiencesLead}</p>
              <div className="flex flex-wrap gap-2.5">
                {EXPERIENCE_TYPES.map((e) => (
                  <Chip key={e} selected={plan.experiences.includes(e)} onClick={() => actions.toggleExperience(e)}>
                    {t.smart.experiences[e]}
                  </Chip>
                ))}
              </div>
            </div>
          </Question>

          {/* ---------- Q3 · narration */}
          <Question n={3} step={step} title={t.plan.q3}>
            <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
              <SelectField
                label={t.plan.narrationLang}
                icon="globe"
                value={narrationLang}
                onChange={(e) => actions.setPlan({ narrationLang: e.target.value as Locale })}
                options={[
                  { value: "ar", label: t.plan.narrationLangs.ar },
                  { value: "en", label: t.plan.narrationLangs.en },
                ]}
              />
              <VoicePicker className="lg:hidden" lang={narrationLang} value={plan.voice} />
              <div className="flex flex-col gap-2">
                <p className="t-label text-ink">{t.plan.preferredDepth}</p>
                <DepthPicker value={plan.depth} onChange={(d) => actions.setPlan({ depth: d })} label={t.plan.preferredDepth} />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="t-label text-ink lg:hidden">{t.plan.accessibility}</p>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                <ListRowToggle
                  icon="navigate"
                  title={t.smart.plan.stepFree}
                  description={t.smart.plan.stepFreeBody}
                  control={<Switch checked={plan.stepFree} onCheckedChange={(v) => actions.setPlan({ stepFree: v })} label={t.smart.plan.stepFree} />}
                />
                <ListRowToggle
                  icon="captions"
                  title={t.plan.captionsTitle}
                  description={t.plan.captionsBody}
                  control={<Switch checked={prefs.captions} onCheckedChange={(v) => actions.setPrefs({ captions: v })} label={t.plan.captionsTitle} />}
                />
                <ListRowToggle
                  icon="text-size"
                  title={t.plan.largeTitle}
                  description={
                    <>
                      <span className="lg:hidden">{t.plan.largeBodyMobile}</span>
                      <span className="max-lg:hidden">{t.plan.largeBody}</span>
                    </>
                  }
                  control={
                    <Switch
                      checked={prefs.textSize >= 3}
                      onCheckedChange={(v) => actions.setPrefs({ textSize: v ? 3 : 2 })}
                      label={t.plan.largeTitle}
                    />
                  }
                />
              </div>
            </div>
          </Question>
        </div>

        {/* ---------- live summary (desktop) */}
        <aside className="sticky top-28 hidden w-[380px] shrink-0 flex-col gap-[18px] rounded-3xl bg-inverse p-7 text-on-inverse shadow-raised lg:flex">
          <p className="t-overline text-on-inverse/70">{t.plan.summary.overline}</p>
          <SummaryRow icon="clock" label={t.plan.summary.time} value={durationLabel(plan.minutes, locale, true)} />
          <SummaryRow icon="navigate" label={t.plan.summary.start} value={t.plan.gates[plan.gate]} />
          <SummaryRow
            icon="heart"
            label={t.plan.summary.interests}
            value={enough ? capitalize(plan.interests.map((i) => t.interestsShort[i]).join(locale === "ar" ? "، " : ", ")) : t.plan.summary.none}
          />
          <SummaryRow
            icon="globe"
            label={t.plan.summary.language}
            value={`${t.plan.narrationLangs[narrationLang]} · ${plan.voice === "calm" ? t.plan.summary.voiceCalm : t.plan.summary.voiceLively}`}
          />
          <hr className="border-on-inverse/15" />
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="flex-1 t-display">{fmt(t.plan.summary.stops, { n: stops })}</p>
              <LayerBadge layer="algo" className="bg-on-inverse/15 text-on-inverse" />
            </div>
            <p className="t-caption text-on-inverse/70">{fmt(t.smart.plan.previewTotal, { n: preview.totals.total, budget: plan.minutes })}</p>
            <ol className="flex flex-col gap-1">
              {preview.stops.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2 t-caption text-on-inverse/90">
                  <span className="grid size-5 place-items-center rounded-full bg-on-inverse/15 text-[0.7rem]">{i + 1}</span>
                  <span className="flex-1 truncate">{l(getPavilion(s.id)!.stampName)}</span>
                  <span className="text-on-inverse/70">{t.depth[s.depth]}</span>
                </li>
              ))}
            </ol>
          </div>
          <Button size="lg" block trailing="arrow-right" onClick={build} disabled={!enough}>
            {t.plan.build}
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Question({
  n,
  step,
  title,
  lead,
  mobileLead,
  children,
}: {
  n: number;
  step: number;
  title: string;
  lead?: string;
  mobileLead?: string;
  children: ReactNode;
}) {
  const { t, fmt } = useI18n();
  return (
    <section
      className={cn("flex-col gap-5 lg:flex lg:rounded-3xl lg:border lg:border-line lg:bg-card lg:p-7", step === n ? "flex" : "hidden")}
      aria-labelledby={`q${n}`}
    >
      <ProgressStepper label={fmt(t.plan.step, { n })} step={n} className="lg:hidden" />
      <div className="flex items-start gap-3.5">
        <span className="hidden size-8 shrink-0 place-items-center rounded-full bg-inverse t-body-strong text-on-inverse lg:grid">{n}</span>
        <div className="flex flex-col gap-0.5">
          <h2 id={`q${n}`} className="t-h1 text-ink lg:t-h2">
            {title}
          </h2>
          {lead && <p className="hidden t-body text-ink-2 lg:block">{lead}</p>}
          {(mobileLead ?? lead) && <p className="mt-1.5 t-body text-ink-2 lg:hidden">{mobileLead ?? lead}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon name={icon} size={20} className="mt-0.5 text-gold" directional={false} />
      <div className="min-w-0">
        <p className="t-caption text-on-inverse/70">{label}</p>
        <p className="t-body-strong">{value}</p>
      </div>
    </div>
  );
}

function VoicePicker({ value, lang, className }: { value: Voice; lang: Locale; className?: string }) {
  const { t } = useI18n();
  const sample = (v: Voice) => speak(t.plan.voiceSample, { lang, rate: v === "calm" ? 0.9 : 1.15, pitch: v === "calm" ? 0.95 : 1.15 });
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="t-label text-ink">{t.plan.voice}</p>
      <div role="radiogroup" aria-label={t.plan.voice} className="flex flex-col gap-2.5">
        {(["calm", "lively"] as const).map((v) => {
          const on = value === v;
          return (
            <div
              key={v}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-3.5",
                on ? "border-2 border-action bg-action-subtle p-[13px]" : "border-[1.5px] border-line bg-card",
              )}
            >
              <button
                type="button"
                onClick={() => sample(v)}
                aria-label={`${t.plan.voiceHint} ${t.plan.voices[v].title}`}
                className={cn("grid size-10 shrink-0 place-items-center rounded-full", on ? "bg-action text-on-action" : "bg-muted text-ink")}
              >
                <Icon name="play" size={20} />
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => actions.setPlan({ voice: v })}
                className="flex min-w-0 flex-1 items-center gap-3 text-start"
              >
                <span className="flex flex-1 flex-col">
                  <span className="t-body-strong text-ink">{t.plan.voices[v].title}</span>
                  <span className="t-caption text-ink-2">{t.plan.voices[v].body}</span>
                </span>
                <span
                  aria-hidden
                  className={cn("grid size-6 shrink-0 place-items-center rounded-full", on ? "bg-action text-on-action" : "border-2 border-line-strong")}
                >
                  {on && <Icon name="check" size={14} />}
                </span>
              </button>
            </div>
          );
        })}
      </div>
      <p className="t-caption text-ink-2">{t.plan.voiceHint}</p>
    </div>
  );
}
