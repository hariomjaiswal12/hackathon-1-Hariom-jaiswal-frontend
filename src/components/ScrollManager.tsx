import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const scrollToHash = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" })
      else window.scrollTo(0, 0)
    }

    const timer = window.setTimeout(scrollToHash, 60)
    return () => window.clearTimeout(timer)
  }, [pathname, hash])

  return null
}
