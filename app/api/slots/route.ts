import { NextResponse } from "next/server"

import { getAvailableSlots } from "@/lib/data"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const serviceId = url.searchParams.get("serviceId") ?? ""
  const stylistId = url.searchParams.get("stylistId") ?? ""
  const appointmentDate = url.searchParams.get("date") ?? ""

  const slots = await getAvailableSlots({
    serviceId,
    stylistId,
    appointmentDate,
  })

  return NextResponse.json({ slots })
}
