import { organicPillars } from "@/data/about"

export function OrganicSection() {
  return (
    <section className="organic" id="organic">
      <div className="organic-intro reveal">
        <p className="kicker">Sagardoa</p>
        <h2>
          Natural.
          <br />
          Organic.
          <br />
          <em>From our land.</em>
        </h2>
        <p>Our cider and apple juice are fully natural and organic, made with apples from our own orchards.</p>
      </div>
      <div className="organic-grid">
        {organicPillars.map((pillar) => (
          <article className="reveal" key={pillar.number}>
            <span>{pillar.number}</span>
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
