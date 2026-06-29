"use client"

import { useActionState, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"

import { updatePasswordAction } from "@/app/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Dictionary, Locale } from "@/lib/i18n"
import { initialActionState } from "@/lib/types"

type ResetPasswordFormProps = {
  locale: Locale
  dict: Dictionary
  code: string | null
}

export function ResetPasswordForm({
  locale,
  dict,
  code,
}: ResetPasswordFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initialActionState
  )
  const [exchangeStatus, setExchangeStatus] = useState<
    "idle" | "pending" | "ready" | "error"
  >(code ? "pending" : "ready")

  useEffect(() => {
    if (!code) {
      return
    }

    let active = true
    const supabase = createClient()

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!active) {
        return
      }

      setExchangeStatus(error ? "error" : "ready")
      if (!error) {
        router.replace(`/${locale}/auth/reset-password`)
        router.refresh()
      }
    })

    return () => {
      active = false
    }
  }, [code, locale, router])

  useEffect(() => {
    if (state.status === "success") {
      router.refresh()
    }
  }, [router, state.status])

  const formDisabled = pending || exchangeStatus === "pending" || exchangeStatus === "error"

  return (
    <Card className="border-border/80 bg-card/95 shadow-[0_18px_50px_rgba(45,52,54,0.08)]">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.auth.resetPassword}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          {exchangeStatus === "pending" ? (
            <p className="text-sm text-muted-foreground">
              {dict.common.loading}
            </p>
          ) : null}
          {exchangeStatus === "error" ? (
            <p className="text-sm text-destructive">
              {dict.auth.messages.resetLinkInvalid}
            </p>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="new-password">{dict.auth.newPassword}</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              disabled={formDisabled}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">
              {dict.auth.confirmPassword}
            </Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              disabled={formDisabled}
              required
            />
          </div>
          {state.message ? (
            <p
              className={
                state.status === "error"
                  ? "text-sm text-destructive"
                  : "text-sm text-foreground"
              }
            >
              {state.message}
            </p>
          ) : null}
          <Button type="submit" size="lg" disabled={formDisabled}>
            <KeyRound data-icon="inline-start" />
            {dict.auth.setNewPassword}
          </Button>
          <Link
            href={`/${locale}/auth`}
            className={buttonVariants({ variant: "ghost" })}
          >
            {dict.auth.signIn}
          </Link>
        </form>
      </CardContent>
    </Card>
  )
}
