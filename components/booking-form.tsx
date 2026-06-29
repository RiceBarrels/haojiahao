"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Scissors,
} from "lucide-react"

import { createAppointmentAction } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"

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
  const [slotsError, setSlotsError] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(
    null
  )

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId) ?? null,
    [serviceId, services]
  )
  const selectedStylist = useMemo(
    () => stylists.find((stylist) => stylist.id === stylistId) ?? null,
    [stylistId, stylists]
  )
  const weekDates = useMemo(
    () => getWeekDates(appointmentDate),
    [appointmentDate]
  )
  const todayValue = getTodayInputValue()
  const bookingFormId = "salon-booking-form"
  const bookingSnapshot = `${serviceId}:${stylistId}:${appointmentDate}:${selectedSlot}`
  const bookingSucceededForSelection =
    state.status === "success" && submittedSnapshot === bookingSnapshot
  const canSubmit =
    Boolean(selectedSlot && serviceId && stylistId) &&
    slots.includes(selectedSlot) &&
    !bookingSucceededForSelection
  const selectedSlotRange =
    selectedSlot && selectedService
      ? formatSlotRange(selectedSlot, selectedService.duration_minutes)
      : selectedSlot
        ? formatTime(selectedSlot)
        : ""

  function updateAppointmentDate(value: string) {
    setAppointmentDate(value)
    setSelectedSlot("")
  }

  function navigateWeek(direction: -1 | 1) {
    const currentDate = parseDateInput(appointmentDate) ?? new Date()
    const nextDate = addDays(currentDate, direction * 7)
    const nextValue = dateInputFromDate(nextDate)

    updateAppointmentDate(nextValue < todayValue ? todayValue : nextValue)
  }

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
          setSlotsError(false)
          setSlots([])
        }
      })
      .then(() =>
        fetch(`/api/slots?${search.toString()}`, {
          signal: controller.signal,
        })
      )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load slots")
        }

        return response.json()
      })
      .then((data: { slots?: string[] }) => {
        setSlots(data.slots ?? [])
        setSlotsError(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSlots([])
          setSlotsError(true)
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
        <form id={bookingFormId} action={formAction} className="grid gap-6">
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

          <section className="overflow-hidden rounded-lg border border-border bg-background/55">
            <div className="grid grid-cols-3 border-b border-border bg-card/70">
              <ScheduleStat
                label={dict.common.duration}
                value={
                  selectedService
                    ? String(selectedService.duration_minutes)
                    : "-"
                }
                suffix={selectedService ? dict.common.minutes : undefined}
              />
              <ScheduleStat
                label={dict.booking.timeline.available}
                value={slotsLoading ? "-" : String(slots.length)}
                border
              />
              <ScheduleStat
                label={dict.booking.timeline.selected}
                value={selectedSlot ? formatTime(selectedSlot) : "-"}
                border
              />
            </div>

            <div className="border-b border-border bg-secondary/25">
              <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
                <Label
                  htmlFor="appointment-date"
                  className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {dict.booking.fields.appointmentDate} ·{" "}
                  {formatTimelineDate(appointmentDate, locale)}
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigateWeek(-1)}
                    aria-label={dict.common.previous}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => navigateWeek(1)}
                    aria-label={dict.common.next}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 px-3 pb-3">
                {weekDates.map((date) => {
                  const value = dateInputFromDate(date)
                  const active = value === appointmentDate
                  const isToday = value === todayValue
                  const disabled = value < todayValue

                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateAppointmentDate(value)}
                      className={cn(
                        "relative flex min-h-16 flex-col items-center justify-center rounded-md border px-1 py-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-card/70",
                        !active && isToday && "text-foreground"
                      )}
                    >
                      <span className="text-[9.5px] font-semibold uppercase tracking-wider opacity-75">
                        {dict.weekdays.short[date.getDay()]}
                      </span>
                      <span className="mt-1 font-mono text-base font-semibold leading-none tabular-nums">
                        {date.getDate()}
                      </span>
                      <span
                        className={cn(
                          "mt-1 font-mono text-[9px] font-semibold tabular-nums",
                          active
                            ? "opacity-85"
                            : "text-muted-foreground"
                        )}
                      >
                        {active
                          ? slotsLoading
                            ? "..."
                            : slots.length
                          : ""}
                      </span>
                      {isToday && !active ? (
                        <span className="absolute bottom-1 size-1 rounded-full bg-foreground" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
              <div className="px-4 pb-3">
                <Input
                  id="appointment-date"
                  type="date"
                  name="appointmentDate"
                  min={todayValue}
                  value={appointmentDate}
                  onChange={(event) => updateAppointmentDate(event.target.value)}
                  required
                  className="h-8 max-w-40 bg-card/70 text-xs"
                />
              </div>
            </div>
          </section>

          <div className="grid gap-3">
            <Label>{dict.booking.fields.appointmentTime}</Label>
            <div className="rounded-lg border border-border bg-background/55 p-0">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card/75 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">
                    {dict.booking.timeline.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimelineDate(appointmentDate, locale)}
                  </p>
                </div>
                {selectedSlotRange ? (
                  <BadgeLike label={dict.booking.timeline.selected} value={selectedSlotRange} />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {dict.booking.timeline.noSelection}
                  </span>
                )}
              </div>
              {slotsLoading ? (
                <div
                  className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  <Clock3 className="size-4 text-[var(--salon-gold)]" />
                  {dict.booking.timeline.loading}
                </div>
              ) : slotsError ? (
                <div
                  className="rounded-lg border border-dashed border-destructive/30 bg-card/60 p-4"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium text-destructive">
                    {dict.common.error}
                  </p>
                </div>
              ) : slots.length ? (
                <ol
                  className="grid gap-0"
                  aria-label={dict.booking.timeline.title}
                  role="radiogroup"
                >
                  {slots.map((slot) => {
                    const isSelected = selectedSlot === slot
                    const slotRange = selectedService
                      ? formatSlotRange(slot, selectedService.duration_minutes)
                      : formatTime(slot)

                    return (
                      <li
                        key={slot}
                        className="grid grid-cols-[3.75rem_1fr] gap-3 last:[&_[data-slot-line]]:hidden"
                      >
                        <div
                          className="flex flex-col items-center"
                          aria-hidden="true"
                        >
                          <span
                            className={cn(
                              "grid size-10 place-items-center rounded-full border text-xs font-semibold transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card text-muted-foreground"
                            )}
                          >
                            {formatTime(slot)}
                          </span>
                          <span
                            data-slot-line
                            className="my-2 min-h-4 w-px flex-1 bg-border"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                          className={cn(
                            "mb-3 h-auto min-h-16 w-full justify-between gap-3 whitespace-normal rounded-lg border px-3 py-3 text-left transition-all",
                            isSelected
                              ? "border-primary bg-primary/15 shadow-[0_10px_26px_rgba(212,175,55,0.16)] hover:bg-primary/20"
                              : "border-border bg-card/80 hover:border-primary/50 hover:bg-secondary/55"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                              {slotRange}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {dict.booking.timeline.available}
                            </span>
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="size-5 shrink-0 text-[var(--salon-gold)]" />
                          ) : (
                            <Clock3 className="size-5 shrink-0 text-muted-foreground" />
                          )}
                        </Button>
                      </li>
                    )
                  })}
                </ol>
              ) : (
                <div
                  className="rounded-lg border border-dashed border-border bg-card/60 p-4"
                  aria-live="polite"
                >
                  <p className="text-sm font-medium">
                    {dict.booking.timeline.emptyTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dict.booking.messages.noSlots}
                  </p>
                </div>
              )}
            </div>
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
                  {appointmentDate} {selectedSlotRange}
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

          <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  size="lg"
                  disabled={!canSubmit || slotsLoading}
                />
              }
            >
              <CalendarClock data-icon="inline-start" />
              {dict.booking.actions.book}
            </DialogTrigger>
            <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {dict.booking.summary.title}
                </DialogTitle>
                <DialogDescription>
                  {locale === "zh"
                    ? "确认时间后填写联系方式，我们会发送预约邮件。"
                    : "Confirm the time and add contact details. A reservation email will be sent."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="rounded-lg border border-border bg-secondary/40 p-4">
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <SummaryItem
                      label={dict.booking.summary.service}
                      value={
                        selectedService
                          ? locale === "zh"
                            ? selectedService.name_zh
                            : selectedService.name_en
                          : "-"
                      }
                    />
                    <SummaryItem
                      label={dict.booking.summary.stylist}
                      value={
                        selectedStylist
                          ? locale === "zh"
                            ? selectedStylist.name_zh
                            : selectedStylist.name_en
                          : "-"
                      }
                    />
                    <SummaryItem
                      label={dict.booking.summary.time}
                      value={`${appointmentDate} ${selectedSlotRange}`}
                    />
                    <SummaryItem
                      label={dict.booking.summary.price}
                      value={
                        selectedService
                          ? formatPrice(selectedService.price_cents, locale)
                          : "-"
                      }
                    />
                  </dl>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="customer-name">
                      {dict.booking.fields.customerName}
                    </Label>
                    <Input
                      id="customer-name"
                      form={bookingFormId}
                      name="customerName"
                      defaultValue={profile?.display_name ?? ""}
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-phone">
                      {dict.booking.fields.customerPhone}
                    </Label>
                    <Input
                      id="customer-phone"
                      form={bookingFormId}
                      name="customerPhone"
                      type="tel"
                      defaultValue={profile?.phone ?? ""}
                      autoComplete="tel"
                      required
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="customer-email">
                      {dict.booking.fields.customerEmail}
                    </Label>
                    <Input
                      id="customer-email"
                      form={bookingFormId}
                      name="customerEmail"
                      type="email"
                      defaultValue={customerEmail ?? ""}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="note">{dict.booking.fields.note}</Label>
                    <Textarea
                      id="note"
                      form={bookingFormId}
                      name="note"
                      rows={3}
                    />
                  </div>
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
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  form={bookingFormId}
                  size="lg"
                  disabled={pending || !canSubmit}
                  onClick={() => setSubmittedSnapshot(bookingSnapshot)}
                  className="w-full sm:w-auto"
                >
                  <CalendarClock data-icon="inline-start" />
                  {pending ? dict.common.loading : dict.booking.actions.book}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </CardContent>
    </Card>
  )
}

function getTodayInputValue() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const year = parts.find((part) => part.type === "year")?.value ?? "1970"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"

  return `${year}-${month}-${day}`
}

function BadgeLike({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-medium text-foreground">
      <CheckCircle2 className="size-3.5 text-[var(--salon-gold)]" />
      {label}: {value}
    </span>
  )
}

function ScheduleStat({
  label,
  value,
  suffix,
  border,
}: {
  label: string
  value: string
  suffix?: string
  border?: boolean
}) {
  return (
    <div
      className={cn(
        "px-3 py-3 text-center",
        border && "border-l border-border"
      )}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
        {value}
        {suffix ? (
          <span className="ml-1 font-sans text-[10px] font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  )
}

function formatTimelineDate(value: string, locale: Locale) {
  const date = parseDateInput(value)

  if (!date) {
    return value
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatSlotRange(slot: string, durationMinutes: number) {
  const endTime = addMinutesToTime(slot, durationMinutes)

  return endTime ? `${formatTime(slot)}-${endTime}` : formatTime(slot)
}

function addMinutesToTime(value: string, minutesToAdd: number) {
  const [hoursValue, minutesValue] = formatTime(value).split(":")
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return ""
  }

  const totalMinutes = hours * 60 + minutes + minutesToAdd
  const nextHours = Math.floor(totalMinutes / 60) % 24
  const nextMinutes = totalMinutes % 60

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(
    2,
    "0"
  )}`
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function dateInputFromDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + days)

  return nextDate
}

function getWeekDates(value: string) {
  const selectedDate = parseDateInput(value) ?? new Date()
  const day = selectedDate.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = addDays(selectedDate, mondayOffset)

  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
}
