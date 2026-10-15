import { DEPTHS } from "@/data/pavilions";
import { getStationContent } from "@/server/ai/content";
import { getQuiz } from "@/server/ai/quiz";
import { bad, guard, lang, station } from "@/server/ai/request";
import { json } from "@/server/session";

// POST { stationId, lang } → generate and cache all three depths (story + quiz) for one station: demo preparation,
// so live demos are instant. Called station by station from the Inside Sadu page.
export async function POST(request: Request) {
  const g = await guard(request, { limit: 60 });
  if ("error" in g) return g.error;
  const id = station(g.body.stationId), l = lang(g.body.lang);
  if (!id) return bad("stationId");
  if (!l) return bad("lang");
  const results = [];
  for (const d of DEPTHS) {
    const content = await getStationContent(id, d, l);
    const quiz = await getQuiz(id, d, l);
    results.push({ depth: d, content: content.origin, quiz: quiz.origin, notice: content.notice ?? quiz.notice });
  }
  return json({ stationId: id, lang: l, results });
}
