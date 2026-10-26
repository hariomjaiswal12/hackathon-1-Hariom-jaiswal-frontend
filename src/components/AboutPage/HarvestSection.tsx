import { harvestStages } from "@/data/about"

export function HarvestSection() {
  return (
    <section className="harvest" id="harvest">
      <div className="harvest-head reveal">
        <p className="kicker">Sagar bilketa · The harvest</p>
        <h2>
          How the harvest
          <br />
          <em>becomes cider.</em>
        </h2>
        <p>From the tree, through the press, and into the quiet of the barrel.</p>
      </div>
      <div className="process-track" tabIndex={0} aria-label="From orchard to cider">
        {harvestStages.map((stage) => (
          <article className="process-card" key={stage.number}>
            <div className="process-img">
              <img src={stage.image} alt={`${stage.title} stage of making cider`} />
              <span>{stage.number}</span>
            </div>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
