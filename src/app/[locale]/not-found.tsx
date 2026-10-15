"use client";

import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  const { t, href } = useI18n();
  return (
    <PageShell header={{ type: "logo" }}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24 text-center">
        <span className="grid size-16 place-items-center rounded-[14px] bg-gold-subtle text-gold-text">
          <Icon name="map" size={30} />
        </span>
        <h1 className="t-h1 text-ink">{t.notFound.title}</h1>
        <p className="max-w-md t-body text-ink-2">{t.notFound.body}</p>
        <Button asChild size="lg">
          <Link href={href("/")}>{t.notFound.cta}</Link>
        </Button>
      </div>
    </PageShell>
  );
}
