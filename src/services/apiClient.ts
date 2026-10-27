import type { ApiErrorResponse, ApiResponse } from "@/types/api"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1"

export class ApiError extends Error {
  code: string
  status: number
  errors?: any[]

  constructor(message: string, code: string = "API_ERROR", status: number = 500, errors?: any[]) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
    this.errors = errors
  }
}

export function getToken(): string | null {
  return localStorage.getItem("txotx_token")
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("txotx_token", token)
  } else {
    localStorage.removeItem("txotx_token")
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  params?: Record<string, string | number | boolean | undefined | null>
  body?: any
  headers?: Record<string, string>
  /** Login and register return 401 for bad credentials. That is not an expired session. */
  ignoreUnauthorized?: boolean
}

export function apiOrigin() {
  return new URL(API_BASE_URL).origin
}

export async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", params, body, headers = {}, ignoreUnauthorized = false } = options

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString
    }
  }

  const token = getToken()
  const reqHeaders: Record<string, string> = {
    Accept: "application/json",
    ...headers,
  }

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`
  }

  let reqBody: string | undefined = undefined
  if (body !== undefined) {
    reqHeaders["Content-Type"] = "application/json"
    reqBody = JSON.stringify(body)
  }

  const REQUEST_TIMEOUT_MS = 20000
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: reqBody,
      signal: controller.signal,
    })
  } catch (netErr: any) {
    const timedOut = netErr?.name === "AbortError"
    throw new ApiError(
      timedOut
        ? "The server took too long to respond. Try again."
        : "Unable to connect to the server. Please check your network connection.",
      timedOut ? "TIMEOUT" : "NETWORK_ERROR",
      0
    )
  } finally {
    window.clearTimeout(timer)
  }

  let json: any = null
  try {
    json = await res.json()
  } catch (_e) {
    json = null
  }

  if (!res.ok) {
    if (res.status === 401 && !ignoreUnauthorized) {
      setToken(null)
      window.dispatchEvent(new CustomEvent("txotx:unauthorized"))
    }
    const errData: ApiErrorResponse = json || {
      success: false,
      code: "HTTP_" + res.status,
      message: res.statusText || "Request failed",
    }
    throw new ApiError(
      errData.message || `Request failed with status ${res.status}`,
      errData.code || "UNKNOWN_ERROR",
      res.status,
      errData.errors
    )
  }

  const apiRes: ApiResponse<T> = json
  return apiRes?.data as T
}
