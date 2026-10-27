import { request } from "./apiClient"
import type { WaitlistEntry } from "@/types/api"

export const waitlistService = {
  async createWaitlist(data: {
    date: string
    requestedStartTime: string
    guests: number
    notes?: string
    customerId?: string
    source?: string
  }): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>("/waitlist", {
      method: "POST",
      body: data,
    })
    return res.waitlist
  },

  async listWaitlist(params?: {
    status?: string
    date?: string
    source?: string
  }): Promise<WaitlistEntry[]> {
    const res = await request<{ waitlist: WaitlistEntry[] }>("/waitlist", {
      params,
    })
    return res.waitlist
  },

  async getWaitlist(reference: string): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>(
      `/waitlist/${reference}`
    )
    return res.waitlist
  },

  async cancelWaitlist(reference: string): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>(
      `/waitlist/${reference}/cancel`,
      {
        method: "PATCH",
      }
    )
    return res.waitlist
  },

  async notifyWaitlist(reference: string): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>(
      `/waitlist/${reference}/notify`,
      {
        method: "PATCH",
      }
    )
    return res.waitlist
  },

  async convertWaitlist(reference: string): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>(
      `/waitlist/${reference}/convert`,
      {
        method: "PATCH",
      }
    )
    return res.waitlist
  },

  async expireWaitlist(reference: string): Promise<WaitlistEntry> {
    const res = await request<{ waitlist: WaitlistEntry }>(
      `/waitlist/${reference}/expire`,
      {
        method: "PATCH",
      }
    )
    return res.waitlist
  },
}
