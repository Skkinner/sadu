import { getQuiz } from "@/server/ai/quiz";
import { bad, depth, guard, lang, station } from "@/server/ai/request";
import { json } from "@/server/session";

// POST { stationId, depth, lang } → the question for the depth the visitor completed (AI-generated, checked, cached).
export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const id = station(g.body.stationId), d = depth(g.body.depth), l = lang(g.body.lang);
  if (!id) return bad("stationId");
  if (!d) return bad("depth");
  if (!l) return bad("lang");
  return json(await getQuiz(id, d, l));
}
