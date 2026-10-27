import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { eventDateBadge, eventTimeRange } from "@/components/Content/contentFormat"
import { formatBookingDate } from "@/lib/booking"
import { formatApiError } from "@/lib/errors"
import { eventService } from "@/services/eventService"
import { contact } from "@/data/site"
import type { RestaurantEvent } from "@/types/api"

export function EventDetailPage() {
  const { slug = "" } = useParams()
  const [event, setEvent] = useState<RestaurantEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setEvent(await eventService.getPublic(slug))
    } catch (loadError) {
      setEvent(null)
      setError(formatApiError(loadError, "This event could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load, attempt])

  const badge = event ? eventDateBadge(event.startDate) : { month: "", day: "" }

  return (
    <main id="content" className="page-enter pt-32 pb-24 px-6 md:px-12 bg-[var(--cream)] min-h-screen text-[var(--dark)]">
      <article className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--forest)] hover:text-[var(--gold)] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all events
          </Link>
        </div>

        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={!loading && !error && !event ? "This event is currently not available or published." : undefined}
        >
          {event ? (
            <div className="space-y-8">
              {/* Event Cover Image */}
              {event.imageUrl ? (
                <div className="relative overflow-hidden rounded-sm border border-[var(--line)] max-h-[460px] bg-[var(--beige)]">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover max-h-[460px]"
                  />
                  {badge.month ? (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-[var(--line)] px-3 py-1.5 text-center shadow-md">
                      <span className="block text-[10px] font-bold tracking-widest text-[var(--copper)]">
                        {badge.month}
                      </span>
                      <span className="block font-serif text-2xl leading-none font-bold text-[var(--forest)]">
                        {badge.day}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Title & Metadata Header */}
              <div className="border-b border-[var(--line)] pb-6">
                <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--copper)] font-medium">
                  Iturrieta Gathering
                </p>
                <h1 className="font-serif text-3xl md:text-5xl text-[var(--forest)] mt-2 tracking-tight">
                  {event.title}
                </h1>

                {/* Key Metadata Chips */}
                <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-[var(--dark)]">
                  {/* Date Chip */}
                  <div className="flex items-center gap-2 bg-white border border-[var(--line)] px-3 py-1.5 rounded-sm">
                    <svg className="w-4 h-4 text-[var(--copper)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">
                      {formatBookingDate(event.startDate)}
                      {event.endDate && event.endDate !== event.startDate ? ` – ${formatBookingDate(event.endDate)}` : ""}
                    </span>
                  </div>

                  {/* Time Chip */}
                  <div className="flex items-center gap-2 bg-white border border-[var(--line)] px-3 py-1.5 rounded-sm">
                    <svg className="w-4 h-4 text-[var(--copper)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">
                      {eventTimeRange(event.startTime, event.endTime)}
                    </span>
                  </div>

                  {/* Location Chip */}
                  <div className="flex items-center gap-2 bg-white border border-[var(--line)] px-3 py-1.5 rounded-sm">
                    <svg className="w-4 h-4 text-[var(--copper)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{event.location}</span>
                  </div>

                  {event.status !== "PUBLISHED" ? (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded">
                      {event.status}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Event Content Description */}
              <div className="prose max-w-none text-base md:text-lg leading-relaxed text-[var(--dark)]/90 whitespace-pre-wrap">
                {event.description}
              </div>

              {/* Reservation CTA Box */}
              <div className="bg-white border border-[var(--line)] p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="font-serif text-2xl text-[var(--forest)]">
                    Join us for this experience
                  </h2>
                  <p className="text-sm text-stone-700 mt-1 font-medium">
                    Book your table in advance. Kupela tastings and seasonal menus fill quickly.
                  </p>
                </div>
                <Link
                  to="/#book"
                  className="px-6 py-3.5 bg-[var(--forest)] text-white text-xs uppercase tracking-widest font-bold hover:bg-[var(--dark)] transition-colors text-center whitespace-nowrap shadow-sm"
                >
                  Reserve a Table &rarr;
                </Link>
              </div>

              {/* Practical Info Card */}
              <div className="border-t border-[var(--line)] pt-6 grid sm:grid-cols-2 gap-4 text-xs text-stone-700">
                <div>
                  <p className="font-bold text-[var(--forest)] uppercase tracking-wider text-[10px] mb-1">
                    Location & Directions
                  </p>
                  <p>Arraga auzoa 2, 01169 Aramaio, Álava</p>
                  <a
                    href={contact.maps}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--forest)] underline hover:text-[var(--gold)] mt-1 inline-block"
                  >
                    Open in Google Maps &rarr;
                  </a>
                </div>
                <div>
                  <p className="font-medium text-[var(--dark)] uppercase tracking-wider text-[10px] mb-1">
                    Questions & Group Enquiries
                  </p>
                  <p>Call us at <a href={contact.phoneHref} className="text-[var(--dark)] font-medium underline">{contact.phone}</a> or write to <a href={`mailto:${contact.email}`} className="text-[var(--dark)] font-medium underline">{contact.email}</a></p>
                </div>
              </div>
            </div>
          ) : null}
        </ContentStatus>
      </article>
    </main>
  )
}
