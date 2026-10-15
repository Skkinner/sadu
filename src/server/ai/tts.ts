import "server-only";

// TextToSpeechService: neural text-to-speech through Azure AI Speech (REST, no SDK), with Saudi Arabic and
// English neural voices. Audio is cached in the database by provider + voice + text, so each narration is
// synthesized once. Without AZURE_SPEECH_KEY / AZURE_SPEECH_REGION the service reports "not configured" and the
// app falls back to text-only reading; it never labels a non-neural voice as neural.
import type { Locale } from "@/i18n/config";
import { getAudio, logAiCall, putAudio } from "@/server/db";
import { sha } from "./common";

export type VoiceStyle = "calm" | "lively";

export const VOICES: Record<Locale, Record<VoiceStyle, string>> = {
  ar: { calm: process.env.SADU_TTS_VOICE_AR_CALM || "ar-SA-HamedNeural", lively: process.env.SADU_TTS_VOICE_AR_LIVELY || "ar-SA-ZariyahNeural" },
  en: { calm: process.env.SADU_TTS_VOICE_EN_CALM || "en-US-GuyNeural", lively: process.env.SADU_TTS_VOICE_EN_LIVELY || "en-US-JennyNeural" },
};

export const ttsConfigured = () => Boolean(process.env.AZURE_SPEECH_KEY && (process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_ENDPOINT));

/** Regional endpoint, or AZURE_SPEECH_ENDPOINT for a custom host (e.g. a self-hosted Speech container). */
const endpoint = () => process.env.AZURE_SPEECH_ENDPOINT || `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;

export class TtsUnavailable extends Error {
  constructor(public reason: "not_configured" | "provider_error" | "timeout") {
    super(reason);
  }
}

const escapeXml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function synthesize(text: string, lang: Locale, style: VoiceStyle) {
  const voice = VOICES[lang][style];
  const key = sha(`azure|${voice}|${text}`);
  const cached = getAudio(key);
  if (cached) return { audio: cached.audio, mime: cached.mime, voice, provider: "azure", cached: true };
  if (!ttsConfigured()) throw new TtsUnavailable("not_configured");

  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang === "ar" ? "ar-SA" : "en-US"}"><voice name="${voice}">${escapeXml(text)}</voice></speak>`;
  const started = Date.now();
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY!,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        "User-Agent": "sadu",
      },
      body: ssml,
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Azure TTS ${res.status}`);
    const audio = new Uint8Array(await res.arrayBuffer());
    const mime = res.headers.get("content-type")?.split(";")[0] || "audio/mpeg";
    logAiCall({ kind: "tts", provider: "azure", model: voice, ok: true, ms: Date.now() - started });
    putAudio(key, "azure", voice, mime, audio);
    return { audio, mime, voice, provider: "azure", cached: false };
  } catch (e) {
    const timeout = (e as Error).name === "TimeoutError";
    logAiCall({ kind: "tts", provider: "azure", model: voice, ok: false, ms: Date.now() - started, error: (e as Error).message });
    throw new TtsUnavailable(timeout ? "timeout" : "provider_error");
  }
}
