import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { tableService } from "@/services/tableService"
import { bookingService } from "@/services/bookingService"
import { waitlistService } from "@/services/waitlistService"
import { scheduleService } from "@/services/scheduleService"
import { adminService } from "@/services/adminService"
import { bookingTableLabel } from "@/lib/booking"
import { formatApiError } from "@/lib/errors"
import { subscribeFloorUpdates } from "@/services/realtime"
import { FloorPlanEditor } from "./FloorPlanEditor"
import type {
  LiveFloorData,
  LiveTable,
  Booking,
  WaitlistEntry,
  Table,
  DaySchedule,
  ClosedDay,
  AdminJobStatus,
  TableStatus,
  ServiceWindow,
} from "@/types/api"

export function OperationsPage() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<"floor" | "bookings" | "waitlist" | "tables" | "schedule">("floor")

  // Live Floor State
  const [liveFloor, setLiveFloor] = useState<LiveFloorData | null>(null)
  const [floorLoading, setFloorLoading] = useState(true)

  // Bookings State
  const [allBookings, setAllBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingFilterDate, setBookingFilterDate] = useState("")
  const [bookingFilterStatus, setBookingFilterStatus] = useState("")
  const [bookingFilterTableId, setBookingFilterTableId] = useState("")
  const [bookingFilterSource, setBookingFilterSource] = useState("")
  const [floorError, setFloorError] = useState("")
  const [bookingsError, setBookingsError] = useState("")
  const [waitlistError, setWaitlistError] = useState("")
  const [inactiveTables, setInactiveTables] = useState<Table[]>([])
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [positionDrafts, setPositionDrafts] = useState<
    Record<string, { x: number; y: number; rotation: number }>
  >({})
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [dayForm, setDayForm] = useState<{ isOpen: boolean; services: ServiceWindow[] }>({
    isOpen: false,
    services: [],
  })
  const [dayFormError, setDayFormError] = useState("")
  const [closedLookup, setClosedLookup] = useState("")
  const [closedLookupResult, setClosedLookupResult] = useState<ClosedDay | null>(null)

  // Waitlist State
  const [allWaitlists, setAllWaitlists] = useState<WaitlistEntry[]>([])
  const [waitlistLoading, setWaitlistLoading] = useState(false)

  // Tables State (Admin)
  const [tablesList, setTablesList] = useState<Table[]>([])
  const [showCreateTableModal, setShowCreateTableModal] = useState(false)
  const [newTableNumber, setNewTableNumber] = useState("")
  const [newTableName, setNewTableName] = useState("")
  const [newTableCapacity, setNewTableCapacity] = useState(4)
  const [newTableShape, setNewTableShape] = useState<"ROUND" | "SQUARE" | "RECTANGLE">("SQUARE")
  const [newTableLocation, setNewTableLocation] = useState<"WINDOW" | "BAR" | "CENTER" | "PRIVATE" | "OUTDOOR">("CENTER")
  const [newTablePosX, setNewTablePosX] = useState(100)
  const [newTablePosY, setNewTablePosY] = useState(100)
  const [tableModalError, setTableModalError] = useState("")

  // Schedules & Closed Days (Admin)
  const [weeklySchedules, setWeeklySchedules] = useState<DaySchedule[]>([])
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([])
  const [newClosedDate, setNewClosedDate] = useState("")
  const [newClosedReason, setNewClosedReason] = useState("")
  const [jobStatus, setJobStatus] = useState<AdminJobStatus | null>(null)

  // Operational feedback toast
  const [notice, setNotice] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  // Load live floor
  const loadLiveFloor = useCallback(async () => {
    setFloorLoading(true)
    try {
      const data = await tableService.getLiveFloor()
      setLiveFloor(data)
      setFloorError("")
      try {
        const tables = await tableService.listTables({ isActive: true })
        setNoteDrafts((current) => {
          const next = { ...current }
          tables.forEach((table) => {
            if (next[table.id] === undefined) next[table.id] = table.notes || ""
          })
          return next
        })
      } catch (_notesError) {
        // The live floor is already shown. Notes stay editable once the catalog responds.
      }
    } catch (err: unknown) {
      setFloorError(formatApiError(err, "Failed to load live floor"))
    } finally {
      setFloorLoading(false)
    }
  }, [])

  // Load bookings
  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const data = await bookingService.listBookings({
        date: bookingFilterDate || undefined,
        status: bookingFilterStatus || undefined,
        tableId: bookingFilterTableId || undefined,
        source: bookingFilterSource || undefined,
      })
      setAllBookings(data)
      setBookingsError("")
    } catch (err: unknown) {
      setBookingsError(formatApiError(err, "Failed to load bookings"))
    } finally {
      setBookingsLoading(false)
    }
  }, [bookingFilterDate, bookingFilterStatus, bookingFilterTableId, bookingFilterSource])

  // Load waitlist
  const loadWaitlists = useCallback(async () => {
    setWaitlistLoading(true)
    try {
      const data = await waitlistService.listWaitlist()
      setAllWaitlists(data)
      setWaitlistError("")
    } catch (err: any) {
      setWaitlistError(formatApiError(err, "Failed to load waitlist"))
    } finally {
      setWaitlistLoading(false)
    }
  }, [])

  // Load tables & admin data
  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return
    try {
      const [t, inactive, s, c, j] = await Promise.all([
        tableService.listTables({ isActive: true }),
        tableService.listTables({ isActive: false }),
        scheduleService.getWeeklySchedule(),
        scheduleService.listClosedDays(),
        adminService.getJobStatus().catch(() => null),
      ])
      setTablesList(t)
      setInactiveTables(inactive)
      setWeeklySchedules(s)
      setClosedDays(c)
      setJobStatus(j)
    } catch (_e) {
      // ignore
    }
  }, [isAdmin])

  useEffect(() => {
    loadLiveFloor()
  }, [loadLiveFloor])

  useEffect(() => subscribeFloorUpdates(() => {
    loadLiveFloor()
    loadBookings()
    loadWaitlists()
  }), [loadLiveFloor, loadBookings, loadWaitlists])

  useEffect(() => {
    if (activeTab === "bookings") loadBookings()
    if (activeTab === "waitlist") loadWaitlists()
    if (activeTab === "tables" || activeTab === "schedule") loadAdminData()
  }, [activeTab, loadBookings, loadWaitlists, loadAdminData])

  // Table Status Update
  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    try {
      await tableService.updateTableStatus(tableId, status)
      showNotice(`Table status updated to ${status}`)
      loadLiveFloor()
    } catch (err: any) {
      showNotice(formatApiError(err, "Failed to update table status"))
    }
  }

  // Booking lifecycle transitions
  const handleBookingAction = async (
    reference: string,
    action: "arrive" | "seat" | "complete" | "no-show" | "cancel"
  ) => {
    try {
      if (action === "arrive") await bookingService.arriveBooking(reference)
      if (action === "seat") await bookingService.seatBooking(reference)
      if (action === "complete") await bookingService.completeBooking(reference)
      if (action === "no-show") await bookingService.markNoShow(reference)
      if (action === "cancel") {
        const reason = prompt("Enter reason for cancellation (optional):") ?? undefined
        await bookingService.cancelBooking(reference, reason)
      }
      showNotice(`Booking ${reference} updated: ${action.toUpperCase()}`)
      loadBookings()
      loadLiveFloor()
    } catch (err: any) {
      showNotice(formatApiError(err, "Failed to update booking status"))
      if (err && typeof err === "object" && "code" in err && err.code === "INVALID_BOOKING_STATE") {
        loadBookings()
      }
    }
  }

  // Waitlist actions
  const handleWaitlistAction = async (reference: string, action: "notify" | "convert" | "expire") => {
    try {
      if (action === "notify") await waitlistService.notifyWaitlist(reference)
      if (action === "convert") await waitlistService.convertWaitlist(reference)
      if (action === "expire") await waitlistService.expireWaitlist(reference)
      showNotice(`Waitlist ${reference} updated: ${action.toUpperCase()}`)
      loadWaitlists()
    } catch (err: any) {
      showNotice(formatApiError(err, "Failed to update waitlist entry"))
    }
  }

  // Create table
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault()
    setTableModalError("")
    try {
      await tableService.createTable({
        tableNumber: newTableNumber.toUpperCase().trim(),
        name: newTableName.trim() || undefined,
        capacity: Number(newTableCapacity),
        shape: newTableShape,
        location: newTableLocation,
        position: { x: Number(newTablePosX), y: Number(newTablePosY), rotation: 0 },
        tags: [newTableLocation.toLowerCase()],
      })
      setShowCreateTableModal(false)
      setNewTableNumber("")
      setNewTableName("")
      showNotice("New table created successfully")
      loadAdminData()
      loadLiveFloor()
    } catch (err: any) {
      setTableModalError(formatApiError(err, "Failed to create table"))
    }
  }

  // Deactivate table
  const handleDeactivateTable = async (tableId: string) => {
    if (!confirm("Are you sure you want to deactivate this table?")) return
    try {
      await tableService.deactivateTable(tableId)
      showNotice("Table deactivated")
      loadAdminData()
      loadLiveFloor()
    } catch (err: any) {
      showNotice(formatApiError(err, "Failed to deactivate table"))
    }
  }

  // Create Closed Day
  const handleCreateClosedDay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClosedDate || newClosedReason.trim().length < 2) {
      showNotice("VALIDATION_ERROR — A closed day needs a reason of at least 2 characters.")
      return
    }
    try {
      await scheduleService.createClosedDay({
        date: newClosedDate,
        reason: newClosedReason.trim(),
      })
      setNewClosedDate("")
      setNewClosedReason("")
      showNotice("Closed day added")
      loadAdminData()
    } catch (err: any) {
      showNotice(formatApiError(err, "Failed to add closed day"))
    }
  }

  const handleDeactivateClosedDay = async (id?: string) => {
    if (!id) return
    try {
      await scheduleService.updateClosedDay(id, { isActive: false })
      showNotice("Closed day deactivated")
      loadAdminData()
    } catch (err: unknown) {
      showNotice(formatApiError(err, "Failed to update the closed day"))
    }
  }

  const handleLookupClosedDay = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setClosedLookupResult(await scheduleService.getClosedDay(closedLookup))
    } catch (err: unknown) {
      setClosedLookupResult(null)
      showNotice(formatApiError(err, "Closed day not found"))
    }
  }

  const handleReactivateTable = async (tableId: string) => {
    try {
      await tableService.updateTable(tableId, { isActive: true })
      showNotice("Table reactivated")
      loadAdminData()
      loadLiveFloor()
    } catch (err: unknown) {
      showNotice(formatApiError(err, "Failed to reactivate table"))
    }
  }

  const handleSaveNotes = async (tableId: string) => {
    try {
      await tableService.updateTable(tableId, { notes: noteDrafts[tableId] || "" })
      showNotice("Table notes saved")
      loadLiveFloor()
    } catch (err: unknown) {
      showNotice(formatApiError(err, "Failed to save notes"))
    }
  }

  const handleSavePosition = async (table: LiveTable) => {
    const position = positionDrafts[table.id] || table.position
    try {
      await tableService.updateTablePosition(table.id, position)
      showNotice("Table position saved")
      loadLiveFloor()
    } catch (err: unknown) {
      showNotice(formatApiError(err, "Failed to save position"))
    }
  }

  const openDayEditor = async (day: string) => {
    setDayFormError("")
    try {
      const schedule = await scheduleService.getDaySchedule(day)
      setEditingDay(day)
      setDayForm({
        isOpen: Boolean(schedule.isOpen),
        services: schedule.services || [],
      })
    } catch (err: unknown) {
      setDayFormError(formatApiError(err, "Failed to load that day"))
    }
  }

  const saveDayEditor = async () => {
    if (!editingDay) return
    setDayFormError("")
    try {
      await scheduleService.saveDaySchedule(editingDay, dayForm)
      setEditingDay(null)
      showNotice("Schedule saved")
      loadAdminData()
    } catch (err: unknown) {
      setDayFormError(formatApiError(err, "Failed to save the schedule"))
    }
  }

  const operationalStateBadge = (state: LiveTable["operationalState"]) => {
    switch (state) {
      case "AVAILABLE":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 rounded">Available</span>
      case "BOOKED":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 rounded">Booked</span>
      case "ARRIVED":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 rounded">Arrived</span>
      case "SEATED":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 rounded">Seated</span>
      case "UPCOMING":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 rounded">Upcoming</span>
      case "CLEANING":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 rounded">Cleaning</span>
      case "OUT_OF_SERVICE":
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 rounded">Out of Service</span>
      default:
        return <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 rounded">{state}</span>
    }
  }

  return (
    <main id="content" className="min-h-screen bg-[var(--cream)] text-[var(--dark)] pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <div className="border-b border-[var(--line)] pb-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--copper)]">
              TXOTX OS Operations · Staff & Admin Console
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--forest)] mt-1">
              Floor & Service Operations
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Operator: <strong>{user?.name}</strong> · Role: <strong className="text-[var(--forest)]">{user?.role}</strong>
              {liveFloor && (
                <> · Business Date: <strong>{liveFloor.date}</strong> · Clock: <strong>{liveFloor.currentTime}</strong></>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                loadLiveFloor()
                if (activeTab === "bookings") loadBookings()
                if (activeTab === "waitlist") loadWaitlists()
                if (activeTab === "tables" || activeTab === "schedule") loadAdminData()
                showNotice("Data refreshed from backend")
              }}
              className="px-4 py-2 text-xs uppercase tracking-wider bg-white text-[var(--dark)] font-bold border border-[var(--line)] hover:bg-[var(--beige)] transition-colors"
            >
              ↻ Refresh All
            </button>
          </div>
        </div>

        {/* Global Notice Toast */}
        {notice && (
          <div className="mb-6 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold">
            {notice}
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex flex-wrap border-b border-[var(--line)] mb-8">
          <button
            type="button"
            onClick={() => setActiveTab("floor")}
            className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
              activeTab === "floor"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                : "text-stone-700 hover:text-[var(--forest)] font-semibold"
            }`}
          >
            Live Floor Plan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
              activeTab === "bookings"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                : "text-stone-700 hover:text-[var(--forest)] font-semibold"
            }`}
          >
            Bookings Operations
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
            Waitlist Queue
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("tables")}
                className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
                  activeTab === "tables"
                    ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                    : "text-stone-700 hover:text-[var(--forest)] font-semibold"
                }`}
              >
                Table Catalog
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`py-3 px-6 text-xs uppercase tracking-widest font-semibold transition-all ${
                  activeTab === "schedule"
                    ? "border-b-2 border-[var(--forest)] text-[var(--forest)] bg-white/40"
                    : "text-stone-700 hover:text-[var(--forest)] font-semibold"
                }`}
              >
                Schedules & Jobs
              </button>
            </>
          )}
        </div>

        {/* TAB 1: LIVE FLOOR */}
        {activeTab === "floor" && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 p-4 bg-white/70 border border-[var(--line)]">
              <div>
                <h3 className="font-serif text-xl text-[var(--forest)]">Restaurant Floor Status</h3>
                <p className="text-xs text-gray-500">
                  Operational state derived from active table status and today's reservations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Booked
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 border border-blue-300">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Arrived
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-300">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Seated
                </span>
                <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 border border-yellow-300">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" /> Cleaning
                </span>
              </div>
            </div>

            <FloorPlanEditor />

            {liveFloor ? (
              <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[10px] uppercase tracking-wider text-[var(--dark)]">
                {([
                  ["Free", "AVAILABLE"],
                  ["Reserved", "BOOKED"],
                  ["Arrived", "ARRIVED"],
                  ["Seated", "SEATED"],
                  ["Upcoming", "UPCOMING"],
                  ["Cleaning", "CLEANING"],
                  ["Out of service", "OUT_OF_SERVICE"],
                ] as const).map(([label, state]) => (
                  <p key={state} className="border border-[var(--line)] bg-white px-2 py-2">
                    {label}
                    <span className="block font-serif text-2xl normal-case tracking-normal text-[var(--forest)]">
                      {liveFloor.tables.filter((table) => table.operationalState === state).length}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}

            {floorError ? (
              <p className="mb-4 text-xs text-rose-700" role="alert">
                {floorError}
                <button type="button" className="block mt-2 underline" onClick={() => loadLiveFloor()}>Retry</button>
              </p>
            ) : null}
            {floorLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading live floor...</p>
              </div>
            ) : liveFloor?.tables.length === 0 ? (
              <p className="text-xs text-gray-500">No active tables found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {liveFloor?.tables.map((table) => (
                  <div
                    key={table.id}
                    className="bg-white border border-[var(--line)] p-4 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-serif text-2xl font-bold text-[var(--dark)]">
                          {table.tableNumber}
                        </span>
                        {operationalStateBadge(table.operationalState)}
                      </div>

                      <p className="text-xs text-gray-500 mt-1">
                        Capacity: <strong>{table.capacity} guests</strong> · {table.location} ({table.shape.toLowerCase()})
                      </p>

                      {table.currentBooking ? (
                        <div className="mt-3 p-2 bg-blue-50/80 border border-blue-200 text-xs">
                          <p className="font-mono text-[10px] text-blue-900 font-semibold">
                            Current: {table.currentBooking.bookingReference}
                          </p>
                          <p className="text-blue-800 text-[11px]">
                            {table.currentBooking.startTime} – {table.currentBooking.endTime} ({table.currentBooking.guests}p)
                          </p>
                          <p className="text-[10px] font-bold uppercase text-blue-950">
                            Status: {table.currentBooking.status}
                            {(table.currentBooking.tableCount || 0) > 1 ? ` · Group · ${table.currentBooking.tableCount} tables` : ""}
                          </p>
                        </div>
                      ) : table.nextBooking ? (
                        <div className="mt-3 p-2 bg-stone-50 border border-stone-200 text-xs">
                          <p className="text-[10px] text-gray-500 font-semibold">
                            Next: {table.nextBooking.startTime} ({table.nextBooking.guests} guests)
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 text-[10px] text-emerald-700 bg-emerald-50/50">
                          No overlapping bookings today
                        </div>
                      )}
                    </div>

                    {/* Quick Physical Status Change */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-[9px] uppercase tracking-wider text-stone-700 font-bold">
                        Physical:
                      </span>
                      <select
                        value={table.tableStatus}
                        onChange={(e) =>
                          handleUpdateTableStatus(table.id, e.target.value as TableStatus)
                        }
                        className="bg-[var(--cream)] border border-[var(--line)] px-2 py-1 text-[10px] font-semibold text-[var(--dark)]"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="RESERVED">RESERVED</option>
                        <option value="OCCUPIED">OCCUPIED</option>
                        <option value="CLEANING">CLEANING</option>
                        <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
                      </select>
                    </div>
                    <form
                      className="mt-3 space-y-2 text-[10px]"
                      onSubmit={(event) => {
                        event.preventDefault()
                        handleSaveNotes(table.id)
                      }}
                    >
                      <label className="block uppercase tracking-wider text-stone-700 font-bold">
                        Notes
                        <textarea
                          value={noteDrafts[table.id] ?? ""}
                          onChange={(event) =>
                            setNoteDrafts((current) => ({ ...current, [table.id]: event.target.value }))
                          }
                          className="mt-1 w-full bg-[var(--cream)] border border-[var(--line)] p-1 text-xs"
                        />
                      </label>
                      <button type="submit" className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] rounded-xs transition-colors shadow-xs">
                        Save notes
                      </button>
                    </form>
                    <form
                      className="mt-2 grid grid-cols-3 gap-1 text-[10px]"
                      onSubmit={(event) => {
                        event.preventDefault()
                        handleSavePosition(table)
                      }}
                    >
                      {(["x", "y", "rotation"] as const).map((field) => (
                        <label key={field} className="uppercase tracking-wider text-stone-700 font-bold">
                          {field}
                          <input
                            type="number"
                            value={(positionDrafts[table.id] || table.position)[field]}
                            onChange={(event) =>
                              setPositionDrafts((current) => ({
                                ...current,
                                [table.id]: {
                                  ...(current[table.id] || table.position),
                                  [field]: Number(event.target.value),
                                },
                              }))
                            }
                            className="mt-1 w-full bg-[var(--cream)] border border-[var(--line)] p-1"
                          />
                        </label>
                      ))}
                      <button type="submit" className="col-span-3 px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-white text-[var(--forest)] hover:bg-[var(--beige)] border border-[var(--line)] rounded-xs transition-colors">
                        Save position
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKINGS OPERATIONS */}
        {activeTab === "bookings" && (
          <div>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white/70 border border-[var(--line)]">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                  Filter Date
                </label>
                <input
                  type="date"
                  value={bookingFilterDate}
                  onChange={(e) => setBookingFilterDate(e.target.value)}
                  className="bg-white border border-[var(--line)] px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                  Filter Status
                </label>
                <select
                  value={bookingFilterStatus}
                  onChange={(e) => setBookingFilterStatus(e.target.value)}
                  className="bg-white border border-[var(--line)] px-3 py-1.5 text-xs"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="ARRIVED">ARRIVED</option>
                  <option value="SEATED">SEATED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="NO_SHOW">NO_SHOW</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                  Table
                </label>
                <select
                  value={bookingFilterTableId}
                  onChange={(e) => setBookingFilterTableId(e.target.value)}
                  className="bg-white border border-[var(--line)] px-3 py-1.5 text-xs"
                  aria-label="Filter by table"
                >
                  <option value="">All tables</option>
                  {(liveFloor?.tables || []).map((table) => (
                    <option key={table.id} value={table.id}>{table.tableNumber}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                  Source
                </label>
                <select
                  value={bookingFilterSource}
                  onChange={(e) => setBookingFilterSource(e.target.value)}
                  className="bg-white border border-[var(--line)] px-3 py-1.5 text-xs"
                >
                  <option value="">All sources</option>
                  {["WEBSITE", "PHONE", "WHATSAPP", "STAFF", "ADMIN"].map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {(bookingFilterDate || bookingFilterStatus || bookingFilterTableId || bookingFilterSource) && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingFilterDate("")
                    setBookingFilterStatus("")
                    setBookingFilterTableId("")
                    setBookingFilterSource("")
                  }}
                  className="text-xs text-[var(--copper)] hover:underline mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {bookingsError ? (
              <p className="mb-4 text-xs text-rose-950" role="alert">
                {bookingsError}
                <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={() => loadBookings()}>Retry</button>
              </p>
            ) : null}
            {bookingsLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading bookings...</p>
              </div>
            ) : allBookings.length === 0 ? (
              <div className="p-12 text-center bg-white/60 border border-[var(--line)]">
                <p className="font-serif text-xl">No bookings match the filter criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-[var(--line)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--forest)] text-white uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Guests</th>
                      <th className="p-3">Table</th>
                      <th className="p-3">Deposit</th>
                      <th className="p-3">Source</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allBookings.map((b) => (
                      <tr key={b.id || b.bookingReference} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-semibold text-[var(--forest)]">
                          {b.bookingReference}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold">{b.date}</p>
                          <p className="text-[10px] text-gray-500">
                            {b.startTime} – {b.endTime}
                          </p>
                        </td>
                        <td className="p-3 font-semibold">{b.guests}p</td>
                        <td className="p-3 text-[var(--dark)]">
                          {bookingTableLabel(b)}
                          {(b.tables?.length || 0) > 1 ? (
                            <span className="block mt-1 text-[10px] uppercase tracking-wider text-[var(--forest)]">Group · {b.tables?.length} tables</span>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {b.depositRequired ? (
                            b.depositStatus === "PAID" ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
                                Paid €{(b.depositAmount || 0).toFixed(2)}
                              </span>
                            ) : b.depositStatus === "REFUNDED" ? (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-amber-100 text-amber-800">
                                Refunded
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-yellow-100 text-yellow-800">
                                Pending €{(b.depositAmount || 0).toFixed(2)}
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-stone-600 font-medium">—</span>
                          )}
                        </td>
                        <td className="p-3 text-[10px] text-gray-500 uppercase">{b.source}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-gray-100">
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {b.status === "CONFIRMED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "arrive")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Arrive
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "no-show")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-gray-600 text-white hover:bg-gray-700"
                              >
                                No-Show
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "cancel")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-rose-600 text-white hover:bg-rose-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {b.status === "ARRIVED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "seat")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-purple-600 text-white hover:bg-purple-700"
                              >
                                Seat
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "no-show")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-gray-600 text-white hover:bg-gray-700"
                              >
                                No-Show
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "cancel")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-rose-600 text-white hover:bg-rose-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {b.status === "SEATED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "complete")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Complete
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBookingAction(b.bookingReference, "cancel")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-rose-600 text-white hover:bg-rose-700"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WAITLIST QUEUE */}
        {activeTab === "waitlist" && (
          <div>
            {waitlistError ? (
              <p className="mb-4 text-xs text-rose-950" role="alert">
                {waitlistError}
                <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={() => loadWaitlists()}>Retry</button>
              </p>
            ) : null}
            {waitlistLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs uppercase tracking-wider text-gray-500">Loading waitlist...</p>
              </div>
            ) : allWaitlists.length === 0 ? (
              <div className="p-12 text-center bg-white/60 border border-[var(--line)]">
                <p className="font-serif text-xl">The waitlist is currently empty.</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white border border-[var(--line)]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--forest)] text-white uppercase text-[9px] tracking-wider">
                    <tr>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Party Size</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allWaitlists.map((w) => (
                      <tr key={w.id || w.waitlistReference} className="hover:bg-gray-50">
                        <td className="p-3 font-mono font-semibold text-[var(--forest)]">
                          {w.waitlistReference}
                        </td>
                        <td className="p-3">
                          <p className="font-semibold">{w.date}</p>
                          <p className="text-[10px] text-gray-500">{w.requestedStartTime}</p>
                        </td>
                        <td className="p-3 font-semibold">{w.guests} guests</td>
                        <td className="p-3 text-gray-600 italic">{w.notes || "—"}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded bg-amber-100 text-amber-900">
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {w.status === "WAITING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleWaitlistAction(w.waitlistReference, "notify")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Notify Customer
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWaitlistAction(w.waitlistReference, "expire")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-gray-500 text-white hover:bg-gray-600"
                              >
                                Expire
                              </button>
                            </>
                          )}

                          {w.status === "NOTIFIED" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleWaitlistAction(w.waitlistReference, "convert")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Mark Converted
                              </button>
                              <button
                                type="button"
                                onClick={() => handleWaitlistAction(w.waitlistReference, "expire")}
                                className="px-2 py-1 text-[10px] uppercase font-semibold bg-gray-500 text-white hover:bg-gray-600"
                              >
                                Expire
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TABLE CATALOG (ADMIN) */}
        {activeTab === "tables" && isAdmin && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-2xl text-[var(--forest)]">Tables Catalog</h3>
              <button
                type="button"
                onClick={() => setShowCreateTableModal(true)}
                className="btn gold text-xs uppercase tracking-wider"
              >
                + Add New Table
              </button>
            </div>

            <div className="overflow-x-auto bg-white border border-[var(--line)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--forest)] text-white uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="p-3">Table #</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3">Shape</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Position</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tablesList.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-[var(--forest)]">{t.tableNumber}</td>
                      <td className="p-3 text-gray-700">{t.name || "—"}</td>
                      <td className="p-3 font-semibold">{t.capacity} guests</td>
                      <td className="p-3 uppercase text-[10px]">{t.shape}</td>
                      <td className="p-3 uppercase text-[10px]">{t.location}</td>
                      <td className="p-3 font-mono text-[10px] text-gray-500">
                        x:{t.position.x}, y:{t.position.y}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeactivateTable(t.id)}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white border border-rose-300 rounded transition-colors"
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {inactiveTables.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-xl text-[var(--forest)] mb-3">Deactivated tables</h3>
                <ul className="bg-white border border-[var(--line)] divide-y text-xs">
                  {inactiveTables.map((table) => (
                    <li key={table.id} className="p-3 flex justify-between items-center">
                      <span className="font-bold text-[var(--dark)]">{table.tableNumber}</span>
                      <button
                        type="button"
                        className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-300 rounded transition-colors"
                        onClick={() => handleReactivateTable(table.id)}
                      >
                        Reactivate
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SCHEDULES & CLOSED DAYS & JOBS (ADMIN) */}
        {activeTab === "schedule" && isAdmin && (
          <div className="space-y-8">
            {/* Weekly Hours */}
            <div>
              <h3 className="font-serif text-2xl text-[var(--forest)] mb-4">Weekly Schedule Hours</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {weeklySchedules.map((day) => (
                  <div key={day.dayOfWeek} className="bg-white border border-[var(--line)] p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs uppercase text-[var(--forest)]">
                        {day.dayOfWeek}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 font-bold ${
                          day.isConfigured === false
                            ? "bg-stone-100 text-stone-600"
                            : day.isOpen
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {day.isConfigured === false ? "NOT CONFIGURED" : day.isOpen ? "OPEN" : "CLOSED"}
                      </span>
                    </div>
                    {(day.services || []).length > 0 ? (
                      day.services?.map((s) => (
                        <div key={s.name} className="text-xs text-gray-600 border-t border-gray-100 pt-2 mt-2">
                          <p className="font-semibold">{s.name}</p>
                          <p>{s.startTime} – {s.endTime} (last: {s.lastBookingTime})</p>
                          <p className="text-[10px] text-gray-500">Duration: {s.bookingDurationMinutes}m · Max: {s.maxGuestsPerBooking}p</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-stone-600 font-medium italic">
                        {day.isConfigured === false ? "SCHEDULE_NOT_CONFIGURED" : "No services configured."}
                      </p>
                    )}
                    <button type="button" className="mt-3 text-[10px] uppercase tracking-wider text-[var(--forest)] font-bold underline hover:text-[var(--dark)]" onClick={() => openDayEditor(day.dayOfWeek)}>
                      Edit day
                    </button>
                  </div>
                ))}
              </div>
              {editingDay && (
                <form
                  className="mt-6 bg-white border border-[var(--line)] p-4 space-y-3 text-xs"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveDayEditor()
                  }}
                >
                  <h4 className="font-serif text-xl">Edit {editingDay}</h4>
                  {dayFormError ? <p className="text-rose-700" role="alert">{dayFormError}</p> : null}
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={dayForm.isOpen}
                      onChange={(event) => setDayForm((current) => ({ ...current, isOpen: event.target.checked }))}
                    />
                    Open
                  </label>
                  {dayForm.services.map((service, index) => (
                    <div key={`${editingDay}-${index}`} className="grid grid-cols-2 md:grid-cols-3 gap-2 border-t pt-2">
                      {(["name", "startTime", "endTime", "lastBookingTime"] as const).map((field) => (
                        <label key={field} className="uppercase text-[9px] tracking-wider text-gray-500">
                          {field}
                          <input
                            value={service[field]}
                            onChange={(event) =>
                              setDayForm((current) => ({
                                ...current,
                                services: current.services.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, [field]: event.target.value } : item
                                ),
                              }))
                            }
                            className="mt-1 w-full border border-[var(--line)] p-1"
                          />
                        </label>
                      ))}
                      <label className="uppercase text-[9px] tracking-wider text-gray-500">
                        Duration
                        <input
                          type="number"
                          value={service.bookingDurationMinutes}
                          onChange={(event) =>
                            setDayForm((current) => ({
                              ...current,
                              services: current.services.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, bookingDurationMinutes: Number(event.target.value) }
                                  : item
                              ),
                            }))
                          }
                          className="mt-1 w-full border border-[var(--line)] p-1"
                        />
                      </label>
                      <label className="uppercase text-[9px] tracking-wider text-gray-500">
                        Max guests
                        <input
                          type="number"
                          value={service.maxGuestsPerBooking}
                          onChange={(event) =>
                            setDayForm((current) => ({
                              ...current,
                              services: current.services.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, maxGuestsPerBooking: Number(event.target.value) }
                                  : item
                              ),
                            }))
                          }
                          className="mt-1 w-full border border-[var(--line)] p-1"
                        />
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-white text-[var(--forest)] border border-[var(--forest)] hover:bg-[var(--beige)] transition-colors"
                    onClick={() =>
                      setDayForm((current) => ({
                        ...current,
                        services: [
                          ...current.services,
                          {
                            name: "",
                            startTime: "",
                            endTime: "",
                            lastBookingTime: "",
                            bookingDurationMinutes: 0,
                            maxGuestsPerBooking: 0,
                          },
                        ],
                      }))
                    }
                  >
                    + Add service
                  </button>
                  <div className="flex gap-3">
                    <button type="submit" className="btn gold text-xs uppercase tracking-wider font-bold">Save schedule</button>
                    <button type="button" className="px-3 py-2 text-xs uppercase tracking-wider font-semibold text-stone-700 hover:text-[var(--dark)]" onClick={() => setEditingDay(null)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Closed Days Form & List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-serif text-xl text-[var(--forest)] mb-3">Add Holiday Closure</h3>
                <form onSubmit={handleCreateClosedDay} className="bg-white border border-[var(--line)] p-4 space-y-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Closed Date
                    </label>
                    <input
                      required
                      type="date"
                      value={newClosedDate}
                      onChange={(e) => setNewClosedDate(e.target.value)}
                      className="w-full bg-[var(--cream)] border border-[var(--line)] p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Reason
                    </label>
                    <input
                      required
                      minLength={2}
                      type="text"
                      placeholder="Reason, at least 2 characters"
                      value={newClosedReason}
                      onChange={(e) => setNewClosedReason(e.target.value)}
                      className="w-full bg-[var(--cream)] border border-[var(--line)] p-2 text-xs"
                    />
                  </div>
                  <button type="submit" className="btn gold text-xs uppercase tracking-wider font-bold w-full">
                    Save Closed Date
                  </button>
                </form>
              </div>

              <div>
                <h3 className="font-serif text-xl text-[var(--forest)] mb-3">Upcoming Closed Dates</h3>
                <div className="bg-white border border-[var(--line)] divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {closedDays.length === 0 ? (
                    <p className="p-4 text-xs text-stone-600 font-medium">No closed dates recorded.</p>
                  ) : (
                    closedDays.map((c) => (
                      <div key={c.date} className="p-3 text-xs flex justify-between items-center">
                        <div>
                          <strong className="text-[var(--dark)]">{c.date}</strong>
                          <p className="text-gray-500 text-[11px]">{c.reason || "Scheduled closure"}</p>
                        </div>
                        <button
                          type="button"
                          className="px-2 py-1 text-[9px] uppercase font-bold text-rose-800 bg-rose-50 hover:bg-rose-700 hover:text-white border border-rose-300 rounded transition-colors"
                          onClick={() => handleDeactivateClosedDay(c.id || c._id)}
                        >
                          Deactivate
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleLookupClosedDay} className="mt-4 flex gap-2 text-xs">
                  <input
                    type="date"
                    value={closedLookup}
                    onChange={(event) => setClosedLookup(event.target.value)}
                    className="border border-[var(--line)] p-2"
                    aria-label="Look up a closed day"
                  />
                  <button type="submit" className="px-3 py-2 text-xs uppercase font-bold tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] transition-colors shadow-xs">Look up</button>
                </form>
                {closedLookupResult ? (
                  <p className="mt-2 text-xs">
                    {closedLookupResult.date}: {closedLookupResult.reason} · {closedLookupResult.isActive === false ? "inactive" : "active"}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Admin Jobs Status */}
            {jobStatus && (
              <div className="bg-white border border-[var(--line)] p-6">
                <h3 className="font-serif text-xl text-[var(--forest)] mb-2">Background Scheduled Jobs</h3>
                <p className="text-xs text-[var(--dark)] mb-4">
                  Scheduler: <strong>{jobStatus.scheduler || (jobStatus.jobsEnabled ? "ENABLED" : "DISABLED")}</strong>
                  {jobStatus.intervalMinutes ? ` · every ${jobStatus.intervalMinutes} minutes` : ""}
                  {jobStatus.reminderWindowMinutes ? ` · reminders ${jobStatus.reminderWindowMinutes} minutes ahead` : ""}
                  {jobStatus.expiryWindowHours ? ` · waitlist expiry ${jobStatus.expiryWindowHours} hours` : ""}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {jobStatus.jobs.map((job) => (
                    <div key={job.name} className="p-3 bg-stone-50 border border-stone-200 text-xs">
                      <p className="font-bold text-[var(--forest)]">{job.name}</p>
                      <p className="text-[10px] text-[var(--dark)]">Flag: {job.configuration || (job.enabled ? "ENABLED" : "DISABLED")}</p>
                      <p className="text-[10px] text-[var(--dark)]">Runs now: {job.enabled ? "ENABLED" : "DISABLED"}</p>
                      <p className="text-[10px] text-gray-600">Running: {String(job.running)}</p>
                      <p className="text-[10px] text-[var(--dark)] mt-1">Last Run: {job.lastRunAt || "None"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE TABLE MODAL */}
        {showCreateTableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-[var(--cream)] border border-[var(--line)] p-8 max-w-md w-full shadow-2xl">
              <h3 className="font-serif text-2xl text-[var(--dark)] mb-4">Create New Table</h3>

              {tableModalError && (
                <div className="p-3 bg-red-100 text-red-800 text-xs mb-4">
                  {tableModalError}
                </div>
              )}

              <form onSubmit={handleCreateTable} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                    Table Number (e.g. T15)
                  </label>
                  <input
                    required
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="w-full bg-white border border-[var(--line)] p-2 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="e.g. Kupela Corner Table"
                    className="w-full bg-white border border-[var(--line)] p-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Capacity
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={50}
                      value={newTableCapacity}
                      onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                      className="w-full bg-white border border-[var(--line)] p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Shape
                    </label>
                    <select
                      value={newTableShape}
                      onChange={(e) => setNewTableShape(e.target.value as any)}
                      className="w-full bg-white border border-[var(--line)] p-2"
                    >
                      <option value="ROUND">ROUND</option>
                      <option value="SQUARE">SQUARE</option>
                      <option value="RECTANGLE">RECTANGLE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                    Location
                  </label>
                  <select
                    value={newTableLocation}
                    onChange={(e) => setNewTableLocation(e.target.value as any)}
                    className="w-full bg-white border border-[var(--line)] p-2"
                  >
                    <option value="WINDOW">WINDOW</option>
                    <option value="BAR">BAR</option>
                    <option value="CENTER">CENTER</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="OUTDOOR">OUTDOOR</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Position X
                    </label>
                    <input
                      type="number"
                      value={newTablePosX}
                      onChange={(e) => setNewTablePosX(Number(e.target.value))}
                      className="w-full bg-white border border-[var(--line)] p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-gray-600 mb-1">
                      Position Y
                    </label>
                    <input
                      type="number"
                      value={newTablePosY}
                      onChange={(e) => setNewTablePosY(Number(e.target.value))}
                      className="w-full bg-white border border-[var(--line)] p-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateTableModal(false)}
                    className="px-4 py-2 text-xs uppercase text-gray-600"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn gold text-xs uppercase tracking-wider">
                    Create Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
