import { request } from "./apiClient"

export type BlacklistStatus = "ACTIVE" | "BLACKLISTED"

export type BlacklistCustomer = {
  id: string
  name: string
  email: string
  phone: string | null
  role: "CUSTOMER"
  noShowCount: number
  blacklistStatus: BlacklistStatus
  blacklistedAt: string | null
  blacklistReason: string | null
}

export const blacklistService = {
  list(params: { blacklistStatus?: BlacklistStatus; minNoShowCount?: number } = {}) {
    return request<{ customers: BlacklistCustomer[] }>("/admin/blacklist", {
      params: {
        blacklistStatus: params.blacklistStatus,
        minNoShowCount: params.minNoShowCount,
      },
    })
  },

  get(userId: string) {
    return request<{ customer: BlacklistCustomer }>(`/admin/blacklist/${userId}`)
  },

  blacklist(userId: string, reason: string) {
    return request<{ customer: BlacklistCustomer }>(`/admin/blacklist/${userId}`, {
      method: "PATCH",
      body: { reason },
    })
  },

  unblock(userId: string) {
    return request<{ customer: BlacklistCustomer }>(`/admin/blacklist/${userId}/unblock`, {
      method: "PATCH",
    })
  },
}
