import { Link } from "react-router-dom"
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
            Opening hours
            <br />
            follow the published schedule
          </p>
        </div>
        <Link className="btn cream" to="/contact#arrive">
          Get directions <Arrow />
        </Link>
      </div>
      <div className="map-pin">
        <i />
        ITURRIETA
      </div>
    </section>
  )
}
