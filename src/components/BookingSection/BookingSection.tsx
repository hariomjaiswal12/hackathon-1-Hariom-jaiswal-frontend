import { FormEvent, useEffect, useRef, useState, useTransition } from "react"
import { Link } from "react-router-dom"
import { bookingSteps } from "@/data/site"
import {
  bookingTableLabel,
  formatBookingDate,
  getDefaultBookingDate,
  generateTimeSlotsForServices,
  validateBooking,
  type BookingRequest,
} from "@/lib/booking"
import { availabilityReasonText, formatApiError } from "@/lib/errors"
import { Arrow } from "@/components/UI/Arrow"
import { scheduleService } from "@/services/scheduleService"
import { tableService } from "@/services/tableService"
import { availabilityService } from "@/services/availabilityService"
import { bookingService } from "@/services/bookingService"
import { waitlistService } from "@/services/waitlistService"
import { paymentService } from "@/services/paymentService"
import { useAuth } from "@/context/AuthContext"
import type {
  AvailabilityResult,
  EffectiveSchedule,
  RecommendationResult,
  Booking,
  WaitlistEntry,
  TableLocation,
  TableShape,
  DepositConfig,
  PaymentOrder,
} from "@/types/api"

export function BookingSection() {
  const { user, isAuthenticated, login, register, openAuthModal, refreshNotificationsCount } = useAuth()
  const [, startTransition] = useTransition()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<BookingRequest>({
    date: getDefaultBookingDate(),
    time: "13:30",
    guests: 2,
    tableId: "",
    tableIds: [],
    tableNumber: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    requests: "",
    isWaitlist: false,
  })

  const [schedule, setSchedule] = useState<EffectiveSchedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [timeSlots, setTimeSlots] = useState<Array<{ time: string; note: string }>>([])

  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
  const [recomLoading, setRecomLoading] = useState(false)
  const [preferences, setPreferences] = useState<{
    location: "" | TableLocation
    shape: "" | TableShape
    tag: string
  }>({ location: "", shape: "", tag: "" })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [availabilityRefresh, setAvailabilityRefresh] = useState(0)
  const [scheduleRetry, setScheduleRetry] = useState(0)
  const keepError = useRef(false)
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [confirmedWaitlist, setConfirmedWaitlist] = useState<WaitlistEntry | null>(null)
  const [depositConfig, setDepositConfig] = useState<DepositConfig | null>(null)
  const [pendingPaymentBooking, setPendingPaymentBooking] = useState<Booking | null>(null)
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<PaymentOrder | null>(null)
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState("")

  // Fetch deposit config on load
  useEffect(() => {
    paymentService
      .getDepositConfig()
      .then((cfg) => setDepositConfig(cfg))
      .catch(() => setDepositConfig(null))
  }, [])

  const isDepositRequired = Boolean(
    depositConfig?.enabled && draft.guests >= (depositConfig.minGuests || 1) && !draft.isWaitlist
  )
  const depositAmount = depositConfig
    ? depositConfig.type === "FLAT"
      ? depositConfig.amount
      : depositConfig.amount * draft.guests
    : 0

  // Prepopulate contact info if user logs in
  useEffect(() => {
    if (user) {
      setDraft((current) => ({
        ...current,
        name: user.name || current.name,
        email: user.email || current.email,
        phone: user.phone || current.phone,
      }))
    }
  }, [user])

  // Check effective schedule whenever date changes
  useEffect(() => {
    if (!draft.date) return
    let active = true
    setScheduleLoading(true)

    scheduleService
      .getEffectiveSchedule(draft.date)
      .then((sched) => {
        if (!active) return
        setSchedule(sched)
        if (sched && !sched.isClosed && sched.services.length > 0) {
          const slots = generateTimeSlotsForServices(sched.services)
          setTimeSlots(slots)
          if (slots.length > 0 && !slots.some((s) => s.time === draft.time)) {
            setDraft((d) => ({ ...d, time: slots[0].time }))
          }
        } else {
          setTimeSlots([])
        }
      })
      .catch((err) => {
        if (!active) return
        setSchedule(null)
        setTimeSlots([])
        setError(formatApiError(err, "Failed to load schedule."))
      })
      .finally(() => {
        if (active) setScheduleLoading(false)
      })

    return () => {
      active = false
    }
  }, [draft.date, scheduleRetry])

  // Fetch table recommendations when entering Step 4
  useEffect(() => {
    if (step !== 4 || draft.isWaitlist || !draft.date || !draft.time) return
    let active = true
    setRecomLoading(true)
    setError((current) => {
      if (keepError.current) {
        keepError.current = false
        return current
      }
      return ""
    })

    Promise.all([
      availabilityService.getAvailability({
        date: draft.date,
        time: draft.time,
        guests: draft.guests,
      }),
      tableService.getRecommendation({
        date: draft.date,
        time: draft.time,
        guests: draft.guests,
        location: preferences.location || undefined,
        shape: preferences.shape || undefined,
        tag: preferences.tag.trim() || undefined,
      }),
    ])
      .then(([nextAvailability, rec]) => {
        if (!active) return
        setAvailability(nextAvailability)
        setRecommendation(rec)
        if (nextAvailability.available && rec.available && rec.recommendations.length > 0) {
          const topTable = rec.recommendations[0].table
          setDraft((current) => ({
            ...current,
            tableIds: [topTable.id],
            tableId: topTable.id,
            tableNumber: topTable.tableNumber,
          }))
        } else {
          setDraft((current) => ({
            ...current,
            tableIds: [],
            tableId: "",
            tableNumber: "",
          }))
        }
      })
      .catch((err) => {
        if (!active) return
        setAvailability(null)
        setRecommendation(null)
        setError(formatApiError(err, "Unable to check table availability."))
      })
      .finally(() => {
        if (active) setRecomLoading(false)
      })

    return () => {
      active = false
    }
  }, [step, draft.date, draft.time, draft.guests, draft.isWaitlist, preferences.location, preferences.shape, preferences.tag, availabilityRefresh])

  const update = (patch: Partial<BookingRequest>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setError("")
  }

  const handleNext = () => {
    if (step === 1) {
      if (!draft.date) {
        setError("Choose a date to continue.")
        return
      }
      if (schedule && !schedule.isConfigured) {
        setError("SCHEDULE_NOT_CONFIGURED — No schedule is configured for this date.")
        return
      }
      if (schedule?.isClosed) {
        setError(
          schedule.reason
            ? `RESTAURANT_CLOSED — ${schedule.reason}`
            : "RESTAURANT_CLOSED — The restaurant is closed on this date."
        )
        return
      }
      if (timeSlots.length === 0) {
        setError("SCHEDULE_NOT_CONFIGURED — No service hours are configured for this day.")
        return
      }
    }

    if (step === 2) {
      if (!draft.time) {
        setError("Please select a time slot.")
        return
      }
    }

    if (step === 4 && !draft.isWaitlist && (draft.tableIds?.length || 0) === 0) {
      setError("Please select at least one table, or join the waitlist when no table is suitable.")
      return
    }

    setError("")
    setStep((s) => s + 1)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step < 5) {
      handleNext()
      return
    }

    const validation = validateBooking(draft)
    if (validation.status === "invalid") {
      setError(validation.message)
      return
    }

    setSubmitting(true)
    setError("")

    try {
      // 1. Ensure user is authenticated
      if (!isAuthenticated) {
        if (draft.password && draft.password.length >= 8) {
          try {
            await register(draft.name, draft.email, draft.password, draft.phone)
          } catch (regErr: any) {
            // If already exists, attempt login with given password
            if (regErr.message?.includes("already exists") || regErr.code === "DUPLICATE_DATA") {
              await login(draft.email, draft.password)
            } else {
              throw regErr
            }
          }
        } else {
          // Open auth modal so customer can log in or create an account
          setSubmitting(false)
          openAuthModal("login")
          setError("Please sign in or provide a password (8+ chars) below to confirm your booking.")
          return
        }
      }

      if (user && user.role !== "CUSTOMER" && !draft.isWaitlist) {
        setError("AUTHORIZATION_ERROR — Website bookings are created on a customer account.")
        return
      }

      // 2. Submit either Waitlist or Booking
      if (draft.isWaitlist) {
        const waitlistResult = await waitlistService.createWaitlist({
          date: draft.date,
          requestedStartTime: draft.time,
          guests: draft.guests,
          notes: draft.requests || undefined,
        })
        setConfirmedWaitlist(waitlistResult)
      } else {
        const selectedIds = draft.tableIds?.length ? draft.tableIds : draft.tableId ? [draft.tableId] : []
        const bookingResult = await bookingService.createBooking({
          date: draft.date,
          startTime: draft.time,
          guests: draft.guests,
          ...(selectedIds.length === 1 ? { tableId: selectedIds[0] } : { tableIds: selectedIds }),
          notes: draft.requests || undefined,
        })

        if (bookingResult.status === "PENDING" && bookingResult.payment) {
          setPendingPaymentBooking(bookingResult)
          setPendingPaymentOrder(bookingResult.payment)
          setSubmitting(false)
          return
        }

        setConfirmedBooking(bookingResult)
      }

      refreshNotificationsCount()
    } catch (err: any) {
      setConfirmedBooking(null)
      setPendingPaymentBooking(null)
      setPendingPaymentOrder(null)
      setError(formatApiError(err, "Failed to process reservation. Please try again."))
      if (err?.code === "BOOKING_CONFLICT" || err?.code === "TABLE_CAPACITY_INSUFFICIENT") {
        keepError.current = true
        setDraft((current) => ({
          ...current,
          tableId: "",
          tableIds: [],
          tableNumber: "",
        }))
        setStep(4)
        setAvailabilityRefresh((value) => value + 1)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyPayment = async () => {
    if (!pendingPaymentBooking || !pendingPaymentOrder) return
    setVerifyingPayment(true)
    setPaymentError("")

    try {
      const result = await paymentService.verifyPayment({
        paymentReference: pendingPaymentBooking.paymentReference || pendingPaymentOrder.paymentReference || "",
        providerOrderId: pendingPaymentOrder.providerOrderId,
        providerSignature: pendingPaymentOrder.providerSignature,
      })

      setConfirmedBooking(result.booking)
      setPendingPaymentBooking(null)
      setPendingPaymentOrder(null)
      refreshNotificationsCount()
    } catch (err: any) {
      setPaymentError(formatApiError(err, "Payment verification failed. Please try again."))
    } finally {
      setVerifyingPayment(false)
    }
  }

  const restart = () => {
    setConfirmedBooking(null)
    setConfirmedWaitlist(null)
    setPendingPaymentBooking(null)
    setPendingPaymentOrder(null)
    setPaymentError("")
    setStep(1)
    setError("")
    setDraft({
      date: getDefaultBookingDate(),
      time: "13:30",
      guests: 2,
      tableId: "",
      tableIds: [],
      tableNumber: "",
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      password: "",
      requests: "",
      isWaitlist: false,
    })
  }

  const switchToWaitlist = () => {
    startTransition(() => {
      setDraft((d) => ({ ...d, isWaitlist: true, tableId: "", tableIds: [], tableNumber: "" }))
      setError("")
      setStep(5)
    })
  }

  return (
    <section className="booking" id="book">
      <div className="book-intro reveal">
        <p className="kicker">Reservations</p>
        <h2>
          Your table
          <br />
          <em>is waiting.</em>
        </h2>
        <p>Come for the cider. Stay for the ritual.</p>

        {schedule && !schedule.isClosed && schedule.services.length > 0 && (
          <div className="mt-6 text-xs text-white/60 space-y-1">
            <p className="text-[10px] tracking-widest uppercase text-[var(--gold)]">
              {schedule.dayOfWeek} Hours
            </p>
            {schedule.services.map((s) => (
              <p key={s.name}>
                {s.name}: {s.startTime} – {s.endTime} (last booking {s.lastBookingTime})
              </p>
            ))}
          </div>
        )}

        <div className="steps" aria-label="Booking progress">
          {bookingSteps.map((label, index) => {
            const number = index + 1
            return (
              <span className={number <= step ? "active" : ""} key={label}>
                0{number}
              </span>
            )
          })}
        </div>
      </div>

      <form className="book-card reveal" onSubmit={submit} noValidate>
        {confirmedBooking ? (
          <div className="confirmation">
            <span className="check" aria-hidden="true">
              ✓
            </span>
            <p className="kicker dark">Booking confirmed</p>
            <h3>See you in the valley.</h3>
            <p>
              Reference: <strong className="font-mono text-[var(--forest)]">{confirmedBooking.bookingReference}</strong>
            </p>
            <p>
              {formatBookingDate(confirmedBooking.date)} · {confirmedBooking.startTime}–{confirmedBooking.endTime}
            </p>
            <p>
              {confirmedBooking.guests} guests · {confirmedBooking.serviceName} · {confirmedBooking.status}
            </p>
            <p>Tables: {bookingTableLabel(confirmedBooking)}</p>
            {confirmedBooking.depositStatus === "PAID" ? (
              <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 text-left">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-emerald-900">✓ Security Deposit Paid</span>
                  <span className="font-bold text-sm text-emerald-800">
                    €{(confirmedBooking.depositAmount || 0).toFixed(2)}
                  </span>
                </div>
                {confirmedBooking.paymentReference ? (
                  <p className="text-[11px] text-emerald-700 font-mono">
                    Payment Reference: {confirmedBooking.paymentReference}
                  </p>
                ) : null}
                <p className="text-[11px] text-emerald-800/80 mt-1">
                  Refundable if cancelled at least {depositConfig?.refundCutoffHours || 24} hours prior to arrival.
                </p>
              </div>
            ) : null}
            <div className="flex gap-4 mt-6">
              <Link to="/dashboard" className="btn gold text-xs uppercase tracking-wider">
                View in My Bookings
              </Link>
              <button type="button" className="line-link ink text-xs uppercase" onClick={restart}>
                Make another booking
              </button>
            </div>
          </div>
        ) : confirmedWaitlist ? (
          <div className="confirmation">
            <span className="check" aria-hidden="true">
              ⏳
            </span>
            <p className="kicker dark">Waitlist Joined</p>
            <h3>You're on the list.</h3>
            <p>
              Reference: <strong className="font-mono text-[var(--forest)]">{confirmedWaitlist.waitlistReference}</strong>
            </p>
            <p>
              {formatBookingDate(confirmedWaitlist.date)} · Requested {confirmedWaitlist.requestedStartTime} ·{" "}
              {confirmedWaitlist.guests} guests
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Our team will notify you in-app and by phone as soon as a suitable table frees up.
            </p>
            <div className="flex gap-4 mt-6">
              <Link to="/dashboard" className="btn gold text-xs uppercase tracking-wider">
                Track on Dashboard
              </Link>
              <button type="button" className="line-link ink text-xs uppercase" onClick={restart}>
                Back to booking
              </button>
            </div>
          </div>
        ) : pendingPaymentBooking && pendingPaymentOrder ? (
          <div className="payment-checkout p-2">
            <div className="text-center mb-5">
              <span className="inline-block px-3 py-0.5 bg-[var(--gold)]/20 text-[var(--forest)] text-[10px] font-bold tracking-widest uppercase rounded mb-2">
                Deposit Payment Required
              </span>
              <h3 className="font-serif text-2xl text-[var(--dark)]">Confirm Your Table</h3>
              <p className="text-xs text-gray-600 mt-1">
                A deposit is required to confirm this reservation.
              </p>
            </div>

            <div className="bg-[var(--cream)] border border-[var(--line)] p-4 rounded mb-5 space-y-2 text-xs">
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-2">
                <span className="text-gray-500">Booking Reference</span>
                <span className="font-mono font-bold text-[var(--forest)]">{pendingPaymentBooking.bookingReference}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--line)]/50 pb-2">
                <span className="text-gray-500">Date & Service</span>
                <span className="font-medium text-gray-800">
                  {formatBookingDate(pendingPaymentBooking.date)} · {pendingPaymentBooking.startTime} ({pendingPaymentBooking.guests} guests)
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm">
                <span className="font-semibold text-[var(--copper)]">Deposit Due</span>
                <span className="font-bold text-lg text-[var(--forest)]">
                  €{pendingPaymentOrder.amount.toFixed(2)} {pendingPaymentOrder.currency}
                </span>
              </div>
            </div>

            <div className="p-4 border border-[var(--line)] rounded bg-white mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Provider</span>
                <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono font-bold">
                  {pendingPaymentOrder.provider}
                </span>
              </div>
              <div className="space-y-3 text-xs text-gray-700">
                <div className="p-2.5 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">💳</span>
                    <span className="font-mono text-gray-600">•••• •••• •••• 4242</span>
                  </div>
                  <span className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">Simulated Sandbox</span>
                </div>
                <p className="text-[11px] text-gray-500">
                  {pendingPaymentOrder.instructions || "Server-authoritative provider sandbox. Verification is signed and verified by the backend."}
                </p>
              </div>
            </div>

            {paymentError ? (
              <p className="form-error mb-4" role="alert">
                {paymentError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="btn gold w-full py-3 text-xs uppercase tracking-wider font-bold shadow-md"
                disabled={verifyingPayment}
                onClick={handleVerifyPayment}
              >
                {verifyingPayment
                  ? "Verifying Payment with Server..."
                  : `Pay Deposit €${pendingPaymentOrder.amount.toFixed(2)}`}
              </button>
              <button
                type="button"
                className="line-link ink text-center text-xs uppercase"
                disabled={verifyingPayment}
                onClick={restart}
              >
                Cancel and edit details
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="book-top">
              <span>Step 0{step}</span>
              <span>
                {draft.isWaitlist && step === 5
                  ? "Join Waiting List"
                  : bookingSteps[step - 1]}
              </span>
            </div>

            {/* STEP 1: DATE */}
            {step === 1 && (
              <div className="field-screen">
                <label>
                  Date
                  <input
                    required
                    type="date"
                    name="date"
                    value={draft.date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(event) => update({ date: event.target.value })}
                  />
                </label>
                {scheduleLoading ? (
                  <p className="text-xs text-gray-500 mt-2">Checking schedule...</p>
                ) : schedule?.isClosed ? (
                  <p className="text-xs text-[var(--copper)] mt-2 font-medium">
                    ⚠️ {schedule.reason || "Restaurant is closed on this date."}
                  </p>
                ) : schedule && !schedule.isConfigured ? (
                  <p className="text-xs text-[var(--copper)] mt-2 font-medium">
                    SCHEDULE_NOT_CONFIGURED — No schedule is configured for this date.
                  </p>
                ) : schedule && !schedule.isClosed && schedule.services.length > 0 ? (
                  <p className="text-xs text-[var(--forest)] mt-2">
                    Open on {schedule.dayOfWeek} for {schedule.services.map((s) => s.name).join(" & ")}.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">Choose a date to load the effective schedule.</p>
                )}
              </div>
            )}

            {/* STEP 2: TIME */}
            {step === 2 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[var(--copper)] mt-4">
                  Available Service Times
                </p>
                {timeSlots.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">
                    No available time slots found for this date.
                  </div>
                ) : (
                  <div className="time-grid" role="group" aria-label="Choose a time">
                    {timeSlots.map((slot) => (
                      <button
                        type="button"
                        className={draft.time === slot.time ? "selected" : ""}
                        aria-pressed={draft.time === slot.time}
                        onClick={() => update({ time: slot.time })}
                        key={slot.time}
                      >
                        {slot.time}
                        <small>{slot.note}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: GUESTS */}
            {step === 3 && (
              <div>
                <div className="guest-picker">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => update({ guests: Math.max(1, draft.guests - 1) })}
                  >
                    −
                  </button>
                  <div aria-live="polite">
                    <strong>{draft.guests}</strong>
                    <span>Guests</span>
                  </div>
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => update({ guests: Math.min(100, draft.guests + 1) })}
                  >
                    +
                  </button>
                </div>
                {isDepositRequired && depositConfig ? (
                  <div className="mt-4 p-3 bg-[var(--cream)] border border-[var(--gold)]/40 rounded text-xs text-left">
                    <p className="font-semibold text-[var(--copper)]">
                      💳 Security Deposit Required: €{depositAmount.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {depositConfig.type === "PER_GUEST"
                        ? `€${depositConfig.amount} per guest for parties of ${depositConfig.minGuests} or more.`
                        : `Flat €${depositConfig.amount} deposit for parties of ${depositConfig.minGuests} or more.`}
                      {" "}Refundable if cancelled at least {depositConfig.refundCutoffHours}h before arrival.
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* STEP 4: TABLE RECOMMENDATION & SELECTION */}
            {step === 4 && (
              <div className="py-2">
                {recomLoading ? (
                  <div className="min-h-[280px] flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs tracking-wider uppercase text-gray-600">
                      Checking availability and table ranking...
                    </p>
                  </div>
                ) : availability && !availability.available ? (
                  <div className="min-h-[260px] flex flex-col items-center justify-center text-center p-6 bg-white/50 border border-[var(--line)]">
                    <p className="text-sm font-serif text-[var(--dark)] mb-2">This time cannot be booked.</p>
                    <p className="text-xs text-gray-700 max-w-xs mb-4" role="alert">
                      {availabilityReasonText(availability.reason, availability.closedReason)}
                    </p>
                    {availability.service ? (
                      <p className="text-[10px] text-gray-500 mb-4">
                        {availability.service.name}
                        {availability.endTime ? ` · would end ${availability.endTime}` : ""}
                      </p>
                    ) : null}
                    {availability.reason === "NO_SUITABLE_TABLE" ? (
                      <button
                        type="button"
                        onClick={switchToWaitlist}
                        className="btn gold text-xs uppercase tracking-wider flex items-center gap-2"
                      >
                        Join Waiting List <Arrow />
                      </button>
                    ) : null}
                  </div>
                ) : recommendation?.available && recommendation.recommendations.length > 0 ? (
                  <>
                    <p className="text-[10px] tracking-wider uppercase text-[var(--forest)] font-semibold mb-2">
                      {availability?.available ? "Available" : "Ranked tables"} ·{" "}
                      {recommendation.recommendations.length} table{recommendation.recommendations.length === 1 ? "" : "s"}
                      {availability?.service ? ` · ${availability.service.name}` : recommendation.service ? ` · ${recommendation.service.name}` : ""}
                      {availability?.endTime ? ` · ends ${availability.endTime}` : ""}
                    </p>
                    <p className="text-[10px] text-gray-500 mb-3">
                      Suitable tables:{" "}
                      {(availability?.tables || []).map((table) => table.tableNumber).join(", ") || "listed below"}.
                      Select up to three. The score is the backend rank.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
                      <select
                        value={preferences.location}
                        onChange={(event) =>
                          setPreferences((current) => ({
                            ...current,
                            location: event.target.value as "" | TableLocation,
                          }))
                        }
                        className="bg-white border border-[var(--line)] p-1"
                        aria-label="Preferred location"
                      >
                        <option value="">Any location</option>
                        {["WINDOW", "BAR", "CENTER", "PRIVATE", "OUTDOOR", "OTHER"].map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                      <select
                        value={preferences.shape}
                        onChange={(event) =>
                          setPreferences((current) => ({
                            ...current,
                            shape: event.target.value as "" | TableShape,
                          }))
                        }
                        className="bg-white border border-[var(--line)] p-1"
                        aria-label="Preferred shape"
                      >
                        <option value="">Any shape</option>
                        {["ROUND", "SQUARE", "RECTANGLE"].map((shape) => (
                          <option key={shape} value={shape}>
                            {shape}
                          </option>
                        ))}
                      </select>
                      <input
                        value={preferences.tag}
                        onChange={(event) =>
                          setPreferences((current) => ({ ...current, tag: event.target.value }))
                        }
                        placeholder="Tag"
                        className="bg-white border border-[var(--line)] p-1"
                        aria-label="Preferred tag"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {recommendation.recommendations.map((rec) => {
                        const selectedIds = draft.tableIds || []
                        const isSelected = selectedIds.includes(rec.table.id)
                        return (
                          <button
                            key={rec.table.id}
                            type="button"
                            onClick={() => {
                              const next = isSelected
                                ? selectedIds.filter((id) => id !== rec.table.id)
                                : [...selectedIds, rec.table.id]
                              if (next.length > 3) {
                                setError("TOO_MANY_TABLES — A booking can include at most three tables.")
                                return
                              }
                              const labels = recommendation.recommendations
                                .filter((item) => next.includes(item.table.id))
                                .map((item) => item.table.tableNumber)
                              update({
                                tableIds: next,
                                tableId: next[0] || "",
                                tableNumber: labels.join(", "),
                              })
                            }}
                            className={`p-3 text-left border transition-all ${
                              isSelected
                                ? "bg-[var(--forest)] text-white border-[var(--forest)] shadow-md"
                                : "bg-white/80 border-[var(--line)] hover:border-[var(--forest)] text-[var(--dark)]"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-serif text-lg font-bold">{rec.table.tableNumber}</span>
                              <span
                                className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                Rank #{rec.rank}
                              </span>
                            </div>
                            <p className="text-xs mt-1">
                              {rec.table.capacity} seats · {rec.table.shape.toLowerCase()} · {rec.table.location}
                            </p>
                            <p className={`text-[10px] mt-1 ${isSelected ? "text-[var(--gold)]" : "text-gray-500"}`}>
                              Score {rec.score} · seats {rec.breakdown.capacity} · location {rec.breakdown.location.points} · shape{" "}
                              {rec.breakdown.shape.points} · tag {rec.breakdown.tag.points}
                            </p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--line)] flex justify-between items-center text-xs">
                      <span className="text-stone-700 font-medium">
                        Selected: {draft.tableNumber || "none"} ({draft.tableIds?.length || 0}/3)
                      </span>
                      <button
                        type="button"
                        onClick={switchToWaitlist}
                        className="text-[10px] uppercase tracking-wider text-[var(--forest)] hover:underline font-bold"
                      >
                        Join Waiting List instead →
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="min-h-[260px] flex flex-col items-center justify-center text-center p-6 bg-white/50 border border-[var(--line)]">
                    <p className="text-sm font-serif text-[var(--dark)] mb-2">No ranked tables were returned.</p>
                    <p className="text-xs text-gray-600 max-w-xs mb-6" role="alert">
                      {availabilityReasonText(recommendation?.reason || availability?.reason, recommendation?.closedReason)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: DETAILS & CONFIRM */}
            {step === 5 && (
              <div className="details">
                {isAuthenticated ? (
                  <div className="mb-4 p-3 bg-white/80 border border-[var(--line)] text-xs">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--copper)]">
                      Signed in as
                    </p>
                    <p className="font-semibold text-sm text-[var(--forest)]">{user?.name}</p>
                    <p className="text-gray-600">{user?.email}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">
                        Guest Information
                      </span>
                      <button
                        type="button"
                        onClick={() => openAuthModal("login")}
                        className="text-[10px] uppercase tracking-wider text-[var(--forest)] font-bold hover:underline"
                      >
                        Already have an account? Sign In
                      </button>
                    </div>

                    <label>
                      Full name
                      <input
                        required
                        name="name"
                        autoComplete="name"
                        placeholder="Your name"
                        value={draft.name}
                        onChange={(event) => update({ name: event.target.value })}
                      />
                    </label>

                    <label>
                      Email
                      <input
                        required
                        type="email"
                        name="email"
                        autoComplete="email"
                        placeholder="name@email.com"
                        value={draft.email}
                        onChange={(event) => update({ email: event.target.value })}
                      />
                    </label>

                    <label>
                      Phone Number
                      <input
                        type="tel"
                        name="phone"
                        autoComplete="tel"
                        placeholder="+34 685 72 15 92"
                        value={draft.phone}
                        onChange={(event) => update({ phone: event.target.value })}
                      />
                    </label>

                    <label>
                      Create Password (to secure your reservation)
                      <input
                        type="password"
                        name="password"
                        placeholder="At least 8 characters"
                        value={draft.password}
                        onChange={(event) => update({ password: event.target.value })}
                      />
                    </label>
                  </>
                )}

                {isDepositRequired && depositConfig ? (
                  <div className="p-3.5 bg-[var(--cream)] border border-[var(--gold)]/50 rounded mb-4 text-xs text-left">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--copper)]">Security Deposit Required</span>
                      <span className="font-bold text-sm text-[var(--forest)]">€{depositAmount.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      To secure your table, a deposit of €{depositAmount.toFixed(2)} is collected upon confirmation.
                      Automatic refund if cancelled at least {depositConfig.refundCutoffHours}h before your booking.
                    </p>
                  </div>
                ) : null}

                <label>
                  Special requests
                  <textarea
                    name="requests"
                    placeholder="Allergies, high chair, dietary restrictions, or anniversary celebration"
                    value={draft.requests}
                    onChange={(event) => update({ requests: event.target.value })}
                  />
                </label>
              </div>
            )}

            {error ? (
              <p className="form-error" role="alert">
                {error}
                {error.startsWith("NETWORK_ERROR") ? (
                  <button
                    type="button"
                    className="block mt-2 underline"
                    onClick={() => setScheduleRetry((value) => value + 1)}
                  >
                    Retry
                  </button>
                ) : null}
              </p>
            ) : null}

            <div className="book-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="back"
                  onClick={() => {
                    setError("")
                    setStep((current) => current - 1)
                  }}
                >
                  ← Back
                </button>
              )}
              <button
                className="btn gold"
                type="submit"
                disabled={submitting || (step === 1 && schedule?.isClosed)}
              >
                {submitting
                  ? "Processing..."
                  : step === 1
                  ? "Check availability"
                  : step === 5
                  ? draft.isWaitlist
                    ? "Join Waiting List"
                    : isDepositRequired
                    ? `Confirm & Pay Deposit (€${depositAmount.toFixed(2)})`
                    : "Confirm Booking"
                  : "Continue"}{" "}
                <Arrow />
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}
