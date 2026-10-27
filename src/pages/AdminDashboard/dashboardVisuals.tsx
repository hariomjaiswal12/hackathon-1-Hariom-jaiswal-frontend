import type { ReactNode } from "react"

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "#173c32",
  ARRIVED: "#2f6f9f",
  SEATED: "#6d4d8a",
  COMPLETED: "#71856e",
  CANCELLED: "#b96832",
  NO_SHOW: "#9a3b3b",
  PENDING: "#d89b45",
  WEBSITE: "#173c32",
  PHONE: "#2f6f9f",
  WHATSAPP: "#71856e",
  STAFF: "#8b4e24",
  ADMIN: "#d89b45",
}

export function readableLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
    .replace("No show", "No-show")
}

export function formatReturnedRate(rate: number) {
  const percent = rate * 100
  const rounded = Math.round(percent * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return `${text}%`
}

export function Panel({
  kicker,
  title,
  action,
  children,
}: {
  kicker: string
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="bg-white/85 border border-[var(--line)] p-5 md:p-6 shadow-[0_12px_40px_rgba(23,19,15,0.04)]">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--copper)]">{kicker}</p>
          <h2 className="font-serif text-3xl text-[var(--forest)] mt-1">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SectionMessage({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--brown)]">{children}</p>
}

export function KpiCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string
  value: string | number
  detail: string
  icon: ReactNode
}) {
  return (
    <article className="group bg-white border border-[var(--line)] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(23,60,50,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] tracking-[0.16em] uppercase text-[var(--sage)]">{label}</p>
        <span className="text-[var(--forest)] opacity-80 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <p className="font-serif text-4xl text-[var(--dark)] mt-3 leading-none">{value}</p>
      <p className="text-xs text-[var(--brown)] mt-3 leading-relaxed">{detail}</p>
    </article>
  )
}

export function DonutChart({
  segments,
}: {
  segments: { label: string; value: number; color: string }[]
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  let offset = 0

  if (total === 0) {
    return (
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="w-36 h-36 shrink-0" role="img" aria-label="No status counts">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e8d6bc" strokeWidth="14" />
          <text x="60" y="64" textAnchor="middle" className="fill-[var(--dark)]" fontSize="16">
            0
          </text>
        </svg>
        <p className="text-sm text-[var(--sage)]">No bookings in this breakdown.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-36 h-36 shrink-0" role="img" aria-label="Booking status breakdown">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f5ebdd" strokeWidth="14" />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference
          const dash = `${length} ${circumference - length}`
          const circle = (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            />
          )
          offset += length
          return circle
        })}
        <text x="60" y="58" textAnchor="middle" fontSize="18" className="fill-[var(--dark)]">
          {total}
        </text>
        <text x="60" y="74" textAnchor="middle" fontSize="8" className="fill-[var(--sage)]">
          BOOKINGS
        </text>
      </svg>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs min-w-0">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[var(--dark)]">
              <i className="w-2.5 h-2.5" style={{ background: segment.color }} />
              {readableLabel(segment.label)}
            </span>
            <strong>{segment.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HorizontalBars({
  rows,
}: {
  rows: { label: string; value: number; color: string }[]
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--sage)]">No values returned.</p>
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-xs mb-1">
            <span>{readableLabel(row.label)}</span>
            <strong>{row.value}</strong>
          </div>
          <div className="h-2 bg-[var(--beige)]">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${(row.value / max) * 100}%`, background: row.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HourlyChart({
  hours,
}: {
  hours: { time: string; bookings: number; guests: number }[]
}) {
  if (hours.length === 0) {
    return <p className="text-sm text-[var(--sage)]">No bookings start during this date.</p>
  }

  const max = Math.max(...hours.flatMap((hour) => [hour.bookings, hour.guests]), 1)
  const width = Math.max(hours.length * 72, 320)
  const height = 220
  const barWidth = 16
  const gap = 8

  return (
    <div>
      <div className="flex gap-4 text-[10px] uppercase tracking-wider text-[var(--sage)] mb-3">
        <span className="flex items-center gap-2"><i className="w-3 h-3 bg-[var(--forest)]" /> Bookings</span>
        <span className="flex items-center gap-2"><i className="w-3 h-3 bg-[var(--gold)]" /> Guests</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[320px] h-56" role="img" aria-label="Hourly bookings and guests">
          {hours.map((hour, index) => {
            const x = 28 + index * ((width - 40) / hours.length)
            const bookingHeight = (hour.bookings / max) * 150
            const guestHeight = (hour.guests / max) * 150
            return (
              <g key={hour.time}>
                <rect x={x} y={170 - bookingHeight} width={barWidth} height={bookingHeight} fill="#173c32" />
                <rect x={x + barWidth + gap} y={170 - guestHeight} width={barWidth} height={guestHeight} fill="#d89b45" />
                <text x={x + barWidth} y={192} textAnchor="middle" fontSize="11" fill="#17130f">
                  {hour.time}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function statusColor(label: string) {
  return STATUS_COLORS[label] || "#8b4e24"
}

export function Icon({ name }: { name: "book" | "guests" | "check" | "seat" | "done" | "cancel" | "alert" | "table" | "clock" | "list" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    "aria-hidden": true as const,
  }

  if (name === "guests") {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.6-3 2.7-4.5 5.5-4.5S14.4 16 15 19" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16.2 14.6c2.2.3 3.6 1.6 4.3 4.4" />
      </svg>
    )
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 12.2 11 14.7 15.8 9.5" />
      </svg>
    )
  }

  if (name === "seat") {
    return (
      <svg {...common}>
        <path d="M7 11V6h10v5" />
        <path d="M6 11h12v5H6z" />
        <path d="M8 16v3M16 16v3" />
      </svg>
    )
  }

  if (name === "done") {
    return (
      <svg {...common}>
        <path d="M8 6h11v12H8z" />
        <path d="M8 10h11" />
        <path d="M5 8v10h3" />
      </svg>
    )
  }

  if (name === "cancel") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    )
  }

  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="M12 4 3.5 19h17z" />
        <path d="M12 10v4" />
        <path d="M12 16.5h.01" />
      </svg>
    )
  }

  if (name === "table") {
    return (
      <svg {...common}>
        <rect x="4" y="8" width="16" height="8" />
        <path d="M8 16v3M16 16v3" />
      </svg>
    )
  }

  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4.5L15 15" />
      </svg>
    )
  }

  if (name === "list") {
    return (
      <svg {...common}>
        <path d="M8 7h11M8 12h11M8 17h11" />
        <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <rect x="5" y="4" width="14" height="16" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}
