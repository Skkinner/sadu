import type { SummaryResponse } from "@/lib/ai-types";
import { referencesFor } from "@/server/ai/common";
import { AiUnavailable } from "@/server/ai/llm";
import { bad, guard, lang } from "@/server/ai/request";
import { buildSummaryInput, fallbackSummary, generateSummary } from "@/server/ai/summary";
import { getUserData, saveSummary } from "@/server/db";
import { json } from "@/server/session";

// POST { lang, journeyId } → personal end-of-journey summary written by the LLM from this account's stored
// journey (the browser saves its data first). The result is saved to the account.
export async function POST(request: Request) {
  const g = await guard(request, { limit: 20 });
  if ("error" in g) return g.error;
  const l = lang(g.body.lang);
  if (!l) return bad("lang");
  const journeyId = typeof g.body.journeyId === "string" ? g.body.journeyId.slice(0, 64) : "";
  if (!journeyId) return bad("journeyId");

  const input = buildSummaryInput(g.user.firstName, l, getUserData(g.user.id));
  if (!input) return json({ error: "no_journey" }, 409);
  const refs = input.completed.flatMap((c) => referencesFor(c.id));
  let res: SummaryResponse;
  try {
    const { value, model } = await generateSummary(input);
    res = { origin: "ai", model, generatedAt: new Date().toISOString(), references: refs, lang: l, journeyId, data: value };
    saveSummary(g.user.id, journeyId, l, value, model);
  } catch (e) {
    res = { origin: "fallback", notice: e instanceof AiUnavailable ? e.reason : "api_error", references: refs, lang: l, journeyId, data: fallbackSummary(input) };
  }
  return json(res);
}
