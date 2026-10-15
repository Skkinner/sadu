"use client";

// Browser side of the AI layer: fetches generated content from the server (which owns the API keys and the
// cache) and keeps responses in memory for the session, so switching pages or languages is instant.
import { useEffect, useState } from "react";
import type { Depth, PavilionId } from "@/data/pavilions";
import type { Locale } from "@/i18n/config";
import type { AiStatus, BridgeResponse, ContentResponse, QuizResponse, SummaryResponse } from "@/lib/ai-types";
import { flush } from "@/lib/store";

const memory = new Map<string, Promise<unknown>>();

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json() as Promise<T>;
}

function cachedPost<T>(key: string, url: string, body: unknown): Promise<T> {
  let p = memory.get(key) as Promise<T> | undefined;
  if (!p) {
    p = post<T>(url, body);
    memory.set(key, p);
    p.catch(() => memory.delete(key));
  }
  return p;
}

export const fetchContent = (stationId: PavilionId, depth: Depth, lang: Locale) =>
  cachedPost<ContentResponse>(`content|${stationId}|${depth}|${lang}`, "/api/ai/content", { stationId, depth, lang });
export const fetchQuiz = (stationId: PavilionId, depth: Depth, lang: Locale) =>
  cachedPost<QuizResponse>(`quiz|${stationId}|${depth}|${lang}`, "/api/ai/quiz", { stationId, depth, lang });
export const fetchBridge = (fromId: PavilionId, toId: PavilionId, lang: Locale) =>
  cachedPost<BridgeResponse>(`bridge|${fromId}|${toId}|${lang}`, "/api/ai/bridge", { fromId, toId, lang });

/** The server builds the summary from the stored journey, so pending changes are saved first. */
export async function requestSummary(journeyId: string, lang: Locale) {
  await flush();
  return post<SummaryResponse>("/api/ai/summary", { journeyId, lang });
}

export async function fetchStatus(): Promise<AiStatus> {
  const res = await fetch("/api/ai/status", { cache: "no-store" });
  return res.json();
}

export type Loadable<T> = { status: "loading"; data?: undefined } | { status: "ready"; data: T } | { status: "error"; data?: undefined };

/** Runs an async loader whenever `key` changes. */
export function useLoad<T>(key: string | null, load: () => Promise<T>): Loadable<T> {
  const [state, setState] = useState<{ key: string | null; value: Loadable<T> }>({ key: null, value: { status: "loading" } });
  useEffect(() => {
    if (!key) return;
    let alive = true;
    load().then(
      (data) => alive && setState({ key, value: { status: "ready", data } }),
      () => alive && setState({ key, value: { status: "error" } }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state.key === key ? state.value : { status: "loading" };
}

export const useContent = (id: PavilionId | null, depth: Depth, lang: Locale) =>
  useLoad(id ? `content|${id}|${depth}|${lang}` : null, () => fetchContent(id!, depth, lang));
export const useQuiz = (id: PavilionId | null, depth: Depth, lang: Locale) => useLoad(id ? `quiz|${id}|${depth}|${lang}` : null, () => fetchQuiz(id!, depth, lang));
export const useBridge = (from: PavilionId | null, to: PavilionId | null, lang: Locale) =>
  useLoad(from && to && from !== to ? `bridge|${from}|${to}|${lang}` : null, () => fetchBridge(from!, to!, lang));
