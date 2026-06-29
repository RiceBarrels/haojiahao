import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  getLocalSeoPage,
  localSeoPages,
  localizedValue,
  salonAddressLine,
  salonLocation,
  type LocalSeoPage,
} from "@/lib/local-seo"
import { getDictionary, LOCALES, toLocale, type Locale } from "@/lib/i18n"

type LocalSeoPageProps = {
  params: Promise<{ lang: string; slug: string }>
}

export function generateStaticParams() {
  return LOCALES.flatMap((lang) =>
    localSeoPages.map((page) => ({
      lang,
      slug: page.slug,
    }))
  )
}

export async function generateMetadata({
  params,
}: LocalSeoPageProps): Promise<Metadata> {
  const { lang, slug } = await params
  const locale = toLocale(lang)
  const page = getLocalSeoPage(slug)

  if (!page) {
    return {}
  }

  return {
    title: localizedValue(page.metaTitle, locale),
    description: localizedValue(page.metaDescription, locale),
    alternates: {
      canonical: `/${locale}/private-hair-stylist-near/${page.slug}`,
    },
  }
}

export default async function LocalSeoPlacePage({
  params,
}: LocalSeoPageProps) {
  const { lang, slug } = await params
  const locale = toLocale(lang)
  const page = getLocalSeoPage(slug)

  if (!page) {
    notFound()
  }

  const dict = getDictionary(locale)
  const placeName = localizedValue(page.placeName, locale)
  const headline = localizedValue(page.headline, locale)
  const intro = localizedValue(page.intro, locale)
  const context = localizedValue(page.context, locale)
  const searchPhrases = localizedValue(page.searchPhrases, locale)
  const bookingHref = `/${locale}/booking`

  return (
    <main>
      <SeoStructuredData page={page} locale={locale} />

      <section className="bg-card/55 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <Badge className="mb-5 border-transparent bg-secondary text-secondary-foreground">
              <MapPin className="size-3.5" />
              {placeName}
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-tight sm:text-6xl">
              {headline}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              {intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={bookingHref} className={buttonVariants({ size: "lg" })}>
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

          <Card className="border-border/80 bg-card">
            <CardContent className="grid gap-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  {locale === "zh" ? "工作室地址" : "Studio address"}
                </p>
                <p className="mt-2 font-heading text-2xl font-semibold">
                  {salonAddressLine()}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {salonLocation.country}
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  locale === "zh"
                    ? "预约制沟通，按发质、脸型和日常打理习惯调整"
                    : "Appointment-based consultation tailored to hair texture, face shape, and daily routine",
                  locale === "zh"
                    ? "男士精剪、女士剪发、儿童剪发与造型整理"
                    : "Men's cuts, women's cuts, children's cuts, and styling refreshes",
                  locale === "zh"
                    ? "适合在 Norwalk 及周边社区寻找更私密剪发体验的顾客"
                    : "Designed for clients around Norwalk who prefer a more private haircut experience",
                ].map((item) => (
                  <p key={item} className="flex gap-2 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--salon-gold)]" />
                    {item}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-[var(--salon-gold)]" />
              <h2 className="font-heading text-4xl font-semibold">
                {locale === "zh" ? "为什么适合这个区域" : "Why this area page fits"}
              </h2>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {context}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {searchPhrases.map((phrase) => (
              <Card key={phrase} className="border-border/80 bg-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                    {locale === "zh" ? "本地搜索词" : "Local search phrase"}
                  </p>
                  <p className="mt-3 font-heading text-2xl font-semibold">
                    {phrase}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/55 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="font-heading text-4xl font-semibold">
                {locale === "zh" ? "常见问题" : "Common questions"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {locale === "zh"
                  ? `关于从 ${placeName} 附近预约私人高定剪发。`
                  : `About booking a private custom haircut near ${placeName}.`}
              </p>
            </div>
            <div className="grid gap-4">
              {getFaqItems(page, locale).map((item) => (
                <Card key={item.question} className="border-border/80 bg-card">
                  <CardContent className="p-5">
                    <h3 className="font-heading text-2xl font-semibold">
                      {item.question}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-5 px-4 sm:px-6 md:flex-row md:items-center lg:px-8">
          <div>
            <h2 className="font-heading text-4xl font-semibold">
              {locale === "zh" ? "预约私人剪发" : "Book a private haircut"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {locale === "zh"
                ? `从 ${placeName} 附近出发，提前选择服务、发型师和可用时间。`
                : `Coming from ${placeName}? Choose a service, stylist, and available time in advance.`}
            </p>
          </div>
          <Link href={bookingHref} className={buttonVariants({ size: "lg" })}>
            <Scissors data-icon="inline-start" />
            {dict.publicSite.hero.primaryAction}
          </Link>
        </div>
      </section>
    </main>
  )
}

function getFaqItems(page: LocalSeoPage, locale: Locale) {
  const placeName = localizedValue(page.placeName, locale)

  if (locale === "zh") {
    return [
      {
        question: `${placeName} 附近可以预约私人高定剪发吗？`,
        answer:
          "可以。你可以在线选择服务、发型师和可用时段，预约一对一沟通的剪发体验。",
      },
      {
        question: "这个地址在哪里？",
        answer: `工作室地址是 ${salonAddressLine()}, ${salonLocation.country}。`,
      },
      {
        question: "适合哪些服务？",
        answer:
          "适合男士精剪、女士剪发、儿童剪发、洗剪造型和需要先沟通风格的发型调整。",
      },
    ]
  }

  return [
    {
      question: `Can I book a private custom haircut near ${placeName}?`,
      answer:
        "Yes. You can choose a service, stylist, and available appointment time online for a more personal haircut experience.",
    },
    {
      question: "Where is the studio located?",
      answer: `The studio is located at ${salonAddressLine()}, ${salonLocation.country}.`,
    },
    {
      question: "What services fit this appointment?",
      answer:
        "Men's cuts, women's cuts, children's cuts, wash-and-cut styling, and consultative restyles all fit this appointment flow.",
    },
  ]
}

function SeoStructuredData({
  page,
  locale,
}: {
  page: LocalSeoPage
  locale: Locale
}) {
  const faqItems = getFaqItems(page, locale)
  const businessName = localizedValue(salonLocation.name, locale)
  const placeName = localizedValue(page.placeName, locale)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: businessName,
      telephone: salonLocation.telephone,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        streetAddress: salonLocation.streetAddress,
        addressLocality: salonLocation.city,
        addressRegion: salonLocation.region,
        postalCode: salonLocation.postalCode,
        addressCountry: "US",
      },
      areaServed: {
        "@type": "Place",
        name: placeName,
      },
      makesOffer: {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name:
            locale === "zh"
              ? "私人高定剪发与造型预约"
              : "Private custom haircut and styling appointment",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
