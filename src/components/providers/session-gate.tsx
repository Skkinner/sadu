"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { PUBLIC_PATHS } from "@/lib/constants";
import { flush, session, useStore } from "@/lib/store";

/**
 * Loads who is using the app on this browser, and keeps app pages behind the entry form.
 * (The proxy already redirects when there is no session cookie; this covers expired or switched sessions.)
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { t, href } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const auth = useStore((s) => s.auth);
  const path = pathname.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const isPublic = PUBLIC_PATHS.includes(path);

  useEffect(() => {
    void session.bootstrap();
    const save = () => void flush(true);
    const onHide = () => document.visibilityState === "hidden" && save();
    // another tab entered or switched user: follow it, so this tab never edits the wrong account
    const onStorage = (e: StorageEvent) => e.key === "sadu-session" && void session.bootstrap();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", save);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // (no ?next= here: after "Switch user" the next person should land on home, not on the last user's page)
  useEffect(() => {
    if (!isPublic && auth === "none") router.replace(href("/start"));
  }, [isPublic, auth, router, href]);

  if (isPublic || auth === "user") return children;
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-live="polite">
      <span className="flex flex-col items-center gap-3 t-caption text-ink-2">
        <span aria-hidden className="size-8 rounded-full border-[3px] border-line border-t-action animate-[sadu-spin_1s_linear_infinite]" />
        {t.common.loading}
      </span>
    </div>
  );
}
