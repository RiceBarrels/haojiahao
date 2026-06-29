import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import {
  CalendarCheck2,
  CalendarClock,
  Clock3,
  LockKeyhole,
  Mail,
  Phone,
  Plus,
  Scissors,
  Users,
} from "lucide-react"

import {
  addTimeOffAction,
  deleteTimeOffAction,
  updateAppointmentStatusAction,
  upsertAvailabilityAction,
  upsertServiceAction,
  upsertStylistAction,
} from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { getAdminDashboardData } from "@/lib/data"
import {
  formatPrice,
  formatTime,
  getDictionary,
  toLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n"
import type {
  AppointmentStatus,
  AppointmentWithRelations,
  Service,
  Stylist,
  StylistAvailability,
  StylistTimeOff,
} from "@/lib/types"

type AdminPageProps = {
  params: Promise<{ lang: string }>
}

const appointmentStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const satisfies readonly AppointmentStatus[]

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const editPanelClassName =
  "group rounded-lg border border-border bg-background/55 transition-colors open:bg-background/80"
const editSummaryClassName =
  "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden"
const editFormClassName = "grid gap-4 border-t border-border p-4"

export default async function AdminPage({ params }: AdminPageProps) {
  const { lang } = await params
  const locale = toLocale(lang)
  const dict = getDictionary(locale)
  const data = await getAdminDashboardData()

  if (!data) {
    return <AdminRequired locale={locale} dict={dict} />
  }

  const pendingCount = data.appointments.filter(
    (appointment) => appointment.status === "pending"
  ).length
  const today = getNewYorkDateValue()
  const todayCount = data.appointments.filter(
    (appointment) =>
      appointment.appointment_date === today &&
      appointment.status !== "cancelled"
  ).length
  const activeServices = data.services.filter((service) => service.active).length
  const activeStylists = data.stylists.filter((stylist) => stylist.active).length

  return (
    <main className="bg-[linear-gradient(180deg,var(--background),var(--card))] py-10 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Badge className="mb-4 w-fit bg-secondary text-secondary-foreground">
              <LockKeyhole className="size-3.5" />
              {dict.admin.title}
            </Badge>
            <h1 className="font-heading text-5xl font-semibold leading-none">
              {dict.admin.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {locale === "zh"
                ? "管理服务菜单、发型师、每周可预约时间、休息时间和顾客预约。"
                : "Manage services, stylists, weekly availability, time off, and customer bookings."}
            </p>
          </div>
          <Link
            href={`/${locale}/booking`}
            className={buttonVariants({ variant: "outline" })}
          >
            {dict.publicSite.nav.booking}
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={<CalendarCheck2 className="size-5" />}
            label={dict.admin.dashboard.pendingAppointments}
            value={pendingCount}
          />
          <MetricCard
            icon={<CalendarClock className="size-5" />}
            label={
              locale === "zh" ? "今日预约" : "Today's appointments"
            }
            value={todayCount}
          />
          <MetricCard
            icon={<Scissors className="size-5" />}
            label={dict.admin.dashboard.activeServices}
            value={activeServices}
          />
          <MetricCard
            icon={<Users className="size-5" />}
            label={dict.admin.dashboard.activeStylists}
            value={activeStylists}
          />
        </div>

        <DashboardOverview
          appointments={data.appointments}
          stylists={data.stylists}
          availability={data.availability}
          today={today}
          locale={locale}
          dict={dict}
        />

        <div className="mt-8 grid gap-8">
          <AppointmentsSection
            appointments={data.appointments}
            locale={locale}
            dict={dict}
          />
          <ServicesSection
            services={data.services}
            locale={locale}
            dict={dict}
          />
          <StylistsSection
            stylists={data.stylists}
            locale={locale}
            dict={dict}
          />
          <AvailabilitySection
            availability={data.availability}
            stylists={data.stylists}
            locale={locale}
            dict={dict}
          />
          <TimeOffSection
            timeOff={data.timeOff}
            stylists={data.stylists}
            locale={locale}
            dict={dict}
          />
        </div>
      </div>
    </main>
  )
}

function DashboardOverview({
  appointments,
  stylists,
  availability,
  today,
  locale,
  dict,
}: {
  appointments: AppointmentWithRelations[]
  stylists: Stylist[]
  availability: StylistAvailability[]
  today: string
  locale: Locale
  dict: Dictionary
}) {
  const activeAppointments = appointments
    .filter((appointment) => appointment.status !== "cancelled")
    .sort(compareAppointments)
  const pendingAppointments = activeAppointments
    .filter((appointment) => appointment.status === "pending")
    .slice(0, 5)
  const todayAppointments = activeAppointments
    .filter((appointment) => appointment.appointment_date === today)
    .slice(0, 5)
  const activeStylists = stylists.filter((stylist) => stylist.active)

  return (
    <section className="mt-8 grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_0.8fr]">
        <AppointmentQueueCard
          title={locale === "zh" ? "需要处理" : "Needs attention"}
          description={
            locale === "zh"
              ? "新的预约会先进入待确认状态。"
              : "New reservations land here first."
          }
          emptyText={
            locale === "zh"
              ? "没有待确认预约。"
              : "No pending appointments."
          }
          appointments={pendingAppointments}
          locale={locale}
          dict={dict}
        />
        <AppointmentQueueCard
          title={locale === "zh" ? "今日时间线" : "Today timeline"}
          description={
            locale === "zh"
              ? `${today} 的预约安排。`
              : `Appointments scheduled for ${today}.`
          }
          emptyText={
            locale === "zh"
              ? "今天还没有预约。"
              : "No appointments today."
          }
          appointments={todayAppointments}
          locale={locale}
          dict={dict}
        />
        <ScheduleSnapshotCard
          stylists={activeStylists}
          availability={availability}
          locale={locale}
          dict={dict}
        />
      </div>
    </section>
  )
}

function AppointmentQueueCard({
  title,
  description,
  emptyText,
  appointments,
  locale,
  dict,
}: {
  title: string
  description: string
  emptyText: string
  appointments: AppointmentWithRelations[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length ? (
          <div className="grid gap-2">
            {appointments.map((appointment) => (
              <AppointmentQueueItem
                key={appointment.id}
                appointment={appointment}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
            {emptyText}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AppointmentQueueItem({
  appointment,
  locale,
  dict,
}: {
  appointment: AppointmentWithRelations
  locale: Locale
  dict: Dictionary
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border bg-background/55 p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="grid size-11 place-items-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">
        {formatTime(appointment.start_time)}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{appointment.customer_name}</p>
          <StatusPill status={appointment.status} dict={dict} />
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {appointment.appointment_date} ·{" "}
          {appointment.services
            ? localizedName(appointment.services, locale)
            : "-"}{" "}
          ·{" "}
          {appointment.stylists
            ? localizedName(appointment.stylists, locale)
            : "-"}
        </p>
      </div>
      <Link
        href="#appointments"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        {dict.common.view}
      </Link>
    </div>
  )
}

function ScheduleSnapshotCard({
  stylists,
  availability,
  locale,
  dict,
}: {
  stylists: Stylist[]
  availability: StylistAvailability[]
  locale: Locale
  dict: Dictionary
}) {
  const rows = stylists
    .filter((stylist) => stylist.active)
    .map((stylist) => {
      const activeRows = availability.filter(
        (item) => item.stylist_id === stylist.id && item.active
      )

      return {
        stylist,
        activeDays: new Set(activeRows.map((item) => item.day_of_week)).size,
      }
    })

  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">
          {locale === "zh" ? "发型师排班" : "Stylist schedule"}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "快速查看谁可预约，以及预约时间间隔。"
            : "See who can be booked and their slot interval."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className="grid gap-3">
            {rows.map(({ stylist, activeDays }) => (
              <div
                key={stylist.id}
                className="grid gap-2 rounded-lg border border-border bg-background/55 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{localizedName(stylist, locale)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {activeDays} {locale === "zh" ? "天可预约" : "bookable days"}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {stylist.appointment_interval_minutes} {dict.common.minutes}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
            {locale === "zh"
              ? "还没有启用的发型师。"
              : "No active stylists yet."}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AdminRequired({
  locale,
  dict,
}: {
  locale: Locale
  dict: Dictionary
}) {
  return (
    <main className="bg-[linear-gradient(180deg,var(--background),var(--card))] py-16">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <Card className="border-border/80 bg-card/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-3xl">
              <LockKeyhole className="size-5 text-[var(--salon-gold)]" />
              {dict.auth.messages.adminRequired}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {dict.auth.messages.unauthorized}
            </p>
            <Link href={`/${locale}/auth`} className={buttonVariants()}>
              {dict.publicSite.nav.signIn}
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-4xl font-semibold">{value}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function AppointmentsSection({
  appointments,
  locale,
  dict,
}: {
  appointments: AppointmentWithRelations[]
  locale: Locale
  dict: Dictionary
}) {
  const groupedAppointments = groupAppointmentsByDate(appointments)

  return (
    <Card id="appointments" className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.admin.nav.appointments}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "查看谁预约了，并更新确认、完成或取消状态。"
            : "See who booked and update confirmation, completion, or cancellation."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length ? (
          <div className="grid gap-5">
            {groupedAppointments.map((group) => (
              <section key={group.date} className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/55 px-4 py-3">
                  <div>
                    <h3 className="font-medium">
                      {formatAppointmentDateHeading(group.date, locale)}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {group.items.length} {dict.admin.nav.appointments}
                    </p>
                  </div>
                  <Badge variant="secondary">{group.date}</Badge>
                </div>
                <ol
                  className="grid gap-0"
                  aria-label={`${dict.admin.nav.appointments} ${group.date}`}
                >
                  {group.items.map((appointment) => (
                    <AppointmentTimelineItem
                      key={appointment.id}
                      appointment={appointment}
                      locale={locale}
                      dict={dict}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dict.booking.messages.noAppointments}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function AppointmentTimelineItem({
  appointment,
  locale,
  dict,
}: {
  appointment: AppointmentWithRelations
  locale: Locale
  dict: Dictionary
}) {
  const serviceName = appointment.services
    ? localizedName(appointment.services, locale)
    : "-"
  const stylistName = appointment.stylists
    ? localizedName(appointment.stylists, locale)
    : "-"

  return (
    <li className="grid grid-cols-[4rem_1fr] gap-3 last:[&_[data-appointment-line]]:hidden">
      <div className="flex flex-col items-center" aria-hidden="true">
        <span className="grid h-11 w-16 place-items-center rounded-lg border border-border bg-card text-sm font-semibold text-foreground">
          {formatTime(appointment.start_time)}
        </span>
        <span
          data-appointment-line
          className="my-2 min-h-5 w-px flex-1 bg-border"
        />
      </div>
      <article className="mb-4 rounded-lg border border-border bg-background/55 p-4 shadow-[0_10px_30px_rgba(45,52,54,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{appointment.customer_name}</h3>
              <StatusPill status={appointment.status} dict={dict} />
            </div>
            {appointment.profiles?.display_name ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {appointment.profiles.display_name}
              </p>
            ) : null}
          </div>
          <form
            action={updateAppointmentStatusAction}
            className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-64 sm:flex-row sm:items-center"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <select
              name="status"
              defaultValue={appointment.status}
              className={selectClassName}
              aria-label={dict.common.status}
            >
              {appointmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {dict.booking.status[status]}
                </option>
              ))}
            </select>
            <Button size="sm" type="submit">
              {dict.common.save}
            </Button>
          </form>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <TimelineDetail
            label={dict.admin.labels.service}
            value={serviceName}
            subValue={
              appointment.services
                ? formatPrice(appointment.services.price_cents, locale)
                : undefined
            }
          />
          <TimelineDetail
            label={dict.admin.labels.stylist}
            value={stylistName}
          />
          <TimelineDetail
            label={dict.common.time}
            value={`${appointment.appointment_date} ${formatTime(
              appointment.start_time
            )}`}
            icon={<Clock3 className="size-3.5 text-[var(--salon-gold)]" />}
          />
          <TimelineDetail
            label={dict.admin.labels.customerPhone}
            value={appointment.customer_phone}
            href={`tel:${appointment.customer_phone}`}
            icon={<Phone className="size-3.5 text-[var(--salon-gold)]" />}
          />
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm text-muted-foreground">
          <Mail className="size-3.5 shrink-0 text-[var(--salon-gold)]" />
          <a
            href={`mailto:${appointment.customer_email}`}
            className="min-w-0 break-all hover:text-foreground"
          >
            {appointment.customer_email}
          </a>
        </div>
      </article>
    </li>
  )
}

function TimelineDetail({
  label,
  value,
  subValue,
  href,
  icon,
}: {
  label: string
  value: string
  subValue?: string
  href?: string
  icon?: ReactNode
}) {
  const content = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="mt-1 block break-words font-medium text-foreground">
        {value}
      </span>
      {subValue ? (
        <span className="mt-1 block text-xs text-muted-foreground">
          {subValue}
        </span>
      ) : null}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className="rounded-lg border border-border bg-card/70 p-3 transition-colors hover:border-primary/50 hover:bg-secondary/45"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      {content}
    </div>
  )
}

function ServicesSection({
  services,
  locale,
  dict,
}: {
  services: Service[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card id="services" className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.admin.nav.services}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "设置菜单、价格、时长和上下架状态。"
            : "Set the service menu, prices, durations, and active status."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <ServiceForm locale={locale} dict={dict} />
        {services.map((service) => (
          <ServiceForm
            key={service.id}
            service={service}
            locale={locale}
            dict={dict}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function ServiceForm({
  service,
  locale,
  dict,
}: {
  service?: Service
  locale: Locale
  dict: Dictionary
}) {
  return (
    <details className={editPanelClassName}>
      <summary className={editSummaryClassName}>
        <div className="min-w-0">
          <h3 className="truncate font-medium">
            {service
              ? localizedName(service, locale)
              : dict.admin.actions.addService}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {service
              ? `${service.duration_minutes} ${dict.common.minutes} · ${formatPrice(
                  service.price_cents,
                  locale
                )}`
              : locale === "zh"
                ? "新增一个顾客可预约的服务项目"
                : "Create a bookable service"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {service ? (
            <Badge variant={service.active ? "secondary" : "outline"}>
              {service.active ? dict.common.active : dict.common.inactive}
            </Badge>
          ) : (
            <Plus className="size-4 text-[var(--salon-gold)]" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {service ? dict.common.edit : dict.common.create}
          </span>
        </div>
      </summary>
      <form action={upsertServiceAction} className={editFormClassName}>
        <input type="hidden" name="locale" value={locale} />
        {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.labels.nameZh} id={`service-name-zh-${service?.id ?? "new"}`}>
          <Input
            id={`service-name-zh-${service?.id ?? "new"}`}
            name="nameZh"
            defaultValue={service?.name_zh ?? ""}
            required
          />
        </Field>
        <Field label={dict.admin.labels.nameEn} id={`service-name-en-${service?.id ?? "new"}`}>
          <Input
            id={`service-name-en-${service?.id ?? "new"}`}
            name="nameEn"
            defaultValue={service?.name_en ?? ""}
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.labels.descriptionZh} id={`service-desc-zh-${service?.id ?? "new"}`}>
          <Textarea
            id={`service-desc-zh-${service?.id ?? "new"}`}
            name="descriptionZh"
            defaultValue={service?.description_zh ?? ""}
            rows={3}
          />
        </Field>
        <Field label={dict.admin.labels.descriptionEn} id={`service-desc-en-${service?.id ?? "new"}`}>
          <Textarea
            id={`service-desc-en-${service?.id ?? "new"}`}
            name="descriptionEn"
            defaultValue={service?.description_en ?? ""}
            rows={3}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={dict.common.duration} id={`service-duration-${service?.id ?? "new"}`}>
          <Input
            id={`service-duration-${service?.id ?? "new"}`}
            name="durationMinutes"
            type="number"
            min={10}
            max={480}
            defaultValue={service?.duration_minutes ?? 30}
            required
          />
        </Field>
        <Field label={dict.common.price} id={`service-price-${service?.id ?? "new"}`}>
          <Input
            id={`service-price-${service?.id ?? "new"}`}
            name="priceDollars"
            type="number"
            min={0}
            step="0.01"
            defaultValue={service ? service.price_cents / 100 : 0}
            required
          />
        </Field>
        <Field label={dict.admin.labels.sortOrder} id={`service-sort-${service?.id ?? "new"}`}>
          <Input
            id={`service-sort-${service?.id ?? "new"}`}
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={service?.sort_order ?? 100}
            required
          />
        </Field>
      </div>
      <ActiveCheckbox
        name="active"
        label={dict.common.active}
        defaultChecked={service?.active ?? true}
      />
      <Button type="submit" className="w-fit">
        {service ? dict.common.save : dict.admin.actions.addService}
      </Button>
      </form>
    </details>
  )
}

function StylistsSection({
  stylists,
  locale,
  dict,
}: {
  stylists: Stylist[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card id="stylists" className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.admin.nav.stylists}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "设置店内工作人员，启用后顾客可以预约。"
            : "Set the people working in the studio. Active stylists can be booked."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <StylistForm locale={locale} dict={dict} />
        {stylists.map((stylist) => (
          <StylistForm
            key={stylist.id}
            stylist={stylist}
            locale={locale}
            dict={dict}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function StylistForm({
  stylist,
  locale,
  dict,
}: {
  stylist?: Stylist
  locale: Locale
  dict: Dictionary
}) {
  return (
    <details className={editPanelClassName}>
      <summary className={editSummaryClassName}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-secondary-foreground">
            {stylist?.photo_url ? (
              <Image
                src={stylist.photo_url}
                alt={localizedName(stylist, locale)}
                width={44}
                height={44}
                className="size-11 object-cover"
              />
            ) : (
              <Scissors className="size-4" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-medium">
              {stylist
                ? localizedName(stylist, locale)
                : dict.admin.actions.addStylist}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {stylist
                ? `${stylist.appointment_interval_minutes} ${dict.common.minutes} · ${
                    locale === "zh" ? "预约间隔" : "slot interval"
                  }`
                : locale === "zh"
                  ? "新增一位可预约的发型师"
                  : "Create a bookable stylist"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {stylist ? (
            <Badge variant={stylist.active ? "secondary" : "outline"}>
              {stylist.active ? dict.common.active : dict.common.inactive}
            </Badge>
          ) : (
            <Plus className="size-4 text-[var(--salon-gold)]" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {stylist ? dict.common.edit : dict.common.create}
          </span>
        </div>
      </summary>
      <form action={upsertStylistAction} className={editFormClassName}>
        <input type="hidden" name="locale" value={locale} />
        {stylist ? <input type="hidden" name="id" value={stylist.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.labels.nameZh} id={`stylist-name-zh-${stylist?.id ?? "new"}`}>
          <Input
            id={`stylist-name-zh-${stylist?.id ?? "new"}`}
            name="nameZh"
            defaultValue={stylist?.name_zh ?? ""}
            required
          />
        </Field>
        <Field label={dict.admin.labels.nameEn} id={`stylist-name-en-${stylist?.id ?? "new"}`}>
          <Input
            id={`stylist-name-en-${stylist?.id ?? "new"}`}
            name="nameEn"
            defaultValue={stylist?.name_en ?? ""}
            required
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.labels.bioZh} id={`stylist-bio-zh-${stylist?.id ?? "new"}`}>
          <Textarea
            id={`stylist-bio-zh-${stylist?.id ?? "new"}`}
            name="bioZh"
            defaultValue={stylist?.bio_zh ?? ""}
            rows={3}
          />
        </Field>
        <Field label={dict.admin.labels.bioEn} id={`stylist-bio-en-${stylist?.id ?? "new"}`}>
          <Textarea
            id={`stylist-bio-en-${stylist?.id ?? "new"}`}
            name="bioEn"
            defaultValue={stylist?.bio_en ?? ""}
            rows={3}
          />
        </Field>
      </div>
      <input
        type="hidden"
        name="currentPhotoUrl"
        value={stylist?.photo_url ?? ""}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem_10rem]">
        <Field
          label={dict.admin.labels.photoUpload}
          id={`stylist-photo-${stylist?.id ?? "new"}`}
        >
          {stylist?.photo_url ? (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-background/55 p-2">
              <div className="relative size-14 overflow-hidden rounded-lg bg-secondary">
                <Image
                  src={stylist.photo_url}
                  alt={localizedName(stylist, locale)}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === "zh" ? "已上传照片" : "Current photo"}
              </p>
            </div>
          ) : null}
          <Input
            id={`stylist-photo-${stylist?.id ?? "new"}`}
            name="photoFile"
            type="file"
            accept="image/*,.heic,.heif,.avif,.webp,.tif,.tiff"
          />
        </Field>
        <Field
          label={dict.admin.labels.appointmentInterval}
          id={`stylist-interval-${stylist?.id ?? "new"}`}
        >
          <Input
            id={`stylist-interval-${stylist?.id ?? "new"}`}
            name="appointmentIntervalMinutes"
            type="number"
            min={10}
            max={240}
            step={5}
            defaultValue={stylist?.appointment_interval_minutes ?? 60}
            required
          />
        </Field>
        <Field label={dict.admin.labels.sortOrder} id={`stylist-sort-${stylist?.id ?? "new"}`}>
          <Input
            id={`stylist-sort-${stylist?.id ?? "new"}`}
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={stylist?.sort_order ?? 100}
            required
          />
        </Field>
      </div>
      <ActiveCheckbox
        name="active"
        label={dict.common.active}
        defaultChecked={stylist?.active ?? true}
      />
      <Button type="submit" className="w-fit">
        {stylist ? dict.common.save : dict.admin.actions.addStylist}
      </Button>
      </form>
    </details>
  )
}

function AvailabilitySection({
  availability,
  stylists,
  locale,
  dict,
}: {
  availability: StylistAvailability[]
  stylists: Stylist[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card id="availability" className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.admin.nav.availability}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "设置每位发型师每周哪几天、几点到几点可预约；关闭某天就是每周休息。"
            : "Set each stylist's weekly bookable days and hours. Turning a day off makes it a weekly rest day."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <AvailabilityForm
          stylists={stylists}
          locale={locale}
          dict={dict}
        />
        {availability.map((item) => (
          <AvailabilityForm
            key={item.id}
            availability={item}
            stylists={stylists}
            locale={locale}
            dict={dict}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function AvailabilityForm({
  availability,
  stylists,
  locale,
  dict,
}: {
  availability?: StylistAvailability
  stylists: Stylist[]
  locale: Locale
  dict: Dictionary
}) {
  const selectedStylist =
    stylists.find((stylist) => stylist.id === availability?.stylist_id) ??
    stylists[0]
  const title = availability
    ? `${selectedStylist ? localizedName(selectedStylist, locale) : "-"} · ${
        dict.weekdays.long[availability.day_of_week]
      }`
    : dict.admin.actions.addAvailability

  return (
    <details className={editPanelClassName}>
      <summary className={editSummaryClassName}>
        <div className="min-w-0">
          <h3 className="truncate font-medium">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {availability
              ? `${formatTime(availability.start_time)}-${formatTime(
                  availability.end_time
                )}`
              : locale === "zh"
                ? "新增一个每周可预约时间"
                : "Create a weekly bookable window"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {availability ? (
            <Badge variant={availability.active ? "secondary" : "outline"}>
              {availability.active ? dict.common.active : dict.common.inactive}
            </Badge>
          ) : (
            <Plus className="size-4 text-[var(--salon-gold)]" />
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {availability ? dict.common.edit : dict.common.create}
          </span>
        </div>
      </summary>
      <form action={upsertAvailabilityAction} className={editFormClassName}>
        <input type="hidden" name="locale" value={locale} />
        {availability ? (
          <input type="hidden" name="id" value={availability.id} />
        ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.admin.labels.stylist} id={`availability-stylist-${availability?.id ?? "new"}`}>
          <select
            id={`availability-stylist-${availability?.id ?? "new"}`}
            name="stylistId"
            defaultValue={availability?.stylist_id ?? stylists[0]?.id ?? ""}
            className={selectClassName}
            required
          >
            {stylists.map((stylist) => (
              <option key={stylist.id} value={stylist.id}>
                {localizedName(stylist, locale)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={dict.admin.labels.dayOfWeek} id={`availability-day-${availability?.id ?? "new"}`}>
          <select
            id={`availability-day-${availability?.id ?? "new"}`}
            name="dayOfWeek"
            defaultValue={availability?.day_of_week ?? 1}
            className={selectClassName}
            required
          >
            {dict.weekdays.long.map((day, index) => (
              <option key={day} value={index}>
                {day}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={dict.common.startTime} id={`availability-start-${availability?.id ?? "new"}`}>
          <Input
            id={`availability-start-${availability?.id ?? "new"}`}
            name="startTime"
            type="time"
            step={1800}
            defaultValue={formatTime(availability?.start_time ?? "10:00")}
            required
          />
        </Field>
        <Field label={dict.common.endTime} id={`availability-end-${availability?.id ?? "new"}`}>
          <Input
            id={`availability-end-${availability?.id ?? "new"}`}
            name="endTime"
            type="time"
            step={1800}
            defaultValue={formatTime(availability?.end_time ?? "19:00")}
            required
          />
        </Field>
      </div>
      <ActiveCheckbox
        name="active"
        label={dict.common.active}
        defaultChecked={availability?.active ?? true}
      />
      <Button type="submit" className="w-fit">
        {availability ? dict.common.save : dict.admin.actions.addAvailability}
      </Button>
      </form>
    </details>
  )
}

function TimeOffSection({
  timeOff,
  stylists,
  locale,
  dict,
}: {
  timeOff: StylistTimeOff[]
  stylists: Stylist[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card id="time-off" className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.admin.nav.timeOff}
        </CardTitle>
        <CardDescription>
          {locale === "zh"
            ? "设置某一天全天或部分时间休息，顾客不会看到这些时段。"
            : "Set all-day or partial-day time off. Customers will not see those slots."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <details className={editPanelClassName}>
          <summary className={editSummaryClassName}>
            <div>
              <h3 className="font-medium">{dict.admin.actions.addTimeOff}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {locale === "zh"
                  ? "设置某天全天或部分时间不可预约"
                  : "Block a full day or part of a day"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Plus className="size-4 text-[var(--salon-gold)]" />
              {dict.common.create}
            </div>
          </summary>
          <form action={addTimeOffAction} className={editFormClassName}>
            <input type="hidden" name="locale" value={locale} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label={dict.admin.labels.stylist} id="time-off-stylist-new">
                <select
                  id="time-off-stylist-new"
                  name="stylistId"
                  className={selectClassName}
                  required
                >
                  {stylists.map((stylist) => (
                    <option key={stylist.id} value={stylist.id}>
                      {localizedName(stylist, locale)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={dict.common.date} id="time-off-date-new">
                <Input id="time-off-date-new" name="offDate" type="date" required />
              </Field>
              <Field label={dict.common.startTime} id="time-off-start-new">
                <Input
                  id="time-off-start-new"
                  name="startTime"
                  type="time"
                  step={1800}
                  defaultValue="10:00"
                />
              </Field>
              <Field label={dict.common.endTime} id="time-off-end-new">
                <Input
                  id="time-off-end-new"
                  name="endTime"
                  type="time"
                  step={1800}
                  defaultValue="19:00"
                />
              </Field>
            </div>
            <ActiveCheckbox
              name="allDay"
              label={dict.admin.labels.allDay}
              defaultChecked
            />
            <Field label={dict.admin.labels.reason} id="time-off-reason-new">
              <Input id="time-off-reason-new" name="reason" />
            </Field>
            <Button type="submit" className="w-fit">
              {dict.admin.actions.addTimeOff}
            </Button>
          </form>
        </details>

        {timeOff.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.admin.labels.stylist}</TableHead>
                <TableHead>{dict.common.date}</TableHead>
                <TableHead>{dict.common.time}</TableHead>
                <TableHead>{dict.admin.labels.reason}</TableHead>
                <TableHead className="text-right">
                  {dict.common.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeOff.map((item) => {
                const stylist = stylists.find(
                  (candidate) => candidate.id === item.stylist_id
                )

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {stylist ? localizedName(stylist, locale) : "-"}
                    </TableCell>
                    <TableCell>{item.off_date}</TableCell>
                    <TableCell>
                      {item.all_day
                        ? dict.admin.labels.allDay
                        : `${formatTime(item.start_time)}-${formatTime(
                            item.end_time
                          )}`}
                    </TableCell>
                    <TableCell>{item.reason || "-"}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteTimeOffAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="timeOffId" value={item.id} />
                        <Button variant="outline" size="sm" type="submit">
                          {dict.common.delete}
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dict.admin.tables.noRows}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

function ActiveCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex w-fit items-center gap-2 text-sm">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 rounded border-input accent-[var(--salon-gold)]"
      />
      {label}
    </label>
  )
}

function StatusPill({
  status,
  dict,
}: {
  status: AppointmentStatus
  dict: Dictionary
}) {
  const variant =
    status === "cancelled"
      ? "destructive"
      : status === "pending"
        ? "outline"
        : "secondary"

  return <Badge variant={variant}>{dict.booking.status[status]}</Badge>
}

function compareAppointments(
  first: AppointmentWithRelations,
  second: AppointmentWithRelations
) {
  return (
    `${first.appointment_date} ${first.start_time}`.localeCompare(
      `${second.appointment_date} ${second.start_time}`
    ) || first.customer_name.localeCompare(second.customer_name)
  )
}

function groupAppointmentsByDate(appointments: AppointmentWithRelations[]) {
  const groups = new Map<string, AppointmentWithRelations[]>()

  for (const appointment of appointments) {
    const currentItems = groups.get(appointment.appointment_date) ?? []
    currentItems.push(appointment)
    groups.set(appointment.appointment_date, currentItems)
  }

  return Array.from(groups.entries())
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, items]) => ({
      date,
      items: items.toSorted(compareAppointments),
    }))
}

function formatAppointmentDateHeading(dateValue: string, locale: Locale) {
  const date = parseDateInput(dateValue)

  if (!date) {
    return dateValue
  }

  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date)
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const [year, month, day] = value.split("-").map(Number)

  return new Date(year, month - 1, day)
}

function getNewYorkDateValue() {
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

function localizedName(
  value: { name_zh: string; name_en: string },
  locale: Locale
) {
  return locale === "zh" ? value.name_zh : value.name_en
}
