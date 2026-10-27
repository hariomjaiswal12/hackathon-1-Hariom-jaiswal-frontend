import { useCallback, useEffect, useState } from "react"
import { customerAdminService, type AdminCustomer } from "@/services/customerAdminService"
import { blacklistService } from "@/services/blacklistService"
import { bookingService } from "@/services/bookingService"
import { bookingTableLabel } from "@/lib/booking"
import { formatApiError } from "@/lib/errors"
import type { Booking } from "@/types/api"
import { Panel, SectionMessage } from "./dashboardVisuals"

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export function CustomersPanel() {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState<"" | "ACTIVE" | "BLACKLISTED">("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [selected, setSelected] = useState<AdminCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState("")
  const [history, setHistory] = useState<Booking[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(query.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await customerAdminService.list({ q: debounced, blacklistStatus: status, page, limit: 10 })
      if (!Array.isArray(data?.customers)) {
        setCustomers([])
        setError("Customer records were incomplete.")
        return
      }
      setCustomers(data.customers)
      setTotal(data.pagination?.total ?? data.customers.length)
      setTotalPages(data.pagination?.totalPages ?? 1)
    } catch (loadError) {
      setCustomers([])
      setError(formatApiError(loadError, "Customers could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [debounced, status, page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!selected) return undefined
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selected])

  const loadHistory = useCallback(async (id: string) => {
    setHistoryLoading(true)
    setHistoryError("")
    try {
      const rows = await bookingService.listBookings({ customerId: id })
      setHistory(Array.isArray(rows) ? rows : [])
    } catch (loadError) {
      setHistory(null)
      setHistoryError(formatApiError(loadError, "Reservations could not be loaded."))
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  const openCustomer = async (id: string) => {
    setSaving(true)
    setError("")
    try {
      const data = await customerAdminService.get(id)
      setSelected(data.customer)
      setReason("")
      setHistory(null)
      loadHistory(id)
    } catch (loadError) {
      setError(formatApiError(loadError, "That customer could not be loaded."))
    } finally {
      setSaving(false)
    }
  }

  const changeBlacklist = async (action: "block" | "unblock") => {
    if (!selected) return
    if (action === "block" && reason.trim().length < 2) {
      setError("VALIDATION_ERROR — A blacklist reason is required.")
      return
    }
    setSaving(true)
    setError("")
    setNotice("")
    try {
      if (action === "block") {
        await blacklistService.blacklist(selected.id, reason.trim())
      } else {
        await blacklistService.unblock(selected.id)
      }
      const data = await customerAdminService.get(selected.id)
      setSelected(data.customer)
      setNotice(action === "block" ? "Customer blacklisted." : "Customer unblocked.")
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The blacklist could not be updated."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel kicker="Guests" title="Customers">
      <p className="text-xs text-[var(--sage)] mb-4">
        Customer accounts only. Passwords, roles, and booking records stay on their existing services.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 mb-4 text-xs">
        <label className="flex-1 text-[var(--dark)]">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or phone"
            className="mt-1 block w-full bg-white border border-[var(--line)] px-2 py-2 text-[var(--dark)]"
            aria-label="Search customers"
          />
        </label>
        <label className="text-[var(--dark)]">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | "ACTIVE" | "BLACKLISTED")
              setPage(1)
            }}
            className="mt-1 block bg-white border border-[var(--line)] px-2 py-2 text-[var(--dark)]"
            aria-label="Filter customers by blacklist status"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </label>
      </div>

      {loading ? <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Loading customers</p> : null}
      {error ? (
        <SectionMessage>
          {error}
          <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={load}>Retry</button>
        </SectionMessage>
      ) : null}
      {notice ? <p className="text-sm text-[var(--forest)] mb-3">{notice}</p> : null}
      {!loading && !error && customers.length === 0 ? (
        <p className="text-sm text-[var(--sage)]">No customers match this search.</p>
      ) : null}

      {customers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="uppercase tracking-wider text-[var(--dark)]">
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Phone</th>
                <th className="py-2 pr-3">No-shows</th>
                <th className="py-2 pr-3">Blacklist</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[var(--line)]">
                  <td className="py-3 pr-3 font-semibold text-[var(--dark)]">{customer.name}</td>
                  <td className="py-3 pr-3 text-[var(--dark)]">{customer.email}</td>
                  <td className="py-3 pr-3 text-[var(--dark)]">{customer.phone || "—"}</td>
                  <td className="py-3 pr-3 text-[var(--dark)]">{customer.noShowCount}</td>
                  <td className="py-3 pr-3 text-[var(--dark)]">{customer.blacklistStatus}</td>
                  <td className="py-3 pr-3 text-[var(--dark)]">{formatDate(customer.createdAt)}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-white text-[var(--forest)] hover:bg-[var(--beige)] border border-[var(--line)] rounded transition-colors"
                      onClick={() => openCustomer(customer.id)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {totalPages > 1 || total > customers.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--dark)]">
          <button
            type="button"
            className="px-3 py-1.5 border border-[var(--forest)] text-[var(--forest)] font-bold uppercase tracking-wider text-[10px] bg-white hover:bg-[var(--beige)] transition-colors disabled:border-[var(--dark)] disabled:text-[var(--dark)] disabled:bg-[var(--cream)] disabled:opacity-100"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span className="font-medium">Page {page} of {totalPages} · {total} customers</span>
          <button
            type="button"
            className="px-3 py-1.5 border border-[var(--forest)] text-[var(--forest)] font-bold uppercase tracking-wider text-[10px] bg-white hover:bg-[var(--beige)] transition-colors disabled:border-[var(--dark)] disabled:text-[var(--dark)] disabled:bg-[var(--cream)] disabled:opacity-100"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" onKeyDown={(event) => { if (event.key === "Escape") setSelected(null) }}>
          <div className="bg-[var(--cream)] border border-[var(--line)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Customer details">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--copper)]">Customer</p>
                <h3 className="font-serif text-3xl text-[var(--forest)]">{selected.name}</h3>
              </div>
              <button
                type="button"
                className="text-xs uppercase tracking-wider font-semibold text-[var(--dark)] hover:text-[var(--copper)] transition-colors"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--dark)]">
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Email</dt><dd>{selected.email}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Phone</dt><dd>{selected.phone || "—"}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Role</dt><dd>{selected.role}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">No-shows</dt><dd>{selected.noShowCount}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Blacklist</dt><dd>{selected.blacklistStatus}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Reservations</dt><dd>{selected.bookings.total}</dd></div>
              <div className="sm:col-span-2"><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Reason</dt><dd>{selected.blacklistReason || "—"}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Created</dt><dd>{formatDate(selected.createdAt)}</dd></div>
              <div><dt className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Updated</dt><dd>{formatDate(selected.updatedAt)}</dd></div>
            </dl>
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-stone-700 font-bold">Reservation history</p>
              {historyLoading ? <p className="mt-2 text-xs text-[var(--dark)]">Loading reservations</p> : null}
              {historyError ? (
                <p className="mt-2 text-sm text-rose-950" role="alert">
                  {historyError}
                  <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={() => loadHistory(selected.id)}>Retry</button>
                </p>
              ) : null}
              {!historyLoading && !historyError && history && history.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--dark)]">No reservations are recorded for this customer.</p>
              ) : null}
              {history && history.length > 0 ? (
                <ul className="mt-2 max-h-40 overflow-y-auto divide-y divide-[var(--line)] text-sm text-[var(--dark)]">
                  {history.map((booking) => (
                    <li key={booking.bookingReference} className="py-2">
                      <span className="font-semibold">{booking.bookingReference}</span>
                      {" · "}{booking.date} {booking.startTime}
                      {" · "}{bookingTableLabel(booking)}
                      {" · "}{booking.status}
                      {booking.depositRequired ? ` · Deposit ${booking.depositStatus}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            {selected.blacklistStatus === "BLACKLISTED" ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => changeBlacklist("unblock")}
                className="mt-5 px-4 py-2 text-[10px] uppercase tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:bg-[var(--dark)] disabled:text-white"
              >
                {saving ? "Saving..." : "Unblock"}
              </button>
            ) : (
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={200}
                  placeholder="Reason"
                  aria-label="Blacklist reason"
                  className="flex-1 bg-white border border-[var(--line)] px-2 py-2 text-sm text-[var(--dark)]"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => changeBlacklist("block")}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider bg-[var(--forest)] text-white hover:bg-[var(--dark)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)] disabled:bg-[var(--dark)] disabled:text-white"
                >
                  {saving ? "Saving..." : "Blacklist"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
