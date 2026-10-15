"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { Logo } from "@/components/sadu/brand";
import { useStore } from "@/lib/store";

// Figma › Site Footer v2
export function SiteFooter() {
  const { t, href } = useI18n();
  const signedIn = useStore((s) => s.auth === "user");
  const links = [
    { label: t.common.footerLinks.home, href: signedIn ? href("/home") : href("/") },
    { label: t.common.footerLinks.faq, href: href("/faq") },
    { label: t.common.footerLinks.contact, href: href("/contact") },
    { label: t.common.footerLinks.accessibility, href: href("/accessibility") },
    { label: t.common.footerLinks.privacy, href: href("/privacy") },
  ];
  return (
    <footer className="mt-auto hidden bg-subtle lg:block">
      <div className="page-container flex flex-col gap-7 pb-10 pt-14">
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-2.5">
            <Link href={links[0].href} className="self-start">
              <Logo />
            </Link>
            <p className="t-body text-ink-2">{t.common.footerTagline}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-7">
              {links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="t-body text-ink-2 hover:text-ink hover:underline underline-offset-4">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <hr className="border-line" />
        <p className="t-caption text-ink-3">{t.common.footerChallenge}</p>
      </div>
    </footer>
  );
}
