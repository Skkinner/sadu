import type { AiStatus } from "@/lib/ai-types";
import { LLM_MODEL, llmConfigured } from "@/server/ai/llm";
import { VOICES, ttsConfigured } from "@/server/ai/tts";
import { aiCacheCounts, recentAiCalls } from "@/server/db";
import { json } from "@/server/session";

// GET → which AI integrations are configured, what is cached, and the latest real model calls (no visitor data).
export async function GET() {
  const status: AiStatus = {
    llm: { configured: llmConfigured(), provider: "Anthropic Claude", model: LLM_MODEL },
    tts: { configured: ttsConfigured(), provider: "Azure AI Speech", voices: VOICES },
    cache: await aiCacheCounts(),
    calls: await recentAiCalls(15),
  };
  return json(status);
}
