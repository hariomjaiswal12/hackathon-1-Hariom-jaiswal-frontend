import { Link } from "react-router-dom"
import { aboutImages } from "@/data/about"
import { contact } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function AboutCta() {
  return (
    <section className="farewell" id="visit-us">
      <img src={aboutImages.orchard} alt="The Iturrieta orchard at the end of the day" />
      <div className="farewell-overlay" aria-hidden="true" />
      <div className="farewell-copy">
        <div className="reveal">
        <p className="kicker">Zatozte</p>
        <h2>
          Come and
          <br />
          <em>meet us.</em>
        </h2>
        <p>Book your table or guided visit and experience cider from its origin.</p>
        <div className="actions">
          <Link className="btn gold" to="/#book">
            Book a table <Arrow />
          </Link>
          <Link className="line-link" to="/contact">
            Plan your visit <Arrow />
          </Link>
        </div>
        <div className="farewell-contact">
          <a href={contact.whatsapp} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={contact.phoneHref}>Phone</a>
        </div>
        </div>
      </div>
    </section>
  )
}
