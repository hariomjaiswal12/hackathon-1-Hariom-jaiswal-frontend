import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { formatBookingDate } from "@/lib/booking"
import { dashboardService } from "@/services/dashboardService"
import { subscribeFloorUpdates } from "@/services/realtime"
import { formatApiError } from "@/lib/errors"
import type {
  DashboardActivity,
  DashboardBookingAnalytics,
  DashboardHourly,
  DashboardLive,
  DashboardOverview,
  DashboardServices,
  DashboardTables,
  DashboardWaitlistAnalytics,
  LiveTable,
} from "@/types/api"
import { DepositPanel } from "./DepositPanel"
import { BlacklistPanel } from "./BlacklistPanel"
import { EventsPanel } from "./EventsPanel"
import { NewsPanel } from "./NewsPanel"
import { ChannelsPanel } from "./ChannelsPanel"
import { CustomersPanel } from "./CustomersPanel"
import { JobsPanel } from "./JobsPanel"
import {
  DonutChart,
  HorizontalBars,
  HourlyChart,
  Icon,
  KpiCard,
  Panel,
  SectionMessage,
  formatReturnedRate,
  readableLabel,
  statusColor,
} from "./dashboardVisuals"

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function messageOf(error: unknown) {
  return formatApiError(error, "The dashboard request failed.")
}

function activityLabel(type: string) {
  const labels: Record<string, string> = {
    BOOKING_CREATED: "Booking created",
    BOOKING_STATUS_CHANGED: "Booking status changed",
    BOOKING_RESCHEDULED: "Booking rescheduled",
    WAITLIST: "Waitlist update",
  }
  return labels[type] || readableLabel(type)
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function floorBadge(state: LiveTable["operationalState"]) {
  const styles: Record<string, string> = {
    AVAILABLE: "bg-emerald-100 text-emerald-800",
    UPCOMING: "bg-teal-100 text-teal-800",
    BOOKED: "bg-amber-100 text-amber-900",
    ARRIVED: "bg-blue-100 text-blue-800",
    SEATED: "bg-purple-100 text-purple-900",
    CLEANING: "bg-yellow-100 text-yellow-800",
    OUT_OF_SERVICE: "bg-rose-100 text-rose-800",
  }
  return (
    <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded ${styles[state] || "bg-stone-100 text-stone-700"}`}>
      {readableLabel(state)}
    </span>
  )
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const [pickedDate, setPickedDate] = useState("")
  const [loading, setLoading] = useState(true)
  const [floorLoading, setFloorLoading] = useState(false)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [bookings, setBookings] = useState<DashboardBookingAnalytics | null>(null)
  const [hourly, setHourly] = useState<DashboardHourly | null>(null)
  const [services, setServices] = useState<DashboardServices | null>(null)
  const [tables, setTables] = useState<DashboardTables | null>(null)
  const [waitlist, setWaitlist] = useState<DashboardWaitlistAnalytics | null>(null)
  const [live, setLive] = useState<DashboardLive | null>(null)
  const [activity, setActivity] = useState<DashboardActivity | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const businessDate = overview?.date || ""
  const shownDate = pickedDate || businessDate

  const load = useCallback(async () => {
    setLoading(true)
    const queryDate = ISO_DATE.test(pickedDate) ? pickedDate : undefined
    const nextErrors: Record<string, string> = {}
    let resolvedDate = queryDate

    try {
      const overviewData = await dashboardService.getOverview(queryDate)
      setOverview(overviewData)
      if (!resolvedDate) resolvedDate = overviewData.date
    } catch (error) {
      setOverview(null)
      nextErrors.overview = messageOf(error)
    }

    const dated = resolvedDate && ISO_DATE.test(resolvedDate) ? resolvedDate : ""

    const [bookingResult, hourlyResult, serviceResult, tableResult, waitlistResult, liveResult, activityResult] =
      await Promise.allSettled([
        dated ? dashboardService.getBookings(dated) : Promise.reject(new Error("A business date is required.")),
        dated ? dashboardService.getHourly(dated) : Promise.reject(new Error("A business date is required.")),
        dated ? dashboardService.getServices(dated) : Promise.reject(new Error("A business date is required.")),
        dated ? dashboardService.getTables(dated) : Promise.reject(new Error("A business date is required.")),
        dated ? dashboardService.getWaitlist(dated) : dashboardService.getWaitlist(),
        dashboardService.getLive(),
        dashboardService.getActivity(),
      ])

    if (bookingResult.status === "fulfilled") setBookings(bookingResult.value)
    else {
      setBookings(null)
      nextErrors.bookings = messageOf(bookingResult.reason)
    }
    if (hourlyResult.status === "fulfilled") setHourly(hourlyResult.value)
    else {
      setHourly(null)
      nextErrors.hourly = messageOf(hourlyResult.reason)
    }
    if (serviceResult.status === "fulfilled") setServices(serviceResult.value)
    else {
      setServices(null)
      nextErrors.services = messageOf(serviceResult.reason)
    }
    if (tableResult.status === "fulfilled") setTables(tableResult.value)
    else {
      setTables(null)
      nextErrors.tables = messageOf(tableResult.reason)
    }
    if (waitlistResult.status === "fulfilled") setWaitlist(waitlistResult.value)
    else {
      setWaitlist(null)
      nextErrors.waitlist = messageOf(waitlistResult.reason)
    }
    if (liveResult.status === "fulfilled") setLive(liveResult.value)
    else {
      setLive(null)
      nextErrors.live = messageOf(liveResult.reason)
    }
    if (activityResult.status === "fulfilled") setActivity(activityResult.value)
    else {
      setActivity(null)
      nextErrors.activity = messageOf(activityResult.reason)
    }

    setErrors(nextErrors)
    setLoading(false)
  }, [pickedDate])

  useEffect(() => {
    load()
  }, [load])

  const refreshFloor = useCallback(async () => {
    setFloorLoading(true)
    try {
      const floor = await dashboardService.getLive()
      setLive(floor)
      setErrors((current) => ({ ...current, live: "" }))
    } catch (error) {
      setErrors((current) => ({ ...current, live: messageOf(error) }))
    } finally {
      setFloorLoading(false)
    }
  }, [])

  useEffect(() => subscribeFloorUpdates(() => {
    refreshFloor()
  }), [refreshFloor])

  const statusSegments = bookings
    ? Object.entries(bookings.byStatus)
        .filter(([, value]) => value > 0)
        .map(([label, value]) => ({ label, value, color: statusColor(label) }))
    : []
  const sourceRows = bookings
    ? Object.entries(bookings.bySource)
        .filter(([, value]) => value > 0)
        .map(([label, value]) => ({ label, value, color: statusColor(label) }))
    : []
  const busiestMinutes = Math.max(...(tables?.tables.map((table) => table.utilizationMinutes) || [0]), 1)

  return (
    <main id="content" className="min-h-screen bg-[var(--cream)] text-[var(--dark)] pt-32 pb-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="border-b border-[var(--line)] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--copper)]">TXOTX OS</p>
            <h1 className="font-serif text-4xl md:text-6xl text-[var(--forest)] mt-1">Admin Dashboard</h1>
            <p className="text-sm text-[var(--brown)] mt-2">Restaurant operations overview</p>
            <p className="text-xs text-[var(--sage)] mt-3">
              {user?.name} · {user?.role}
              {shownDate ? <> · Business date <strong className="text-[var(--dark)]">{formatBookingDate(shownDate)}</strong></> : null}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="text-[10px] uppercase tracking-[0.16em] text-stone-700 font-bold">
              Date
              <input
                type="date"
                value={shownDate}
                onChange={(event) => setPickedDate(event.target.value)}
                className="mt-1 block bg-white border border-[var(--line)] px-3 py-2 text-sm text-[var(--dark)] tracking-normal"
              />
            </label>
            <button
              type="button"
              onClick={() => setPickedDate("")}
              className="px-4 py-2 text-[10px] uppercase tracking-wider bg-white text-[var(--dark)] font-bold border border-[var(--line)] hover:bg-[var(--beige)] transition-colors"
            >
              Business date
            </button>
            <button
              type="button"
              onClick={load}
              className="px-4 py-2 text-[10px] uppercase tracking-wider bg-[var(--forest)] text-white font-bold hover:bg-[var(--dark)] transition-colors"
            >
              Refresh
            </button>
          </div>
        </header>

        {loading && (
          <div className="p-10 text-center bg-white/70 border border-[var(--line)]">
            <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs uppercase tracking-wider text-stone-700 font-medium">Loading operations</p>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {errors.overview ? <SectionMessage>{errors.overview}</SectionMessage> : null}
          {overview && (
            <>
              <KpiCard label="Total bookings" value={overview.bookings.total} detail="Every reservation on this date." icon={<Icon name="book" />} />
              <KpiCard label="Total guests" value={overview.guests.total} detail="Guest count across every status." icon={<Icon name="guests" />} />
              <KpiCard label="Confirmed" value={overview.bookings.confirmed} detail={`${overview.guests.confirmed} confirmed guests.`} icon={<Icon name="check" />} />
              <KpiCard label="Arrived" value={overview.bookings.arrived} detail={`${overview.guests.arrived} arrived guests.`} icon={<Icon name="clock" />} />
              <KpiCard label="Seated" value={overview.bookings.seated} detail={`${overview.guests.seated} seated guests.`} icon={<Icon name="seat" />} />
              <KpiCard label="Completed" value={overview.bookings.completed} detail={`${overview.guests.completed} completed guests.`} icon={<Icon name="done" />} />
              <KpiCard label="Cancelled" value={overview.bookings.cancelled} detail="Cancelled reservations." icon={<Icon name="cancel" />} />
              <KpiCard label="No-show" value={overview.bookings.noShow} detail="Reservations marked no-show." icon={<Icon name="alert" />} />
              <KpiCard
                label="Tables"
                value={overview.tables.total}
                detail={`${overview.tables.available} available · ${overview.tables.reserved} reserved · ${overview.tables.occupied} occupied · ${overview.tables.cleaning} cleaning · ${overview.tables.outOfService} out of service.`}
                icon={<Icon name="table" />}
              />
              <KpiCard
                label="Waitlist"
                value={overview.waitlist.waiting}
                detail={`${overview.waitlist.notified} notified · ${overview.waitlist.converted} converted · ${overview.waitlist.cancelled} cancelled · ${overview.waitlist.expired} expired.`}
                icon={<Icon name="list" />}
              />
            </>
          )}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel kicker="Reservations" title="Bookings">
            {errors.bookings ? <SectionMessage>{errors.bookings}</SectionMessage> : null}
            {bookings && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <KpiCard label="Total" value={bookings.total} detail="Counted once, including group bookings." icon={<Icon name="book" />} />
                  <KpiCard label="Guests" value={bookings.totalGuests} detail={`Average ${bookings.averageGuestsPerBooking} guests.`} icon={<Icon name="guests" />} />
                  <KpiCard label="Group bookings" value={bookings.groupBookingCount} detail={`${bookings.singleTableBookingCount} single-table bookings.`} icon={<Icon name="table" />} />
                </div>
                <DonutChart segments={statusSegments} />
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.16em] text-[var(--sage)] mb-3">By source</h3>
                  <HorizontalBars rows={sourceRows} />
                </div>
              </div>
            )}
          </Panel>

          <Panel kicker="Service rhythm" title="Hourly demand">
            {errors.hourly ? <SectionMessage>{errors.hourly}</SectionMessage> : null}
            {hourly && <HourlyChart hours={hourly.hours} />}
          </Panel>
        </div>

        <Panel kicker="Meal periods" title="Service performance">
          {errors.services ? <SectionMessage>{errors.services}</SectionMessage> : null}
          {services && services.services.length === 0 ? (
            <p className="text-sm text-[var(--sage)]">No services have bookings on this date.</p>
          ) : null}
          {services && services.services.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {services.services.map((service) => (
                <article key={service.serviceName} className="border border-[var(--line)] p-4 bg-[var(--cream)]/50">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-serif text-2xl text-[var(--forest)]">{service.serviceName}</h3>
                    <p className="text-xs text-[var(--sage)]">{service.bookings} bookings</p>
                  </div>
                  <div className="mt-4">
                    <HorizontalBars
                      rows={[
                        { label: "Bookings", value: service.bookings, color: "#173c32" },
                        { label: "Guests", value: service.guests, color: "#d89b45" },
                      ]}
                    />
                  </div>
                  <p className="text-xs text-[var(--brown)] mt-3">
                    Average {service.averageGuests} guests · {service.completed} completed · {service.cancelled} cancelled · {service.noShow} no-show
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </Panel>

        <Panel kicker="Floor demand" title="Table utilization">
          {errors.tables ? <SectionMessage>{errors.tables}</SectionMessage> : null}
          {tables && (
            <div className="space-y-3">
              {tables.tables.length === 0 ? <p className="text-sm text-[var(--sage)]">No tables returned.</p> : null}
              {tables.tables.map((table) => (
                <article key={table.tableId} className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3 items-center">
                  <div>
                    <p className="font-serif text-2xl text-[var(--dark)]">{table.tableNumber}</p>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Capacity {table.capacity}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{table.utilizationMinutes} min</span>
                      <span>{table.bookingCount} bookings · {table.guestCount} guests</span>
                    </div>
                    <div className="h-3 bg-[var(--beige)]">
                      <div
                        className="h-full bg-[var(--forest)]"
                        style={{ width: `${(table.utilizationMinutes / busiestMinutes) * 100}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--sage)] mt-1">
                      {table.completedCount} completed · {table.cancelledCount} cancelled
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel kicker="Queue" title="Waitlist conversion">
            {errors.waitlist ? <SectionMessage>{errors.waitlist}</SectionMessage> : null}
            {waitlist && (
              <div>
                <p className="font-serif text-6xl text-[var(--forest)] leading-none">{formatReturnedRate(waitlist.conversionRate)}</p>
                <p className="text-xs text-[var(--sage)] mt-2">API rate {waitlist.conversionRate}</p>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 text-sm">
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Waiting</dt><dd className="font-serif text-2xl">{waitlist.waiting}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Notified</dt><dd className="font-serif text-2xl">{waitlist.notified}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Converted</dt><dd className="font-serif text-2xl">{waitlist.converted}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Cancelled</dt><dd className="font-serif text-2xl">{waitlist.cancelled}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Expired</dt><dd className="font-serif text-2xl">{waitlist.expired}</dd></div>
                  <div><dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">Total</dt><dd className="font-serif text-2xl">{waitlist.total}</dd></div>
                </dl>
              </div>
            )}
          </Panel>

          <Panel kicker="History" title="Recent activity">
            {errors.activity ? <SectionMessage>{errors.activity}</SectionMessage> : null}
            {activity && activity.events.length === 0 ? <p className="text-sm text-[var(--sage)]">No recent events.</p> : null}
            {activity && activity.events.length > 0 ? (
              <ol className="space-y-4 max-h-[420px] overflow-auto pr-2">
                {activity.events.map((event, index) => (
                  <li key={`${event.reference}-${event.timestamp}-${index}`} className="grid grid-cols-[16px_1fr] gap-3">
                    <span className="mt-1 w-2.5 h-2.5 rounded-full bg-[var(--copper)]" />
                    <div className="border-b border-[var(--line)] pb-3">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]">{formatActivityTime(event.timestamp)}</p>
                      <p className="text-sm text-[var(--dark)] mt-1">{activityLabel(event.type)}</p>
                      <p className="text-xs text-[var(--brown)] mt-1">
                        {event.reference}
                        {event.status ? ` · ${readableLabel(event.status)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}
          </Panel>
        </div>

        <Panel
          kicker="Right now"
          title="Live floor"
          action={
            <button
              type="button"
              onClick={refreshFloor}
              className="px-3 py-2 text-[10px] uppercase tracking-wider border border-[var(--line)] bg-white text-[var(--dark)] font-bold hover:bg-[var(--beige)] transition-colors"
            >
              {floorLoading ? "Refreshing" : "Refresh floor"}
            </button>
          }
        >
          {errors.live ? <SectionMessage>{errors.live}</SectionMessage> : null}
          {live && (
            <div>
              <p className="text-xs text-stone-700 font-medium mb-4">
                {live.businessDate} · {live.currentTime}
              </p>
              <div className="flex flex-wrap gap-2 mb-5 text-[10px] uppercase tracking-wider">
                {Object.entries(live.summary).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-[var(--cream)] border border-[var(--line)]">
                    {readableLabel(key)} {value}
                  </span>
                ))}
              </div>
              {live.tables.length === 0 ? <p className="text-sm text-[var(--sage)]">No active tables on the live floor.</p> : null}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {live.tables.map((table) => (
                  <article key={table.id} className="border border-[var(--line)] p-4 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-2xl">{table.tableNumber}</h3>
                      {floorBadge(table.operationalState)}
                    </div>
                    <p className="text-xs text-[var(--sage)] mt-2">Capacity {table.capacity}</p>
                    {table.currentBooking ? (
                      <p className="text-xs mt-3 text-[var(--dark)]">
                        {table.currentBooking.bookingReference} · {table.currentBooking.startTime}–{table.currentBooking.endTime} · {table.currentBooking.guests} guests · {readableLabel(table.currentBooking.status)}
                      </p>
                    ) : table.nextBooking ? (
                      <p className="text-xs mt-3 text-[var(--brown)]">
                        Next {table.nextBooking.bookingReference} · {table.nextBooking.startTime} · {table.nextBooking.guests} guests
                      </p>
                    ) : (
                      <p className="text-xs mt-3 text-[var(--sage)]">No current or upcoming booking.</p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <DepositPanel />
        <CustomersPanel />
        <BlacklistPanel />
        <EventsPanel />
        <NewsPanel />
        <ChannelsPanel />
        <JobsPanel />
      </div>
    </main>
  )
}
