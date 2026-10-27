import { useCallback, useEffect, useRef, useState } from "react"
import { stages } from "@/data/site"

export function StorySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [isDesktop, setIsDesktop] = useState(false)
  const [sectionHeight, setSectionHeight] = useState<number | undefined>(undefined)
  const [activeIdx, setActiveIdx] = useState(0)

  // Cached dimensions to prevent layout thrashing during scroll events
  const dimensionsRef = useRef({
    maxTranslateX: 0,
    scrollDistance: 0,
    viewportWidth: 0,
    viewportHeight: 0,
  })

  // Measure and compute the exact vertical scroll distance required for horizontal travel
  const updateDimensions = useCallback(() => {
    if (!sectionRef.current || !trackRef.current) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const desktop =
      vw >= 1024 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    setIsDesktop(desktop)

    if (!desktop) {
      setSectionHeight(undefined)
      if (trackRef.current) {
        trackRef.current.style.transform = ""
      }
      return
    }

    const track = trackRef.current
    const scrollWidth = track.scrollWidth
    // Ensure the last card is fully revealed with comfortable breathing room (60-100px)
    const maxTranslate = Math.max(0, scrollWidth - vw)

    // Using a 1.15 multiplier provides ideal, natural scroll pacing without feeling rushed
    const verticalDistance = Math.round(maxTranslate * 1.15)
    const totalHeight = vh + verticalDistance

    dimensionsRef.current = {
      maxTranslateX: maxTranslate,
      scrollDistance: verticalDistance,
      viewportWidth: vw,
      viewportHeight: vh,
    }

    setSectionHeight(totalHeight)
  }, [])

  // Scroll listener using RequestAnimationFrame for performant 60/120fps animation
  useEffect(() => {
    updateDimensions()

    const handleResize = () => {
      updateDimensions()
    }
    window.addEventListener("resize", handleResize, { passive: true })

    // Observe track resizing when images finish loading
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions()
    })
    if (trackRef.current) {
      resizeObserver.observe(trackRef.current)
    }

    let rafId: number | null = null

    const onScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        rafId = null
        if (!isDesktop || !sectionRef.current || !trackRef.current) return

        const rect = sectionRef.current.getBoundingClientRect()
        const totalScrollable = rect.height - window.innerHeight
        if (totalScrollable <= 0) return

        // Scrolled distance within this pinned section
        const scrolled = -rect.top
        const progress = Math.min(Math.max(scrolled / totalScrollable, 0), 1)

        // Translate the horizontal track
        const translateX = progress * dimensionsRef.current.maxTranslateX
        trackRef.current.style.transform = `translate3d(-${translateX.toFixed(2)}px, 0, 0)`

        // Update progress bar indicator
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${progress.toFixed(4)})`
        }

        // Focal card calculation
        const numStages = stages.length
        const currentIdx = Math.min(
          numStages - 1,
          Math.max(0, Math.floor(progress * numStages + 0.15))
        )
        setActiveIdx(currentIdx)
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    // Initial calculation
    onScroll()

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", onScroll)
      resizeObserver.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [isDesktop, updateDimensions])

  // Smooth jump to any card when clicking on its progress indicator pill
  const scrollToStage = (index: number) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    const currentScrollY = window.scrollY
    const sectionTop = currentScrollY + rect.top
    const totalScrollable =
      (sectionHeight || sectionRef.current.offsetHeight) - window.innerHeight
    const targetProgress = index / (stages.length - 1)
    const targetScrollY = sectionTop + targetProgress * totalScrollable

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    })
  }

  // Handle native swipe on mobile
  const handleMobileScroll = () => {
    if (isDesktop || !trackRef.current) return
    const track = trackRef.current
    const maxScroll = track.scrollWidth - track.clientWidth
    if (maxScroll <= 0) return
    const progress = track.scrollLeft / maxScroll
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${Math.min(
        Math.max(progress, 0),
        1
      ).toFixed(4)})`
    }
    const cardWidth = track.clientWidth * 0.8
    const idx = Math.min(
      stages.length - 1,
      Math.max(0, Math.round(track.scrollLeft / cardWidth))
    )
    setActiveIdx(idx)
  }

  return (
    <section
      ref={sectionRef}
      className="story horizontal-story"
      id="story"
      style={{ height: isDesktop && sectionHeight ? `${sectionHeight}px` : undefined }}
    >
      <div className="story-sticky">
        <div className="story-sticky-inner">
          {/* Header & Story Progress Bar */}
          <div className="story-head reveal shown">
            <div className="story-title-group">
              <p className="kicker">The making of our cider</p>
              <h2>
                Born in the
                <br />
                <em>Aramaio valley.</em>
              </h2>
            </div>

            {/* Subtle Progress Bar & Interactive Stage Navigator */}
            <div className="story-progress-indicator" aria-label="Story stages">
              <div className="story-steps">
                {stages.map((stage, i) => (
                  <button
                    key={stage.number}
                    type="button"
                    onClick={() => scrollToStage(i)}
                    className={`story-step-btn ${activeIdx === i ? "is-active" : ""}`}
                    aria-label={`Jump to stage ${stage.number} ${stage.title}`}
                  >
                    <span className="step-dot" />
                    <span className="step-num">{stage.number}</span>
                    <span className="step-title">{stage.title}</span>
                  </button>
                ))}
              </div>
              <div className="story-progress-track">
                <div ref={progressBarRef} className="story-progress-fill" />
              </div>
            </div>
          </div>

          {/* Horizontal Track of Cards */}
          <div
            ref={trackRef}
            className="stage-track"
            tabIndex={0}
            aria-label="Cider making stages"
            onScroll={handleMobileScroll}
          >
            {stages.map((stage, index) => {
              const isActive = activeIdx === index
              return (
                <article
                  className={`stage ${isActive ? "active-stage" : ""}`}
                  key={stage.title}
                  data-index={index}
                >
                  <div className="stage-img">
                    <img
                      src={stage.image}
                      alt={`${stage.title} stage of cider making`}
                      loading="lazy"
                    />
                    <span>{stage.number}</span>
                    <div className="stage-img-gradient" />
                  </div>
                  <div className="stage-meta">
                    <h3>{stage.title}</h3>
                    <p>{stage.text}</p>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Subtle bottom scroll prompt / cue */}
          <div className="story-foot-cue" aria-hidden="true">
            <span className="cue-line" />
            <span className="cue-text">
              {isDesktop
                ? "Scroll vertically to explore the ritual · 01 Orchard to 05 Table"
                : "Swipe to explore the ritual"}
            </span>
            <span className="cue-line" />
          </div>
        </div>
      </div>
    </section>
  )
}
