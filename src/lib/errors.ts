import { ApiError } from "@/services/apiClient"

const REASON_TEXT: Record<string, string> = {
  RESTAURANT_CLOSED: "The restaurant is closed for this date.",
  SCHEDULE_NOT_CONFIGURED: "No schedule is configured for this date.",
  OUTSIDE_SERVICE_HOURS: "That time is outside service hours.",
  AFTER_LAST_BOOKING_TIME: "That time is after the last booking time.",
  BOOKING_ENDS_AFTER_SERVICE: "The booking would end after the service closes.",
  PARTY_TOO_LARGE: "The party is larger than this service allows.",
  NO_SUITABLE_TABLE: "No suitable table is free for this party.",
  BOOKING_CONFLICT: "A selected table is already booked for that time.",
  TABLE_CAPACITY_INSUFFICIENT: "The selected tables do not seat this party.",
  TOO_MANY_TABLES: "A booking can include at most three tables.",
  INVALID_TABLE_SELECTION: "Send one table or a list of tables, not both.",
  INVALID_BOOKING_STATE: "This booking cannot take that action in its current state.",
  INVALID_WAITLIST_STATE: "This waitlist entry cannot take that action in its current state.",
  WAITLIST_DUPLICATE: "An active waitlist request already exists for this party and time.",
  AUTHENTICATION_ERROR: "Sign in again to continue.",
  AUTHORIZATION_ERROR: "Your role cannot perform that action.",
  CUSTOMER_BLACKLISTED: "Your account is currently restricted from making new reservations. Please contact the restaurant.",
  PAYMENT_REQUIRED: "This reservation requires a deposit before it can be confirmed.",
  HTTP_400: "The request was not accepted.",
  HTTP_401: "Sign in again to continue.",
  HTTP_403: "Your role cannot perform that action.",
  HTTP_404: "That record was not found.",
  HTTP_409: "That change conflicts with the current record.",
  NETWORK_ERROR: "The reservation service is unreachable.",
  TIMEOUT: "The server took too long to respond.",
  HTTP_422: "The request could not be processed.",
  HTTP_500: "The server could not complete that request.",
  NOT_FOUND: "That record was not found.",
  VALIDATION_ERROR: "The request was rejected.",
  DUPLICATE_DATA: "That record already exists.",
}

export function formatApiError(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message ? error.message : fallback
  }

  const explanation = REASON_TEXT[error.code]
  const fieldErrors = error.errors
    ?.map((item) => item?.message)
    .filter((message): message is string => Boolean(message))
  const detail = [error.message, explanation, fieldErrors?.join(" ")]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(" ")

  if (error.code && error.code !== "UNKNOWN_ERROR" && error.code !== "API_ERROR") {
    return `${error.code} — ${detail || fallback}`
  }

  return detail || fallback
}

export function availabilityReasonText(reason?: string | null, closedReason?: string | null) {
  if (!reason) return ""
  const explanation = REASON_TEXT[reason] || "The restaurant cannot take this request."
  const closure = closedReason ? ` ${closedReason}` : ""
  return `${reason} — ${explanation}${closure}`
}
