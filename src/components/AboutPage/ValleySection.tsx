import { aboutImages, peakMarkers, peaks } from "@/data/about"
import { contact } from "@/data/site"
import { useParallax } from "@/hooks/useParallax"
import { Arrow } from "@/components/UI/Arrow"

export function ValleySection() {
  const photo = useParallax<HTMLDivElement>(0.1)

  return (
    <section className="valley-place" id="valley">
      <div className="valley-head reveal">
        <p className="kicker dark">Non gauden · Where we are</p>
        <h2>
          The Aramaio
          <br />
          <em>valley.</em>
        </h2>
      </div>
      <div className="valley-grid">
        <div className="valley-photo reveal" ref={photo} tabIndex={0}>
          <img src={aboutImages.mountains} alt="Mountain ridges surrounding a green valley" />
          {peakMarkers.map((marker, index) => (
            <span
              className="peak"
              key={marker.name}
              style={{ left: marker.x, top: marker.y, transitionDelay: `${index * 40}ms` }}
            >
              <i />
              <span>{marker.name}</span>
            </span>
          ))}
        </div>
        <div className="valley-copy reveal">
          <p className="valley-name">
            Suiza Txiki
            <small>Little Switzerland</small>
          </p>
          <p>
            The valley sits in northern Álava, held by mountains and softened by an Atlantic
            climate. Mist, green pasture and a long growing season shape the fruit.
          </p>
          <div className="valley-facts">
            <div>
              <strong>Aramaio</strong>
              <span>Álava · Basque Country</span>
            </div>
            <div>
              <strong>485 m</strong>
              <span>Altitude</span>
            </div>
            <div>
              <strong>Atlantic</strong>
              <span>Climate</span>
            </div>
          </div>
          <p className="peak-list">
            {peaks.map((peak) => peak.name).join("  ·  ")}
          </p>
          <a className="line-link ink" href={contact.maps} target="_blank" rel="noreferrer">
            How to get here <Arrow />
          </a>
        </div>
      </div>
      <div className="peaks-mobile" aria-label="Mountains around Aramaio">
        {peaks.map((peak) => (
          <article key={peak.name}>
            <span>{peak.side}</span>
            <h3>{peak.name}</h3>
            <p>{peak.note}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
