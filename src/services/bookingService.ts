import { request } from "./apiClient"
import type { Booking } from "@/types/api"

export const bookingService = {
  async createBooking(data: {
    date: string
    startTime: string
    guests: number
    tableId?: string
    tableIds?: string[]
    notes?: string
    customerId?: string
    source?: string
  }): Promise<Booking & { booking: Booking; payment?: any }> {
    const res = await request<{ booking: Booking; payment?: any }>("/bookings", {
      method: "POST",
      body: data,
    })
    const merged = Object.assign(res.booking, { booking: res.booking, payment: res.payment })
    return merged
  },

  async listBookings(params?: {
    date?: string
    status?: string
    customerId?: string
    tableId?: string
    source?: string
  }): Promise<Booking[]> {
    const res = await request<{ bookings: Booking[] }>("/bookings", { params })
    return res.bookings
  },

  async getBooking(reference: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(`/bookings/${reference}`)
    return res.booking
  },

  async cancelBooking(reference: string, reason?: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/cancel`,
      {
        method: "PATCH",
        body: { reason },
      }
    )
    return res.booking
  },

  async rescheduleBooking(
    reference: string,
    data: { date: string; startTime: string; tableId: string }
  ): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/reschedule`,
      {
        method: "PATCH",
        body: data,
      }
    )
    return res.booking
  },

  async arriveBooking(reference: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/arrive`,
      {
        method: "PATCH",
      }
    )
    return res.booking
  },

  async seatBooking(reference: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/seat`,
      {
        method: "PATCH",
      }
    )
    return res.booking
  },

  async completeBooking(reference: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/complete`,
      {
        method: "PATCH",
      }
    )
    return res.booking
  },

  async markNoShow(reference: string): Promise<Booking> {
    const res = await request<{ booking: Booking }>(
      `/bookings/${reference}/no-show`,
      {
        method: "PATCH",
      }
    )
    return res.booking
  },
}
