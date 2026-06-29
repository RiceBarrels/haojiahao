import { NextResponse, type NextRequest } from "next/server"

import { getPreferredLocale, parsePathLocale } from "@/lib/i18n"
import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)
  const { pathname } = request.nextUrl

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return response
  }

  const parsed = parsePathLocale(pathname)

  if (parsed.hasLocale) {
    return response
  }

  const url = request.nextUrl.clone()
  const locale = getPreferredLocale(request.headers.get("accept-language"))
  url.pathname =
    pathname === "/" ? `/${locale}` : `/${locale}${pathname}`

  const redirectResponse = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
