import { useCallback, useEffect, useState } from "react"
import { formatApiError } from "@/lib/errors"
import { blacklistService, type BlacklistCustomer, type BlacklistStatus } from "@/services/blacklistService"
import { Panel, SectionMessage } from "./dashboardVisuals"

type StatusFilter = "" | BlacklistStatus

export function BlacklistPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("BLACKLISTED")
  const [minCount, setMinCount] = useState("")
  const [customers, setCustomers] = useState<BlacklistCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [reason, setReason] = useState("")
  const [savingId, setSavingId] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const parsedMin = minCount.trim() === "" ? undefined : Number(minCount)
      const data = await blacklistService.list({
        blacklistStatus: statusFilter || undefined,
        minNoShowCount: Number.isInteger(parsedMin) ? parsedMin : undefined,
      })
      setCustomers(data.customers)
    } catch (loadError) {
      setCustomers([])
      setError(formatApiError(loadError, "The blacklist could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [minCount, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const runAction = async (id: string, action: () => Promise<unknown>, success: string) => {
    setSavingId(id)
    setNotice("")
    setError("")
    try {
      await action()
      setNotice(success)
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The blacklist could not be updated."))
    } finally {
      setSavingId("")
    }
  }

  const blacklistByEmail = async () => {
    const email = customerEmail.trim().toLowerCase()
    const trimmedReason = reason.trim()
    if (!email || !trimmedReason) {
      setError("VALIDATION_ERROR — A customer email and a reason are required.")
      return
    }
    setSavingId("lookup")
    setError("")
    setNotice("")
    try {
      const data = await blacklistService.list()
      const match = data.customers.find((customer) => customer.email.toLowerCase() === email)
      if (!match) {
        setError("NOT_FOUND — No customer account uses that email.")
        return
      }
      await blacklistService.blacklist(match.id, trimmedReason)
      setCustomerEmail("")
      setReason("")
      setNotice("Customer blacklisted.")
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The blacklist could not be updated."))
    } finally {
      setSavingId("")
    }
  }

  return (
    <Panel kicker="Reservations" title="No-show blacklist">
      <p className="text-xs text-[var(--sage)] mb-4">
        Restricted customers cannot create or reschedule their own reservations. Existing bookings stay in place.
      </p>

      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="mt-1 block bg-white border border-[var(--line)] px-2 py-1"
            aria-label="Filter by blacklist status"
          >
            <option value="">All customers</option>
            <option value="BLACKLISTED">Blacklisted</option>
            <option value="ACTIVE">Active</option>
          </select>
        </label>
        <label>
          Minimum no-shows
          <input
            value={minCount}
            onChange={(event) => setMinCount(event.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            className="mt-1 block w-28 bg-white border border-[var(--line)] px-2 py-1"
            aria-label="Minimum no-show count"
          />
        </label>
        <button
          type="button"
          onClick={load}
          className="self-end px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--dark)] border border-[var(--line)] bg-white hover:bg-[var(--beige)] transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Loading blacklist</p> : null}
      {error ? <SectionMessage>{error}</SectionMessage> : null}
      {notice ? <p className="text-xs text-[var(--forest)] mb-3">{notice}</p> : null}

      {!loading && !error && customers.length === 0 ? (
        <p className="text-sm text-stone-700 mb-4 font-medium">No customers match this filter.</p>
      ) : null}

      {customers.length > 0 ? (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="uppercase tracking-wider text-stone-700 font-bold bg-stone-100/60 border-b border-[var(--line)]">
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">No-shows</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-[var(--line)] hover:bg-white/50">
                  <td className="py-3 px-3">
                    <p className="font-semibold text-[var(--dark)]">{customer.name}</p>
                    <p className="text-stone-600 text-[11px]">{customer.email}</p>
                  </td>
                  <td className="py-3 px-3 font-semibold text-[var(--dark)]">{customer.noShowCount}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                      customer.blacklistStatus === "BLACKLISTED"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}>
                      {customer.blacklistStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-700">{customer.blacklistReason || "—"}</td>
                  <td className="py-3 px-3">
                    {customer.blacklistStatus === "BLACKLISTED" ? (
                      <button
                        type="button"
                        disabled={savingId === customer.id}
                        onClick={() => runAction(customer.id, () => blacklistService.unblock(customer.id), "Customer unblocked.")}
                        className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-emerald-50 text-emerald-800 hover:bg-emerald-700 hover:text-white border border-emerald-300 rounded transition-colors disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={savingId === customer.id}
                        onClick={() => runAction(
                          customer.id,
                          () => blacklistService.blacklist(customer.id, "Repeated no-shows"),
                          "Customer blacklisted."
                        )}
                        className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white border border-rose-300 rounded transition-colors disabled:opacity-50"
                      >
                        Blacklist
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <label>
          Customer email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="mt-1 block w-full bg-white border border-[var(--line)] px-2 py-1"
            aria-label="Customer email to blacklist"
          />
        </label>
        <label className="md:col-span-2">
          Reason
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={200}
            className="mt-1 block w-full bg-white border border-[var(--line)] px-2 py-1"
            aria-label="Blacklist reason"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={blacklistByEmail}
        disabled={Boolean(savingId)}
        className="mt-3 px-5 py-2.5 text-xs uppercase tracking-wider font-bold bg-[var(--forest)] text-white hover:bg-[var(--dark)] transition-colors shadow-sm disabled:opacity-50"
      >
        Blacklist customer
      </button>
    </Panel>
  )
}
