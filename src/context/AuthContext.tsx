import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { authService } from "@/services/authService"
import { notificationService } from "@/services/notificationService"
import { ApiError, getToken } from "@/services/apiClient"
import { connectRealtime, disconnectRealtime, subscribeNotificationUpdates } from "@/services/realtime"
import type { User } from "@/types/api"

type AuthContextType = {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isStaff: boolean
  isAdmin: boolean
  isStaffOrAdmin: boolean
  authModalOpen: boolean
  authModalMode: "login" | "register"
  unreadNotificationsCount: number
  login: (email: string, pass: string) => Promise<User>
  register: (name: string, email: string, pass: string, phone?: string) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
  refreshNotificationsCount: () => Promise<void>
  sessionError: string | null
  openAuthModal: (mode?: "login" | "register") => void
  closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login")
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const refreshNotificationsCount = useCallback(async () => {
    if (!getToken()) {
      setUnreadNotificationsCount(0)
      return
    }
    try {
      const list = await notificationService.listNotifications({ status: "UNREAD" })
      setUnreadNotificationsCount(list.length)
    } catch (_err) {
      // ignore
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setSessionError(null)
      setLoading(false)
      return
    }

    try {
      const me = await authService.getMe()
      setUser(me)
      setSessionError(null)
      refreshNotificationsCount()
    } catch (err) {
      if (err instanceof ApiError && (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT")) {
        setSessionError(err.message)
      } else {
        authService.logout()
        setUser(null)
        setSessionError(null)
      }
    } finally {
      setLoading(false)
    }
  }, [refreshNotificationsCount])

  useEffect(() => {
    if (!user) {
      disconnectRealtime()
      return
    }
    const token = getToken()
    if (!token) return
    connectRealtime(token)
    const unsubscribe = subscribeNotificationUpdates(() => {
      refreshNotificationsCount()
    })
    return () => {
      unsubscribe()
      disconnectRealtime()
    }
  }, [user, refreshNotificationsCount])

  useEffect(() => {
    refreshUser()

    const handleUnauthorized = () => {
      authService.logout()
      setUser(null)
      setUnreadNotificationsCount(0)
    }

    window.addEventListener("txotx:unauthorized", handleUnauthorized)
    return () => {
      window.removeEventListener("txotx:unauthorized", handleUnauthorized)
    }
  }, [refreshUser])

  const login = async (email: string, pass: string) => {
    const res = await authService.login({ email, password: pass })
    setUser(res.user)
    setAuthModalOpen(false)
    refreshNotificationsCount()
    return res.user
  }

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    const res = await authService.register({ name, email, password: pass, phone })
    setUser(res.user)
    setAuthModalOpen(false)
    refreshNotificationsCount()
    return res.user
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setUnreadNotificationsCount(0)
  }

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }

  const closeAuthModal = () => {
    setAuthModalOpen(false)
  }

  const isAuthenticated = Boolean(user)
  const isStaff = user?.role === "STAFF"
  const isAdmin = user?.role === "ADMIN"
  const isStaffOrAdmin = isStaff || isAdmin

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isStaff,
        isAdmin,
        isStaffOrAdmin,
        authModalOpen,
        authModalMode,
        unreadNotificationsCount,
        login,
        register,
        logout,
        refreshUser,
        refreshNotificationsCount,
        sessionError,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
