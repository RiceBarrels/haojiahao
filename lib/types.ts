export type ProfileRole = "customer" | "admin"

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"

export type Profile = {
  id: string
  display_name: string | null
  phone: string | null
  role: ProfileRole
}

export type Service = {
  id: string
  name_zh: string
  name_en: string
  description_zh: string
  description_en: string
  duration_minutes: number
  price_cents: number
  active: boolean
  sort_order: number
}

export type Stylist = {
  id: string
  name_zh: string
  name_en: string
  bio_zh: string
  bio_en: string
  photo_url: string | null
  active: boolean
  sort_order: number
  appointment_interval_minutes: number
}

export type StylistAvailability = {
  id: string
  stylist_id: string
  day_of_week: number
  start_time: string
  end_time: string
  active: boolean
}

export type StylistTimeOff = {
  id: string
  stylist_id: string
  off_date: string
  all_day: boolean
  start_time: string | null
  end_time: string | null
  reason: string
}

export type Appointment = {
  id: string
  user_id: string | null
  stylist_id: string
  service_id: string
  appointment_date: string
  start_time: string
  end_time: string
  customer_name: string
  customer_email: string
  customer_phone: string
  note: string
  status: AppointmentStatus
  created_at: string
}

export type AppointmentWithRelations = Appointment & {
  services: Pick<
    Service,
    "name_zh" | "name_en" | "duration_minutes" | "price_cents"
  > | null
  stylists: Pick<Stylist, "name_zh" | "name_en"> | null
  profiles?: Pick<Profile, "display_name" | "phone"> | null
}

export type PublicSalonData = {
  services: Service[]
  stylists: Stylist[]
  availability: StylistAvailability[]
}

export type SessionProfile = {
  userId: string | null
  email: string | null
  profile: Profile | null
  isAdmin: boolean
}

export type ActionState = {
  status: "idle" | "success" | "error"
  message: string
  email?: string
  nextStep?: "verifyOtp"
  errors?: Record<string, string[]>
}

export const initialActionState: ActionState = {
  status: "idle",
  message: "",
}
