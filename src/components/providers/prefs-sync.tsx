"use client";

import { useEffect } from "react";
import { useHydrated, useStore } from "@/lib/store";

/**
 * Mirrors display preferences (theme, contrast, motion, text size) onto <html>.
 * PREFS_SCRIPT applies the same classes before first paint to avoid a flash.
 */
export function PrefsSync() {
  const prefs = useStore((s) => s.prefs);
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return; // keep the pre-paint classes until persisted prefs are known
    const root = document.documentElement;
    root.classList.toggle("dark", prefs.theme === "dark");
    root.classList.toggle("contrast", prefs.contrast);
    root.classList.toggle("reduce-motion", prefs.reduceMotion);
    root.dataset.textSize = String(prefs.textSize);
  }, [prefs, hydrated]);
  return null;
}

