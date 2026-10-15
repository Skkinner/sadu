import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPavilion, pavilionIds } from "@/data/pavilions";
import { isLocale } from "@/i18n/config";

export function generateStaticParams() {
  return pavilionIds.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale, id } = await params;
  const p = getPavilion(id);
  if (!p || !isLocale(locale)) return {};
  return { title: p.title[locale] };
}

export default async function PavilionLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getPavilion(id)) notFound();
  return children;
}
