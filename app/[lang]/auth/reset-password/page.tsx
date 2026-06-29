import { KeyRound } from "lucide-react"

import { ResetPasswordForm } from "@/components/reset-password-form"
import { Badge } from "@/components/ui/badge"
import { getDictionary, toLocale } from "@/lib/i18n"

type ResetPasswordPageProps = {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ code?: string }>
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const [{ lang }, query] = await Promise.all([params, searchParams])
  const locale = toLocale(lang)
  const dict = getDictionary(locale)

  return (
    <main className="bg-[linear-gradient(180deg,var(--background),var(--card))] py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <Badge className="mb-4 w-fit bg-secondary text-secondary-foreground">
            <KeyRound className="size-3.5" />
            {dict.auth.resetPassword}
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-none">
            {dict.auth.setNewPassword}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            {dict.auth.messages.resetPasswordIntro}
          </p>
        </section>

        <ResetPasswordForm
          locale={locale}
          dict={dict}
          code={query.code ?? null}
        />
      </div>
    </main>
  )
}
