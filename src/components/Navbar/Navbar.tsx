import { useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { navLinks } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const { pathname, hash } = useLocation()

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

  return (
    <header className={`nav ${compact ? "compact" : ""}`}>
      <Link className="logo" to="/" onClick={close}>
        <b>I</b>
        <span>
          ITURRIETA
          <small>ARAMAIO</small>
        </span>
      </Link>
      <nav className={open ? "open" : ""} id="site-nav" aria-label="Primary">
        {navLinks.map((link) => {
          const active = link.to === "/" ? homeActive : link.to === "/about" ? aboutActive : false
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
