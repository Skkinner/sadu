import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Noto_Sans_Arabic, Readex_Pro, Space_Grotesk } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { getMessages } from "@/i18n/messages";
import { PrefsSync } from "@/components/providers/prefs-sync";
import { SessionGate } from "@/components/providers/session-gate";
import { ToastProvider } from "@/components/providers/toast-provider";
import { dir, isLocale, locales } from "@/i18n/config";
import { PREFS_SCRIPT } from "@/lib/constants";

// Figma › Foundations › Typography
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-space-grotesk", display: "swap" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex", display: "swap" });
const readex = Readex_Pro({ subsets: ["arabic", "latin"], weight: ["500", "600", "700"], variable: "--font-readex", display: "swap" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-noto-arabic", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getMessages(locale);
  return {
    title: { default: t.meta.title, template: `%s · ${locale === "ar" ? "سدو" : "Sadu"}` },
    description: t.meta.description,
    alternates: { languages: { ar: "/ar", en: "/en" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1130" },
  ],
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      data-text-size="2"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${plex.variable} ${readex.variable} ${notoArabic.variable}`}
    >
      <head>
        {/* applies saved theme / contrast / text size before first paint */}
        <script dangerouslySetInnerHTML={{ __html: PREFS_SCRIPT }} />
      </head>
      <body>
        <I18nProvider locale={locale}>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[70] focus:rounded-xl focus:bg-card focus:px-4 focus:py-3 focus:shadow-sheet"
            >
              {getMessages(locale).common.skipToContent}
            </a>
            <PrefsSync />
            <SessionGate>{children}</SessionGate>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
