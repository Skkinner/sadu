"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { JourneyHeroArt } from "@/components/brand/art";
import { PageShell } from "@/components/layout/page-shell";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { validateProfile, type Profile, type ProfileErrors } from "@/lib/profile";
import { session, useStore } from "@/lib/store";

/** Shared layout (D03 / M03): form column + warm visual panel. */
function AuthLayout({ appTitle, visualTitle, actionsNode, children }: { appTitle: string; visualTitle: string; actionsNode: ReactNode; children: ReactNode }) {
  const { t, href } = useI18n();
  return (
    <PageShell header={{ type: "back", title: appTitle, backHref: href("/") }} actionBar={actionsNode}>
      <div className="page-container flex items-start gap-[72px] pb-10 pt-4 lg:pb-20 lg:pt-14">
        <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 lg:mx-0 lg:shrink-0">
          {children}
          <div className="hidden flex-col gap-2 lg:flex">{actionsNode}</div>
        </div>
        <aside className="hidden min-w-0 flex-1 flex-col items-center gap-7 rounded-[40px] bg-gold-subtle px-12 py-10 lg:flex">
          <JourneyHeroArt className="h-[300px] w-auto max-w-full" />
          <div className="flex w-full max-w-[440px] flex-col gap-2.5">
            <h2 className="t-h1 text-ink">{visualTitle}</h2>
            <p className="t-body-l text-ink-2">{t.auth.visualBody}</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

/** Messages for the shared validation codes. */
export function useProfileErrorText() {
  const { t } = useI18n();
  return (errors: ProfileErrors): Partial<Record<keyof Profile, string>> => ({
    firstName: errors.firstName && (errors.firstName === "required" ? t.auth.errors.firstNameRequired : t.auth.errors.nameTooLong),
    lastName: errors.lastName && (errors.lastName === "required" ? t.auth.errors.lastNameRequired : t.auth.errors.nameTooLong),
    email: errors.email && (errors.email === "required" ? t.auth.errors.emailRequired : t.auth.errors.emailInvalid),
  });
}

/** Only follow `?next=` to a page of this site (never an external URL). */
function safeNext(next: string | null) {
  return next && /^\/(ar|en)(\/|$)/.test(next) && !/^\/(ar|en)\/start\b/.test(next) ? next : null;
}

// ------------------------------------------------------------ Entry: first name, last name, email → Continue
export function EntryScreen() {
  const { t, fmt, href } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const search = useSearchParams();
  const auth = useStore((s) => s.auth);
  const errorText = useProfileErrorText();
  const [form, setForm] = useState<Profile>({ firstName: "", lastName: "", email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const destination = safeNext(search.get("next")) ?? href("/home");
  const check = validateProfile(form);
  const errors: Partial<Record<keyof Profile, string>> = submitted && !check.ok ? errorText(check.errors) : {};

  // already signed in on this browser (e.g. opened /start directly)
  useEffect(() => {
    if (auth === "user" && !pending) router.replace(destination);
  }, [auth, pending, router, destination]);

  const field = (key: keyof Profile) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFailure(null);
    },
    error: errors[key],
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!check.ok || pending) return;
    setPending(true);
    const result = await session.enter(check.value);
    if (!result.ok) {
      setPending(false);
      setFailure(result.error === "rate_limited" ? t.auth.errors.rateLimited : result.error === "network" ? t.auth.errors.network : t.auth.errors.emailInvalid);
      return;
    }
    if (!result.created) toast(fmt(t.auth.entry.welcomeBack, { name: result.user.firstName }));
    router.replace(destination);
  };

  return (
    <AuthLayout
      appTitle={t.auth.entry.appTitle}
      visualTitle={t.auth.entry.visualTitle}
      actionsNode={
        <Button type="submit" form="entry-form" size="lg" block trailing="arrow-right" disabled={pending} aria-busy={pending || undefined}>
          {t.auth.entry.submit}
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <h1 className="t-h1 text-ink">{t.auth.entry.title}</h1>
        <p className="t-body text-ink-2">{t.auth.entry.lead}</p>
      </div>
      <form id="entry-form" noValidate onSubmit={submit} className="flex flex-col gap-[18px]">
        <div className="grid gap-[18px] sm:grid-cols-2">
          <InputField label={t.auth.firstName} icon="user" autoComplete="given-name" placeholder={t.auth.firstNamePlaceholder} required maxLength={60} {...field("firstName")} />
          <InputField label={t.auth.lastName} autoComplete="family-name" placeholder={t.auth.lastNamePlaceholder} required maxLength={60} {...field("lastName")} />
        </div>
        <InputField
          label={t.auth.email}
          icon="mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          dir="ltr"
          required
          maxLength={254}
          placeholder={t.auth.emailPlaceholder}
          helper={t.auth.emailHelper}
          {...field("email")}
        />
        {failure && (
          <p role="alert" className="flex items-start gap-1.5 t-caption text-error">
            <Icon name="info" size={18} className="mt-px" />
            {failure}
          </p>
        )}
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-4 t-caption text-ink-2">
          <Icon name="lock" size={18} className="mt-px shrink-0" />
          {t.auth.entry.note}
        </p>
      </form>
    </AuthLayout>
  );
}
