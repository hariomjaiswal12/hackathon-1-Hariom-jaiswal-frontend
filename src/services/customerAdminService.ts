import { request } from "./apiClient"

export type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string | null
  role: "CUSTOMER"
  isActive: boolean
  noShowCount: number
  blacklistStatus: "ACTIVE" | "BLACKLISTED"
  blacklistReason: string | null
  blacklistedAt: string | null
  createdAt: string
  updatedAt: string
  bookings: { total: number }
}

export type CustomerPage = {
  customers: AdminCustomer[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const customerAdminService = {
  list(params: { q?: string; blacklistStatus?: "ACTIVE" | "BLACKLISTED" | ""; page?: number; limit?: number } = {}) {
    return request<CustomerPage>("/admin/customers", {
      params: {
        q: params.q || undefined,
        blacklistStatus: params.blacklistStatus || undefined,
        page: params.page,
        limit: params.limit,
      },
    })
  },

  get(id: string) {
    return request<{ customer: AdminCustomer }>(`/admin/customers/${id}`)
  },

  update(id: string, body: { name?: string; email?: string; phone?: string }) {
    return request<{ customer: AdminCustomer }>(`/admin/customers/${id}`, {
      method: "PATCH",
      body,
    })
  },
}
