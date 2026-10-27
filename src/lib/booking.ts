import type { Booking, ServiceWindow, Table } from "@/types/api"

export type BookingRequest = {
  date: string
  time: string
  guests: number
  table?: number | string
  tableId?: string
  tableIds?: string[]
  tableNumber?: string
  name: string
  email: string
  phone?: string
  password?: string
  requests: string
  isWaitlist?: boolean
}

export type BookingValidation =
  | { status: "ready"; request: BookingRequest }
  | { status: "invalid"; message: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateBooking(request: BookingRequest): BookingValidation {
  if (!request.date) {
    return { status: "invalid", message: "Choose a date to continue." }
  }
  if (!request.time) {
    return { status: "invalid", message: "Choose a time slot to continue." }
  }
  const selectedTables = request.tableIds?.length
    ? request.tableIds
    : request.tableId
      ? [request.tableId]
      : []
  if (!request.isWaitlist && selectedTables.length === 0) {
    return { status: "invalid", message: "Please select an available table." }
  }
  if (selectedTables.length > 3) {
    return { status: "invalid", message: "TOO_MANY_TABLES — A booking can include at most three tables." }
  }
  if (!request.name.trim()) {
    return { status: "invalid", message: "Please enter your name." }
  }
  if (!emailPattern.test(request.email.trim())) {
    return { status: "invalid", message: "Please enter a valid email address." }
  }
  return { status: "ready", request }
}

export function formatBookingDate(value: string) {
  if (!value) return "Your date"
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

/** Converts HH:mm to minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/** Converts minutes from midnight to HH:mm */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Generates 30-minute booking time slots from a list of services */
export function generateTimeSlotsForServices(services: ServiceWindow[]) {
  const slots: Array<{ time: string; note: string }> = []
  const seen = new Set<string>()

  services.forEach((service) => {
    const startMins = timeToMinutes(service.startTime)
    const lastMins = timeToMinutes(service.lastBookingTime)

    for (let current = startMins; current <= lastMins; current += 30) {
      const timeStr = minutesToTime(current)
      if (!seen.has(timeStr)) {
        seen.add(timeStr)
        slots.push({
          time: timeStr,
          note: `${service.name} · max ${service.maxGuestsPerBooking}p`,
        })
      }
    }
  })

  return slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

/** Tomorrow as a calendar date. Opening rules come from the effective schedule. */
export function getDefaultBookingDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function bookingTableLabel(booking: Pick<Booking, "table" | "tables">) {
  const numbers = (booking.tables || [])
    .map((table) => table?.tableNumber)
    .filter((value): value is string => Boolean(value))
  if (numbers.length > 0) return numbers.join(", ")
  if (booking.table?.tableNumber) return booking.table.tableNumber
  return "Assigned by the restaurant"
}

export function tableNumbers(tables: Array<Pick<Table, "tableNumber">>) {
  return tables.map((table) => table.tableNumber).join(", ")
}

const CUSTOMER_CANCEL_STATUSES = new Set(["CONFIRMED", "ARRIVED", "SEATED"])
const RESCHEDULE_STATUSES = new Set(["PENDING", "CONFIRMED", "ARRIVED", "SEATED"])

export function customerCanCancel(status: string) {
  return CUSTOMER_CANCEL_STATUSES.has(status)
}

export function customerCanReschedule(status: string) {
  return RESCHEDULE_STATUSES.has(status)
}
