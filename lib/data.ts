import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import { formatTime } from "@/lib/i18n"
import type {
  AppointmentWithRelations,
  PublicSalonData,
  Service,
  SessionProfile,
  Stylist,
  StylistAvailability,
  StylistTimeOff,
} from "@/lib/types"

export async function getSessionProfile(): Promise<SessionProfile> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  const userId = typeof claims?.sub === "string" ? claims.sub : null
  const email = typeof claims?.email === "string" ? claims.email : null

  if (!userId) {
    return {
      userId: null,
      email: null,
      profile: null,
      isAdmin: false,
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, phone, role")
    .eq("id", userId)
    .maybeSingle()

  return {
    userId,
    email,
    profile: (profile ?? null) as SessionProfile["profile"],
    isAdmin: profile?.role === "admin",
  }
}

export const getPublicSalonData = cache(async (): Promise<PublicSalonData> => {
  const supabase = await createClient()

  const [servicesResult, stylistsResult, availabilityResult] =
    await Promise.all([
      supabase
        .from("services")
        .select(
          "id, name_zh, name_en, description_zh, description_en, duration_minutes, price_cents, active, sort_order"
        )
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("stylists")
        .select(
          "id, name_zh, name_en, bio_zh, bio_en, photo_url, active, sort_order"
        )
        .eq("active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("stylist_availability")
        .select("id, stylist_id, day_of_week, start_time, end_time, active")
        .eq("active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),
    ])

  return {
    services: (servicesResult.data ?? []) as Service[],
    stylists: (stylistsResult.data ?? []) as Stylist[],
    availability: (availabilityResult.data ?? []) as StylistAvailability[],
  }
})

export async function getAvailableSlots({
  stylistId,
  serviceId,
  appointmentDate,
}: {
  stylistId: string
  serviceId: string
  appointmentDate: string
}): Promise<string[]> {
  if (!stylistId || !serviceId || !appointmentDate) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_stylist_id: stylistId,
    p_service_id: serviceId,
    p_appointment_date: appointmentDate,
  })

  if (error) {
    return []
  }

  return ((data ?? []) as { slot_time: string }[]).map((slot) =>
    formatTime(slot.slot_time)
  )
}

export async function getCustomerAppointments(): Promise<
  AppointmentWithRelations[]
> {
  const supabase = await createClient()
  const { userId } = await getSessionProfile()

  if (!userId) {
    return []
  }

  const { data } = await supabase
    .from("appointments")
    .select(
      "id, user_id, stylist_id, service_id, appointment_date, start_time, end_time, customer_name, customer_email, customer_phone, note, status, created_at, services(name_zh, name_en, duration_minutes, price_cents), stylists(name_zh, name_en)"
    )
    .eq("user_id", userId)
    .order("appointment_date", { ascending: false })
    .order("start_time", { ascending: true })

  return (data ?? []) as unknown as AppointmentWithRelations[]
}

export async function getAdminDashboardData() {
  const session = await getSessionProfile()

  if (!session.isAdmin) {
    return null
  }

  const supabase = await createClient()
  const [
    servicesResult,
    stylistsResult,
    availabilityResult,
    timeOffResult,
    appointmentsResult,
  ] = await Promise.all([
    supabase
      .from("services")
      .select(
        "id, name_zh, name_en, description_zh, description_en, duration_minutes, price_cents, active, sort_order"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("stylists")
      .select(
        "id, name_zh, name_en, bio_zh, bio_en, photo_url, active, sort_order"
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("stylist_availability")
      .select("id, stylist_id, day_of_week, start_time, end_time, active")
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("stylist_time_off")
      .select("id, stylist_id, off_date, all_day, start_time, end_time, reason")
      .order("off_date", { ascending: false }),
    supabase
      .from("appointments")
      .select(
        "id, user_id, stylist_id, service_id, appointment_date, start_time, end_time, customer_name, customer_email, customer_phone, note, status, created_at, services(name_zh, name_en, duration_minutes, price_cents), stylists(name_zh, name_en), profiles!appointments_user_profile_fkey(display_name, phone)"
      )
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: true })
      .limit(100),
  ])

  return {
    session,
    services: (servicesResult.data ?? []) as Service[],
    stylists: (stylistsResult.data ?? []) as Stylist[],
    availability: (availabilityResult.data ?? []) as StylistAvailability[],
    timeOff: (timeOffResult.data ?? []) as StylistTimeOff[],
    appointments: (appointmentsResult.data ??
      []) as unknown as AppointmentWithRelations[],
  }
}
