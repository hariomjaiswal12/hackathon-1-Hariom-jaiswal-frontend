import { useCallback, useEffect, useState } from "react"
import { request } from "@/services/apiClient"
import { formatApiError } from "@/lib/errors"
import { Panel, SectionMessage } from "./dashboardVisuals"

type ChannelStatus = {
  channel: string
  label: string
  status: "connected" | "ready" | "not_configured" | "error"
  detail: string
  outbound?: boolean
  operations?: string[]
}

const STATUS_LABEL = {
  connected: "Connected",
  ready: "Ready",
  not_configured: "Not configured",
  error: "Error",
}

export function ChannelsPanel() {
  const [channels, setChannels] = useState<ChannelStatus[]>([])
  const [checkedAt, setCheckedAt] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await request<{ channels?: ChannelStatus[]; checkedAt?: string }>("/admin/integrations/status")
      if (!Array.isArray(data?.channels)) {
        setChannels([])
        setCheckedAt("")
        setError("Provider status was incomplete.")
        return
      }
      setChannels(data.channels)
      setCheckedAt(data.checkedAt || "")
    } catch (loadError) {
      setChannels([])
      setCheckedAt("")
      setError(formatApiError(loadError, "Booking channel status could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Panel kicker="Bookings" title="Booking channels">
      <p className="text-xs text-stone-700 font-medium mb-4">
        Status is checked from server configuration. This page does not call Retell or WhatsApp, and it never shows credentials.
      </p>
      {loading ? <p className="text-xs uppercase tracking-wider text-stone-700 font-medium">Loading channels...</p> : null}
      {error ? (
        <SectionMessage>
          {error}
          <button type="button" className="block mt-2 underline font-bold" onClick={load}>Retry</button>
        </SectionMessage>
      ) : null}
      {!loading && !error && checkedAt ? (
        <p className="text-[10px] uppercase tracking-wider text-stone-700 font-bold mb-3">Checked {checkedAt}</p>
      ) : null}
      {!loading && !error ? (
        <ul className="text-sm">
          {channels.map((channel) => (
            <li key={channel.channel} className="border-t border-[var(--line)] py-3">
              <p className="font-semibold text-[var(--dark)]">{channel.label} — {STATUS_LABEL[channel.status] || channel.status}</p>
              <p className="text-xs text-stone-700 mt-1">{channel.detail}</p>
              {channel.operations?.length ? (
                <p className="text-xs mt-2">Operations: {channel.operations.join(", ")}</p>
              ) : null}
              {channel.channel === "whatsapp" ? (
                <p className="text-xs mt-1">Outbound messages: {channel.outbound ? "Available" : "Not configured"}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  )
}