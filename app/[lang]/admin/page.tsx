import Link from "next/link"
import type { ReactNode } from "react"
import {
  CalendarCheck2,
  LockKeyhole,
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
import { Separator } from "@/components/ui/separator"
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

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard
            icon={<CalendarCheck2 className="size-5" />}
            label={dict.admin.dashboard.pendingAppointments}
            value={pendingCount}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.admin.labels.customer}</TableHead>
                <TableHead>{dict.admin.labels.service}</TableHead>
                <TableHead>{dict.admin.labels.stylist}</TableHead>
                <TableHead>{dict.admin.labels.appointmentDate}</TableHead>
                <TableHead>{dict.common.time}</TableHead>
                <TableHead>{dict.admin.labels.customerPhone}</TableHead>
                <TableHead>{dict.common.status}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div>
                      <p>{appointment.customer_name}</p>
                      {appointment.profiles?.display_name ? (
                        <p className="text-xs text-muted-foreground">
                          {appointment.profiles.display_name}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    {appointment.services
                      ? localizedName(appointment.services, locale)
                      : "-"}
                    {appointment.services ? (
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(appointment.services.price_cents, locale)}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {appointment.stylists
                      ? localizedName(appointment.stylists, locale)
                      : "-"}
                  </TableCell>
                  <TableCell>{appointment.appointment_date}</TableCell>
                  <TableCell>{formatTime(appointment.start_time)}</TableCell>
                  <TableCell>{appointment.customer_phone}</TableCell>
                  <TableCell>
                    <form
                      action={updateAppointmentStatusAction}
                      className="flex min-w-56 items-center gap-2"
                    >
                      <input type="hidden" name="locale" value={locale} />
                      <input
                        type="hidden"
                        name="appointmentId"
                        value={appointment.id}
                      />
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            {dict.booking.messages.noAppointments}
          </p>
        )}
      </CardContent>
    </Card>
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
      <CardContent className="grid gap-5">
        <ServiceForm locale={locale} dict={dict} />
        <Separator />
        <div className="grid gap-4 lg:grid-cols-2">
          {services.map((service) => (
            <ServiceForm
              key={service.id}
              service={service}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
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
    <form
      action={upsertServiceAction}
      className="grid gap-4 rounded-lg border border-border bg-background/55 p-4"
    >
      <input type="hidden" name="locale" value={locale} />
      {service ? <input type="hidden" name="id" value={service.id} /> : null}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-2xl font-semibold">
          {service ? localizedName(service, locale) : dict.admin.actions.addService}
        </h3>
        <Badge variant={service?.active ?? true ? "secondary" : "outline"}>
          {service?.active ?? true ? dict.common.active : dict.common.inactive}
        </Badge>
      </div>
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
      <CardContent className="grid gap-5">
        <StylistForm locale={locale} dict={dict} />
        <Separator />
        <div className="grid gap-4 lg:grid-cols-2">
          {stylists.map((stylist) => (
            <StylistForm
              key={stylist.id}
              stylist={stylist}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
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
    <form
      action={upsertStylistAction}
      className="grid gap-4 rounded-lg border border-border bg-background/55 p-4"
    >
      <input type="hidden" name="locale" value={locale} />
      {stylist ? <input type="hidden" name="id" value={stylist.id} /> : null}
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-2xl font-semibold">
          {stylist ? localizedName(stylist, locale) : dict.admin.actions.addStylist}
        </h3>
        <Badge variant={stylist?.active ?? true ? "secondary" : "outline"}>
          {stylist?.active ?? true ? dict.common.active : dict.common.inactive}
        </Badge>
      </div>
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
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <Field label={dict.admin.labels.photoUrl} id={`stylist-photo-${stylist?.id ?? "new"}`}>
          <Input
            id={`stylist-photo-${stylist?.id ?? "new"}`}
            name="photoUrl"
            type="url"
            defaultValue={stylist?.photo_url ?? ""}
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
      <CardContent className="grid gap-5">
        <AvailabilityForm
          stylists={stylists}
          locale={locale}
          dict={dict}
        />
        <Separator />
        <div className="grid gap-4 lg:grid-cols-2">
          {availability.map((item) => (
            <AvailabilityForm
              key={item.id}
              availability={item}
              stylists={stylists}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
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

  return (
    <form
      action={upsertAvailabilityAction}
      className="grid gap-4 rounded-lg border border-border bg-background/55 p-4"
    >
      <input type="hidden" name="locale" value={locale} />
      {availability ? (
        <input type="hidden" name="id" value={availability.id} />
      ) : null}
      <h3 className="font-heading text-2xl font-semibold">
        {availability
          ? `${selectedStylist ? localizedName(selectedStylist, locale) : "-"} · ${
              dict.weekdays.long[availability.day_of_week]
            }`
          : dict.admin.actions.addAvailability}
      </h3>
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
        <form
          action={addTimeOffAction}
          className="grid gap-4 rounded-lg border border-border bg-background/55 p-4"
        >
          <input type="hidden" name="locale" value={locale} />
          <h3 className="flex items-center gap-2 font-heading text-2xl font-semibold">
            <Plus className="size-5 text-[var(--salon-gold)]" />
            {dict.admin.actions.addTimeOff}
          </h3>
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

function localizedName(
  value: { name_zh: string; name_en: string },
  locale: Locale
) {
  return locale === "zh" ? value.name_zh : value.name_en
}
