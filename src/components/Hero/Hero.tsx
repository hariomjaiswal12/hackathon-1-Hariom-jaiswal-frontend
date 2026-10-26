import { images } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function Hero() {
  return (
    <section className="hero" id="home">
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${images.hero})` }}
        aria-hidden="true"
      />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-mark" aria-hidden="true">
        I
      </div>
      <div className="hero-copy">
        <p className="kicker">Sidrería Iturrieta · Aramaio, Basque Country</p>
        <h1>
          From the apple,
          <br />
          <em>to the table.</em>
        </h1>
        <p className="lede">
          A family cider house where the valley, the orchard and the table become one.
        </p>
        <div className="actions">
          <a className="btn gold" href="#book">
            Book a table <Arrow />
          </a>
          <a className="line-link" href="#the-cider-house">
            Discover Iturrieta <Arrow />
          </a>
        </div>
      </div>
      <a className="scroll" href="#the-cider-house">
        <i /> Scroll to enter
      </a>
      <div className="hero-note">
        42° 58′ N · 2° 35′ W
        <br />
        ARABA · EUSKADI
      </div>
    </section>
  )
}
