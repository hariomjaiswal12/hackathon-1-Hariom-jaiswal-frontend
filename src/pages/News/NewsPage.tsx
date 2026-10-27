import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { publishedLabel } from "@/components/Content/contentFormat"
import { formatApiError } from "@/lib/errors"
import { newsService } from "@/services/newsService"
import type { NewsArticle } from "@/types/api"

export function NewsPage() {
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

  return (
    <main id="content" className="page-enter pt-32 pb-24 px-6 md:px-12 bg-[var(--cream)] min-h-screen text-[var(--dark)]">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-[var(--line)] pb-8 mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--copper)] font-medium">
            From the valley · Chronicles & Stories
          </p>
          <div className="mt-2">
            <h1 className="font-serif text-4xl md:text-6xl text-[var(--forest)] tracking-tight">
              News & Cider Life
            </h1>
            <p className="text-sm md:text-base text-[var(--brown)] mt-2 max-w-2xl leading-relaxed">
              Harvest dispatches, seasonal pairings, cellar craft notes, and centuries of cider house tradition in Aramaio.
            </p>
          </div>
        </div>

        {/* Articles Grid */}
        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={!loading && !error && articles.length === 0 ? "No news articles are published yet. Check back soon for stories from the cider house." : undefined}
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group bg-white border border-[var(--line)] overflow-hidden flex flex-col hover:border-[var(--forest)] transition-all duration-300 hover:shadow-md"
              >
                {/* Cover Image */}
                <div className="relative h-52 w-full overflow-hidden bg-[var(--beige)]">
                  {article.imageUrl ? (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-[var(--beige)] text-[var(--sage)] text-xs uppercase tracking-wider font-medium">
                      Iturrieta Sagardotegia
                    </div>
                  )}
                  {/* Category Chip */}
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-[var(--line)] px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold text-[var(--forest)] shadow-sm">
                    Cider Chronicle
                  </div>
                </div>

                {/* Article Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Publication Date */}
                    {article.publishedAt ? (
                      <p className="text-[11px] text-[var(--copper)] font-medium uppercase tracking-wider mb-2">
                        {publishedLabel(article.publishedAt)}
                      </p>
                    ) : null}

                    {/* Headline */}
                    <h2 className="font-serif text-2xl text-[var(--forest)] group-hover:text-[var(--gold)] transition-colors leading-snug">
                      <Link to={`/news/${article.slug}`}>{article.title}</Link>
                    </h2>

                    {/* Excerpt */}
                    <p className="text-sm text-[var(--dark)]/80 mt-3 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  {/* Read More Link */}
                  <div className="pt-5 mt-5 border-t border-[var(--line)] flex items-center justify-between text-xs">
                    <Link
                      to={`/news/${article.slug}`}
                      className="text-[var(--forest)] font-medium uppercase tracking-wider text-[11px] group-hover:text-[var(--gold)] transition-colors flex items-center gap-1.5"
                    >
                      Read full story &rarr;
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ContentStatus>
      </div>
    </main>
  )
}
