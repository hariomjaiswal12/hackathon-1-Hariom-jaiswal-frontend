import { aboutImages } from "@/data/about"
import { useParallax } from "@/hooks/useParallax"

export function FarmhouseBand() {
  const frame = useParallax<HTMLDivElement>(0.08)

  return (
    <section className="farmhouse" id="farmhouse">
      <div className="farmhouse-frame" ref={frame}>
        <img src={aboutImages.farm} alt="The Iturrieta farmhouse in the Aramaio countryside" />
      </div>
      <div className="farmhouse-overlay" aria-hidden="true" />
      <div className="farmhouse-copy reveal">
        <p className="kicker">Iturrieta</p>
        <h2>Where our story began.</h2>
        <i className="rule" />
      </div>
    </section>
  )
}
