"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"

import { signInAction, signUpAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Dictionary, Locale } from "@/lib/i18n"
import { initialActionState } from "@/lib/types"

type AuthPanelProps = {
  locale: Locale
  dict: Dictionary
}

export function AuthPanel({ locale, dict }: AuthPanelProps) {
  const router = useRouter()
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialActionState
  )
  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialActionState
  )

  useEffect(() => {
    if (signInState.status === "success" || signUpState.status === "success") {
      router.refresh()
    }
  }, [router, signInState.status, signUpState.status])

  return (
    <Card className="border-border/80 bg-card/95 shadow-[0_18px_50px_rgba(45,52,54,0.08)]">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.auth.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" className="gap-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{dict.auth.signIn}</TabsTrigger>
            <TabsTrigger value="signup">{dict.auth.signUp}</TabsTrigger>
          </TabsList>
          <TabsContent value="signin">
            <form action={signInFormAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-2">
                <Label htmlFor="signin-email">{dict.auth.email}</Label>
                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signin-password">{dict.auth.password}</Label>
                <Input
                  id="signin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {signInState.message ? (
                <p
                  className={
                    signInState.status === "error"
                      ? "text-sm text-destructive"
                      : "text-sm text-foreground"
                  }
                >
                  {signInState.message}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={signInPending}>
                <LogIn data-icon="inline-start" />
                {dict.auth.signIn}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form action={signUpFormAction} className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <div className="grid gap-2">
                <Label htmlFor="signup-name">{dict.auth.displayName}</Label>
                <Input
                  id="signup-name"
                  name="displayName"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-phone">{dict.auth.phone}</Label>
                <Input
                  id="signup-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-email">{dict.auth.email}</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-password">{dict.auth.password}</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              {signUpState.message ? (
                <p
                  className={
                    signUpState.status === "error"
                      ? "text-sm text-destructive"
                      : "text-sm text-foreground"
                  }
                >
                  {signUpState.message}
                </p>
              ) : null}
              <Button type="submit" size="lg" disabled={signUpPending}>
                <UserPlus data-icon="inline-start" />
                {dict.auth.createAccount}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
