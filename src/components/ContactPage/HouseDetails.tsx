import { aboutImages } from "@/data/about"
import { contact } from "@/data/site"
import { houseFacts } from "@/data/contactPage"

const hrefFor = (label: string) => {
  if (label === "Bookings") return contact.phoneHref
  if (label === "Email") return `mailto:${contact.email}`
  if (label === "Instagram") return contact.instagram
  return contact.maps
}

export function HouseDetails() {
  return (
    <section className="house" id="house">
      <div className="house-layout">
        <div className="reveal">
          <p className="kicker dark">The house</p>
          <h2>
            Iturrieta
            <br />
            <em>Sagardotegia.</em>
          </h2>
          <p>
            A family cider house at the end of the A-4025. Call before you come — the valley roads
            are easier with a confirmed table.
          </p>
        </div>
        <div className="reveal">
          <dl className="house-facts">
            {houseFacts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>
                  <a
                    href={hrefFor(fact.label)}
                    {...(fact.label === "Instagram" || fact.label === "Address"
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {fact.value}
                  </a>
                  <small>{fact.detail}</small>
                </dd>
              </div>
            ))}
          </dl>
          <figure>
            <img src={aboutImages.farm} alt="The farmhouse above the Aramaio valley" />
            <figcaption>Arraga auzoa · Aramaio</figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
