import Image from "next/image"
import Link from "next/link"
import {
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Scissors,
  Sparkles,
  Star,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPublicSalonData } from "@/lib/data"
import {
  formatPrice,
  getDictionary,
  toLocale,
  type Locale,
} from "@/lib/i18n"

type HomePageProps = {
  params: Promise<{ lang: string }>
}

const testimonials = {
  zh: [
    "剪得很细，沟通也耐心，家里大人小孩都能约到合适时间。",
    "店里干净安静，价格和时间很清楚，不用来回打电话确认。",
    "男士短发修得利落，女士洗吹也很自然。",
  ],
  en: [
    "Careful cuts, patient communication, and easy times for the whole family.",
    "Clean, calm, and clear about pricing and timing before you book.",
    "Sharp men's cuts and natural blowouts without a rushed feeling.",
  ],
} as const

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params
  const locale = toLocale(lang)
  const dict = getDictionary(locale)
  const { services, stylists } = await getPublicSalonData()

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/salon-hero.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,245,245,0.94)_0%,rgba(255,245,245,0.78)_38%,rgba(255,245,245,0.18)_72%)]" />
        </div>
        <div className="mx-auto flex min-h-[78svh] w-full max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="mb-5 border-transparent bg-secondary text-secondary-foreground">
              <Sparkles className="size-3.5" />
              {dict.publicSite.hero.eyebrow}
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-[0.95] text-foreground sm:text-7xl">
              {locale === "zh"
                ? "好加好男女发廊康州工作室"
                : "Better Hair and Beauty Salon Company"}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              {dict.publicSite.hero.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${locale}/booking`}
                className={buttonVariants({ size: "lg" })}
              >
                <CalendarDays data-icon="inline-start" />
                {dict.publicSite.hero.primaryAction}
              </Link>
              <Link
                href="#services"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <Scissors data-icon="inline-start" />
                {dict.publicSite.hero.secondaryAction}
              </Link>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-foreground sm:grid-cols-3">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-[var(--salon-gold)]" />
                Norwalk, CT
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-[var(--salon-gold)]" />
                929-410-9809
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-[var(--salon-gold)]" />
                10:00-19:00
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="bg-card/55 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-4xl font-semibold">
                {dict.publicSite.services.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {dict.publicSite.services.description}
              </p>
            </div>
            <Link
              href={`/${locale}/booking`}
              className={buttonVariants({ variant: "outline" })}
            >
              {dict.publicSite.nav.booking}
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="border-border/80 bg-card">
                <CardContent className="grid gap-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-heading text-2xl font-semibold">
                      {serviceName(service, locale)}
                    </h3>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(service.price_cents, locale)}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {locale === "zh"
                      ? service.description_zh
                      : service.description_en}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4 text-[var(--salon-gold)]" />
                    {service.duration_minutes} {dict.common.minutes}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <h2 className="font-heading text-4xl font-semibold">
              {dict.publicSite.stylists.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {dict.publicSite.stylists.description}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {stylists.map((stylist) => (
              <Card key={stylist.id} className="border-border/80 bg-card">
                <CardContent className="p-5">
                  {stylist.photo_url ? (
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
                      <Image
                        src={stylist.photo_url}
                        alt={locale === "zh" ? stylist.name_zh : stylist.name_en}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 grid size-12 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                      <Scissors className="size-5" />
                    </div>
                  )}
                  <h3 className="font-heading text-2xl font-semibold">
                    {locale === "zh" ? stylist.name_zh : stylist.name_en}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {locale === "zh" ? stylist.bio_zh : stylist.bio_en}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary/55 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Star className="size-5 fill-[var(--salon-gold)] text-[var(--salon-gold)]" />
            <h2 className="font-heading text-4xl font-semibold">
              {locale === "zh" ? "顾客反馈" : "Client notes"}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {testimonials[locale].map((quote) => (
              <Card key={quote} className="border-border/80 bg-card">
                <CardContent className="p-5 text-sm leading-7 text-muted-foreground">
                  &ldquo;{quote}&rdquo;
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <h2 className="font-heading text-4xl font-semibold">
              {locale === "zh" ? "预约与到店" : "Book and visit"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              155 Wolfpit Ave, Norwalk, CT 06851
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/${locale}/booking`}
              className={buttonVariants({ size: "lg" })}
            >
              <CalendarDays data-icon="inline-start" />
              {dict.publicSite.nav.booking}
            </Link>
            <a
              href="tel:+19294109809"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              <Phone data-icon="inline-start" />
              929-410-9809
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function serviceName(
  service: { name_zh: string; name_en: string },
  locale: Locale
) {
  return locale === "zh" ? service.name_zh : service.name_en
}
