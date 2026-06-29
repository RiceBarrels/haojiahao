import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, MapPin, Phone, Scissors } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  localSeoPages,
  localizedValue,
  salonAddressLine,
  salonLocation,
} from "@/lib/local-seo"
import { getDictionary, toLocale } from "@/lib/i18n"

type LocalSeoIndexPageProps = {
  params: Promise<{ lang: string }>
}

export async function generateMetadata({
  params,
}: LocalSeoIndexPageProps): Promise<Metadata> {
  const { lang } = await params
  const locale = toLocale(lang)

  return {
    title:
      locale === "zh"
        ? "Norwalk CT 私人高定剪发师服务区域"
        : "Private Custom Haircut Stylist Areas in Norwalk CT",
    description:
      locale === "zh"
        ? "查看好加好男女发廊康州工作室在 Norwalk, CT 06851 附近服务的本地 SEO 区域页面。"
        : "Explore local service pages for private custom haircut appointments near Norwalk, CT 06851.",
  }
}

export default async function LocalSeoIndexPage({
  params,
}: LocalSeoIndexPageProps) {
  const { lang } = await params
  const locale = toLocale(lang)
  const dict = getDictionary(locale)

  return (
    <main>
      <section className="bg-card/55 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <Badge className="mb-5 border-transparent bg-secondary text-secondary-foreground">
              <MapPin className="size-3.5" />
              {salonAddressLine()}
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-tight sm:text-6xl">
              {locale === "zh"
                ? "Norwalk 附近私人高定剪发师"
                : "Private custom haircut stylist near Norwalk"}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              {locale === "zh"
                ? "围绕 155 Wolfpit Ave, Norwalk, CT 06851 创建的本地服务页面，覆盖 Wolfpit、Cranbury、SoNo、East Norwalk 和周边知名地标。"
                : "Local service pages built around 155 Wolfpit Ave, Norwalk, CT 06851, covering Wolfpit, Cranbury, SoNo, East Norwalk, and nearby landmarks."}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/booking`}
                className={buttonVariants({ size: "lg" })}
              >
                <CalendarDays data-icon="inline-start" />
                {dict.publicSite.nav.booking}
              </Link>
              <a
                href={`tel:${salonLocation.telephone}`}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <Phone data-icon="inline-start" />
                {salonLocation.displayPhone}
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {localSeoPages.map((page) => (
              <Link
                key={page.slug}
                href={`/${locale}/private-hair-stylist-near/${page.slug}`}
                className="group"
              >
                <Card className="h-full border-border/80 bg-card transition-colors group-hover:border-primary/60">
                  <CardContent className="grid gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                        <Scissors className="size-4" />
                      </span>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                          {localizedValue(page.areaLabel, locale)}
                        </p>
                        <h2 className="mt-1 font-heading text-2xl font-semibold">
                          {localizedValue(page.placeName, locale)}
                        </h2>
                      </div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {localizedValue(page.metaDescription, locale)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
