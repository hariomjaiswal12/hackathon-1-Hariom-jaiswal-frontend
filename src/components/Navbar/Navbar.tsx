import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { navLinks } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"
import { useAuth } from "@/context/AuthContext"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const { pathname, hash } = useLocation()
  const {
    user,
    isAuthenticated,
    isAdmin,
    isStaffOrAdmin,
    unreadNotificationsCount,
    openAuthModal,
    logout,
  } = useAuth()

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 50)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname, hash])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  const close = () => setOpen(false)
  const homeActive = pathname === "/" && (hash === "" || hash === "#home")
  const aboutActive = pathname === "/about"
  const contactActive = pathname === "/contact"
  const eventsActive = pathname.startsWith("/events")
  const newsActive = pathname.startsWith("/news")
  const dashboardActive = pathname === "/dashboard"
  const operationsActive = pathname === "/operations"
  const adminDashboardActive = pathname === "/admin/dashboard"

  const isHeroPage = pathname === "/" || pathname === "/about" || pathname === "/contact"
  const hasSolidNav = compact || !isHeroPage

  return (
    <header className={`nav ${hasSolidNav ? "compact" : ""}`}>
      <Link className="logo" to="/" onClick={close}>
        <b>I</b>
        <span>
          ITURRIETA
          <small>ARAMAIO</small>
        </span>
      </Link>
      <nav className={open ? "open" : ""} id="site-nav" aria-label="Primary">
        {navLinks.map((link) => {
          const active =
            link.to === "/"
              ? homeActive
              : link.to === "/about"
              ? aboutActive
              : link.to === "/contact"
              ? contactActive
              : link.to === "/events"
              ? eventsActive
              : link.to === "/news"
              ? newsActive
              : false
          return (
            <Link
              key={link.to}
              to={link.to}
              className={active ? "active" : undefined}
              aria-current={active ? "page" : undefined}
              onClick={close}
            >
              {link.label}
            </Link>
          )
        })}

        {isAuthenticated && (
          <Link
            to="/dashboard"
            className={dashboardActive ? "active" : undefined}
            onClick={close}
          >
            My Bookings
            {unreadNotificationsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-[var(--gold)] text-[var(--dark)] rounded-full font-bold">
                {unreadNotificationsCount}
              </span>
            )}
          </Link>
        )}

        {isStaffOrAdmin && (
          <Link
            to="/operations"
            className={operationsActive ? "active" : undefined}
            onClick={close}
          >
            Operations ({user?.role})
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/admin/dashboard"
            className={adminDashboardActive ? "active" : undefined}
            onClick={close}
          >
            Admin
          </Link>
        )}

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className="text-[9px] uppercase tracking-wider text-white font-medium border-b border-transparent">
              {user?.name.split(" ")[0]}
            </span>
            <button
              type="button"
              onClick={() => {
                logout()
                close()
              }}
              className="text-[9px] uppercase tracking-wider text-[var(--gold)] hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              openAuthModal("login")
              close()
            }}
            className="text-[9px] uppercase tracking-widest text-white hover:text-[var(--gold)] font-semibold transition-colors cursor-pointer"
          >
            Sign In
          </button>
        )}

        <Link to="/#book" className="nav-cta" onClick={close}>
          Book a table <Arrow />
        </Link>
      </nav>
      <button
        className="hamburger"
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpen((current) => !current)}
      >
        <i />
        <i />
      </button>
    </header>
  )
}
