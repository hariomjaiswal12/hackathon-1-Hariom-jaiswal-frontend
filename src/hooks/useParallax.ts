import { useEffect, useRef } from "react"

export function useParallax<T extends HTMLElement>(speed = 0.12) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const narrow = window.matchMedia("(max-width: 768px)").matches
    if (reduce || narrow) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect()
        const shift = (rect.top - window.innerHeight * 0.4) * speed
        node.style.setProperty("--parallax", `${shift.toFixed(1)}px`)
      })
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
    }
  }, [speed])

  return ref
}
