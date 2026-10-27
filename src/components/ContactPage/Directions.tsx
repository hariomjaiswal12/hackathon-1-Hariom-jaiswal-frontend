import { useState } from "react"
import { images } from "@/data/site"
import { routes } from "@/data/contactPage"
import { Arrow } from "@/components/UI/Arrow"

export function Directions() {
  const [active, setActive] = useState<(typeof routes)[number]["id"]>(routes[0].id)
  const route = routes.find((item) => item.id === active) ?? routes[0]

  return (
    <section className="arrive" id="arrive">
      <div className="arrive-head reveal">
        <p className="kicker dark">Nola iritsi</p>
        <h2>
          Follow the roads
          <br />
          <em>we know.</em>
        </h2>
        <p>
          Arraga auzoa · 01169 Aramaio. Coordinates 43º03'08"N 2º34'30"O. Some tracks in the valley
          do not reach the farmhouse, so follow these roads even if a sat-nav suggests another way.
        </p>
      </div>
      <div className="arrive-grid">
        <figure className="arrive-photo reveal">
          <img src={images.valley} alt="The approach to the farmhouse through green hills" />
        </figure>
        <div className="arrive-routes reveal">
          <div className="route-index" role="tablist" aria-label="Routes to Iturrieta">
            {routes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`route-${item.id}`}
                aria-selected={item.id === active}
                aria-controls="route-panel"
                className={item.id === active ? "on" : undefined}
                onClick={() => setActive(item.id)}
              >
                <small>From</small>
                {item.from}
              </button>
            ))}
          </div>
          <div className="route-panel" role="tabpanel" id="route-panel" aria-labelledby={`route-${route.id}`}>
            <ol>
              {route.steps.map((step, index) => (
                <li key={step}>
                  <span>0{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <a className="line-link ink" href={route.href} target="_blank" rel="noreferrer">
              See the route <Arrow />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
