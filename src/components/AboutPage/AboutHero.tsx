import { Link } from "react-router-dom"
import { aboutImages } from "@/data/about"
import { Arrow } from "@/components/UI/Arrow"

export function AboutHero() {
  return (
    <section className="about-hero" id="about-top">
      <div className="about-hero-bg" style={{ backgroundImage: `url(${aboutImages.hero})` }} aria-hidden="true" />
      <div className="about-hero-overlay" aria-hidden="true" />
      <div className="about-hero-copy">
        <p className="crumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          About
        </p>
        <p className="kicker">Nortzuk garen</p>
        <h1>
          <span>About</span>
          <span>us</span>
        </h1>
        <p className="about-statement">
          A family farming project
          <br />
          in the Aramaio valley,
          <br />
          <em>devoted to natural organic cider.</em>
        </p>
        <a className="btn gold" href="#origin">
          Discover our story <Arrow />
        </a>
      </div>
    </section>
  )
}
