import { request } from "./apiClient"
import type { ClosedDay, DaySchedule, EffectiveSchedule } from "@/types/api"

export const scheduleService = {
  async getWeeklySchedule(): Promise<DaySchedule[]> {
    const res = await request<any>("/schedules")
    return res.schedules || res.schedule || []
  },

  async getDaySchedule(day: string): Promise<DaySchedule> {
    const res = await request<{ schedule: DaySchedule }>(`/schedules/${day}`)
    return res.schedule
  },

  async getEffectiveSchedule(date: string): Promise<EffectiveSchedule> {
    const res = await request<{ schedule: EffectiveSchedule }>(
      `/schedules/effective/${date}`
    )
    return res.schedule
  },

  async saveDaySchedule(
    day: string,
    data: {
      isOpen: boolean
      services: Array<{
        name: string
        startTime: string
        endTime: string
        lastBookingTime: string
        bookingDurationMinutes: number
        maxGuestsPerBooking: number
      }>
    }
  ): Promise<DaySchedule> {
    const res = await request<{ schedule: DaySchedule }>(`/schedules/${day}`, {
      method: "PUT",
      body: data,
    })
    return res.schedule
  },

  async getClosedDay(date: string): Promise<ClosedDay> {
    const res = await request<{ closedDay: ClosedDay }>(`/closed-days/${date}`)
    return res.closedDay
  },

  async listClosedDays(isActive?: boolean): Promise<ClosedDay[]> {
    const res = await request<{ closedDays: ClosedDay[] }>("/closed-days", {
      params: isActive !== undefined ? { isActive } : undefined,
    })
    return res.closedDays
  },

  async createClosedDay(data: {
    date: string
    reason?: string
  }): Promise<ClosedDay> {
    const res = await request<{ closedDay: ClosedDay }>("/closed-days", {
      method: "POST",
      body: data,
    })
    return res.closedDay
  },

  async updateClosedDay(
    id: string,
    data: { isActive?: boolean; reason?: string }
  ): Promise<ClosedDay> {
    const res = await request<{ closedDay: ClosedDay }>(`/closed-days/${id}`, {
      method: "PATCH",
      body: data,
    })
    return res.closedDay
  },
}
