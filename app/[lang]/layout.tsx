import type { Metadata } from "next"
import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import {
  getDictionary,
  INTL_LOCALES,
  isLocale,
  LOCALES,
  type Locale,
} from "@/lib/i18n"
import { getSessionProfile } from "@/lib/data"

type LocaleLayoutProps = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const locale = isLocale(lang) ? lang : "zh"
  const dict = getDictionary(locale)

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { lang } = await params

  if (!isLocale(lang)) {
    notFound()
  }

  const locale = lang as Locale
  const dict = getDictionary(locale)
  const session = await getSessionProfile()

  return (
    <div lang={INTL_LOCALES[locale]} className="min-h-dvh">
      <SiteHeader locale={locale} dict={dict} session={session} />
      {children}
      <footer className="border-t border-border bg-card/65">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>{dict.publicSite.footer.tagline}</p>
          <p>
            {dict.common.appName} · 155 Wolfpit Ave, Norwalk, CT 06851 ·
            929-410-9809
          </p>
        </div>
      </footer>
    </div>
  )
}
