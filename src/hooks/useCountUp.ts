import { useEffect, useRef, useState } from "react"

export function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true)
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, visible }
}

function countStart(target: number) {
  return target > 100 ? Math.round(target * 0.92) : 0
}

export function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(() => countStart(target))

  useEffect(() => {
    if (!active) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setValue(target)
      return
    }
    const start = target > 100 ? Math.round(target * 0.92) : 0
    const duration = 900
    const began = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - began) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(start + (target - start) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return value
}
