import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ContentStatus } from "@/components/Content/ContentStatus"
import { publishedLabel } from "@/components/Content/contentFormat"
import { formatApiError } from "@/lib/errors"
import { newsService } from "@/services/newsService"
import { contact } from "@/data/site"
import type { NewsArticle } from "@/types/api"

export function NewsDetailPage() {
  const { slug = "" } = useParams()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setArticle(await newsService.getPublic(slug))
    } catch (loadError) {
      setArticle(null)
      setError(formatApiError(loadError, "This article could not be loaded."))
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load, attempt])

  return (
    <main id="content" className="page-enter pt-32 pb-24 px-6 md:px-12 bg-[var(--cream)] min-h-screen text-[var(--dark)]">
      <article className="max-w-4xl mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--forest)] hover:text-[var(--gold)] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all stories
          </Link>
        </div>

        <ContentStatus
          loading={loading}
          error={error}
          onRetry={() => setAttempt((value) => value + 1)}
          empty={!loading && !error && !article ? "This article is currently not published." : undefined}
        >
          {article ? (
            <div className="space-y-8">
              {/* Cover Image */}
              {article.imageUrl ? (
                <div className="relative overflow-hidden rounded-sm border border-[var(--line)] max-h-[480px] bg-[var(--beige)]">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover max-h-[480px]"
                  />
                </div>
              ) : null}

              {/* Header Info */}
              <div className="border-b border-[var(--line)] pb-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2.5 py-0.5 bg-[var(--forest)] text-white text-[9px] uppercase tracking-widest font-bold rounded-xs">
                    Cider Chronicle
                  </span>
                  {article.publishedAt ? (
                    <span className="text-xs text-[var(--copper)] font-medium uppercase tracking-wider">
                      {publishedLabel(article.publishedAt)}
                    </span>
                  ) : null}
                </div>

                <h1 className="font-serif text-3xl md:text-5xl text-[var(--forest)] tracking-tight leading-tight">
                  {article.title}
                </h1>

                {/* Excerpt Lead Paragraph */}
                <div className="mt-5 p-4 border-l-2 border-[var(--copper)] bg-white/60 text-base md:text-lg italic text-[var(--brown)] leading-relaxed">
                  {article.excerpt}
                </div>
              </div>

              {/* Main Content Body */}
              <div className="prose max-w-none text-base md:text-lg leading-relaxed text-[var(--dark)]/90 whitespace-pre-wrap space-y-4">
                {article.content}
              </div>

              {/* Author & Origin Byline */}
              <div className="border-t border-[var(--line)] pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--sage)]">
                <div>
                  <p className="font-serif text-sm text-[var(--forest)] font-bold">Sidrería Iturrieta Sagardotegia</p>
                  <p className="mt-0.5">Arraga auzoa 2, Aramaio · Family cider house since 1998</p>
                </div>
                <div className="flex gap-4">
                  <Link to="/events" className="text-[var(--forest)] underline hover:text-[var(--gold)]">
                    Upcoming Events &rarr;
                  </Link>
                  <Link to="/#book" className="text-[var(--forest)] underline hover:text-[var(--gold)]">
                    Book a Table &rarr;
                  </Link>
                </div>
              </div>

              {/* Bottom Visit Card */}
              <div className="bg-white border border-[var(--line)] p-8 rounded-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 mt-10">
                <div>
                  <h2 className="font-serif text-2xl text-[var(--forest)]">
                    Taste the tradition in person
                  </h2>
                  <p className="text-sm text-stone-700 mt-1 font-medium">
                    Reserve a table for traditional txotx cider pouring straight from the kupelas.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/#book"
                    className="px-6 py-3 bg-[var(--forest)] text-white text-xs uppercase tracking-widest font-bold hover:bg-[var(--dark)] transition-colors text-center whitespace-nowrap shadow-sm"
                  >
                    Reserve a Table &rarr;
                  </Link>
                  <a
                    href={contact.phoneHref}
                    className="px-4 py-3 border border-[var(--line)] bg-white text-[var(--dark)] text-xs uppercase tracking-wider font-semibold hover:bg-[var(--beige)] transition-colors text-center shadow-xs"
                  >
                    Call {contact.phoneShort}
                  </a>
                </div>
              </div>
            </div>
          ) : null}
        </ContentStatus>
      </article>
    </main>
  )
}