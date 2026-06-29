"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock, Scissors } from "lucide-react"

import { createAppointmentAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  formatPrice,
  formatTime,
  type Dictionary,
  type Locale,
} from "@/lib/i18n"
import type { Profile, Service, Stylist } from "@/lib/types"
import { initialActionState } from "@/lib/types"

type BookingFormProps = {
  locale: Locale
  dict: Dictionary
  services: Service[]
  stylists: Stylist[]
  profile: Profile | null
  customerEmail?: string | null
}

export function BookingForm({
  locale,
  dict,
  services,
  stylists,
  profile,
  customerEmail,
}: BookingFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    createAppointmentAction,
    initialActionState
  )
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "")
  const [stylistId, setStylistId] = useState(stylists[0]?.id ?? "")
  const [appointmentDate, setAppointmentDate] = useState(getTodayInputValue())
  const [selectedSlot, setSelectedSlot] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [serviceId, services]
  )
  const selectedStylist = useMemo(
    () => stylists.find((stylist) => stylist.id === stylistId) ?? null,
    [stylistId, stylists]
  )
  const canSubmit =
    Boolean(selectedSlot && serviceId && stylistId) && slots.includes(selectedSlot)

  useEffect(() => {
    if (state.status === "success") {
      router.refresh()
    }
  }, [router, state.status])

  useEffect(() => {
    if (!serviceId || !stylistId || !appointmentDate) {
      return
    }

    const controller = new AbortController()
    const search = new URLSearchParams({
      serviceId,
      stylistId,
      date: appointmentDate,
    })

    Promise.resolve()
      .then(() => {
        if (!controller.signal.aborted) {
          setSlotsLoading(true)
          setSlots([])
        }
      })
      .then(() =>
        fetch(`/api/slots?${search.toString()}`, {
          signal: controller.signal,
        })
      )
      .then((response) => (response.ok ? response.json() : { slots: [] }))
      .then((data: { slots?: string[] }) => {
        setSlots(data.slots ?? [])
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSlots([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSlotsLoading(false)
        }
      })

    return () => controller.abort()
  }, [appointmentDate, serviceId, stylistId])

  return (
    <Card className="border-border/80 bg-card/95 shadow-[0_18px_50px_rgba(45,52,54,0.08)]">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.booking.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-6">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="stylistId" value={stylistId} />
          <input
            type="hidden"
            name="appointmentTime"
            value={selectedSlot}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="service">{dict.booking.fields.service}</Label>
              <select
                id="service"
                value={serviceId}
                onChange={(event) => {
                  setServiceId(event.target.value)
                  setSelectedSlot("")
                }}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {locale === "zh" ? service.name_zh : service.name_en}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stylist">{dict.booking.fields.stylist}</Label>
              <select
                id="stylist"
                value={stylistId}
                onChange={(event) => {
                  setStylistId(event.target.value)
                  setSelectedSlot("")
                }}
                className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {stylists.map((stylist) => (
                  <option key={stylist.id} value={stylist.id}>
                    {locale === "zh" ? stylist.name_zh : stylist.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="appointment-date">
              {dict.booking.fields.appointmentDate}
            </Label>
            <Input
              id="appointment-date"
              type="date"
              name="appointmentDate"
              min={getTodayInputValue()}
              value={appointmentDate}
              onChange={(event) => {
                setAppointmentDate(event.target.value)
                setSelectedSlot("")
              }}
              required
            />
          </div>

          <div className="grid gap-3">
            <Label>{dict.booking.fields.appointmentTime}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {slotsLoading ? (
                <p className="col-span-full text-sm text-muted-foreground">
                  {dict.common.loading}
                </p>
              ) : slots.length ? (
                slots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedSlot === slot ? "default" : "outline"}
                    onClick={() => setSelectedSlot(slot)}
                    className="h-10"
                  >
                    {formatTime(slot)}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-sm text-muted-foreground">
                  {dict.booking.messages.noSlots}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="customer-name">
                {dict.booking.fields.customerName}
              </Label>
              <Input
                id="customer-name"
                name="customerName"
                defaultValue={profile?.display_name ?? ""}
                autoComplete="name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">
                {dict.booking.fields.customerEmail}
              </Label>
              <Input
                id="customer-email"
                name="customerEmail"
                type="email"
                defaultValue={customerEmail ?? ""}
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">
                {dict.booking.fields.customerPhone}
              </Label>
              <Input
                id="customer-phone"
                name="customerPhone"
                type="tel"
                defaultValue={profile?.phone ?? ""}
                autoComplete="tel"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">{dict.booking.fields.note}</Label>
            <Textarea id="note" name="note" rows={3} />
          </div>

          <div className="rounded-lg border border-border bg-secondary/45 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Scissors className="size-4 text-[var(--salon-gold)]" />
              {dict.booking.summary.title}
            </div>
            <dl className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <dt>{dict.booking.summary.service}</dt>
                <dd className="text-foreground">
                  {selectedService
                    ? locale === "zh"
                      ? selectedService.name_zh
                      : selectedService.name_en
                    : "-"}
                </dd>
              </div>
              <div>
                <dt>{dict.booking.summary.stylist}</dt>
                <dd className="text-foreground">
                  {selectedStylist
                    ? locale === "zh"
                      ? selectedStylist.name_zh
                      : selectedStylist.name_en
                    : "-"}
                </dd>
              </div>
              <div>
                <dt>{dict.booking.summary.price}</dt>
                <dd className="text-foreground">
                  {selectedService
                    ? formatPrice(selectedService.price_cents, locale)
                    : "-"}
                </dd>
              </div>
              <div>
                <dt>{dict.booking.summary.time}</dt>
                <dd className="text-foreground">
                  {appointmentDate} {selectedSlot ? formatTime(selectedSlot) : ""}
                </dd>
              </div>
            </dl>
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

          <Button
            type="submit"
            size="lg"
            disabled={pending || !canSubmit}
          >
            <CalendarClock data-icon="inline-start" />
            {dict.booking.actions.book}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}
