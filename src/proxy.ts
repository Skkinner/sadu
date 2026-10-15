import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_PATHS, SESSION_COOKIE } from "@/lib/constants";

// Optimistic check only: no session cookie → straight to the entry form, without rendering the page first.
// The cookie is validated by the API (and SessionGate on the client) on every request that touches data.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const [, locale, ...rest] = pathname.split("/");
  const path = `/${rest.join("/")}`.replace(/\/$/, "") || "/";
  if (PUBLIC_PATHS.includes(path) || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/start`;
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/(ar|en)/:path*"],
};
