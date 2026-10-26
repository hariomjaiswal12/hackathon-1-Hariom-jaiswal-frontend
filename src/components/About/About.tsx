import { Link } from "react-router-dom"
import { images, stats } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function About() {
  return (
    <section className="about" id="the-cider-house">
      <div className="about-title reveal">
        <p className="kicker dark">Our roots</p>
        <h2>
          A family cider house
          <br />
          <em>in the Aramaio valley.</em>
        </h2>
      </div>
      <div className="about-grid">
        <figure className="tall reveal">
          <div className="tall-frame">
            <img src={images.orchard} alt="Apple orchard in soft evening light" />
          </div>
          <figcaption>Our orchard · Aramaio</figcaption>
        </figure>
        <div className="about-copy reveal">
          <p className="lead">
            A family farm and cider house surrounded by the green folds of the Basque Country.
          </p>
          <p>
            Here, food follows the land. Our apples become cider in the old way, our fire is lit
            each morning, and every table is invited to share in the ritual.
          </p>
          <Link className="line-link ink" to="/about">
            Our story <Arrow />
          </Link>
        </div>
        <figure className="small-img reveal">
          <img src={images.apples} alt="Fresh red apples in wooden crates" />
        </figure>
      </div>
      <div className="stats reveal">
        {stats.map((stat) => (
          <div key={stat.label}>
            <strong>
              {stat.value}
              {stat.suffix ? <sup>{stat.suffix}</sup> : null}
            </strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
