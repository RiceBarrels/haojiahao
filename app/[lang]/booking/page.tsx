import Link from "next/link"
import { CalendarDays, Clock, Phone, Scissors, XCircle } from "lucide-react"

import { cancelAppointmentAction } from "@/app/actions"
import { BookingForm } from "@/components/booking-form"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getCustomerAppointments,
  getPublicSalonData,
  getSessionProfile,
} from "@/lib/data"
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
  Profile,
} from "@/lib/types"

type BookingPageProps = {
  params: Promise<{ lang: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { lang } = await params
  const locale = toLocale(lang)
  const dict = getDictionary(locale)
  const [salonData, session, appointments] = await Promise.all([
    getPublicSalonData(),
    getSessionProfile(),
    getCustomerAppointments(),
  ])
  const bookingProfile: Profile | null =
    session.profile ??
    (session.userId
      ? {
          id: session.userId,
          display_name: session.email,
          phone: "",
          role: "customer",
        }
      : null)

  return (
    <main className="bg-[linear-gradient(180deg,var(--background),var(--card))] py-10 sm:py-14">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
        <section className="flex flex-col justify-center">
          <Badge className="mb-4 w-fit bg-secondary text-secondary-foreground">
            <Scissors className="size-3.5" />
            {dict.publicSite.nav.booking}
          </Badge>
          <h1 className="font-heading text-5xl font-semibold leading-none">
            {dict.booking.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            {dict.booking.subtitle}
          </p>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-[var(--salon-gold)]" />
              {dict.booking.steps.time}
            </span>
            <span className="flex items-center gap-2">
              <Scissors className="size-4 text-[var(--salon-gold)]" />
              {dict.booking.steps.stylist}
            </span>
            <a href="tel:+19294109809" className="flex items-center gap-2">
              <Phone className="size-4 text-[var(--salon-gold)]" />
              929-410-9809
            </a>
          </div>
          {!session.userId ? (
            <Link
              href={`/${locale}/auth`}
              className={buttonVariants({ className: "mt-8 w-fit", size: "lg" })}
            >
              {dict.publicSite.nav.signIn}
            </Link>
          ) : null}
        </section>

        <BookingForm
          locale={locale}
          dict={dict}
          services={salonData.services}
          stylists={salonData.stylists}
          profile={bookingProfile}
        />
      </div>

      <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <AppointmentHistory
          appointments={appointments}
          locale={locale}
          dict={dict}
        />
      </section>
    </main>
  )
}

function AppointmentHistory({
  appointments,
  locale,
  dict,
}: {
  appointments: AppointmentWithRelations[]
  locale: Locale
  dict: Dictionary
}) {
  return (
    <Card className="border-border/80 bg-card/95">
      <CardHeader>
        <CardTitle className="font-heading text-3xl">
          {dict.publicSite.nav.myBookings}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{dict.booking.summary.service}</TableHead>
                <TableHead>{dict.booking.summary.stylist}</TableHead>
                <TableHead>{dict.common.date}</TableHead>
                <TableHead>{dict.common.time}</TableHead>
                <TableHead>{dict.common.price}</TableHead>
                <TableHead>{dict.common.status}</TableHead>
                <TableHead className="text-right">
                  {dict.common.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    {appointment.services
                      ? localizedName(appointment.services, locale)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {appointment.stylists
                      ? localizedName(appointment.stylists, locale)
                      : "-"}
                  </TableCell>
                  <TableCell>{appointment.appointment_date}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <Clock className="size-3.5 text-[var(--salon-gold)]" />
                      {formatTime(appointment.start_time)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {appointment.services
                      ? formatPrice(appointment.services.price_cents, locale)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={appointment.status} dict={dict} />
                  </TableCell>
                  <TableCell className="text-right">
                    {appointment.status === "pending" ||
                    appointment.status === "confirmed" ? (
                      <form action={cancelAppointmentAction}>
                        <input type="hidden" name="locale" value={locale} />
                        <input
                          type="hidden"
                          name="appointmentId"
                          value={appointment.id}
                        />
                        <Button variant="outline" size="sm" type="submit">
                          <XCircle data-icon="inline-start" />
                          {dict.booking.actions.cancelAppointment}
                        </Button>
                      </form>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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

function StatusBadge({
  status,
  dict,
}: {
  status: AppointmentStatus
  dict: Dictionary
}) {
  const variant =
    status === "cancelled"
      ? "destructive"
      : status === "confirmed"
        ? "default"
        : status === "completed"
          ? "secondary"
          : "outline"

  return <Badge variant={variant}>{dict.booking.status[status]}</Badge>
}

function localizedName(
  value: { name_zh: string; name_en: string },
  locale: Locale
) {
  return locale === "zh" ? value.name_zh : value.name_en
}
