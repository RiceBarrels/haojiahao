import { NextResponse } from "next/server"

import { getAvailableSlots, getSessionProfile } from "@/lib/data"

export async function GET(request: Request) {
  const session = await getSessionProfile()

  if (!session.userId) {
    return NextResponse.json({ slots: [] }, { status: 401 })
  }

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
