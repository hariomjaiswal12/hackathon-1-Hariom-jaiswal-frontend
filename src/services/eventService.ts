import { request } from "./apiClient"
import type { EventStatus, RestaurantEvent } from "@/types/api"

export type EventInput = {
  title: string
  slug?: string
  description: string
  shortDescription?: string
  imageUrl?: string | null
  location: string
  startDate: string
  endDate?: string
  startTime: string
  endTime?: string | null
  status?: EventStatus
}

export const eventService = {
  async listPublic(params?: { scope?: "upcoming" | "past" | "all"; date?: string }) {
    const data = await request<{ events: RestaurantEvent[] }>("/events", { params })
    return data.events
  },

  async getPublic(slug: string) {
    const data = await request<{ event: RestaurantEvent }>(`/events/${encodeURIComponent(slug)}`)
    return data.event
  },

  async listAdmin(status?: EventStatus) {
    const data = await request<{ events: RestaurantEvent[] }>("/admin/events", {
      params: { status },
    })
    return data.events
  },

  async create(input: EventInput) {
    const data = await request<{ event: RestaurantEvent }>("/admin/events", {
      method: "POST",
      body: input,
    })
    return data.event
  },

  async update(id: string, input: Partial<EventInput>) {
    const data = await request<{ event: RestaurantEvent }>(`/admin/events/${id}`, {
      method: "PATCH",
      body: input,
    })
    return data.event
  },

  async archive(id: string) {
    const data = await request<{ event: RestaurantEvent }>(`/admin/events/${id}`, {
      method: "DELETE",
    })
    return data.event
  },
}
