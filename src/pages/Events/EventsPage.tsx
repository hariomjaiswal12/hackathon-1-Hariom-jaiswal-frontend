import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { eventDateBadge, eventTimeRange } from "@/components/Content/contentFormat"
import { formatBookingDate } from "@/lib/booking"
import { formatApiError } from "@/lib/errors"
import { eventService } from "@/services/eventService"
import type { RestaurantEvent } from "@/types/api"

type Scope = "upcoming" | "all" | "past"

export function EventsPage() {
  const [events, setEvents] = useState<RestaurantEvent[]>([])
  const [scope, setScope] = useState<Scope>("upcoming")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setEvents(await eventService.listPublic({ scope }))
    } catch (loadError) {
      setEvents([])
      setError(formatApiError(loadError, "Events could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => {
    load()
  }, [load, attempt])

  return (
    <main id="content" className="page-enter pt-32 pb-24 px-6 md:px-12 bg-[var(--cream)] min-h-screen text-[var(--dark)]">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-[var(--line)] pb-8 mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--copper)] font-medium">
            At the cider house · Sagardotegia
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-2">
            <div>
              <h1 className="font-serif text-4xl md:text-6xl text-[var(--forest)] tracking-tight">
                Events & Gatherings
              </h1>
              <p className="text-sm md:text-base text-[var(--brown)] mt-2 max-w-2xl leading-relaxed">
                Seasonal tastings, kupela barrel-opening dinners, and cultural feasts celebrating Basque gastronomy in the Aramaio valley.
              </p>
            </div>

            {/* Scope Filter Buttons */}
            <div className="flex items-center gap-2 bg-white border border-[var(--line)] p-1 rounded-sm text-xs shadow-xs">
              <button
                type="button"
                onClick={() => setScope("upcoming")}
                className={`px-3 py-1.5 transition-colors uppercase tracking-wider text-[10px] font-bold ${
                  scope === "upcoming"
                    ? "bg-[var(--forest)] text-white shadow-sm"
                    : "text-stone-700 hover:text-[var(--forest)] hover:bg-stone-100"
                }`}
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`px-3 py-1.5 transition-colors uppercase tracking-wider text-[10px] font-bold ${
                  scope === "all"
                    ? "bg-[var(--forest)] text-white shadow-sm"
                    : "text-stone-700 hover:text-[var(--forest)] hover:bg-stone-100"
                }`}
              >
                All Events
              </button>
              <button
                type="button"
                onClick={() => setScope("past")}
                className={`px-3 py-1.5 transition-colors uppercase tracking-wider text-[10px] font-bold ${
                  scope === "past"
                    ? "bg-[var(--forest)] text-white shadow-sm"
                    : "text-stone-700 hover:text-[var(--forest)] hover:bg-stone-100"
                }`}
              >
                Past
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={
            !loading && !error && events.length === 0
              ? scope === "upcoming"
                ? "No upcoming events scheduled right now. Check back soon or browse all events."
                : "No events found."
              : undefined
          }
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const badge = eventDateBadge(event.startDate)
              return (
                <article
                  key={event.id}
                  className="group bg-white border border-[var(--line)] overflow-hidden flex flex-col hover:border-[var(--forest)] transition-all duration-300 hover:shadow-md"
                >
                  {/* Card Image with Date Badge Overlay */}
                  <div className="relative h-52 w-full overflow-hidden bg-[var(--beige)]">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[var(--beige)] text-[var(--sage)] text-xs uppercase tracking-wider font-medium">
                        Iturrieta Sagardotegia
                      </div>
                    )}
                    {/* Date Badge Pill */}
                    {badge.month ? (
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-[var(--line)] px-2.5 py-1 text-center shadow-sm">
                        <span className="block text-[9px] font-bold tracking-widest text-[var(--copper)]">
                          {badge.month}
                        </span>
                        <span className="block font-serif text-lg leading-none font-bold text-[var(--forest)]">
                          {badge.day}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Date & Time Info */}
                      <p className="text-[11px] text-[var(--copper)] font-medium uppercase tracking-wider mb-2">
                        {formatBookingDate(event.startDate)}
                        {event.startTime ? ` · ${eventTimeRange(event.startTime, event.endTime)}` : ""}
                      </p>

                      {/* Title */}
                      <h2 className="font-serif text-2xl text-[var(--forest)] group-hover:text-[var(--gold)] transition-colors leading-snug">
                        <Link to={`/events/${event.slug}`}>{event.title}</Link>
                      </h2>

                      {/* Location */}
                      <p className="text-xs text-[var(--sage)] mt-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[var(--copper)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>

                      {/* Description */}
                      <p className="text-sm text-[var(--dark)]/80 mt-3 line-clamp-3 leading-relaxed">
                        {event.shortDescription || event.description}
                      </p>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-5 mt-5 border-t border-[var(--line)] flex items-center justify-between gap-3 text-xs">
                      <Link
                        to={`/events/${event.slug}`}
                        className="text-[var(--forest)] font-bold uppercase tracking-wider text-[11px] hover:text-[var(--copper)] transition-colors"
                      >
                        Details &rarr;
                      </Link>
                      <Link
                        to="/#book"
                        className="px-3.5 py-1.5 bg-[var(--forest)] text-white text-[10px] uppercase tracking-wider font-semibold hover:bg-[var(--dark)] transition-colors shadow-xs"
                      >
                        Book table
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </ContentStatus>
      </div>
    </main>
  )
}
