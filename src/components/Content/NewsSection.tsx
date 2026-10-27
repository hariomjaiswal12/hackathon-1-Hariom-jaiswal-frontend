import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { publishedLabel } from "@/components/Content/contentFormat"
import { formatApiError } from "@/lib/errors"
import { newsService } from "@/services/newsService"
import type { NewsArticle } from "@/types/api"

export function NewsSection() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setArticles(await newsService.listPublic())
    } catch (loadError) {
      setArticles([])
      setError(formatApiError(loadError, "News could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, attempt])

  const visible = articles.slice(0, 3)

  return (
    <section id="news" className="px-6 py-20 md:px-12 bg-white border-t border-[var(--line)]">
      <div className="max-w-6xl mx-auto">
        <p className="text-[10px] tracking-[0.22em] uppercase text-[var(--copper)] font-medium">
          From the valley · Chronicles
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-2 mb-10">
          <div>
            <h2 className="font-serif text-3xl md:text-5xl text-[var(--forest)]">Stories from Iturrieta</h2>
            <p className="text-xs md:text-sm text-[var(--brown)] mt-2">
              Orchard notes, cider house recipes, and traditions from the Basque Country.
            </p>
          </div>
          <Link
            to="/news"
            className="text-xs uppercase tracking-wider text-[var(--forest)] font-medium hover:text-[var(--gold)] transition-colors flex items-center gap-1"
          >
            All news &rarr;
          </Link>
        </div>
        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={!loading && !error && visible.length === 0 ? "No news is published right now." : undefined}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {visible.map((article) => (
              <Link
                key={article.id}
                to={`/news/${article.slug}`}
                className="group border border-[var(--line)] bg-[var(--cream)]/30 overflow-hidden flex flex-col hover:border-[var(--forest)] transition-all duration-300 hover:shadow-md"
              >
                <div className="relative h-44 w-full overflow-hidden bg-[var(--beige)]">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
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
                    {article.publishedAt ? (
                      <p className="text-[10px] uppercase tracking-wider text-[var(--copper)] font-medium">
                        {publishedLabel(article.publishedAt)}
                      </p>
                    ) : null}
                    <h3 className="font-serif text-xl text-[var(--forest)] group-hover:text-[var(--copper)] transition-colors mt-2 leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[var(--dark)]/80 mt-2.5 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                  <p className="mt-4 pt-3 border-t border-[var(--line)] text-[11px] uppercase tracking-wider text-[var(--forest)] font-bold group-hover:text-[var(--copper)] transition-colors">
                    Read story &rarr;
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
