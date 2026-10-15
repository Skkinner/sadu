"use client";

import type { Locale } from "@/i18n/config";

/** Thin wrapper around the Web Speech API (voice samples, "listen to the question", read-aloud). */
export function speak(text: string, { lang, rate = 1, pitch = 1 }: { lang: Locale; rate?: number; pitch?: number }) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-GB";
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = pitch;
  synth.speak(u);
  return true;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
