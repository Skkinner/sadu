"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/config";
import { speak, stopSpeaking } from "@/lib/speech";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LayerBadge } from "./layers";

type Part = { heading?: string; text: string };
type Status = "idle" | "loading" | "playing" | "paused" | "ended" | "unavailable";

/**
 * Plays neural TTS narration part by part (one request per section, cached on the server).
 * Play / Pause / Resume / Replay; shows a loading state while audio is generated; if the neural voice is not
 * available, switches to text-only reading and offers the device's own voice, labelled as not neural.
 */
export function NarrationPlayer({
  parts,
  lang,
  request,
  className,
  onPart,
  dark = false,
}: {
  parts: Part[];
  lang: Locale;
  /** body for POST /api/tts for part i */
  request: (i: number) => Record<string, unknown>;
  className?: string;
  onPart?: (i: number) => void;
  dark?: boolean;
}) {
  const { t, fmt } = useI18n();
  const speed = useStore((s) => s.prefs.speed);
  const voiceStyle = useStore((s) => s.plan.voice);
  const audio = useRef<HTMLAudioElement | null>(null);
  const urls = useRef(new Map<number, string>());
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [voice, setVoice] = useState<string | null>(null);
  const [reason, setReason] = useState<"not_configured" | "error">("error");
  const [progress, setProgress] = useState(0);
  const key = JSON.stringify(request(0));

  // new content → stop and start over
  useEffect(() => {
    const cache = urls.current;
    const el = audio.current;
    return () => {
      el?.pause();
      cache.forEach((u) => URL.revokeObjectURL(u));
      cache.clear();
      stopSpeaking();
    };
  }, [key]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  async function load(i: number) {
    const known = urls.current.get(i);
    if (known) return known;
    const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...request(i), voice: voiceStyle }) });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error === "not_configured" ? "not_configured" : "error");
    }
    setVoice(res.headers.get("X-TTS-Voice"));
    const url = URL.createObjectURL(await res.blob());
    urls.current.set(i, url);
    return url;
  }

  async function playFrom(i: number) {
    if (i >= parts.length) {
      setStatus("ended");
      return;
    }
    setIndex(i);
    onPart?.(i);
    setStatus("loading");
    try {
      const url = await load(i);
      const el = audio.current!;
      el.src = url;
      el.playbackRate = speed;
      await el.play();
      setStatus("playing");
      if (i + 1 < parts.length) load(i + 1).catch(() => {}); // prefetch the next part
    } catch (e) {
      setReason((e as Error).message === "not_configured" ? "not_configured" : "error");
      setStatus("unavailable");
    }
  }

  const primary = () => {
    const el = audio.current;
    if (status === "playing") {
      el?.pause();
      setStatus("paused");
    } else if (status === "paused") {
      el?.play();
      setStatus("playing");
    } else if (status === "ended") playFrom(0);
    else if (status === "idle") playFrom(index);
  };

  const label = { idle: t.smart.narration.play, loading: t.smart.narration.loading, playing: t.smart.narration.pause, paused: t.smart.narration.resume, ended: t.smart.narration.replay, unavailable: t.smart.narration.play }[status];
  const ink = dark ? "text-cream" : "text-ink";
  const sub = dark ? "text-cream/75" : "text-ink-2";

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <audio
        ref={audio}
        onEnded={() => playFrom(index + 1)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
        preload="none"
      />
      {status === "unavailable" ? (
        <div className={cn("flex flex-col gap-2 rounded-2xl p-3.5", dark ? "bg-cream/10" : "bg-muted")}>
          <p className={cn("flex items-center gap-2 t-label", ink)}>
            <Icon name="summary" size={18} />
            {t.smart.narration.textOnly}
          </p>
          <p className={cn("t-caption", sub)}>{t.smart.narration.textOnlyBody[reason]}</p>
          <button type="button" onClick={() => speak(parts.map((p) => `${p.heading ? `${p.heading}. ` : ""}${p.text}`).join(" "), { lang })} className={cn("self-start t-label underline underline-offset-4", dark ? "text-saffron" : "text-action")}>
            {t.smart.narration.deviceVoice}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={primary}
            disabled={status === "loading"}
            aria-label={label}
            className={cn("grid size-14 shrink-0 place-items-center rounded-full shadow-raised transition-transform active:scale-95 disabled:opacity-70", dark ? "bg-saffron text-night" : "bg-gold text-night")}
          >
            {status === "loading" ? (
              <span aria-hidden className="size-6 rounded-full border-[3px] border-night/30 border-t-night animate-[sadu-spin_1s_linear_infinite]" />
            ) : (
              <Icon name={status === "playing" ? "pause" : status === "ended" ? "refresh" : "play"} size={26} directional={false} />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className={cn("t-body-strong", ink)} aria-live="polite">
              {label}
            </p>
            <p className={cn("t-caption", sub)}>
              {parts.length > 1 && fmt(t.smart.narration.part, { n: index + 1, total: parts.length })}
              {parts[index]?.heading ? `${parts.length > 1 ? " · " : ""}${parts[index].heading}` : ""}
            </p>
          </div>
          {status !== "idle" && status !== "ended" && (
            <button type="button" onClick={() => playFrom(0)} aria-label={t.smart.narration.replay} className={cn("grid size-11 place-items-center rounded-full border-[1.5px]", dark ? "border-cream/40 text-cream" : "border-line text-ink")}>
              <Icon name="refresh" size={20} />
            </button>
          )}
        </div>
      )}
      {status !== "unavailable" && (
        <div className={cn("h-1 overflow-hidden rounded-full", dark ? "bg-cream/15" : "bg-line")}>
          <div className={cn("h-full transition-[width]", dark ? "bg-saffron" : "bg-gold")} style={{ width: `${((index + progress) / Math.max(1, parts.length)) * 100}%` }} />
        </div>
      )}
      {voice && status !== "unavailable" && <LayerBadge layer="ai" label={fmt(t.smart.narration.neural, { voice })} className="self-start" />}
    </div>
  );
}
