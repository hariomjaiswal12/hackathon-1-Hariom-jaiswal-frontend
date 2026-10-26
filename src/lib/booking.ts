export type BookingRequest = {
  date: string
  time: string
  guests: number
  table: number
  name: string
  email: string
  requests: string
}

export type BookingValidation =
  | { status: "ready"; request: BookingRequest }
  | { status: "invalid"; message: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Checks the draft only. This does not contact a booking API. */
export function validateBooking(request: BookingRequest): BookingValidation {
  if (!request.date) {
    return { status: "invalid", message: "Choose a date to continue." }
  }
  if (!request.name.trim()) {
    return { status: "invalid", message: "Please enter your name." }
  }
  if (!emailPattern.test(request.email.trim())) {
    return { status: "invalid", message: "Please enter a valid email." }
  }
  return { status: "ready", request }
}

export function formatBookingDate(value: string) {
  if (!value) return "Your date"
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
