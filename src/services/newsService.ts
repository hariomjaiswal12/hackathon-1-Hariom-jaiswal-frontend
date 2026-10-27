import { request } from "./apiClient"
import type { NewsArticle, NewsStatus } from "@/types/api"

export type NewsInput = {
  title: string
  slug?: string
  excerpt: string
  content: string
  imageUrl?: string | null
  status?: NewsStatus
}

export const newsService = {
  async listPublic() {
    const data = await request<{ articles: NewsArticle[] }>("/news")
    return data.articles
  },

  async getPublic(slug: string) {
    const data = await request<{ article: NewsArticle }>(`/news/${encodeURIComponent(slug)}`)
    return data.article
  },

  async listAdmin(status?: NewsStatus) {
    const data = await request<{ articles: NewsArticle[] }>("/admin/news", {
      params: { status },
    })
    return data.articles
  },

  async create(input: NewsInput) {
    const data = await request<{ article: NewsArticle }>("/admin/news", {
      method: "POST",
      body: input,
    })
    return data.article
  },

  async update(id: string, input: Partial<NewsInput>) {
    const data = await request<{ article: NewsArticle }>(`/admin/news/${id}`, {
      method: "PATCH",
      body: input,
    })
    return data.article
  },

  async archive(id: string) {
    const data = await request<{ article: NewsArticle }>(`/admin/news/${id}`, {
      method: "DELETE",
    })
    return data.article
  },
}
