"use client";

import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { LayerBadge, type Layer } from "@/components/sadu/layers";
import { Button } from "@/components/ui/button";
import { Chip, StatusBanner } from "@/components/ui/controls";
import { Icon } from "@/components/ui/icon";
import { PERSONALIZATION } from "@/config/personalization";
import { getPavilion, STATION_IDS } from "@/data/pavilions";
import { INTERESTS, type Interest } from "@/data/stations";
import type { Locale } from "@/i18n/config";
import { fetchStatus, useLoad } from "@/lib/ai-client";
import { planJourney, type VisitorPrefs } from "@/lib/engine";
import { cn } from "@/lib/utils";

// Inside Sadu: where AI creates value, where explainable algorithms decide, where simulation stands in.
export function LabScreen() {
  const { t } = useI18n();
  const [tick, setTick] = useState(0);
  const status = useLoad(`status|${tick}`, fetchStatus);

  const layers: { layer: Layer; title: string; items: readonly string[] }[] = [
    { layer: "ai", title: t.smart.lab.aiTitle, items: t.smart.lab.aiItems },
    { layer: "algo", title: t.smart.lab.algoTitle, items: t.smart.lab.algoItems },
    { layer: "sim", title: t.smart.lab.simTitle, items: t.smart.lab.simItems },
  ];

  return (
    <PageShell header={{ type: "back", title: t.smart.lab.title }}>
      <div className="page-container flex flex-col gap-8 pb-16 pt-2 lg:pb-24 lg:pt-12">
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="t-h1 text-ink lg:t-display">{t.smart.lab.title}</h1>
          <p className="t-body-l text-ink-2">{t.smart.lab.lead}</p>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {layers.map((x) => (
            <article key={x.layer} className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5 shadow-card">
              <LayerBadge layer={x.layer} className="self-start" />
              <h2 className="t-h3 text-ink">{x.title}</h2>
              <ul className="flex flex-col gap-1.5">
                {x.items.map((i) => (
                  <li key={i} className="flex gap-2 t-body text-ink-2">
                    <span className="mt-2 size-[6px] shrink-0 rotate-45 bg-gold" />
                    {i}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="flex-1 t-h2 text-ink">{t.smart.lab.statusTitle}</h2>
            <Button variant="secondary" size="sm" leading="refresh" onClick={() => setTick((n) => n + 1)}>
              {t.smart.lab.refresh}
            </Button>
          </div>
          {status.status === "ready" && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Integration ok={status.data.llm.configured} title={`${status.data.llm.provider} · ${status.data.llm.model}`} body={t.smart.lab.llmBody} env="ANTHROPIC_API_KEY" />
                <Integration
                  ok={status.data.tts.configured}
                  title={`${status.data.tts.provider} · ${status.data.tts.voices.ar.calm}, ${status.data.tts.voices.en.calm}`}
                  body={t.smart.lab.ttsBody}
                  env="AZURE_SPEECH_KEY + AZURE_SPEECH_REGION"
                />
              </div>
              <p className="t-caption text-ink-2">
                {t.smart.lab.cache}: {status.data.cache.length ? status.data.cache.map((c) => `${c.kind} (${c.lang}) ${c.n}`).join(" · ") : "—"}
              </p>
              <CallLog calls={status.data.calls} />
            </>
          )}
          {status.status === "loading" && <p className="t-body text-ink-2">…</p>}
        </section>

        <Compare />
        <Weights />
        <Warm />
      </div>
    </PageShell>
  );
}

function Integration({ ok, title, body, env }: { ok: boolean; title: string; body: string; env: string }) {
  const { t } = useI18n();
  return (
    <StatusBanner type={ok ? "success" : "warning"} title={title} icon={ok ? "check-circle" : "settings"}>
      {ok ? body : `${t.smart.lab.needsConfig} ${env}`}
    </StatusBanner>
  );
}

function CallLog({ calls }: { calls: { kind: string; provider: string; model: string; ok: number; ms: number; inputTokens?: number; outputTokens?: number; error?: string; createdAt: string }[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto rounded-[18px] border border-line">
      <table className="w-full min-w-[640px] text-start t-caption" dir="ltr">
        <caption className="bg-muted px-3 py-2 text-start t-label text-ink">{t.smart.lab.calls}</caption>
        <thead className="bg-card text-ink-2">
          <tr>
            {["kind", "provider · model", "ok", "ms", "tokens in/out", "time"].map((h) => (
              <th key={h} className="px-3 py-2 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-card text-ink">
          {calls.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-3 text-ink-2">
                {t.smart.lab.noCalls}
              </td>
            </tr>
          )}
          {calls.map((c, i) => (
            <tr key={i}>
              <td className="px-3 py-2">{c.kind}</td>
              <td className="px-3 py-2">
                {c.provider} · {c.model}
              </td>
              <td className={cn("px-3 py-2", c.ok ? "text-action" : "text-error")} title={c.error}>
                {c.ok ? "✓" : `✗ ${c.error?.slice(0, 40) ?? ""}`}
              </td>
              <td className="px-3 py-2 tabular-nums">{c.ms}</td>
              <td className="px-3 py-2 tabular-nums">{c.inputTokens != null ? `${c.inputTokens} / ${c.outputTokens}` : "—"}</td>
              <td className="px-3 py-2">{new Date(c.createdAt).toLocaleTimeString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PROFILES: { interests: Interest[]; minutes: number }[] = [
  { interests: ["history", "architecture"], minutes: 120 },
  { interests: ["food", "music"], minutes: 120 },
];

/** Two visitors side by side: the deterministic engine runs live in the browser. */
function Compare() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState(PROFILES);
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h2 text-ink">{t.smart.lab.compareTitle}</h2>
        <LayerBadge layer="algo" />
      </div>
      <p className="t-body text-ink-2">{t.smart.lab.compareLead}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {profiles.map((p, i) => (
          <ProfilePlan key={i} label={`${t.smart.lab.visitor} ${String.fromCharCode(65 + i)}`} value={p} onChange={(v) => setProfiles((all) => all.map((x, k) => (k === i ? v : x)))} />
        ))}
      </div>
    </section>
  );
}

function ProfilePlan({ label, value, onChange }: { label: string; value: { interests: Interest[]; minutes: number }; onChange: (v: { interests: Interest[]; minutes: number }) => void }) {
  const { t, fmt, l } = useI18n();
  const prefs: VisitorPrefs = { ...value, experiences: [], maxDepth: "deep", stepFreeOnly: false, gate: "north" };
  const plan = useMemo(() => planJourney(prefs), [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <article className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-4">
      <p className="t-h3 text-ink">{label}</p>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((i) => (
          <Chip key={i} selected={value.interests.includes(i)} onClick={() => onChange({ ...value, interests: value.interests.includes(i) ? value.interests.filter((x) => x !== i) : [...value.interests, i] })}>
            {t.interests[i]}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.plan.q1}>
        {[30, 60, 120, 180].map((m) => (
          <Chip key={m} selected={value.minutes === m} onClick={() => onChange({ ...value, minutes: m })}>
            {fmt(t.smart.time.min, { n: m })}
          </Chip>
        ))}
      </div>
      <ol className="flex flex-col gap-1.5 rounded-2xl bg-muted p-3">
        {plan.stops.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2 t-body text-ink">
            <span className="grid size-6 place-items-center rounded-full bg-card t-label">{i + 1}</span>
            <span className="flex-1">{l(getPavilion(s.id)!.stampName)}</span>
            <span className="t-caption text-ink-2">
              {t.depth[s.depth]} · {s.score.total.toFixed(2)}
            </span>
          </li>
        ))}
        {!plan.stops.length && <li className="t-caption text-ink-2">—</li>}
      </ol>
      <p className="t-caption text-ink-2">
        {fmt(t.smart.lab.planLine, { n: plan.stops.length, total: plan.totals.total, budget: plan.budget, walk: plan.totals.walking, queue: plan.totals.queue, nn: plan.route.nearestNeighbourM, opt: plan.route.optimizedM })}
      </p>
    </article>
  );
}

function Weights() {
  const { t } = useI18n();
  const w = PERSONALIZATION.weights;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h2 text-ink">{t.smart.lab.weightsTitle}</h2>
        <LayerBadge layer="algo" />
      </div>
      <p className="t-body text-ink-2">{t.smart.lab.weightsLead}</p>
      <div className="grid gap-2 sm:grid-cols-5">
        {(Object.keys(w) as (keyof typeof w)[]).map((k) => (
          <div key={k} className="flex flex-col gap-1 rounded-2xl bg-muted p-3">
            <span className="t-h2 tabular-nums text-ink">{w[k]}</span>
            <span className="t-caption text-ink-2">{t.smart.why.components[k]}</span>
          </div>
        ))}
      </div>
      <p className="t-caption text-ink-3">{t.smart.lab.weightsFile}</p>
    </section>
  );
}

/** Demo preparation: generate and cache every station × depth story and quiz for one language. */
function Warm() {
  const { t, fmt, locale } = useI18n();
  const [lang, setLang] = useState<Locale>(locale);
  const [progress, setProgress] = useState<{ done: number; fallback: number; running: boolean; error?: string }>({ done: 0, fallback: 0, running: false });
  const run = async () => {
    setProgress({ done: 0, fallback: 0, running: true });
    let fallback = 0;
    for (let i = 0; i < STATION_IDS.length; i++) {
      const res = await fetch("/api/ai/warm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stationId: STATION_IDS[i], lang }) });
      if (!res.ok) {
        setProgress({ done: i, fallback, running: false, error: res.status === 401 ? t.smart.lab.warmSignIn : `${res.status}` });
        return;
      }
      const body = (await res.json()) as { results: { content: string; quiz: string }[] };
      fallback += body.results.filter((r) => r.content === "fallback" || r.quiz === "fallback").length;
      setProgress({ done: i + 1, fallback, running: true });
    }
    setProgress((p) => ({ ...p, running: false }));
  };
  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-line bg-card p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 t-h2 text-ink">{t.smart.lab.warmTitle}</h2>
        <LayerBadge layer="ai" />
      </div>
      <p className="t-body text-ink-2">{t.smart.lab.warmLead}</p>
      <div className="flex flex-wrap items-center gap-2">
        {(["ar", "en"] as const).map((x) => (
          <Chip key={x} selected={lang === x} onClick={() => setLang(x)}>
            {t.plan.narrationLangs[x]}
          </Chip>
        ))}
        <Button onClick={run} disabled={progress.running} leading="sparkle">
          {t.smart.lab.warm}
        </Button>
      </div>
      {(progress.running || progress.done > 0) && (
        <p className="flex items-center gap-2 t-body text-ink" aria-live="polite">
          <Icon name={progress.running ? "refresh" : "check-circle"} size={18} className={cn(progress.running && "animate-[sadu-spin_1.2s_linear_infinite]")} />
          {fmt(t.smart.lab.warmProgress, { n: progress.done, total: STATION_IDS.length, fallback: progress.fallback })}
        </p>
      )}
      {progress.error && <StatusBanner type="error" title={progress.error} />}
    </section>
  );
}
