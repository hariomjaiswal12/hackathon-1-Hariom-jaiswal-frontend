import { Link } from "react-router-dom"
import { images } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function ContactHero() {
  return (
    <section className="contact-hero" id="contact-top">
      <div className="contact-hero-bg" style={{ backgroundImage: `url(${images.table})` }} aria-hidden="true" />
      <div className="contact-hero-overlay" aria-hidden="true" />
      <div className="contact-hero-copy">
        <p className="crumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          Contact
        </p>
        <p className="kicker">Kontaktua</p>
        <h1>
          <span>Contact</span>
          <span>bookings</span>
        </h1>
        <p className="contact-statement">
          Book your table or celebration.
          <br />
          <em>We'll be delighted to welcome you in Aramaio.</em>
        </p>
        <a className="btn gold" href="#bookings">
          Reserve a table <Arrow />
        </a>
      </div>
    </section>
  )
}
