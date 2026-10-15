import { getStationContent } from "@/server/ai/content";
import { bad, depth, guard, lang, station } from "@/server/ai/request";
import { json } from "@/server/session";

// POST { stationId, depth, lang } → AI-generated station story (cached), or labelled pre-written fallback.
export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const id = station(g.body.stationId), d = depth(g.body.depth), l = lang(g.body.lang);
  if (!id) return bad("stationId");
  if (!d) return bad("depth");
  if (!l) return bad("lang");
  return json(await getStationContent(id, d, l));
}
