import { DEPTHS } from "@/data/pavilions";
import { getBridge } from "@/server/ai/bridge";
import { getStationContent } from "@/server/ai/content";
import { bad, depth, guard, lang, station } from "@/server/ai/request";
import { TtsUnavailable, synthesize } from "@/server/ai/tts";
import { json } from "@/server/session";

// POST { kind: "content", stationId, depth, lang, section, voice } | { kind: "bridge", fromId, toId, lang, voice }
// → audio/mpeg narration. The text is looked up on the server (never taken from the request), so the endpoint
// can only voice Sadu's own station stories and bridges.
export async function POST(request: Request) {
  const g = await guard(request, { limit: 200 });
  if ("error" in g) return g.error;
  const l = lang(g.body.lang);
  if (!l) return bad("lang");
  const voice = g.body.voice === "lively" ? "lively" : "calm";

  let text: string;
  if (g.body.kind === "bridge") {
    const from = station(g.body.fromId), to = station(g.body.toId);
    if (!from || !to) return bad("fromId/toId");
    text = (await getBridge(from, to, l, { allowGenerate: false })).data.text;
  } else {
    const id = station(g.body.stationId), d = depth(g.body.depth);
    const section = Number(g.body.section);
    if (!id) return bad("stationId");
    if (!d || !DEPTHS.includes(d)) return bad("depth");
    const content = await getStationContent(id, d, l, { allowGenerate: false });
    const s = content.data.sections[section];
    if (!Number.isInteger(section) || !s) return bad("section");
    text = `${s.heading}. ${s.text}`;
  }

  try {
    const out = await synthesize(text, l, voice);
    return new Response(new Uint8Array(out.audio), {
      headers: { "Content-Type": out.mime, "Cache-Control": "private, max-age=86400", "X-TTS-Provider": out.provider, "X-TTS-Voice": out.voice, "X-TTS-Cached": String(out.cached) },
    });
  } catch (e) {
    const reason = e instanceof TtsUnavailable ? e.reason : "provider_error";
    return json({ error: reason }, reason === "not_configured" ? 501 : 503);
  }
}
