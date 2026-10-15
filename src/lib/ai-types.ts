// Shapes returned by the AI endpoints (shared by server and browser; no runtime code from the SDK here).
import type { Depth, PavilionId } from "@/data/pavilions";
import type { Reference } from "@/data/sources";

/** where a piece of content came from: a live model call, the cache of an earlier call, or pre-written copy */
export type Origin = "ai" | "cache" | "fallback";
export type AiNotice = "not_configured" | "auth" | "rate_limited" | "timeout" | "refused" | "invalid_output" | "api_error";

export type StationContent = {
  title: string;
  sections: { heading: string; text: string; refs: string[] }[];
  takeaways: string[];
  essence: string;
};

export type GeneratedQuiz = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  refs: string[];
};

export type JourneySummary = {
  recap: string;
  themes: string[];
  highlights: { stationId: PavilionId; text: string }[];
  understood: string[];
  exploreNext: { stationId: PavilionId; text: string }[];
  closing: string;
};

export type Envelope<T> = {
  origin: Origin;
  model?: string;
  generatedAt?: string;
  /** why AI output is not shown (fallback) */
  notice?: AiNotice;
  references: Reference[];
  data: T;
};

export type ContentResponse = Envelope<StationContent> & { stationId: PavilionId; depth: Depth; lang: "ar" | "en" };
export type QuizResponse = Envelope<GeneratedQuiz> & { stationId: PavilionId; depth: Depth; lang: "ar" | "en"; questionId: string };
export type BridgeResponse = Envelope<{ text: string }> & { fromId: PavilionId; toId: PavilionId; lang: "ar" | "en" };
export type SummaryResponse = Envelope<JourneySummary> & { lang: "ar" | "en"; journeyId: string };

export type AiStatus = {
  llm: { configured: boolean; provider: "Anthropic Claude"; model: string };
  tts: { configured: boolean; provider: "Azure AI Speech"; voices: Record<"ar" | "en", Record<"calm" | "lively", string>> };
  cache: { kind: string; lang: string; n: number }[];
  calls: { kind: string; provider: string; model: string; ok: number; ms: number; inputTokens?: number; outputTokens?: number; error?: string; createdAt: string }[];
};
