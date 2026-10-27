import { request } from "./apiClient"
import type {
  DashboardActivity,
  DashboardBookingAnalytics,
  DashboardHourly,
  DashboardLive,
  DashboardOverview,
  DashboardServices,
  DashboardTables,
  DashboardWaitlistAnalytics,
} from "@/types/api"

function dateParams(date?: string) {
  return { date: date || undefined }
}

export const dashboardService = {
  getOverview(date?: string) {
    return request<DashboardOverview>("/admin/dashboard", { params: dateParams(date) })
  },

  getBookings(date: string) {
    return request<DashboardBookingAnalytics>("/admin/dashboard/bookings", {
      params: { date },
    })
  },

  getHourly(date: string) {
    return request<DashboardHourly>("/admin/dashboard/hourly", { params: { date } })
  },

  getServices(date: string) {
    return request<DashboardServices>("/admin/dashboard/services", { params: { date } })
  },

  getTables(date: string) {
    return request<DashboardTables>("/admin/dashboard/tables", { params: { date } })
  },

  getWaitlist(date?: string) {
    return request<DashboardWaitlistAnalytics>("/admin/dashboard/waitlist", {
      params: dateParams(date),
    })
  },

  getLive() {
    return request<DashboardLive>("/admin/dashboard/live")
  },

  getActivity() {
    return request<DashboardActivity>("/admin/dashboard/activity")
  },
}
