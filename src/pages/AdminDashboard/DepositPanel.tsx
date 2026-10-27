import { useCallback, useEffect, useState } from "react"
import { formatApiError } from "@/lib/errors"
import { paymentService } from "@/services/paymentService"
import { Panel, SectionMessage, statusColor } from "./dashboardVisuals"
import type { DepositConfig, Payment, DepositType } from "@/types/api"

export function DepositPanel() {
  const [config, setConfig] = useState<DepositConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [savingConfig, setSavingConfig] = useState(false)
  const [configNotice, setConfigNotice] = useState("")
  const [configError, setConfigError] = useState("")

  // Form state
  const [enabled, setEnabled] = useState(false)
  const [type, setType] = useState<DepositType>("PER_GUEST")
  const [amount, setAmount] = useState("10")
  const [minGuests, setMinGuests] = useState("1")
  const [refundCutoffHours, setRefundCutoffHours] = useState("24")

  // Payments list state
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState("")
  const [refundingRef, setRefundingRef] = useState("")
  const [paymentsNotice, setPaymentsNotice] = useState("")
  const [paymentsError, setPaymentsError] = useState("")

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true)
    setConfigError("")
    try {
      const data = await paymentService.getAdminDepositConfig()
      setConfig(data)
      setEnabled(data.enabled)
      setType(data.type)
      setAmount(String(data.amount))
      setMinGuests(String(data.minGuests))
      setRefundCutoffHours(String(data.refundCutoffHours))
    } catch (err: unknown) {
      setConfigError(formatApiError(err, "Failed to load deposit configuration."))
    } finally {
      setLoadingConfig(false)
    }
  }, [])

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true)
    setPaymentsError("")
    try {
      const data = await paymentService.listPayments({
        status: statusFilter || undefined,
      })
      setPayments(data)
    } catch (err: unknown) {
      setPaymentsError(formatApiError(err, "Failed to load payments list."))
    } finally {
      setPaymentsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadConfig()
    loadPayments()
  }, [loadConfig, loadPayments])

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    setConfigNotice("")
    setConfigError("")

    try {
      const updated = await paymentService.updateDepositConfig({
        enabled,
        type,
        amount: Number(amount),
        minGuests: Number(minGuests),
        refundCutoffHours: Number(refundCutoffHours),
      })
      setConfig(updated)
      setConfigNotice("Deposit configuration saved successfully.")
    } catch (err: unknown) {
      setConfigError(formatApiError(err, "Failed to update deposit configuration."))
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRefund = async (paymentReference: string) => {
    if (!window.confirm(`Issue refund for payment ${paymentReference}?`)) {
      return
    }

    setRefundingRef(paymentReference)
    setPaymentsNotice("")
    setPaymentsError("")

    try {
      await paymentService.refundPayment(paymentReference, "Administrator issued refund")
      setPaymentsNotice(`Refund issued for ${paymentReference}.`)
      await loadPayments()
    } catch (err: unknown) {
      setPaymentsError(formatApiError(err, "Refund request failed."))
    } finally {
      setRefundingRef("")
    }
  }

  return (
    <Panel kicker="Finance & Reservations" title="Deposit & Payment System">
      <p className="text-xs text-[var(--sage)] mb-6">
        Configure restaurant deposit collection rules and manage reservation payment transactions with the PaymentProvider abstraction.
      </p>

      {/* SECTION 1: CONFIGURATION */}
      <div className="bg-white border border-[var(--line)] p-6 mb-8">
        <h3 className="font-serif text-lg text-[var(--dark)] mb-2">Deposit Policy & Rules</h3>
        <p className="text-xs text-gray-500 mb-4">
          When enabled, customers booking reservations matching the criteria must submit an authoritative deposit.
        </p>

        {configNotice ? <SectionMessage>{configNotice}</SectionMessage> : null}
        {configError ? <SectionMessage>{configError}</SectionMessage> : null}

        {loadingConfig ? (
          <p className="text-xs text-gray-500">Loading configuration...</p>
        ) : (
          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 p-3 bg-[var(--cream)] border border-[var(--line)] rounded">
              <input
                type="checkbox"
                id="deposit-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-[var(--forest)] focus:ring-[var(--gold)]"
              />
              <label htmlFor="deposit-enabled" className="font-semibold text-gray-800 cursor-pointer">
                Require Deposits for Eligible Bookings
              </label>
              <span className={`ml-auto text-[9px] uppercase font-bold px-2 py-0.5 rounded ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                {enabled ? "ACTIVE" : "DISABLED"}
              </span>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                Deposit Calculation Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DepositType)}
                className="w-full bg-white border border-[var(--line)] px-2.5 py-1.5"
              >
                <option value="PER_GUEST">Per Guest (e.g. €10/guest)</option>
                <option value="FLAT">Flat Amount (Fixed total)</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                Deposit Amount (€)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border border-[var(--line)] px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">
                Min. Guests Threshold
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value)}
                className="w-full bg-white border border-[var(--line)] px-2.5 py-1.5"
              />
              <span className="text-[10px] text-stone-700 font-medium mt-0.5 block">Applies if guests &ge; this</span>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-stone-700 font-bold mb-1">
                Refund Cutoff Hours
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={refundCutoffHours}
                onChange={(e) => setRefundCutoffHours(e.target.value)}
                className="w-full bg-white border border-[var(--line)] px-2.5 py-1.5"
              />
              <span className="text-[10px] text-stone-700 font-medium mt-0.5 block">Refundable if cancelled before</span>
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-3 mt-2">
              <button
                type="submit"
                disabled={savingConfig}
                className="px-5 py-2.5 bg-[var(--forest)] text-white text-xs uppercase tracking-wider font-bold hover:bg-[var(--dark)] transition-colors shadow-sm disabled:opacity-50"
              >
                {savingConfig ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECTION 2: RECENT PAYMENTS */}
      <div className="bg-white border border-[var(--line)] p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="font-serif text-lg text-[var(--dark)]">Recent Deposit Payments</h3>
            <p className="text-xs text-stone-700 font-medium">Live records from the payment provider abstraction.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[var(--line)] px-2 py-1 text-xs"
              aria-label="Filter payments by status"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
              <option value="FAILED">FAILED</option>
            </select>
            <button
              type="button"
              onClick={loadPayments}
              className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-[var(--dark)] border border-[var(--line)] bg-white hover:bg-[var(--beige)] transition-colors"
            >
              {paymentsLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {paymentsNotice ? <SectionMessage>{paymentsNotice}</SectionMessage> : null}
        {paymentsError ? <SectionMessage>{paymentsError}</SectionMessage> : null}

        {paymentsLoading && payments.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">Loading payments...</p>
        ) : payments.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No deposit transactions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--cream)] uppercase text-[9px] tracking-wider text-gray-600 border-b border-[var(--line)]">
                <tr>
                  <th className="p-3">Payment Reference</th>
                  <th className="p-3">Booking Reference</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id || p.paymentReference} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-semibold text-[var(--forest)]">
                      {p.paymentReference}
                    </td>
                    <td className="p-3 font-mono text-gray-700">
                      {p.bookingReference}
                    </td>
                    <td className="p-3 font-semibold">
                      €{Number(p.amount).toFixed(2)} {p.currency}
                    </td>
                    <td className="p-3 text-[10px] uppercase text-gray-600 font-mono">
                      {p.provider}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded ${
                          p.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "REFUNDED"
                            ? "bg-amber-100 text-amber-800"
                            : p.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {p.status === "PAID" ? (
                        <button
                          type="button"
                          disabled={refundingRef === p.paymentReference}
                          onClick={() => handleRefund(p.paymentReference)}
                          className="px-2.5 py-1 text-[10px] uppercase tracking-wider bg-rose-50 text-rose-800 hover:bg-rose-700 hover:text-white border border-rose-300 rounded font-bold transition-colors disabled:opacity-50"
                        >
                          {refundingRef === p.paymentReference ? "Refunding..." : "Refund"}
                        </button>
                      ) : p.status === "REFUNDED" ? (
                        <span className="text-[10px] text-stone-600 font-medium italic">Refunded</span>
                      ) : (
                        <span className="text-[10px] text-stone-600 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  )
}
