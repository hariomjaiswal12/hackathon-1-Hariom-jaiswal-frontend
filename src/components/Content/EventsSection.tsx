import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { eventWhen } from "@/components/Content/contentFormat"
import { formatApiError } from "@/lib/errors"
import { eventService } from "@/services/eventService"
import type { RestaurantEvent } from "@/types/api"

export function EventsSection() {
  const [events, setEvents] = useState<RestaurantEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setEvents(await eventService.listPublic({ scope: "upcoming" }))
    } catch (loadError) {
      setEvents([])
      setError(formatApiError(loadError, "Events could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, attempt])

  const visible = events.slice(0, 3)

  return (
    <section id="events" className="px-6 py-20 md:px-12 bg-[var(--cream)] border-t border-[var(--line)]">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--copper)] font-medium">
          At the cider house · Sagardotegia
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 mb-10">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-[var(--forest)]">Upcoming gatherings</h2>
            <p className="text-xs md:text-sm text-[var(--brown)] mt-2">
              Join us for seasonal tastings, barrel feasts, and Basque gastronomy.
            </p>
          </div>
          <Link
            to="/events"
            className="text-xs uppercase tracking-wider text-[var(--forest)] font-medium hover:text-[var(--gold)] transition-colors flex items-center gap-1"
          >
            All events &rarr;
          </Link>
        </div>
        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={!loading && !error && visible.length === 0 ? "No upcoming events are published right now." : undefined}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {visible.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.slug}`}
                className="group bg-white border border-[var(--line)] overflow-hidden flex flex-col hover:border-[var(--forest)] transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-44 w-full overflow-hidden bg-[var(--beige)]">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-[var(--sage)]">
                      Iturrieta Sagardotegia
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--copper)] font-medium">
                      {eventWhen(event)}
                    </p>
                    <h3 className="font-serif text-xl text-[var(--forest)] group-hover:text-[var(--copper)] transition-colors mt-2 leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-xs text-stone-700 font-medium mt-1">{event.location}</p>
                    <p className="text-xs text-[var(--dark)]/80 mt-2.5 line-clamp-2 leading-relaxed">
                      {event.shortDescription || event.description}
                    </p>
                  </div>
                  <p className="mt-4 pt-3 border-t border-[var(--line)] text-[11px] uppercase tracking-wider text-[var(--forest)] font-bold group-hover:text-[var(--copper)] transition-colors">
                    View details &rarr;
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </ContentStatus>
      </div>
    </section>
  )
}
