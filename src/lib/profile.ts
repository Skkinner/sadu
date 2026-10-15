// Shared by the entry form, the profile editor and the API: one set of rules for names and emails.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_MAX = 60;
export const EMAIL_MAX = 254;

export type Profile = { firstName: string; lastName: string; email: string };
export type ProfileErrors = Partial<Record<keyof Profile, "required" | "invalid" | "tooLong">>;

/** Emails are case-insensitive identifiers: compare and store them trimmed and lower-cased. */
export function normalizeEmail(email: string) {
  return email.normalize("NFC").trim().toLowerCase();
}

export function cleanName(name: string) {
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function validateProfile(input: unknown): { ok: true; value: Profile } | { ok: false; errors: ProfileErrors } {
  const raw = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const value: Profile = {
    firstName: cleanName(str(raw.firstName)),
    lastName: cleanName(str(raw.lastName)),
    email: normalizeEmail(str(raw.email)),
  };
  const errors: ProfileErrors = {};
  for (const key of ["firstName", "lastName"] as const) {
    if (!value[key]) errors[key] = "required";
    else if (value[key].length > NAME_MAX) errors[key] = "tooLong";
  }
  if (!value.email) errors.email = "required";
  else if (value.email.length > EMAIL_MAX) errors.email = "tooLong";
  else if (!EMAIL_RE.test(value.email)) errors.email = "invalid";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
