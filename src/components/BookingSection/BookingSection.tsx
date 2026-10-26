import { FormEvent, useState } from "react"
import { bookingSteps, tables, timeSlots } from "@/data/site"
import { formatBookingDate, validateBooking, type BookingRequest } from "@/lib/booking"
import { Arrow } from "@/components/UI/Arrow"

const initialRequest: BookingRequest = {
  date: "",
  time: "20:00",
  guests: 2,
  table: 12,
  name: "",
  email: "",
  requests: "",
}

export function BookingSection() {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<BookingRequest>(initialRequest)
  const [error, setError] = useState("")
  const [confirmed, setConfirmed] = useState(false)

  const update = (patch: Partial<BookingRequest>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setError("")
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (step === 1 && !draft.date) {
      setError("Choose a date to continue.")
      return
    }
    if (step < 5) {
      setError("")
      setStep((current) => current + 1)
      return
    }

    const result = validateBooking(draft)
    if (result.status === "invalid") {
      setError(result.message)
      return
    }

    setError("")
    setConfirmed(true)
  }

  const restart = () => {
    setConfirmed(false)
    setStep(1)
    setError("")
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
        {confirmed ? (
          <div className="confirmation">
            <span className="check" aria-hidden="true">
              ✓
            </span>
            <p className="kicker dark">Booking confirmed</p>
            <h3>See you in the valley.</h3>
            <p>
              {formatBookingDate(draft.date)} · {draft.time} · {draft.guests} guests · Table{" "}
              {draft.table}
            </p>
            <button type="button" className="line-link ink" onClick={restart}>
              Make another booking
            </button>
          </div>
        ) : (
          <>
            <div className="book-top">
              <span>Step 0{step}</span>
              <span>{bookingSteps[step - 1]}</span>
            </div>

            {step === 1 && (
              <div className="field-screen">
                <label>
                  Date
                  <input
                    required
                    type="date"
                    name="date"
                    value={draft.date}
                    onChange={(event) => update({ date: event.target.value })}
                  />
                </label>
                <p>We welcome guests Thursday to Sunday.</p>
              </div>
            )}

            {step === 2 && (
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

            {step === 3 && (
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
                  onClick={() => update({ guests: Math.min(12, draft.guests + 1) })}
                >
                  +
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="floor" role="group" aria-label="Choose your table">
                <p>WINDOW</p>
                {tables.map((table) => (
                  <button
                    type="button"
                    key={table.id}
                    disabled={table.reserved}
                    aria-pressed={draft.table === table.id}
                    className={`${draft.table === table.id ? "selected" : ""} ${table.position}`}
                    onClick={() => update({ table: table.id })}
                  >
                    <span>{table.id}</span>
                    <small>{table.capacity}</small>
                  </button>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="details">
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
                  Special requests
                  <textarea
                    name="requests"
                    placeholder="Allergies, occasion or anything we should know"
                    value={draft.requests}
                    onChange={(event) => update({ requests: event.target.value })}
                  />
                </label>
              </div>
            )}

            {error ? (
              <p className="form-error" role="alert">
                {error}
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
              <button className="btn gold" type="submit">
                {step === 1 ? "Check availability" : step === 5 ? "Confirm booking" : "Continue"}{" "}
                <Arrow />
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}
