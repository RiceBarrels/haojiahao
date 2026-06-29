import Link from "next/link"
import { CalendarDays, CheckCircle2, LayoutDashboard } from "lucide-react"

import { AuthPanel } from "@/components/auth-panel"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSessionProfile } from "@/lib/data"
import { getDictionary, toLocale } from "@/lib/i18n"

type AuthPageProps = {
  params: Promise<{ lang: string }>
}

export default async function AuthPage({ params }: AuthPageProps) {
  const { lang } = await params
  const locale = toLocale(lang)
  const dict = getDictionary(locale)
  const session = await getSessionProfile()

  return (
    <main className="bg-[linear-gradient(180deg,var(--background),var(--card))] py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <Badge className="mb-4 w-fit bg-secondary text-secondary-foreground">
            {dict.auth.title}
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-none">
            {locale === "zh" ? "登录与账户" : "Sign in and account"}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            {locale === "zh"
              ? "预约不需要登录。账户用于查看预约记录，管理员账户可以管理服务、发型师、排班和预约状态。"
              : "Booking does not require sign-in. Accounts keep booking history, and admin accounts manage services, stylists, schedules, and appointment status."}
          </p>
        </section>

        {session.userId ? (
          <Card className="border-border/80 bg-card/95 shadow-[0_18px_50px_rgba(45,52,54,0.08)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-3xl">
                <CheckCircle2 className="size-5 text-[var(--salon-gold)]" />
                {dict.auth.messages.signInSuccess}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="rounded-lg border border-border bg-secondary/35 p-4 text-sm">
                <p className="font-medium text-foreground">
                  {session.profile?.display_name ?? session.email}
                </p>
                <p className="mt-1 text-muted-foreground">{session.email}</p>
                <p className="mt-2">
                  <Badge variant={session.isAdmin ? "default" : "outline"}>
                    {session.isAdmin
                      ? dict.auth.role.admin
                      : dict.auth.role.customer}
                  </Badge>
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/booking`}
                  className={buttonVariants({ size: "lg" })}
                >
                  <CalendarDays data-icon="inline-start" />
                  {dict.publicSite.nav.booking}
                </Link>
                {session.isAdmin ? (
                  <Link
                    href={`/${locale}/admin`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                    })}
                  >
                    <LayoutDashboard data-icon="inline-start" />
                    {dict.publicSite.nav.admin}
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : (
          <AuthPanel locale={locale} dict={dict} />
        )}
      </div>
    </main>
  )
}
