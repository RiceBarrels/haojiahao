import Link from "next/link"
import {
  CalendarDays,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Scissors,
} from "lucide-react"

import { signOutAction } from "@/app/actions"
import { buttonVariants } from "@/components/ui/button"
import type { Dictionary, Locale } from "@/lib/i18n"
import { LOCALE_NAMES } from "@/lib/i18n"
import type { SessionProfile } from "@/lib/types"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  locale: Locale
  dict: Dictionary
  session: SessionProfile
}

export function SiteHeader({ locale, dict, session }: SiteHeaderProps) {
  const otherLocale = locale === "zh" ? "en" : "zh"

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card shadow-sm">
            <Scissors className="size-5 text-[var(--salon-gold)]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-heading text-2xl font-semibold leading-6">
              {locale === "zh"
                ? "好加好男女发廊"
                : "Better Hair and Beauty Salon Company"}
            </span>
            <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <MapPin className="size-3" />
              155 Wolfpit Ave, Norwalk
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href={`/${locale}#services`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {dict.publicSite.nav.services}
          </Link>
          <Link
            href={`/${locale}/private-hair-stylist-near`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <MapPin data-icon="inline-start" />
            {locale === "zh" ? "服务区域" : "Areas"}
          </Link>
          <Link
            href={`/${locale}/booking`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <CalendarDays data-icon="inline-start" />
            {dict.publicSite.nav.booking}
          </Link>
          {session.isAdmin ? (
            <Link
              href={`/${locale}/admin`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <LayoutDashboard data-icon="inline-start" />
              {dict.publicSite.nav.admin}
            </Link>
          ) : null}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/${otherLocale}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
            aria-label={dict.locale.switchTo}
          >
            {LOCALE_NAMES[otherLocale]}
          </Link>
          {session.userId ? (
            <form action={signOutAction}>
              <input type="hidden" name="locale" value={locale} />
              <button
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                type="submit"
              >
                <LogOut data-icon="inline-start" />
                <span className="hidden sm:inline">{dict.auth.signOut}</span>
              </button>
            </form>
          ) : (
            <Link
              href={`/${locale}/auth`}
              className={buttonVariants({ size: "sm" })}
            >
              <LogIn data-icon="inline-start" />
              {dict.publicSite.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
