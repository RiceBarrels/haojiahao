"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"
import { getDictionary, toLocale, type Locale } from "@/lib/i18n"
import type { ActionState, AppointmentStatus } from "@/lib/types"
import { initialActionState } from "@/lib/types"

const uuidSchema = z.string().uuid()
const localizedTextSchema = z.string().trim().min(1).max(120)
const longTextSchema = z.string().trim().max(600)
const phoneSchema = z.string().trim().min(7).max(30)
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

function actionLocale(formData: FormData): Locale {
  return toLocale(formData.get("locale"))
}

function actionMessage(message: string): ActionState {
  return {
    status: "success",
    message,
  }
}

function actionError(locale: Locale, message?: string): ActionState {
  const dict = getDictionary(locale)

  return {
    status: "error",
    message: message || dict.common.error,
  }
}

async function requireAdmin(locale: Locale) {
  const dict = getDictionary(locale)
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId || typeof userId !== "string") {
    throw new Error(dict.auth.messages.signInRequired)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role !== "admin") {
    throw new Error(dict.auth.messages.adminRequired)
  }

  return { supabase, userId }
}

export async function signInAction(
  _prevState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState

  const locale = actionLocale(formData)
  const dict = getDictionary(locale)
  const parsed = z
    .object({
      email: z.string().trim().email(),
      password: z.string().min(6),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return actionError(locale, dict.auth.messages.signInFailed)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return actionError(locale, dict.auth.messages.signInFailed)
  }

  revalidatePath("/", "layout")
  return actionMessage(dict.auth.messages.signInSuccess)
}

export async function signUpAction(
  _prevState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState

  const locale = actionLocale(formData)
  const dict = getDictionary(locale)
  const parsed = z
    .object({
      displayName: z.string().trim().min(2).max(80),
      phone: phoneSchema,
      email: z.string().trim().email(),
      password: z.string().min(8).max(72),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return actionError(locale, dict.common.error)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
        phone: parsed.data.phone,
      },
    },
  })

  if (error) {
    return actionError(locale, error.message)
  }

  revalidatePath("/", "layout")
  return actionMessage(dict.auth.messages.accountCreated)
}

export async function signOutAction(formData: FormData) {
  const locale = actionLocale(formData)
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect(`/${locale}`)
}

export async function createAppointmentAction(
  _prevState: ActionState = initialActionState,
  formData: FormData
): Promise<ActionState> {
  void _prevState

  const locale = actionLocale(formData)
  const dict = getDictionary(locale)
  const parsed = z
    .object({
      serviceId: uuidSchema,
      stylistId: uuidSchema,
      appointmentDate: dateSchema,
      appointmentTime: timeSchema,
      customerName: z.string().trim().min(2).max(100),
      customerPhone: phoneSchema,
      note: longTextSchema,
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    return actionError(locale, dict.common.error)
  }

  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId || typeof userId !== "string") {
    return actionError(locale, dict.auth.messages.signInRequired)
  }

  const { error } = await supabase.from("appointments").insert({
    user_id: userId,
    service_id: parsed.data.serviceId,
    stylist_id: parsed.data.stylistId,
    appointment_date: parsed.data.appointmentDate,
    start_time: parsed.data.appointmentTime,
    end_time: parsed.data.appointmentTime,
    customer_name: parsed.data.customerName,
    customer_phone: parsed.data.customerPhone,
    note: parsed.data.note,
    status: "pending",
  })

  if (error) {
    return actionError(locale, error.message)
  }

  revalidatePath("/", "layout")
  return actionMessage(dict.booking.messages.created)
}

export async function cancelAppointmentAction(formData: FormData) {
  const locale = actionLocale(formData)
  const appointmentId = String(formData.get("appointmentId") ?? "")

  if (!uuidSchema.safeParse(appointmentId).success) {
    return
  }

  const supabase = await createClient()
  await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)

  revalidatePath("/", "layout")
  redirect(`/${locale}/booking`)
}

export async function upsertServiceAction(formData: FormData) {
  const locale = actionLocale(formData)
  const parsed = z
    .object({
      id: z.string().optional(),
      nameZh: localizedTextSchema,
      nameEn: localizedTextSchema,
      descriptionZh: longTextSchema,
      descriptionEn: longTextSchema,
      durationMinutes: z.coerce.number().int().min(10).max(480),
      priceDollars: z.coerce.number().min(0).max(10000),
      sortOrder: z.coerce.number().int().min(0).max(10000),
      active: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const { supabase } = await requireAdmin(locale)
  const payload = {
    name_zh: parsed.data.nameZh,
    name_en: parsed.data.nameEn,
    description_zh: parsed.data.descriptionZh,
    description_en: parsed.data.descriptionEn,
    duration_minutes: parsed.data.durationMinutes,
    price_cents: Math.round(parsed.data.priceDollars * 100),
    sort_order: parsed.data.sortOrder,
    active: parsed.data.active === "on",
  }

  const id = parsed.data.id
  const query = id
    ? supabase.from("services").update(payload).eq("id", id)
    : supabase.from("services").insert(payload)

  const { error } = await query

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}

export async function upsertStylistAction(formData: FormData) {
  const locale = actionLocale(formData)
  const parsed = z
    .object({
      id: z.string().optional(),
      nameZh: localizedTextSchema,
      nameEn: localizedTextSchema,
      bioZh: longTextSchema,
      bioEn: longTextSchema,
      photoUrl: z.string().trim().url().optional().or(z.literal("")),
      sortOrder: z.coerce.number().int().min(0).max(10000),
      active: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const { supabase } = await requireAdmin(locale)
  const payload = {
    name_zh: parsed.data.nameZh,
    name_en: parsed.data.nameEn,
    bio_zh: parsed.data.bioZh,
    bio_en: parsed.data.bioEn,
    photo_url: parsed.data.photoUrl || null,
    sort_order: parsed.data.sortOrder,
    active: parsed.data.active === "on",
  }

  const id = parsed.data.id
  const query = id
    ? supabase.from("stylists").update(payload).eq("id", id)
    : supabase.from("stylists").insert(payload)

  const { error } = await query

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}

export async function upsertAvailabilityAction(formData: FormData) {
  const locale = actionLocale(formData)
  const parsed = z
    .object({
      id: z.string().optional(),
      stylistId: uuidSchema,
      dayOfWeek: z.coerce.number().int().min(0).max(6),
      startTime: timeSchema,
      endTime: timeSchema,
      active: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const { supabase } = await requireAdmin(locale)
  const payload = {
    stylist_id: parsed.data.stylistId,
    day_of_week: parsed.data.dayOfWeek,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
    active: parsed.data.active === "on",
  }

  const id = parsed.data.id
  const query = id
    ? supabase.from("stylist_availability").update(payload).eq("id", id)
    : supabase.from("stylist_availability").insert(payload)

  const { error } = await query

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}

export async function addTimeOffAction(formData: FormData) {
  const locale = actionLocale(formData)
  const parsed = z
    .object({
      stylistId: uuidSchema,
      offDate: dateSchema,
      allDay: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      reason: longTextSchema,
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const allDay = parsed.data.allDay === "on"
  const { supabase } = await requireAdmin(locale)
  const { error } = await supabase.from("stylist_time_off").insert({
    stylist_id: parsed.data.stylistId,
    off_date: parsed.data.offDate,
    all_day: allDay,
    start_time: allDay ? null : parsed.data.startTime || null,
    end_time: allDay ? null : parsed.data.endTime || null,
    reason: parsed.data.reason,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}

export async function deleteTimeOffAction(formData: FormData) {
  const locale = actionLocale(formData)
  const timeOffId = String(formData.get("timeOffId") ?? "")

  if (!uuidSchema.safeParse(timeOffId).success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const { supabase } = await requireAdmin(locale)
  const { error } = await supabase
    .from("stylist_time_off")
    .delete()
    .eq("id", timeOffId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const locale = actionLocale(formData)
  const parsed = z
    .object({
      appointmentId: uuidSchema,
      status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
    })
    .safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    throw new Error(getDictionary(locale).admin.messages.saveFailed)
  }

  const { supabase } = await requireAdmin(locale)
  const { error } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status as AppointmentStatus })
    .eq("id", parsed.data.appointmentId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
}
