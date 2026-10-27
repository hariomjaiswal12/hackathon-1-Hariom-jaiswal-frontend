import { useCallback, useEffect, useState } from "react"
import { adminService } from "@/services/adminService"
import { formatApiError } from "@/lib/errors"
import type { AdminJobStatus } from "@/types/api"
import { Panel, SectionMessage } from "./dashboardVisuals"

const JOB_LABELS: Record<string, string> = {
  bookingReminder: "Booking reminders",
  waitlistExpiry: "Waitlist expiry",
  bookingCleanup: "Booking cleanup",
}

function when(value: string | null) {
  return value || "Not run in this process"
}

function configurationLabel(value?: string) {
  if (value === "ENABLED") return "ENABLED"
  if (value === "NOT_CONFIGURED") return "NOT CONFIGURED"
  return "DISABLED"
}

export function JobsPanel() {
  const [status, setStatus] = useState<AdminJobStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await adminService.getJobStatus()
      if (!data || !Array.isArray(data.jobs)) {
        setStatus(null)
        setError("Scheduler status was incomplete.")
        return
      }
      setStatus(data)
    } catch (loadError) {
      setStatus(null)
      setError(formatApiError(loadError, "Scheduler status could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Panel kicker="Operations" title="Scheduled jobs">
      <p className="text-xs text-[var(--dark)] mb-4">
        This view reads the current configuration. It does not start jobs or change their flags.
        A job runs only when the scheduler and that job are both ENABLED. Set JOBS_ENABLED and the matching flag to true in the server environment. NOT CONFIGURED means that variable is absent. This screen cannot turn a job on.
      </p>
      {loading ? <p className="text-xs uppercase tracking-wider text-[var(--sage)]">Loading scheduler</p> : null}
      {error ? (
        <SectionMessage>
          {error}
          <button type="button" className="block mt-2 underline text-[var(--forest)]" onClick={load}>Retry</button>
        </SectionMessage>
      ) : null}
      {status ? (
        <div>
          <div className="text-sm text-[var(--dark)] mb-4 space-y-1">
            <p>Scheduler: <strong>{configurationLabel(status.scheduler || (status.jobsEnabled ? "ENABLED" : "DISABLED"))}</strong></p>
            <p>Interval: every {status.intervalMinutes || 5} minutes{status.schedule ? ` (${status.schedule})` : ""}</p>
            <p>Reminder window: {status.reminderWindowMinutes ?? "—"} minutes before the reservation</p>
            <p>Waitlist expiry window: {status.expiryWindowHours ?? "—"} hours after the requested time</p>
            <p>Cleanup counts finished seatings. It does not delete bookings.</p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {status.jobs.map((job) => (
              <li key={job.name} className="border border-[var(--line)] p-3 bg-white text-sm text-[var(--dark)]">
                <p className="font-serif text-xl text-[var(--forest)]">{JOB_LABELS[job.name] || job.name}</p>
                <p className="mt-2">Flag: {configurationLabel(job.configuration)}</p>
                <p>Runs in this process: {job.enabled ? "ENABLED" : "DISABLED"}</p>
                <p>Running now: {job.running ? "Yes" : "No"}</p>
                <p className="text-xs mt-2 text-[var(--brown)]">Last run: {when(job.lastRunAt)}</p>
                <p className="text-xs text-[var(--brown)]">Last success: {when(job.lastSuccessAt)}</p>
                <p className="text-xs text-[var(--brown)]">Last failure: {when(job.lastFailureAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Panel>
  )
}
