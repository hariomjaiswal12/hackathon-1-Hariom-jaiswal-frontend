import { request } from "./apiClient"
import type { AdminJobStatus } from "@/types/api"

export const adminService = {
  async getJobStatus(): Promise<AdminJobStatus> {
    const res = await request<AdminJobStatus>("/admin/jobs/status")
    return res
  },
}
