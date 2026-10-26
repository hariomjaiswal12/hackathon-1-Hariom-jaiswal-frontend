import { images } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function LocationSection() {
  return (
    <section className="visit" id="visit">
      <img src={images.valley} alt="The green Aramaio valley" />
      <div className="visit-overlay" aria-hidden="true" />
      <div className="visit-copy reveal">
        <p className="kicker">Visit Iturrieta</p>
        <h2>
          Come to
          <br />
          <em>the valley.</em>
        </h2>
        <div className="visit-info">
          <p>
            Aramaio
            <br />
            Basque Country
          </p>
          <p>
            Thursday—Sunday
            <br />
            13:00—23:00
          </p>
        </div>
        <a
          className="btn cream"
          href="https://maps.google.com/?q=Aramaio"
          target="_blank"
          rel="noreferrer"
        >
          Get directions <Arrow />
        </a>
      </div>
      <div className="map-pin">
        <i />
        ITURRIETA
      </div>
    </section>
  )
}
