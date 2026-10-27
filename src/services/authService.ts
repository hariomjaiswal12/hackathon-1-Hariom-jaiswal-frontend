import { request, setToken } from "./apiClient"
import type { AuthResponseData, User } from "@/types/api"

export const authService = {
  async register(data: {
    name: string
    email: string
    phone?: string
    password: string
  }): Promise<AuthResponseData> {
    const res = await request<AuthResponseData>("/auth/register", {
      method: "POST",
      body: data,
      ignoreUnauthorized: true,
    })
    if (res?.token) {
      setToken(res.token)
    }
    return res
  },

  async login(data: {
    email: string
    password: string
  }): Promise<AuthResponseData> {
    const res = await request<AuthResponseData>("/auth/login", {
      method: "POST",
      body: data,
      ignoreUnauthorized: true,
    })
    if (res?.token) {
      setToken(res.token)
    }
    return res
  },

  async getMe(): Promise<User> {
    const res = await request<{ user: User }>("/auth/me")
    return res.user
  },

  logout() {
    setToken(null)
  },
}
