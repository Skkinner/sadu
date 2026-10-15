"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { useSwitchLocale } from "@/components/layout/toggles";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, ProgressBar, Switch } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/dialog";
import { InputField, SelectField, TextAreaField } from "@/components/ui/field";
import { Icon, type IconName } from "@/components/ui/icon";
import { ListGroup, ListRowLink, ListRowToggle } from "@/components/ui/list";
import { speak, stopSpeaking } from "@/lib/speech";
import { useProfileErrorText } from "@/components/screens/auth";
import { validateProfile, type Profile } from "@/lib/profile";
import { actions, fullName, level, points, session, useStore, type TextSize } from "@/lib/store";
import { cn } from "@/lib/utils";

// D28 / M28 · My account  (+ D32 / M32 · Log out)
export function AccountScreen() {
  const { t, fmt, href, locale } = useI18n();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const plan = useStore((s) => s.plan);
  const pts = useStore(points);
  const lv = level(pts);
  const switchLocale = useSwitchLocale();
  const [logout, setLogout] = useState(false);
  const [edit, setEdit] = useState(false);

  const narration = plan.narrationLang ?? locale;
  const profile = (
    <div className="flex flex-col gap-3.5 rounded-[22px] border border-line bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-inverse t-h2 text-on-inverse">
          {(user?.firstName || "·").charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate t-h3 text-ink">{fullName(user)}</p>
          <p className="truncate t-caption text-ink-2">{user?.email}</p>
        </div>
        <IconButton icon="settings" label={t.account.editProfile} size={40} onClick={() => setEdit(true)} />
      </div>
      <div className="flex flex-col gap-2 rounded-[14px] bg-gold-subtle p-3">
        <div className="flex items-center gap-2 text-gold-text">
          <Icon name="award" size={18} />
          <span className="flex-1 t-body-strong">{fmt(t.account.level, { n: lv.n, name: t.account.levels[lv.index] })}</span>
          <span className="t-label" dir="ltr">
            {pts} / {lv.next}
          </span>
        </div>
        <ProgressBar value={(pts - lv.floor) / (lv.next - lv.floor)} className="bg-card" />
      </div>
    </div>
  );
  const shortcuts = (
    <div className="grid grid-cols-2 gap-2.5">
      <Link href={href("/passport")} className="flex items-center gap-2.5 rounded-[18px] bg-muted p-3.5 t-body-strong text-ink hover:bg-line">
        <Icon name="award" size={22} />
        {t.account.myPassport}
      </Link>
      <Link href={href("/missed")} className="flex items-center gap-2.5 rounded-[18px] bg-muted p-3.5 t-body-strong text-ink hover:bg-line">
        <Icon name="bookmark" size={22} />
        {t.account.missed}
      </Link>
    </div>
  );
  const logoutBtn = (
    <Button variant="secondary" size="lg" block onClick={() => setLogout(true)}>
      {t.account.logout}
    </Button>
  );

  return (
    <PageShell header={{ type: "logo" }} tab="account">
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-6 lg:mx-0 lg:max-w-[732px] lg:flex-1 lg:gap-7">
          <h1 className="t-h1 text-ink">{t.account.title}</h1>
          <div className="flex flex-col gap-4 lg:hidden">
            {profile}
            {shortcuts}
          </div>
          <ListGroup title={t.account.preferences}>
            <ListRowLink icon="eye" title={t.account.accessibility} description={t.account.accessibilityBody} href={href("/accessibility")} />
            <ListRowLink
              icon="globe"
              title={t.account.siteLanguage}
              description={locale === "ar" ? "العربية" : "English"}
              onClick={() => switchLocale(locale === "ar" ? "en" : "ar")}
            />
            <ListRowLink
              icon="headphones"
              title={t.account.narration}
              description={fmt(t.account.narrationValue, {
                lang: t.plan.narrationLangs[narration],
                voice: plan.voice === "calm" ? t.account.voiceCalm : t.account.voiceLively,
              })}
              href={href("/plan")}
            />
          </ListGroup>
          <ListGroup title={t.account.help}>
            <ListRowLink icon="quiz" title={t.account.faq} description={t.account.faqBody} href={href("/faq")} />
            <ListRowLink icon="mail" title={t.account.contact} description={t.account.contactBody} href={href("/contact")} />
            <ListRowLink icon="lock" title={t.account.privacy} description={t.account.privacyBody} href={href("/privacy")} />
          </ListGroup>
          <div className="lg:hidden">{logoutBtn}</div>
        </div>
        <aside className="sticky top-28 hidden w-[420px] shrink-0 flex-col gap-6 lg:flex">
          {profile}
          {shortcuts}
          {logoutBtn}
        </aside>
      </div>

      <Dialog
        open={logout}
        onOpenChange={setLogout}
        icon="logout"
        title={t.auth.switchUser.title}
        description={fmt(t.auth.switchUser.body, { email: user?.email ?? "" })}
      >
        <div className="flex w-full flex-col gap-1">
          <Button
            size="lg"
            block
            onClick={async () => {
              await session.switchUser();
              setLogout(false);
              router.push(href("/start"));
            }}
          >
            {t.auth.switchUser.confirm}
          </Button>
          <Button variant="ghost" block onClick={() => setLogout(false)}>
            {t.auth.switchUser.cancel}
          </Button>
        </div>
      </Dialog>
      <EditProfileDialog open={edit} onOpenChange={setEdit} />
    </PageShell>
  );
}

function EditProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange} icon="user" title={t.account.profileTitle} align="start">
      {/* dialog content unmounts when closed, so the form starts fresh from the saved profile each time */}
      <ProfileForm onDone={() => onOpenChange(false)} />
    </Dialog>
  );
}

function ProfileForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const user = useStore((s) => s.user);
  const errorText = useProfileErrorText();
  const [form, setForm] = useState<Profile>({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", email: user?.email ?? "" });
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const check = validateProfile(form);
  const errors: Partial<Record<keyof Profile, string>> = check.ok ? {} : errorText(check.errors);
  const field = (key: keyof Profile) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setFailure(null);
    },
  });
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!check.ok || pending) return;
    setPending(true);
    const result = await session.updateProfile(check.value);
    setPending(false);
    if (!result.ok) {
      setFailure(result.error === "email_taken" ? t.auth.errors.emailTaken : result.error === "network" ? t.auth.errors.network : t.auth.errors.emailInvalid);
      return;
    }
    toast(t.common.toast.saved);
    onDone();
  };
  return (
    <>
      <form onSubmit={save} noValidate className="flex w-full flex-col gap-4 text-start">
        <InputField label={t.auth.firstName} icon="user" autoComplete="given-name" maxLength={60} error={form.firstName ? errors.firstName : undefined} {...field("firstName")} />
        <InputField label={t.auth.lastName} autoComplete="family-name" maxLength={60} error={form.lastName ? errors.lastName : undefined} {...field("lastName")} />
        <InputField
          label={t.auth.email}
          icon="mail"
          type="email"
          dir="ltr"
          autoComplete="email"
          maxLength={254}
          error={failure ?? (form.email ? errors.email : undefined)}
          {...field("email")}
        />
        <div className="flex flex-col gap-1">
          <Button type="submit" size="lg" block disabled={!check.ok || pending}>
            {t.account.save}
          </Button>
          <Button variant="ghost" block onClick={onDone}>
            {t.account.cancel}
          </Button>
        </div>
      </form>
    </>
  );
}

// D29 / M29 · Accessibility
export function AccessibilityScreen() {
  const { t, fmt, locale } = useI18n();
  const prefs = useStore((s) => s.prefs);
  const speeds = [0.75, 1, 1.25, 1.5] as const;
  const speedLabel = t.a11y.speedLabels[String(prefs.speed) as keyof typeof t.a11y.speedLabels] ?? "";

  // "Read pages aloud": speak the main content when switched on
  const toggleReadAloud = (v: boolean) => {
    actions.setPrefs({ readAloud: v });
    if (v) speak(document.getElementById("main")?.innerText.slice(0, 600) ?? "", { lang: locale, rate: prefs.speed });
    else stopSpeaking();
  };

  const textSize = (
    <section className="flex flex-col gap-3">
      <h2 className="t-label text-ink-2">{t.a11y.textSize}</h2>
      <div className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-card p-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => actions.setPrefs({ textSize: Math.max(1, prefs.textSize - 1) as TextSize })} aria-label={t.a11y.textSizeSmaller} className="t-body text-ink-2">
            {locale === "ar" ? "أ" : "A"}
          </button>
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={prefs.textSize}
            onChange={(e) => actions.setPrefs({ textSize: Number(e.target.value) as TextSize })}
            aria-label={t.a11y.textSize}
            className="h-7 flex-1 cursor-pointer accent-[var(--action)]"
          />
          <button type="button" onClick={() => actions.setPrefs({ textSize: Math.min(4, prefs.textSize + 1) as TextSize })} aria-label={t.a11y.textSizeLarger} className="t-h1 text-ink">
            {locale === "ar" ? "أ" : "A"}
          </button>
        </div>
        <div className="flex flex-col gap-1 rounded-[14px] bg-muted p-3.5">
          <p className="t-caption text-ink-2">{t.a11y.preview}</p>
          <p className="t-body-l text-ink">{t.a11y.previewText}</p>
        </div>
      </div>
    </section>
  );

  return (
    <PageShell header={{ type: "back", title: t.a11y.appTitle }}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[712px] lg:flex-1">
          <div className="flex flex-col gap-1.5">
            <h1 className="t-h1 text-ink">{t.a11y.title}</h1>
            <p className="t-body text-ink-2">{t.a11y.lead}</p>
          </div>
          <div className="lg:hidden">{textSize}</div>
          <ListGroup title={t.a11y.reading}>
            <ListRowToggle
              icon="captions"
              title={t.a11y.captions}
              description={t.a11y.captionsBody}
              control={<Switch checked={prefs.captions} onCheckedChange={(v) => actions.setPrefs({ captions: v })} label={t.a11y.captions} />}
            />
            <ListRowToggle
              icon="volume"
              title={t.a11y.readAloud}
              description={t.a11y.readAloudBody}
              control={<Switch checked={prefs.readAloud} onCheckedChange={toggleReadAloud} label={t.a11y.readAloud} />}
            />
            <ListRowLink
              icon="headphones"
              title={t.a11y.speed}
              description={fmt(t.a11y.speedValue, { s: prefs.speed, label: speedLabel })}
              onClick={() => actions.setPrefs({ speed: speeds[(speeds.indexOf(prefs.speed as (typeof speeds)[number]) + 1) % speeds.length] })}
            />
          </ListGroup>
          <ListGroup title={t.a11y.display}>
            <ListRowToggle
              icon="moon"
              title={t.a11y.dark}
              description={t.a11y.darkBody}
              control={<Switch checked={prefs.theme === "dark"} onCheckedChange={(v) => actions.setPrefs({ theme: v ? "dark" : "light" })} label={t.a11y.dark} />}
            />
            <ListRowToggle
              icon="eye"
              title={t.a11y.contrast}
              description={t.a11y.contrastBody}
              control={<Switch checked={prefs.contrast} onCheckedChange={(v) => actions.setPrefs({ contrast: v })} label={t.a11y.contrast} />}
            />
            <ListRowToggle
              icon="sparkle"
              title={t.a11y.motion}
              description={t.a11y.motionBody}
              control={<Switch checked={prefs.reduceMotion} onCheckedChange={(v) => actions.setPrefs({ reduceMotion: v })} label={t.a11y.motion} />}
            />
          </ListGroup>
        </div>
        <aside className="hidden w-[440px] shrink-0 lg:block">{textSize}</aside>
      </div>
    </PageShell>
  );
}

// D30 / M30 · FAQ
export function FaqScreen() {
  const { t, fmt, href } = useI18n();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | "journey" | "audio" | "stamps">("all");
  const [open, setOpen] = useState<number | null>(0);
  const items = useMemo(
    () =>
      t.faq.items
        .map((item, i) => ({ ...item, i }))
        .filter((item) => (cat === "all" || item.cat === cat) && (item.q + item.a).toLowerCase().includes(query.trim().toLowerCase())),
    [t, cat, query],
  );
  const still = (
    <div className="flex flex-col gap-2.5 rounded-[20px] bg-gold-subtle p-[18px]">
      <p className="t-h3 text-ink">{t.faq.stillTitle}</p>
      <p className="t-body text-ink-2">{t.faq.stillBody}</p>
      <Button asChild variant="secondary" block>
        <Link href={href("/contact")}>
          {t.faq.contact}
          <Icon name="arrow-right" size={20} />
        </Link>
      </Button>
    </div>
  );
  return (
    <PageShell header={{ type: "back", title: t.faq.appTitle }}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[752px] lg:flex-1">
          <div className="flex flex-col gap-3">
            <h1 className="t-h1 text-ink">{t.faq.title}</h1>
            <label className="flex h-[52px] items-center gap-2.5 rounded-[14px] bg-muted px-4 focus-within:outline-2 focus-within:outline-action">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="shrink-0 text-ink-3">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.faq.search}
                aria-label={t.faq.search}
                className="h-full flex-1 bg-transparent t-body text-ink outline-none placeholder:text-ink-3"
              />
            </label>
          </div>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
            {(["all", "journey", "audio", "stamps"] as const).map((c) => (
              <Chip key={c} selected={cat === c} onClick={() => setCat(c)} className="shrink-0">
                {t.faq.categories[c]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            {items.length === 0 && <p className="rounded-[18px] bg-muted p-4 t-body text-ink-2">{fmt(t.faq.noResults, { q: query })}</p>}
            {items.map((item) => {
              const isOpen = open === item.i;
              return (
                <div key={item.i} className={cn("rounded-[18px] transition-colors", isOpen ? "border-[1.5px] border-action bg-card" : "bg-muted")}>
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-${item.i}`}
                      onClick={() => setOpen(isOpen ? null : item.i)}
                      className="flex w-full items-center gap-2.5 p-4 text-start t-body-strong text-ink"
                    >
                      <span className="flex-1">{item.q}</span>
                      <Icon name={isOpen ? "minus" : "plus"} size={20} />
                    </button>
                  </h2>
                  {isOpen && (
                    <p id={`faq-${item.i}`} className="-mt-2 px-4 pb-4 t-body text-ink-2">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="lg:hidden">{still}</div>
        </div>
        <aside className="hidden w-[400px] shrink-0 lg:block">{still}</aside>
      </div>
    </PageShell>
  );
}

// D31 / M31 · Contact us
export function ContactScreen() {
  const { t, fmt } = useI18n();
  const toast = useToast();
  const email = useStore((s) => (s.auth === "user" ? s.user?.email : null));
  const [topic, setTopic] = useState("0");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const icons: IconName[] = ["sparkle", "navigate", "mail"];
  const channelAction = [
    () => toast(t.contact.chatSoon),
    () => toast(t.contact.deskInfo),
    () => (window.location.href = "mailto:hello@sadu.example?subject=Sadu"),
  ];
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) {
      setError(true);
      return;
    }
    toast(t.contact.sent);
    setMessage("");
    setError(false);
  };
  const sendBtn = (
    <Button type="submit" form="contact-form" size="lg" block>
      {t.contact.send}
    </Button>
  );
  const channels = (
    <div className="flex flex-col gap-2.5">
      {t.contact.channels.map((c, i) => (
        <button
          key={c.title}
          type="button"
          onClick={channelAction[i]}
          className="flex items-center gap-3 rounded-[18px] border border-line bg-card p-3.5 text-start transition-colors hover:bg-muted/50"
        >
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-[14px]", i === 0 ? "bg-action text-on-action" : "bg-muted text-ink")}>
            <Icon name={icons[i]} size={22} />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="t-body-strong text-ink">{c.title}</span>
            <span className={cn("t-caption", i === 0 ? "text-action" : "text-ink-2")}>{c.body}</span>
          </span>
          <Icon name="chevron-right" size={20} className="text-ink-2" />
        </button>
      ))}
    </div>
  );
  return (
    <PageShell header={{ type: "back", title: t.contact.appTitle }} actionBar={sendBtn}>
      <div className="page-container flex items-start gap-12 pb-10 pt-2 lg:pb-[88px] lg:pt-12">
        <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col gap-7 lg:mx-0 lg:max-w-[712px] lg:flex-1">
          <div className="flex flex-col gap-1.5">
            <h1 className="t-h1 text-ink">{t.contact.title}</h1>
            <p className="t-body text-ink-2">{t.contact.lead}</p>
          </div>
          <div className="lg:hidden">{channels}</div>
          <form id="contact-form" onSubmit={send} noValidate className="flex flex-col gap-4">
            <h2 className="t-h3 text-ink">{t.contact.write}</h2>
            <SelectField
              label={t.contact.topic}
              icon="route"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              options={t.contact.topics.map((label, i) => ({ value: String(i), label }))}
            />
            <TextAreaField
              label={t.contact.message}
              value={message}
              maxLength={500}
              placeholder={t.contact.messagePlaceholder}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(false);
              }}
              error={error}
              footer={
                <div className="flex items-center justify-between gap-3 t-caption">
                  <span className={error ? "text-error" : "text-ink-2"}>
                    {error ? t.contact.empty : email ? fmt(t.contact.reply, { email }) : t.contact.replyGuest}
                  </span>
                  <span className="shrink-0 text-ink-3" dir="ltr">
                    {message.length} / 500
                  </span>
                </div>
              }
            />
          </form>
        </div>
        <aside className="hidden w-[440px] shrink-0 flex-col gap-6 lg:flex">
          {channels}
          {sendBtn}
        </aside>
      </div>
    </PageShell>
  );
}

// Footer › Privacy (no Figma frame; built from the account row copy in the same layout)
export function PrivacyScreen() {
  const { t } = useI18n();
  const icons: IconName[] = ["lock", "heart", "eye", "settings"];
  return (
    <PageShell header={{ type: "back", title: t.privacy.title }}>
      <div className="page-container flex flex-col gap-7 pb-10 pt-2 lg:max-w-[760px] lg:pb-[88px] lg:pt-12 xl:max-w-[760px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="t-h1 text-ink">{t.privacy.title}</h1>
          <p className="t-body text-ink-2">{t.privacy.lead}</p>
        </div>
        <ListGroup>
          {t.privacy.points.map((p, i) => (
            <ListRowToggle key={p.title} icon={icons[i]} title={p.title} description={p.body} control={null} />
          ))}
        </ListGroup>
      </div>
    </PageShell>
  );
}
