import { request } from "./apiClient"
import type { NotificationItem } from "@/types/api"

export const notificationService = {
  async listNotifications(params?: {
    status?: "UNREAD" | "READ"
    type?: string
  }): Promise<NotificationItem[]> {
    const res = await request<{ notifications: NotificationItem[] }>(
      "/notifications",
      { params }
    )
    return res.notifications
  },

  async getNotification(id: string): Promise<NotificationItem> {
    const res = await request<{ notification: NotificationItem }>(
      `/notifications/${id}`
    )
    return res.notification
  },

  async markNotificationRead(id: string): Promise<NotificationItem> {
    const res = await request<{ notification: NotificationItem }>(
      `/notifications/${id}/read`,
      {
        method: "PATCH",
      }
    )
    return res.notification
  },

  async markAllNotificationsRead(): Promise<number> {
    const res = await request<{ updatedCount: number }>(
      "/notifications/read-all",
      {
        method: "PATCH",
      }
    )
    return res.updatedCount
  },
}
