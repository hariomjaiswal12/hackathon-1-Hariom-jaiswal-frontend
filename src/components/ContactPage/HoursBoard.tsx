import { useEffect, useState } from "react"
import { scheduleService } from "@/services/scheduleService"
import { formatApiError } from "@/lib/errors"
import type { ClosedDay, DaySchedule } from "@/types/api"

const WEEKDAY = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

function shortDay(dayOfWeek: string) {
  return dayOfWeek.slice(0, 3)
}

function titleDay(dayOfWeek: string) {
  return dayOfWeek.charAt(0) + dayOfWeek.slice(1).toLowerCase()
}

function hoursFor(day: DaySchedule) {
  if (day.isConfigured === false) {
    return { hours: "Not configured", note: "SCHEDULE_NOT_CONFIGURED" }
  }
  if (!day.isOpen || !day.services?.length) {
    return { hours: "Closed", note: "Closed this day of the week" }
  }
  return {
    hours: day.services.map((service) => `${service.startTime}–${service.endTime}`).join(" & "),
    note: day.services.map((service) => service.name).join(" & "),
  }
}

export function HoursBoard() {
  const today = WEEKDAY[new Date().getDay()]
  const [active, setActive] = useState(today)
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([])
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError("")

    Promise.all([scheduleService.getWeeklySchedule(), scheduleService.listClosedDays(true)])
      .then(([schedules, closures]) => {
        if (!isMounted) return
        setWeekDays(schedules)
        setClosedDays(closures)
        if (!schedules.some((day) => day.dayOfWeek === today) && schedules[0]) {
          setActive(schedules[0].dayOfWeek)
        }
      })
      .catch((loadError) => {
        if (!isMounted) return
        setError(formatApiError(loadError, "The schedule could not be loaded."))
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [today, attempt])

  const day = weekDays.find((item) => item.dayOfWeek === active) ?? weekDays[0]
  const display = day ? hoursFor(day) : null

  return (
    <section className="hours" id="hours">
      <div className="hours-head reveal">
        <p className="kicker dark">Ordutegia</p>
        <h2>
          Opening
          <br />
          <em>hours.</em>
        </h2>
        <p>Hours and holiday closures are published by the restaurant schedule.</p>
      </div>
      <div className="hours-board reveal">
        {loading ? (
          <p>Loading the restaurant schedule…</p>
        ) : error ? (
          <p role="alert">
            {error}
            <button type="button" className="inline-block mt-2 underline text-[var(--forest)] font-bold hover:text-[var(--dark)]" onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          </p>
        ) : weekDays.length === 0 ? (
          <p>No schedule returned.</p>
        ) : (
          <>
            <div className="day-rail" role="tablist" aria-label="Opening days">
              {weekDays.map((item) => (
                <button
                  key={item.dayOfWeek}
                  type="button"
                  role="tab"
                  id={`day-${item.dayOfWeek}`}
                  aria-selected={item.dayOfWeek === day?.dayOfWeek}
                  aria-controls="day-panel"
                  className={item.dayOfWeek === day?.dayOfWeek ? "on" : undefined}
                  onClick={() => setActive(item.dayOfWeek)}
                >
                  <span>{shortDay(item.dayOfWeek)}</span>
                  {titleDay(item.dayOfWeek)}
                </button>
              ))}
            </div>
            {day && display ? (
              <div
                className="day-panel"
                role="tabpanel"
                id="day-panel"
                aria-labelledby={`day-${day.dayOfWeek}`}
              >
                <p>{display.note}</p>
                <strong>{display.hours}</strong>
                <span>{titleDay(day.dayOfWeek)}</span>
              </div>
            ) : null}
          </>
        )}
      </div>

      {!loading && !error ? (
        <p className="hours-close reveal">
          {closedDays.length > 0 ? (
            <>
              Active closed days:{" "}
              {closedDays.map((closure) => `${closure.date}${closure.reason ? ` (${closure.reason})` : ""}`).join(", ")}
              .
            </>
          ) : (
            <>No active closed days are published.</>
          )}
        </p>
      ) : null}
    </section>
  )
}
