import { getBridge } from "@/server/ai/bridge";
import { bad, guard, lang, station } from "@/server/ai/request";
import { json } from "@/server/session";

// POST { fromId, toId, lang } → narrative transition between two consecutive stops of the current route.
export async function POST(request: Request) {
  const g = await guard(request);
  if ("error" in g) return g.error;
  const from = station(g.body.fromId), to = station(g.body.toId), l = lang(g.body.lang);
  if (!from) return bad("fromId");
  if (!to || to === from) return bad("toId");
  if (!l) return bad("lang");
  return json(await getBridge(from, to, l));
}
