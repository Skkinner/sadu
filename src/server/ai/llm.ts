import "server-only";

// Layer 1 · Real AI: the single place that calls the Claude API. Every generator in src/server/ai goes through
// generateStructured(), which asks for schema-constrained JSON, validates it (schema + semantic checks),
// retries once on invalid output, times out, and records every call in the ai_calls audit table.
// The API key is read server-side from the environment and never reaches the browser.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type * as z from "zod/v4";
import { logAiCall } from "@/server/db";

export const LLM_MODEL = process.env.SADU_LLM_MODEL || "claude-opus-5-5";
const TIMEOUT_MS = Number(process.env.SADU_LLM_TIMEOUT_MS) || 90_000;

export function llmConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export type AiFailure = "not_configured" | "auth" | "rate_limited" | "timeout" | "refused" | "invalid_output" | "api_error";

export class AiUnavailable extends Error {
  constructor(
    public reason: AiFailure,
    detail?: string,
  ) {
    super(detail ? `${reason}: ${detail}` : reason);
  }
}

const g = globalThis as unknown as { saduAnthropic?: Anthropic };
function client() {
  // maxRetries: the SDK retries 408/409/429/5xx and connection errors with backoff (2 retries)
  return (g.saduAnthropic ??= new Anthropic({ maxRetries: 2, timeout: TIMEOUT_MS }));
}

type Effort = "low" | "medium" | "high";

export async function generateStructured<S extends z.ZodType>(opts: {
  kind: string;
  system: string;
  prompt: string;
  schema: S;
  effort: Effort;
  maxTokens?: number;
  /** semantic checks beyond the schema; return a problem description to reject the output */
  validate?: (value: z.infer<S>) => string | null;
}): Promise<{ value: z.infer<S>; model: string }> {
  if (!llmConfigured()) throw new AiUnavailable("not_configured");
  let lastProblem = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const started = Date.now();
    const retryNote = attempt ? `\n\nYour previous answer was rejected by validation: ${lastProblem}. Fix this and answer again.` : "";
    try {
      // Claude Opus 5.5: thinking is adaptive by default; effort sets its depth.
      // fallbacks "default": if the model declines for policy reasons, the API retries on its default fallback model.
      const res = await client().beta.messages.parse({
        model: LLM_MODEL,
        max_tokens: opts.maxTokens ?? 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
        system: opts.system,
        messages: [{ role: "user", content: opts.prompt + retryNote }],
      });
      const usage = { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens };
      if (res.stop_reason === "refusal") {
        logAiCall({ kind: opts.kind, provider: "anthropic", model: res.model, ok: false, ms: Date.now() - started, ...usage, error: "refusal" });
        throw new AiUnavailable("refused");
      }
      const value = res.parsed_output as z.infer<S> | null;
      const problem = res.stop_reason === "max_tokens" ? "the answer was cut off" : !value ? "the answer did not match the schema" : (opts.validate?.(value) ?? null);
      logAiCall({ kind: opts.kind, provider: "anthropic", model: res.model, ok: !problem, ms: Date.now() - started, ...usage, error: problem ?? undefined });
      if (!problem && value) return { value, model: res.model };
      lastProblem = problem ?? "invalid output";
    } catch (e) {
      if (e instanceof AiUnavailable) throw e;
      const ms = Date.now() - started;
      const reason: AiFailure | null =
        e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError
          ? "auth"
          : e instanceof Anthropic.RateLimitError
            ? "rate_limited"
            : e instanceof Anthropic.APIConnectionTimeoutError
              ? "timeout"
              : e instanceof Anthropic.APIError
                ? "api_error"
                : null; // anything else: the response could not be parsed into the schema → retry
      logAiCall({ kind: opts.kind, provider: "anthropic", model: LLM_MODEL, ok: false, ms, error: `${reason ?? "parse"}: ${(e as Error).message}` });
      if (reason) throw new AiUnavailable(reason, (e as Error).message);
      lastProblem = "the answer was not valid JSON for the schema";
    }
  }
  throw new AiUnavailable("invalid_output", lastProblem);
}
