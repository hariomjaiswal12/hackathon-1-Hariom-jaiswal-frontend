import { formatBookingDate } from "@/lib/booking"
import type { RestaurantEvent } from "@/types/api"

export function eventWhen(event: Pick<RestaurantEvent, "startDate" | "endDate" | "startTime" | "endTime">) {
  const date = event.endDate && event.endDate !== event.startDate
    ? `${formatBookingDate(event.startDate)} – ${formatBookingDate(event.endDate)}`
    : formatBookingDate(event.startDate)
  const time = event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime
  return `${date} · ${time}`
}

export function publishedLabel(value: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

export function eventDateBadge(dateStr: string) {
  if (!dateStr) return { month: "", day: "" }
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return { month: "", day: dateStr }
  const date = new Date(year, month - 1, day)
  const monthName = date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase()
  return { month: monthName, day: String(day).padStart(2, "0") }
}

export function eventTimeRange(startTime: string, endTime?: string | null) {
  if (!startTime) return ""
  return endTime ? `${startTime} – ${endTime}` : startTime
}

