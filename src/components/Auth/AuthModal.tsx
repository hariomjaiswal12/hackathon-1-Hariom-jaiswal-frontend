import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import { Arrow } from "@/components/UI/Arrow"

export function AuthModal() {
  const { authModalOpen, authModalMode, closeAuthModal, login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">(authModalMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Synchronize initial mode when modal opens
  useEffect(() => {
    if (authModalOpen) {
      setMode(authModalMode)
      setError("")
    }
  }, [authModalMode, authModalOpen])

  if (!authModalOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          setError("Please provide both email and password.")
          setLoading(false)
          return
        }
        await login(email.trim(), password)
      } else {
        if (!name.trim()) {
          setError("Please enter your full name.")
          setLoading(false)
          return
        }
        if (!email.trim()) {
          setError("Please enter your email.")
          setLoading(false)
          return
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters long.")
          setLoading(false)
          return
        }
        await register(name.trim(), email.trim(), password, phone.trim() || undefined)
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setMode("login")
    setEmail(demoEmail)
    setPassword(demoPass)
    setError("")
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal()
      }}
    >
      <div className="relative w-full max-w-md bg-[var(--cream)] text-[var(--dark)] shadow-2xl p-8 border border-[var(--line)] max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-xs tracking-widest uppercase hover:text-[var(--copper)] transition-colors"
          aria-label="Close modal"
        >
          ✕ Close
        </button>

        <div className="mb-6">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--copper)]">
            TXOTX OS Identity
          </p>
          <h2 id="auth-modal-title" className="font-serif text-3xl mt-1 text-[var(--dark)]">
            {mode === "login" ? "Welcome back." : "Join the ritual."}
          </h2>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-[var(--line)] mb-6 text-xs uppercase tracking-wider">
          <button
            type="button"
            className={`pb-2.5 px-4 font-semibold transition-all ${
              mode === "login"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)]"
                : "text-stone-700 hover:text-[var(--forest)]"
            }`}
            onClick={() => {
              setMode("login")
              setError("")
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`pb-2.5 px-4 font-semibold transition-all ${
              mode === "register"
                ? "border-b-2 border-[var(--forest)] text-[var(--forest)]"
                : "text-stone-700 hover:text-[var(--forest)]"
            }`}
            onClick={() => {
              setMode("register")
              setError("")
            }}
          >
            Create Account
          </button>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="mb-6 p-3 bg-white/80 border border-[var(--line)] text-xs">
          <p className="text-[10px] uppercase tracking-wider text-stone-700 font-bold mb-2">
            Quick Fill Demo Accounts:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillQuickDemo("amaia@iturrieta.eus", "Customer12345!")}
              className="px-2.5 py-1 text-[11px] bg-white text-[var(--dark)] font-medium border border-[var(--line)] hover:bg-[var(--beige)] hover:border-[var(--forest)] transition-colors"
            >
              Customer (Amaia)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("staff@iturrieta.eus", "Staff12345!")}
              className="px-2.5 py-1 text-[11px] bg-white text-[var(--dark)] font-medium border border-[var(--line)] hover:bg-[var(--beige)] hover:border-[var(--forest)] transition-colors"
            >
              Staff Member
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo("admin@iturrieta.eus", "Admin12345!")}
              className="px-2.5 py-1 text-[11px] bg-white text-[var(--dark)] font-medium border border-[var(--line)] hover:bg-[var(--beige)] hover:border-[var(--forest)] transition-colors"
            >
              Administrator
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100/80 border border-red-300 text-red-800 text-xs rounded-none">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-[9px] uppercase tracking-[0.16em] mb-1">
                Full Name
              </label>
              <input
                required
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amaia Agirre"
                className="w-full bg-white border border-[var(--line)] px-3 py-2 text-sm text-[var(--dark)] focus:outline-none focus:border-[var(--forest)]"
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-[0.16em] mb-1">
              Email Address
            </label>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white border border-[var(--line)] px-3 py-2 text-sm text-[var(--dark)] focus:outline-none focus:border-[var(--forest)]"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-[9px] uppercase tracking-[0.16em] mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+34 685 72 15 92"
                className="w-full bg-white border border-[var(--line)] px-3 py-2 text-sm text-[var(--dark)] focus:outline-none focus:border-[var(--forest)]"
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-[0.16em] mb-1">
              Password {mode === "register" && "(min 8 chars)"}
            </label>
            <input
              required
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-[var(--line)] px-3 py-2 text-sm text-[var(--dark)] focus:outline-none focus:border-[var(--forest)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 px-6 bg-[var(--forest)] text-white hover:bg-[var(--dark)] transition-colors flex items-center justify-center gap-3 text-xs uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Connecting...</span>
            ) : mode === "login" ? (
              <>
                <span>Sign In to Iturrieta</span>
                <Arrow />
              </>
            ) : (
              <>
                <span>Create Customer Account</span>
                <Arrow />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
