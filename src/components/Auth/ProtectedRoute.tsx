import type { ReactNode } from "react"
import { useAuth } from "@/context/AuthContext"
import { Arrow } from "@/components/UI/Arrow"

type ProtectedRouteProps = {
  children: ReactNode
  roles?: ("CUSTOMER" | "STAFF" | "ADMIN")[]
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, openAuthModal, sessionError, refreshUser } = useAuth()

  if (loading) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[var(--cream)]">
        <div className="w-8 h-8 border-2 border-[var(--forest)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[var(--dark)]">
          Verifying session...
        </p>
      </main>
    )
  }

  if (sessionError && !isAuthenticated) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[var(--cream)]">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--copper)] mb-2">
          Connection problem
        </p>
        <h2 className="font-serif text-3xl mb-4 text-[var(--dark)]">
          The reservation service is unreachable.
        </h2>
        <p className="text-xs text-gray-600 max-w-sm mb-6" role="alert">
          NETWORK_ERROR — {sessionError}
        </p>
        <button type="button" onClick={() => refreshUser()} className="btn gold flex items-center gap-2">
          Retry <Arrow />
        </button>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[var(--cream)]">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--copper)] mb-2">
          Authentication Required
        </p>
        <h2 className="font-serif text-3xl mb-4 text-[var(--dark)]">
          Please sign in to access your portal.
        </h2>
        <p className="text-xs text-gray-600 max-w-sm mb-6">
          Access your bookings, waitlist status, and personalized notifications.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="btn gold flex items-center gap-2"
        >
          Sign In Now <Arrow />
        </button>
      </main>
    )
  }

  if (roles && user && !roles.includes(user.role)) {
    const adminOnly = roles.length === 1 && roles[0] === "ADMIN"
    return (
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-[var(--cream)]">
        <p className="text-[10px] tracking-[0.2em] uppercase text-red-600 mb-2">
          Access Restricted
        </p>
        <h2 className="font-serif text-3xl mb-4 text-[var(--dark)]">
          {adminOnly ? "Restricted to administrators" : "Restricted to staff and administrators"}
        </h2>
        <p className="text-xs text-gray-600 max-w-sm mb-6">
          Your current account ({user.email}) has the <strong>{user.role}</strong> role and
          cannot access this area.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="btn gold flex items-center gap-2"
        >
          Switch Account <Arrow />
        </button>
      </main>
    )
  }

  return <>{children}</>
}
