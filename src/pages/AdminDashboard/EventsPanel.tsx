import { useCallback, useEffect, useState } from "react"
import { formatApiError } from "@/lib/errors"
import { eventWhen } from "@/components/Content/contentFormat"
import { eventService, type EventInput } from "@/services/eventService"
import type { EventStatus, RestaurantEvent } from "@/types/api"
import { Panel, SectionMessage } from "./dashboardVisuals"

const fieldClass =
  "mt-1.5 block w-full bg-white border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--dark)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20 focus:border-[var(--forest)] transition-all placeholder:text-stone-400"

type FilterState = "ALL" | EventStatus

const emptyForm = {
  title: "",
  slug: "",
  description: "",
  shortDescription: "",
  imageUrl: "",
  location: "Sidrería Iturrieta, Aramaio",
  startDate: "",
  endDate: "",
  startTime: "13:00",
  endTime: "",
  status: "DRAFT" as EventStatus,
}

function statusBadge(status: EventStatus) {
  const styles: Record<EventStatus, { bg: string; text: string; border: string; dot: string }> = {
    PUBLISHED: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-300",
      dot: "bg-emerald-600",
    },
    DRAFT: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300",
      dot: "bg-amber-600",
    },
    COMPLETED: {
      bg: "bg-sky-50",
      text: "text-sky-800",
      border: "border-sky-300",
      dot: "bg-sky-600",
    },
    CANCELLED: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-300",
      dot: "bg-rose-600",
    },
    ARCHIVED: {
      bg: "bg-stone-100",
      text: "text-stone-700",
      border: "border-stone-300",
      dot: "bg-stone-500",
    },
  }
  const config = styles[status] || styles.ARCHIVED
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${config.bg} ${config.text} ${config.border} shadow-2xs whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  )
}

function EventThumbnail({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  const [hasError, setHasError] = useState(false)

  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full min-h-[120px] bg-gradient-to-br from-[var(--cream)] to-[var(--beige)] flex flex-col items-center justify-center p-3 text-center">
        <svg
          className="w-7 h-7 text-[var(--copper)] opacity-70 mb-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--forest)] opacity-80">
          Sidrería Iturrieta
        </span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={title}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  )
}

export function EventsPanel() {
  const [events, setEvents] = useState<RestaurantEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState("")
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<FilterState>("ALL")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setEvents(await eventService.listAdmin())
    } catch (loadError) {
      setEvents([])
      setError(formatApiError(loadError, "Events could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const set = (key: keyof typeof emptyForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const save = async () => {
    if (!form.title.trim()) {
      setError("Title is required.")
      return
    }
    if (!form.description.trim()) {
      setError("Description is required.")
      return
    }
    if (!form.startDate) {
      setError("Start date is required.")
      return
    }
    if (!form.startTime) {
      setError("Start time is required.")
      return
    }

    const input: EventInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      imageUrl: form.imageUrl.trim() || null,
      location: form.location.trim() || "Sidrería Iturrieta, Aramaio",
      startDate: form.startDate,
      endDate: form.endDate.trim() || undefined,
      startTime: form.startTime.trim(),
      endTime: form.endTime.trim() || null,
      status: form.status,
    }

    setSaving(true)
    setError("")
    setNotice("")
    try {
      if (editingId) {
        await eventService.update(editingId, input)
        setNotice(`Event "${form.title}" updated successfully.`)
      } else {
        await eventService.create(input)
        setNotice(`Event "${form.title}" created successfully.`)
      }
      setForm(emptyForm)
      setEditingId("")
      await load()
    } catch (saveError) {
      setError(formatApiError(saveError, "The event could not be saved."))
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (event: RestaurantEvent, status: EventStatus) => {
    setError("")
    setNotice("")
    try {
      await eventService.update(event.id, { status })
      const statusLabels: Record<EventStatus, string> = {
        DRAFT: "unpublished and marked draft",
        PUBLISHED: "published to public website",
        CANCELLED: "marked cancelled",
        COMPLETED: "marked completed",
        ARCHIVED: "archived and hidden",
      }
      setNotice(`Event "${event.title}" ${statusLabels[status] || status.toLowerCase()}.`)
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The event status could not be updated."))
    }
  }

  const archive = async (event: RestaurantEvent) => {
    setError("")
    setNotice("")
    try {
      await eventService.archive(event.id)
      setNotice(`Event "${event.title}" archived.`)
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The event could not be archived."))
    }
  }

  const edit = (event: RestaurantEvent) => {
    setEditingId(event.id)
    setForm({
      title: event.title,
      slug: event.slug || "",
      description: event.description,
      shortDescription: event.shortDescription || "",
      imageUrl: event.imageUrl || "",
      location: event.location,
      startDate: event.startDate,
      endDate: event.endDate || "",
      startTime: event.startTime,
      endTime: event.endTime || "",
      status: event.status,
    })
    window.scrollTo({ top: document.getElementById("event-form")?.offsetTop || 0, behavior: "smooth" })
  }

  const counts: Record<FilterState, number> = {
    ALL: events.length,
    DRAFT: events.filter((e) => e.status === "DRAFT").length,
    PUBLISHED: events.filter((e) => e.status === "PUBLISHED").length,
    CANCELLED: events.filter((e) => e.status === "CANCELLED").length,
    COMPLETED: events.filter((e) => e.status === "COMPLETED").length,
    ARCHIVED: events.filter((e) => e.status === "ARCHIVED").length,
  }

  const filteredEvents = filter === "ALL" ? events : events.filter((e) => e.status === filter)

  return (
    <Panel kicker="Website & Gastronomy" title="Events Management">
      <p className="text-xs text-[var(--sage)] mb-5">
        Published events appear on the public site (
        <code className="text-[10px] bg-[var(--beige)] text-[var(--forest)] font-mono px-1.5 py-0.5 rounded">
          /events
        </code>
        ). Draft, cancelled, completed, and archived events remain in this panel and are hidden from guests.
      </p>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs uppercase tracking-wider">
        {(["ALL", "PUBLISHED", "DRAFT", "COMPLETED", "CANCELLED", "ARCHIVED"] as FilterState[]).map((tab) => {
          const isActive = filter === tab
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-lg border transition-all duration-150 inline-flex items-center gap-2 ${
                isActive
                  ? "bg-[var(--forest)] text-white border-[var(--forest)] font-bold shadow-sm"
                  : "bg-white text-[var(--forest)] border-[var(--line)] hover:bg-[var(--beige)]/40 font-semibold"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-stone-100 text-[var(--forest)]"
                }`}
              >
                {counts[tab]}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="p-8 text-center bg-white/60 border border-[var(--line)] rounded-xl mb-6">
          <div className="w-6 h-6 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs uppercase tracking-wider text-[var(--sage)] font-medium">Loading events...</p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4">
          <SectionMessage>{error}</SectionMessage>
        </div>
      ) : null}

      {notice ? (
        <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-300 px-4 py-2.5 rounded-lg mb-4 font-medium flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          {notice}
        </p>
      ) : null}

      {!loading && filteredEvents.length === 0 ? (
        <div className="bg-white/70 border border-[var(--line)] rounded-xl p-8 text-center mb-6">
          <p className="text-sm text-[var(--sage)] font-medium">No events match the "{filter}" filter.</p>
        </div>
      ) : null}

      {filteredEvents.length > 0 ? (
        <div className="space-y-4 mb-8">
          {filteredEvents.map((event) => (
            <article
              key={event.id}
              className="group bg-white border border-[var(--line)] rounded-xl p-4 md:p-5 shadow-xs hover:border-[var(--forest)] hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center gap-5"
            >
              {/* Thumbnail (160–220px fixed width on desktop, aspect cover) */}
              <div className="relative w-full md:w-52 h-44 sm:h-48 md:h-32 shrink-0 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--beige)]/30">
                <EventThumbnail imageUrl={event.imageUrl} title={event.title} />
              </div>

              {/* Title, location, date, time & metadata */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-[var(--copper)] uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[var(--copper)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {eventWhen(event)}
                  </span>
                  {event.slug && (
                    <span className="text-[10px] text-[var(--sage)] bg-[var(--cream)] px-2 py-0.5 rounded border border-[var(--line)] font-mono">
                      /{event.slug}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-xl md:text-2xl text-[var(--forest)] font-bold leading-snug group-hover:text-[var(--gold)] transition-colors">
                  {event.title}
                </h3>

                <p className="text-xs text-[var(--sage)] flex items-center gap-1.5 mt-1 font-medium">
                  <svg className="w-3.5 h-3.5 text-[var(--copper)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {event.location}
                </p>

                {event.shortDescription || event.description ? (
                  <p className="text-xs text-[var(--dark)]/75 mt-2 line-clamp-2 leading-relaxed">
                    {event.shortDescription || event.description}
                  </p>
                ) : null}
              </div>

              {/* Status Badge & Action Buttons */}
              <div className="w-full md:w-auto shrink-0 flex flex-col md:items-end justify-between self-stretch gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)]">
                <div>{statusBadge(event.status)}</div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => edit(event)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 hover:text-stone-900 transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--forest)] cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit
                  </button>

                  {event.status !== "PUBLISHED" && event.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(event, "PUBLISHED")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Publish
                    </button>
                  ) : null}

                  {event.status === "PUBLISHED" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => changeStatus(event, "COMPLETED")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-sky-600 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => changeStatus(event, "DRAFT")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-amber-600 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Unpublish
                      </button>
                    </>
                  ) : null}

                  {event.status !== "CANCELLED" && event.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(event, "CANCELLED")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-rose-600 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  ) : null}

                  {event.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => archive(event)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-600 hover:bg-stone-700 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-stone-500 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                      Archive
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => changeStatus(event, "DRAFT")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {/* Create / Edit Form */}
      <div id="event-form" className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
          <div>
            <h3 className="font-serif text-2xl text-[var(--forest)] font-bold">
              {editingId ? "Edit Event" : "Create New Event"}
            </h3>
            <p className="text-xs text-[var(--sage)] mt-0.5">
              {editingId
                ? "Update existing event schedule and presentation"
                : "Fill out details to publish a new gastronomy event or tasting"}
            </p>
          </div>
          {editingId ? (
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 rounded-full">
              Editing in progress
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 text-xs">
          <label>
            <span className="font-semibold text-stone-700">
              Title <span className="text-rose-600">*</span>
            </span>
            <input
              className={fieldClass}
              placeholder="e.g. Basque Gastronomy Evening"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Slug{" "}
              <span className="text-[10px] font-normal text-[var(--sage)]">
                (optional — auto-generated from title if blank)
              </span>
            </span>
            <input
              className={fieldClass}
              placeholder="e.g. basque-gastronomy-evening"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Location <span className="text-rose-600">*</span>
            </span>
            <input
              className={fieldClass}
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">Status</span>
            <select
              className={fieldClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED", "ARCHIVED"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Start date (YYYY-MM-DD) <span className="text-rose-600">*</span>
            </span>
            <input
              type="date"
              className={fieldClass}
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              End date (YYYY-MM-DD){" "}
              <span className="text-[10px] font-normal text-[var(--sage)]">(optional)</span>
            </span>
            <input
              type="date"
              className={fieldClass}
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Start time (HH:mm) <span className="text-rose-600">*</span>
            </span>
            <input
              className={fieldClass}
              placeholder="13:00"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              End time (HH:mm){" "}
              <span className="text-[10px] font-normal text-[var(--sage)]">(optional)</span>
            </span>
            <input
              className={fieldClass}
              placeholder="16:00"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
            />
          </label>
          <label className="md:col-span-2">
            <span className="font-semibold text-stone-700">
              Short description{" "}
              <span className="text-[10px] font-normal text-[var(--sage)]">(max 280 characters)</span>
            </span>
            <input
              className={fieldClass}
              placeholder="Brief summary shown on cards"
              value={form.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
            />
          </label>
          <label className="md:col-span-2">
            <span className="font-semibold text-stone-700">
              Description <span className="text-rose-600">*</span>
            </span>
            <textarea
              className={fieldClass}
              rows={4}
              placeholder="Full event description and schedule..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <label className="md:col-span-2">
            <span className="font-semibold text-stone-700">
              Image URL{" "}
              <span className="text-[10px] font-normal text-stone-500">(valid public https URL)</span>
            </span>
            <input
              className={fieldClass}
              placeholder="https://images.unsplash.com/..."
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            className="btn gold text-xs uppercase tracking-wider font-bold rounded-lg cursor-pointer disabled:opacity-50"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving..." : editingId ? "Update event" : "Create event"}
          </button>
          {editingId ? (
            <button
              type="button"
              className="px-4 py-2.5 rounded-lg text-xs text-stone-700 font-semibold border border-stone-300 hover:bg-stone-100 transition-colors cursor-pointer"
              onClick={() => {
                setEditingId("")
                setForm(emptyForm)
              }}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>
    </Panel>
  )
}
