import { Resend } from "resend"

import { formatPrice, formatTime, type Locale } from "@/lib/i18n"

type ReservationEmailDetails = {
  locale: Locale
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  stylistName: string
  appointmentDate: string
  appointmentTime: string
  durationMinutes: number
  priceCents: number
  note: string
}

type ReservationEmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_config" | "send_failed" }

const salonName = "Better Hair and Beauty Salon Company"
const salonNameZh = "好加好男女发廊康州工作室"
const salonAddress = "155 Wolfpit Ave, Norwalk, CT 06851"
const salonPhone = "929-410-9809"

export async function sendReservationEmails(
  details: ReservationEmailDetails,
  adminNotificationEmails: string[] = []
): Promise<ReservationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  const notificationEmails = normalizeEmails(adminNotificationEmails)

  if (!apiKey || !fromEmail || notificationEmails.length === 0) {
    return { sent: false, reason: "missing_config" }
  }

  const resend = new Resend(apiKey)
  const from = `${salonName} <${fromEmail}>`
  const subject =
    details.locale === "zh"
      ? `预约已收到：${details.appointmentDate} ${formatTime(details.appointmentTime)}`
      : `Reservation received: ${details.appointmentDate} ${formatTime(details.appointmentTime)}`

  try {
    const customerResult = await resend.emails.send({
      from,
      to: details.customerEmail,
      replyTo: notificationEmails,
      subject,
      html: renderCustomerEmail(details),
      text: renderCustomerText(details),
      tags: [{ name: "type", value: "reservation_confirmation" }],
    })

    if (customerResult.error) {
      console.error("Failed to send reservation confirmation", customerResult.error)
      return { sent: false, reason: "send_failed" }
    }

    const notificationResult = await resend.emails.send({
      from,
      to: notificationEmails,
      replyTo: details.customerEmail,
      subject:
        details.locale === "zh"
          ? `新预约：${details.customerName} - ${details.appointmentDate} ${formatTime(details.appointmentTime)}`
          : `New reservation: ${details.customerName} - ${details.appointmentDate} ${formatTime(details.appointmentTime)}`,
      html: renderSalonNotification(details),
      text: renderSalonNotificationText(details),
      tags: [{ name: "type", value: "reservation_notification" }],
    })

    if (notificationResult.error) {
      console.error("Failed to send salon reservation notification", notificationResult.error)
      return { sent: false, reason: "send_failed" }
    }

    return { sent: true }
  } catch (error) {
    console.error("Failed to send reservation email", error)
    return { sent: false, reason: "send_failed" }
  }
}

function renderCustomerEmail(details: ReservationEmailDetails) {
  const heading =
    details.locale === "zh" ? "我们已收到你的预约" : "We received your reservation"
  const intro =
    details.locale === "zh"
      ? "店里会尽快确认预约。如需更改时间，请直接电话联系我们。"
      : "The salon will confirm your appointment soon. Call us directly if you need to change the time."

  return renderShell(
    heading,
    `
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#4d5759;">${intro}</p>
      ${renderDetails(details)}
      <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#7a8587;">
        ${escapeHtml(salonAddress)}<br>
        ${escapeHtml(salonPhone)}
      </p>
    `
  )
}

function renderSalonNotification(details: ReservationEmailDetails) {
  return renderShell(
    "New reservation",
    `
      ${renderDetails(details)}
      <div style="margin-top:18px;padding-top:18px;border-top:1px solid #f0d5d7;">
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4d5759;">
          <strong>Customer:</strong> ${escapeHtml(details.customerName)}<br>
          <strong>Email:</strong> ${escapeHtml(details.customerEmail)}<br>
          <strong>Phone:</strong> ${escapeHtml(details.customerPhone)}
        </p>
      </div>
    `
  )
}

function renderShell(title: string, body: string) {
  return `
    <div style="margin:0;padding:0;background:#fff5f5;font-family:Montserrat,Arial,sans-serif;color:#2d3436;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff5f5;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #f2d6d8;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="padding:28px 28px 18px;text-align:center;background:#fffafb;">
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.15;color:#2d3436;">${escapeHtml(salonName)}</div>
                  <div style="margin-top:8px;font-size:14px;color:#5c6668;">${escapeHtml(salonNameZh)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#2d3436;">${escapeHtml(title)}</h1>
                  ${body}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `
}

function renderDetails(details: ReservationEmailDetails) {
  const rows = [
    ["Service", details.serviceName],
    ["Stylist", details.stylistName],
    ["Date", details.appointmentDate],
    ["Time", formatTime(details.appointmentTime)],
    ["Duration", `${details.durationMinutes} minutes`],
    ["Price", formatPrice(details.priceCents, details.locale)],
  ]

  if (details.note) {
    rows.push(["Note", details.note])
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #f0d5d7;border-radius:12px;overflow:hidden;">
      ${rows
        .map(
          ([label, value]) => `
            <tr>
              <td style="width:38%;padding:12px 14px;background:#fff5f5;border-bottom:1px solid #f0d5d7;font-size:13px;color:#5c6668;">${escapeHtml(label)}</td>
              <td style="padding:12px 14px;border-bottom:1px solid #f0d5d7;font-size:14px;color:#2d3436;">${escapeHtml(value)}</td>
            </tr>
          `
        )
        .join("")}
    </table>
  `
}

function renderCustomerText(details: ReservationEmailDetails) {
  return [
    salonName,
    salonNameZh,
    "",
    details.locale === "zh"
      ? "我们已收到你的预约。店里会尽快确认。"
      : "We received your reservation. The salon will confirm it soon.",
    "",
    renderPlainDetails(details),
    "",
    salonAddress,
    salonPhone,
  ].join("\n")
}

function renderSalonNotificationText(details: ReservationEmailDetails) {
  return [
    "New reservation",
    "",
    renderPlainDetails(details),
    "",
    `Customer: ${details.customerName}`,
    `Email: ${details.customerEmail}`,
    `Phone: ${details.customerPhone}`,
  ].join("\n")
}

function renderPlainDetails(details: ReservationEmailDetails) {
  return [
    `Service: ${details.serviceName}`,
    `Stylist: ${details.stylistName}`,
    `Date: ${details.appointmentDate}`,
    `Time: ${formatTime(details.appointmentTime)}`,
    `Duration: ${details.durationMinutes} minutes`,
    `Price: ${formatPrice(details.priceCents, details.locale)}`,
    details.note ? `Note: ${details.note}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function normalizeEmails(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? "").split(","))
        .map((value) => value.trim().toLowerCase())
        .filter((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    )
  )
}
