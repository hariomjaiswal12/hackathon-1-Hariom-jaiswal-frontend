import { aboutImages } from "@/data/about"

export function FamilySection() {
  return (
    <section className="family" id="family">
      <figure className="reveal">
        <img src={aboutImages.family} alt="A family reaching for apples in the orchard" />
      </figure>
      <div className="reveal">
        <p className="kicker dark">Etxean · At home</p>
        <h2>
          A family project.
          <br />
          <em>A place we call home.</em>
        </h2>
        <p>
          The work is still done by the people who live here. Farming, pruning, pressing and
          welcoming a table are part of the same day.
        </p>
        <p>
          Iturrieta is not a brand set on the land. It is the land, kept by a family, and offered
          with the hospitality of a house.
        </p>
      </div>
    </section>
  )
}
