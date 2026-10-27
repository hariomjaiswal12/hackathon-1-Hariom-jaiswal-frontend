import { request } from "./apiClient"
import type { AvailabilityResult } from "@/types/api"

export const availabilityService = {
  async getAvailability(params: {
    date: string
    time: string
    guests: number
  }): Promise<AvailabilityResult> {
    const res = await request<{ availability: AvailabilityResult }>("/availability", {
      params,
    })
    return res.availability
  },
}
