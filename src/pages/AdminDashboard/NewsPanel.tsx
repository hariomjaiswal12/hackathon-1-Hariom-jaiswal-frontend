import { useCallback, useEffect, useState } from "react"
import { formatApiError } from "@/lib/errors"
import { publishedLabel } from "@/components/Content/contentFormat"
import { newsService, type NewsInput } from "@/services/newsService"
import type { NewsArticle, NewsStatus } from "@/types/api"
import { Panel, SectionMessage } from "./dashboardVisuals"

const fieldClass =
  "mt-1.5 block w-full bg-white border border-[var(--line)] rounded-lg px-3 py-2 text-xs text-[var(--dark)] focus:outline-none focus:ring-2 focus:ring-[var(--forest)]/20 focus:border-[var(--forest)] transition-all placeholder:text-stone-400"

type FilterState = "ALL" | NewsStatus

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  status: "DRAFT" as NewsStatus,
}

function statusBadge(status: NewsStatus) {
  const styles: Record<NewsStatus, { bg: string; text: string; border: string; dot: string }> = {
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

function ArticleThumbnail({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
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
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--forest)] opacity-80">
          Iturrieta Gazeta
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

export function NewsPanel() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
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
      setArticles(await newsService.listAdmin())
    } catch (loadError) {
      setArticles([])
      setError(formatApiError(loadError, "News could not be loaded."))
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
    if (!form.excerpt.trim()) {
      setError("Excerpt is required.")
      return
    }
    if (!form.content.trim()) {
      setError("Content is required.")
      return
    }

    const input: NewsInput = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
    }

    setSaving(true)
    setError("")
    setNotice("")
    try {
      if (editingId) {
        await newsService.update(editingId, input)
        setNotice(`Article "${form.title}" updated successfully.`)
      } else {
        await newsService.create(input)
        setNotice(`Article "${form.title}" created successfully.`)
      }
      setForm(emptyForm)
      setEditingId("")
      await load()
    } catch (saveError) {
      setError(formatApiError(saveError, "The article could not be saved."))
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (article: NewsArticle, status: NewsStatus) => {
    setError("")
    setNotice("")
    try {
      await newsService.update(article.id, { status })
      setNotice(
        status === "DRAFT"
          ? `Article "${article.title}" unpublished and marked draft.`
          : `Article "${article.title}" marked ${status.toLowerCase()}.`
      )
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The article could not be updated."))
    }
  }

  const archive = async (article: NewsArticle) => {
    setError("")
    setNotice("")
    try {
      await newsService.archive(article.id)
      setNotice(`Article "${article.title}" archived.`)
      await load()
    } catch (actionError) {
      setError(formatApiError(actionError, "The article could not be archived."))
    }
  }

  const edit = (article: NewsArticle) => {
    setEditingId(article.id)
    setForm({
      title: article.title,
      slug: article.slug || "",
      excerpt: article.excerpt,
      content: article.content,
      imageUrl: article.imageUrl || "",
      status: article.status,
    })
    window.scrollTo({ top: document.getElementById("news-form")?.offsetTop || 0, behavior: "smooth" })
  }

  const counts: Record<FilterState, number> = {
    ALL: articles.length,
    DRAFT: articles.filter((a) => a.status === "DRAFT").length,
    PUBLISHED: articles.filter((a) => a.status === "PUBLISHED").length,
    ARCHIVED: articles.filter((a) => a.status === "ARCHIVED").length,
  }

  const filteredArticles = filter === "ALL" ? articles : articles.filter((a) => a.status === filter)

  return (
    <Panel kicker="Website & Stories" title="News & Articles">
      <p className="text-xs text-[var(--sage)] mb-5">
        Only published articles appear on the public site (
        <code className="text-[10px] bg-[var(--beige)] text-[var(--forest)] font-mono px-1.5 py-0.5 rounded">
          /news
        </code>
        ). Draft and archived articles remain in this panel and are hidden from guests.
      </p>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs uppercase tracking-wider">
        {(["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"] as FilterState[]).map((tab) => {
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
          <p className="text-xs uppercase tracking-wider text-[var(--sage)] font-medium">Loading news...</p>
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

      {!loading && filteredArticles.length === 0 ? (
        <div className="bg-white/70 border border-[var(--line)] rounded-xl p-8 text-center mb-6">
          <p className="text-sm text-[var(--sage)] font-medium">No articles match the "{filter}" filter.</p>
        </div>
      ) : null}

      {filteredArticles.length > 0 ? (
        <div className="space-y-4 mb-8">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group bg-white border border-[var(--line)] rounded-xl p-4 md:p-5 shadow-xs hover:border-[var(--forest)] hover:shadow-md transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center gap-5"
            >
              {/* Thumbnail (160–220px fixed width on desktop, aspect cover) */}
              <div className="relative w-full md:w-52 h-44 sm:h-48 md:h-32 shrink-0 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--beige)]/30">
                <ArticleThumbnail imageUrl={article.imageUrl} title={article.title} />
              </div>

              {/* Title, excerpt, publish date & metadata */}
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
                    {article.publishedAt ? publishedLabel(article.publishedAt) : "Draft / Unpublished"}
                  </span>
                  {article.slug && (
                    <span className="text-[10px] text-[var(--sage)] bg-[var(--cream)] px-2 py-0.5 rounded border border-[var(--line)] font-mono">
                      /{article.slug}
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-xl md:text-2xl text-[var(--forest)] font-bold leading-snug group-hover:text-[var(--gold)] transition-colors">
                  {article.title}
                </h3>

                {article.excerpt ? (
                  <p className="text-xs text-[var(--dark)]/75 mt-2 line-clamp-2 leading-relaxed">
                    {article.excerpt}
                  </p>
                ) : null}
              </div>

              {/* Status Badge & Action Buttons */}
              <div className="w-full md:w-auto shrink-0 flex flex-col md:items-end justify-between self-stretch gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)]">
                <div>{statusBadge(article.status)}</div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => edit(article)}
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

                  {article.status !== "PUBLISHED" && article.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(article, "PUBLISHED")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all duration-150 shadow-xs focus-visible:outline-2 focus-visible:outline-emerald-600 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Publish
                    </button>
                  ) : null}

                  {article.status === "PUBLISHED" ? (
                    <button
                      type="button"
                      onClick={() => changeStatus(article, "DRAFT")}
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
                  ) : null}

                  {article.status !== "ARCHIVED" ? (
                    <button
                      type="button"
                      onClick={() => archive(article)}
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
                      onClick={() => changeStatus(article, "DRAFT")}
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
      <div id="news-form" className="bg-white border border-[var(--line)] rounded-xl p-6 shadow-sm mt-8">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
          <div>
            <h3 className="font-serif text-2xl text-[var(--forest)] font-bold">
              {editingId ? "Edit Article" : "Create New Article"}
            </h3>
            <p className="text-xs text-[var(--sage)] mt-0.5">
              {editingId
                ? "Update editorial content and publication status"
                : "Publish orchard chronicles, harvest notes, or culinary updates"}
            </p>
          </div>
          {editingId ? (
            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 rounded-full">
              Editing in progress
            </span>
          ) : null}
        </div>

        <div className="grid gap-4 text-xs">
          <label>
            <span className="font-semibold text-stone-700">
              Title <span className="text-rose-600">*</span>
            </span>
            <input
              className={fieldClass}
              placeholder="e.g. The 2026 Txotx Season Begins"
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
              placeholder="e.g. the-2026-txotx-season-begins"
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Excerpt <span className="text-rose-600">*</span>{" "}
              <span className="text-[10px] font-normal text-[var(--sage)]">
                (summary shown on cards, max 300 characters)
              </span>
            </span>
            <textarea
              className={fieldClass}
              rows={2}
              placeholder="Brief summary of the article..."
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
            />
          </label>
          <label>
            <span className="font-semibold text-stone-700">
              Full Content <span className="text-rose-600">*</span>
            </span>
            <textarea
              className={fieldClass}
              rows={6}
              placeholder="Full story, craft notes, or seasonal update..."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label>
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
            <label>
              <span className="font-semibold text-stone-700">Status</span>
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {["DRAFT", "PUBLISHED", "ARCHIVED"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            className="btn gold text-xs uppercase tracking-wider font-bold rounded-lg cursor-pointer disabled:opacity-50"
            disabled={saving}
            onClick={save}
          >
            {saving ? "Saving..." : editingId ? "Update article" : "Create article"}
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