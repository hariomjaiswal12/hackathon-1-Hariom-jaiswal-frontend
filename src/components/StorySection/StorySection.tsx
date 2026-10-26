import { stages } from "@/data/site"

export function StorySection() {
  return (
    <section className="story" id="story">
      <div className="story-head reveal">
        <p className="kicker">The making of our cider</p>
        <h2>
          Born in the
          <br />
          <em>Aramaio valley.</em>
        </h2>
        <p>Swipe or scroll through the ritual.</p>
      </div>
      <div className="stage-track" tabIndex={0} aria-label="Cider making stages">
        {stages.map((stage) => (
          <article className="stage" key={stage.title}>
            <div className="stage-img">
              <img src={stage.image} alt={`${stage.title} stage of cider making`} />
              <span>{stage.number}</span>
            </div>
            <div>
              <h3>{stage.title}</h3>
              <p>{stage.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
