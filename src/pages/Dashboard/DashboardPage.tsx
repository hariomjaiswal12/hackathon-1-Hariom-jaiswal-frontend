import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { bookingService } from "@/services/bookingService"
import { waitlistService } from "@/services/waitlistService"
import { notificationService } from "@/services/notificationService"
import { tableService } from "@/services/tableService"
import { bookingTableLabel, customerCanCancel, customerCanReschedule, formatBookingDate } from "@/lib/booking"
import { availabilityReasonText, formatApiError } from "@/lib/errors"
import { subscribeNotificationUpdates } from "@/services/realtime"
import { Arrow } from "@/components/UI/Arrow"
import type { Booking, Table, WaitlistEntry, NotificationItem, TableRecommendation } from "@/types/api"

export function DashboardPage() {
  const { user, refreshNotificationsCount } = useAuth()
  const [activeTab, setActiveTab] = useState<"bookings" | "waitlist" | "notifications">("bookings")

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [bookingsError, setBookingsError] = useState("")
  const [bookingDate, setBookingDate] = useState("")
  const [bookingStatus, setBookingStatus] = useState("")
  const [bookingTableId, setBookingTableId] = useState("")
  const [filterTables, setFilterTables] = useState<Table[]>([])
  const [bookingSource, setBookingSource] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailError, setDetailError] = useState("")

  // Waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [waitlistLoading, setWaitlistLoading] = useState(true)
  const [waitlistError, setWaitlistError] = useState("")

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)

  // Reschedule Modal state
  const [reschedulingBooking, setReschedulingBooking] = useState<Booking | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [rescheduleTableId, setRescheduleTableId] = useState("")
  const [rescheduleRecommendations, setRescheduleRecommendations] = useState<TableRecommendation[]>([])
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState("")

  // Cancel Modal state
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState("")

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    setBookingsError("")
    try {
      const tableId = /^[a-f\d]{24}$/i.test(bookingTableId) ? bookingTableId : undefined
      const data = await bookingService.listBookings({
        date: bookingDate || undefined,
        status: bookingStatus || undefined,
        tableId,
        source: user?.role === "STAFF" || user?.role === "ADMIN" ? bookingSource || undefined : undefined,
      })
      setBookings(data)
    } catch (err: unknown) {
      setBookingsError(formatApiError(err, "Failed to load your reservations."))
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingDate, bookingStatus, bookingTableId, bookingSource, user?.role])

  const loadWaitlist = useCallback(async () => {
    setWaitlistLoading(true)
    setWaitlistError("")
    try {
      const data = await waitlistService.listWaitlist()
      setWaitlist(data)
    } catch (err: any) {
      setWaitlistError(formatApiError(err, "Failed to load your waitlist requests."))
    } finally {
      setWaitlistLoading(false)
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    try {
      const data = await notificationService.listNotifications()
      setNotifications(data)
      refreshNotificationsCount()
    } catch (_err) {
      // ignore
    } finally {
      setNotificationsLoading(false)
    }
  }, [refreshNotificationsCount])

  useEffect(() => {
    tableService.listTables({ isActive: true }).then(setFilterTables).catch(() => setFilterTables([]))
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (activeTab === "notifications") {
      loadNotifications()
    } else if (activeTab === "waitlist") {
      loadWaitlist()
    } else {
      loadBookings()
    }
  }, [activeTab, loadBookings, loadWaitlist, loadNotifications])

  useEffect(() => subscribeNotificationUpdates(() => {
    loadNotifications()
    loadBookings()
  }), [loadBookings, loadNotifications])

  const openBooking = async (reference: string) => {
    setDetailError("")
    try {
      setSelectedBooking(await bookingService.getBooking(reference))
    } catch (error) {
      setSelectedBooking(null)
      setDetailError(formatApiError(error, "Could not load that booking."))
    }
  }

  // Open reschedule dialog
  const handleOpenReschedule = (booking: Booking) => {
    setReschedulingBooking(booking)
    setRescheduleDate(booking.date)
    setRescheduleTime(booking.startTime)
    setRescheduleTableId(booking.tableId)
    setRescheduleError("")
    fetchRescheduleTables(booking.date, booking.startTime, booking.guests)
  }

  const fetchRescheduleTables = async (date: string, time: string, guests: number) => {
    if (!date || !time) return
    try {
      const rec = await tableService.getRecommendation({ date, time, guests })
      if (rec.available && rec.recommendations) {
        setRescheduleRecommendations(rec.recommendations)
        if (rec.recommendations.length > 0 && !rec.recommendations.some((r) => r.table.id === rescheduleTableId)) {
          setRescheduleTableId(rec.recommendations[0].table.id)
        }
      } else {
        setRescheduleRecommendations([])
        setRescheduleError(availabilityReasonText(rec.reason, rec.closedReason))
      }
    } catch (error) {
      setRescheduleRecommendations([])
      setRescheduleError(formatApiError(error, "Could not rank tables for this time."))
    }
  }

  const executeReschedule = async () => {
    if (!reschedulingBooking || !rescheduleDate || !rescheduleTime || !rescheduleTableId) {
      setRescheduleError("Please choose date, time, and an available table.")
      return
    }
    setRescheduleLoading(true)
    setRescheduleError("")
    try {
      await bookingService.rescheduleBooking(reschedulingBooking.bookingReference, {
        date: rescheduleDate,
        startTime: rescheduleTime,
        tableId: rescheduleTableId,
      })
      setReschedulingBooking(null)
      loadBookings()
      loadNotifications()
    } catch (err: any) {
      setRescheduleError(formatApiError(err, "Failed to reschedule booking."))
      if (err && typeof err === "object" && "code" in err && err.code === "INVALID_BOOKING_STATE") {
        loadBookings()
      }
    } finally {
      setRescheduleLoading(false)
    }
  }

  const handleOpenCancel = (booking: Booking) => {
    setCancellingBooking(booking)
    setCancelReason("")
    setCancelError("")
  }

  const executeCancel = async () => {
    if (!cancellingBooking) return
    setCancelLoading(true)
    setCancelError("")
    try {
      await bookingService.cancelBooking(cancellingBooking.bookingReference, cancelReason)
      setCancellingBooking(null)
      loadBookings()
      loadNotifications()
    } catch (err: any) {
      setCancelError(formatApiError(err, "Failed to cancel booking."))
      if (err && typeof err === "object" && "code" in err && err.code === "INVALID_BOOKING_STATE") {
        loadBookings()
      }
    } finally {
      setCancelLoading(false)
    }
  }

  const handleCancelWaitlist = async (reference: string) => {
    if (!confirm("Are you sure you want to cancel this waitlist entry?")) return
    try {
      await waitlistService.cancelWaitlist(reference)
      loadWaitlist()
      loadNotifications()
    } catch (err: any) {
      alert(err.message || "Failed to cancel waitlist entry.")
    }
  }

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await notificationService.markNotificationRead(id)
      loadNotifications()
    } catch (_e) {
      // ignore
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead()
      loadNotifications()
    } catch (_e) {
      // ignore
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">Confirmed</span>
      case "ARRIVED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">Arrived</span>
      case "SEATED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">Seated</span>
      case "COMPLETED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-stone-200 text-stone-800 border border-stone-300">Completed</span>
      case "CANCELLED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">Cancelled</span>
      case "NO_SHOW":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 border border-gray-400">No-Show</span>
      case "WAITING":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">Waiting</span>
      case "NOTIFIED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300">Table Ready</span>
      case "CONVERTED":
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">Converted</span>
      default:
        return <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  return (
    <main id="content" className="min-h-screen bg-[var(--cream)] text-[var(--dark)] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header Banner */}
        <div className="border-b border-[var(--line)] pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--copper)]">
              Customer Portal · Sidería Iturrieta
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--forest)] mt-2">
              Kaixo, {user?.name}.
            </h1>
            <p className="text-xs text-[var(--dark)] mt-1">
              {user?.email} · Role: <strong>{user?.role}</strong> {user?.phone && `· ${user?.phone}`}
            </p>
            {user?.blacklistStatus === "BLACKLISTED" ? (
              <p className="mt-3 text-sm text-rose-950 bg-rose-50 border border-rose-300 px-3 py-2" role="status">
                This account is restricted from new reservations{user.blacklistReason ? `: ${user.blacklistReason}` : "."} Existing bookings stay in place. Contact the restaurant to review the restriction.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                loadBookings()
                loadWaitlist()
                loadNotifications()
              }}
              className="px-4 py-2 text-xs uppercase tracking-wider bg-white text-[var(--dark)] font-semibold border border-[var(--line)] hover:bg-[var(--beige)] transition-colors"
            >
              ↻ Refresh Data
            </button>
            <a href="/#book" className="btn gold text-xs uppercase tracking-wider font-bold">
              New Booking <Arrow />
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--line)] mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
              activeTab === "bookings"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                : "text-stone-700 hover:text-[var(--forest)] font-semibold"
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("waitlist")}
            className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
              activeTab === "waitlist"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                : "text-stone-700 hover:text-[var(--forest)] font-semibold"
            }`}
          >
            Waitlist Requests ({waitlist.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all relative ${
              activeTab === "notifications"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                : "text-stone-700 hover:text-[var(--forest)] font-semibold"
            }`}
          >
            Notifications
            {notifications.filter((n) => n.status === "UNREAD").length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[8px] bg-[var(--gold)] text-[var(--dark)] font-bold rounded-full">
                {notifications.filter((n) => n.status === "UNREAD").length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === "bookings" && (
          <div>
            {bookingsLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading your reservations...</p>
              </div>
            ) : bookingsError ? (
              <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs mb-6" role="alert">
                {bookingsError}
                <button type="button" className="block mt-2 underline" onClick={() => loadBookings()}>
                  Retry
                </button>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 mb-6 text-xs">
              <input type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} className="bg-white border border-[var(--line)] px-2 py-1" aria-label="Filter by date" />
              <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="bg-white border border-[var(--line)] px-2 py-1" aria-label="Filter by status">
                <option value="">All statuses</option>
                {["PENDING", "CONFIRMED", "ARRIVED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select value={bookingTableId} onChange={(event) => setBookingTableId(event.target.value)} className="bg-white border border-[var(--line)] px-2 py-1" aria-label="Filter by table">
                <option value="">All tables</option>
                {filterTables.map((table) => (
                  <option key={table.id} value={table.id}>{table.tableNumber}</option>
                ))}
              </select>
              {user?.role === "STAFF" || user?.role === "ADMIN" ? (
                <select value={bookingSource} onChange={(event) => setBookingSource(event.target.value)} className="bg-white border border-[var(--line)] px-2 py-1" aria-label="Filter by source">
                  <option value="">All sources</option>
                  {["WEBSITE", "PHONE", "WHATSAPP", "STAFF", "ADMIN"].map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              ) : null}
            </div>
            {detailError ? <p className="text-xs text-rose-700 mb-4" role="alert">{detailError}</p> : null}
            {selectedBooking ? (
              <div className="mb-6 p-4 bg-white border border-[var(--line)] text-xs">
                <p className="font-mono text-[var(--forest)] font-bold">{selectedBooking.bookingReference}</p>
                <p>{selectedBooking.date} · {selectedBooking.startTime}–{selectedBooking.endTime} · {selectedBooking.serviceName}</p>
                <p>{selectedBooking.guests} guests · {selectedBooking.status}</p>
                <p>Tables: {bookingTableLabel(selectedBooking)}</p>
                {selectedBooking.depositRequired ? (
                  <p className="mt-1 text-emerald-800 font-medium">
                    Deposit: €{(selectedBooking.depositAmount || 0).toFixed(2)} ({selectedBooking.depositStatus})
                    {selectedBooking.paymentReference ? ` · Ref: ${selectedBooking.paymentReference}` : ""}
                  </p>
                ) : null}
                <button type="button" className="mt-2 uppercase tracking-wider text-[10px] underline" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            ) : null}
            {bookingsLoading ? null : bookingsError ? null : bookings.length === 0 ? (
              <div className="p-16 text-center bg-white/60 border border-[var(--line)]">
                <p className="font-serif text-2xl text-[var(--dark)] mb-2">No reservations found.</p>
                <p className="text-xs text-gray-500 mb-6">You haven't made any table reservations yet.</p>
                <a href="/#book" className="btn gold text-xs uppercase tracking-wider">
                  Book Your Table Now <Arrow />
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bookings.map((booking) => {
                  const canCancel = customerCanCancel(booking.status)
                  const canReschedule = customerCanReschedule(booking.status)
                  return (
                    <div
                      key={booking.id || booking.bookingReference}
                      className="bg-white border border-[var(--line)] p-6 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <button
                            type="button"
                            className="font-mono text-xs font-semibold text-[var(--forest)]"
                            onClick={() => openBooking(booking.bookingReference)}
                          >
                            {booking.bookingReference}
                          </button>
                          {statusBadge(booking.status)}
                        </div>

                        <h3 className="font-serif text-2xl text-[var(--dark)] mb-1">
                          {formatBookingDate(booking.date)}
                        </h3>

                        <div className="space-y-1 text-xs text-gray-600 mb-4">
                          <p>
                            <strong>Time:</strong> {booking.startTime} – {booking.endTime} ({booking.serviceName})
                          </p>
                          <p>
                            <strong>Guests:</strong> {booking.guests} people
                          </p>
                          <p>
                            <strong>Tables:</strong> {bookingTableLabel(booking)}
                          </p>
                          {booking.notes && (
                            <p className="italic text-gray-500 mt-2 bg-stone-50 p-2 border border-stone-200">
                              "{booking.notes}"
                            </p>
                          )}
                          {booking.cancellationReason && (
                            <p className="text-xs text-rose-700 bg-rose-50 p-2 mt-2 border border-rose-200">
                              Cancellation note: {booking.cancellationReason}
                            </p>
                          )}
                          {booking.depositRequired ? (
                            <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                              <span className="text-gray-500 font-medium">Security Deposit:</span>
                              {booking.depositStatus === "PAID" ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-semibold">
                                  ✓ Paid €{(booking.depositAmount || 0).toFixed(2)}
                                </span>
                              ) : booking.depositStatus === "REFUNDED" ? (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold">
                                  Refunded €{(booking.depositAmount || 0).toFixed(2)}
                                </span>
                              ) : booking.depositStatus === "PENDING" ? (
                                <span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-[11px] font-semibold">
                                  Pending Payment (€{(booking.depositAmount || 0).toFixed(2)})
                                </span>
                              ) : (
                                <span className="text-stone-600 font-medium text-[11px]">None</span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {(canCancel || canReschedule) && (
                        <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                          {canReschedule ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(booking)}
                              className="text-xs uppercase tracking-wider font-semibold text-[var(--forest)] hover:underline"
                            >
                              Reschedule
                            </button>
                          ) : null}
                          {canCancel && canReschedule ? <span className="text-gray-300">|</span> : null}
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(booking)}
                              className="text-xs uppercase tracking-wider font-semibold text-[var(--copper)] hover:underline"
                            >
                              Cancel Reservation
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WAITLIST */}
        {activeTab === "waitlist" && (
          <div>
            {waitlistLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading waitlist entries...</p>
              </div>
            ) : waitlistError ? (
              <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-xs mb-6">
                {waitlistError}
              </div>
            ) : waitlist.length === 0 ? (
              <div className="p-16 text-center bg-white/60 border border-[var(--line)]">
                <p className="font-serif text-2xl text-[var(--dark)] mb-2">No active waitlist requests.</p>
                <p className="text-xs text-gray-500">
                  When a desired slot is fully booked, you can join the queue and we will notify you when a table opens.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {waitlist.map((entry) => (
                  <div
                    key={entry.id || entry.waitlistReference}
                    className="bg-white border border-[var(--line)] p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono text-xs font-semibold text-[var(--forest)]">
                          {entry.waitlistReference}
                        </span>
                        {statusBadge(entry.status)}
                      </div>

                      <h3 className="font-serif text-2xl text-[var(--dark)] mb-1">
                        {formatBookingDate(entry.date)}
                      </h3>

                      <div className="space-y-1 text-xs text-gray-600 mb-4">
                        <p>
                          <strong>Requested Time:</strong> {entry.requestedStartTime} ({entry.serviceName})
                        </p>
                        <p>
                          <strong>Party Size:</strong> {entry.guests} guests
                        </p>
                        {entry.notes && (
                          <p className="italic text-gray-500 mt-2 bg-stone-50 p-2 border border-stone-200">
                            "{entry.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {(entry.status === "WAITING" || entry.status === "NOTIFIED") && (
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-stone-600 font-medium">
                          Created {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCancelWaitlist(entry.waitlistReference)}
                          className="text-xs uppercase tracking-wider font-bold text-rose-700 hover:text-rose-900 hover:underline"
                        >
                          Cancel Waitlist
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs text-gray-500">
                In-app notices about your reservations and waitlist status updates.
              </p>
              {notifications.some((n) => n.status === "UNREAD") && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-[var(--forest)] hover:underline font-semibold uppercase tracking-wider"
                >
                  Mark All Read
                </button>
              )}
            </div>

            {notificationsLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-16 text-center bg-white/60 border border-[var(--line)]">
                <p className="font-serif text-2xl text-[var(--dark)] mb-2">No notifications.</p>
                <p className="text-xs text-gray-500">All updates and reminders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.status === "UNREAD") handleMarkNotificationRead(item.id)
                    }}
                    className={`p-4 border transition-colors flex items-start justify-between cursor-pointer ${
                      item.status === "UNREAD"
                        ? "bg-amber-50/70 border-amber-300 shadow-sm"
                        : "bg-white border-[var(--line)] opacity-80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-[var(--forest)]">
                          {item.title}
                        </span>
                        {item.status === "UNREAD" && (
                          <span className="px-1.5 py-0.2 text-[8px] uppercase tracking-wider bg-[var(--gold)] text-[var(--dark)] font-bold rounded">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700">{item.message}</p>
                      {item.bookingReference && (
                        <p className="text-[10px] font-mono text-gray-500 mt-1">
                          Booking ref: {item.bookingReference}
                        </p>
                      )}
                      {item.waitlistReference && (
                        <p className="text-[10px] font-mono text-gray-500 mt-1">
                          Waitlist ref: {item.waitlistReference}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-600 font-medium whitespace-nowrap ml-4">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RESCHEDULE MODAL */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--cream)] border border-[var(--line)] p-8 max-w-lg w-full shadow-2xl">
            <h3 className="font-serif text-2xl text-[var(--dark)] mb-2">
              Reschedule Reservation
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Current tables: {bookingTableLabel(reschedulingBooking)}. The server stores the one table you choose here and recalculates the end time and service.
            </p>
            <p className="text-xs text-gray-600 mb-6">
              Reference: <strong className="font-mono">{reschedulingBooking.bookingReference}</strong> · Party of {reschedulingBooking.guests}
            </p>

            {rescheduleError && (
              <div className="p-3 bg-red-100 text-red-800 text-xs mb-4">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value)
                    fetchRescheduleTables(e.target.value, rescheduleTime, reschedulingBooking.guests)
                  }}
                  className="w-full bg-white border border-[var(--line)] p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">
                  New Time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => {
                    setRescheduleTime(e.target.value)
                    fetchRescheduleTables(rescheduleDate, e.target.value, reschedulingBooking.guests)
                  }}
                  className="w-full bg-white border border-[var(--line)] p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">
                  Select Available Table
                </label>
                {rescheduleRecommendations.length === 0 ? (
                  <p className="text-gray-500 italic p-2 bg-white/60 border border-[var(--line)]">
                    No available tables for this slot. Choose another time or date.
                  </p>
                ) : (
                  <select
                    value={rescheduleTableId}
                    onChange={(e) => setRescheduleTableId(e.target.value)}
                    className="w-full bg-white border border-[var(--line)] p-2 text-sm"
                  >
                    {rescheduleRecommendations.map((r) => (
                      <option key={r.table.id} value={r.table.id}>
                        {r.table.tableNumber} ({r.table.capacity}p, {r.table.location}) - Score: {r.score}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReschedulingBooking(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-stone-700 font-semibold border border-[var(--line)] bg-white hover:bg-[var(--beige)] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                disabled={rescheduleLoading || !rescheduleTableId}
                onClick={executeReschedule}
                className="btn gold text-xs uppercase tracking-wider font-bold disabled:opacity-50"
              >
                {rescheduleLoading ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[var(--cream)] border border-[var(--line)] p-8 max-w-md w-full shadow-2xl">
            <h3 className="font-serif text-2xl text-[var(--dark)] mb-2">
              Cancel Reservation
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Are you sure you want to cancel booking <strong>{cancellingBooking.bookingReference}</strong> for{" "}
              {formatBookingDate(cancellingBooking.date)} at {cancellingBooking.startTime}?
            </p>

            {cancellingBooking.depositStatus === "PAID" ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-4 rounded">
                <span className="font-semibold">Deposit Refund Policy:</span>
                <p className="mt-1">
                  A deposit of €{(cancellingBooking.depositAmount || 0).toFixed(2)} was paid for this booking.
                  Cancellations more than 24 hours in advance will be automatically refunded to your original payment method.
                </p>
              </div>
            ) : null}

            {cancelError && (
              <div className="p-3 bg-red-100 text-red-800 text-xs mb-4">
                {cancelError}
              </div>
            )}

            <label className="block text-[9px] uppercase tracking-widest text-gray-600 mb-1">
              Reason for cancellation (optional)
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Change of plans"
              className="w-full bg-white border border-[var(--line)] p-2 text-xs mb-6 h-20"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-stone-700 font-semibold border border-[var(--line)] bg-white hover:bg-[var(--beige)] transition-colors"
              >
                Nevermind
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={executeCancel}
                className="px-4 py-2 bg-rose-700 text-white text-xs uppercase tracking-widest font-semibold hover:bg-rose-800 disabled:opacity-50 transition-colors shadow-sm"
              >
                {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
