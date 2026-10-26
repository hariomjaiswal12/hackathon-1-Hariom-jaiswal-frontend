import { dishes } from "@/data/site"
import { MenuCard } from "@/components/MenuCard/MenuCard"

export function MenuSection() {
  return (
    <section className="menu" id="menu">
      <div className="menu-head reveal">
        <p className="kicker dark">At the table</p>
        <h2>
          Fire, cider,
          <br />
          <em>and the land.</em>
        </h2>
        <p>A generous table rooted in Basque tradition.</p>
      </div>
      <div className="dish-grid">
        {dishes.map((dish, index) => (
          <MenuCard
            key={dish.name}
            index={index}
            name={dish.name}
            description={dish.description}
            image={dish.image}
          />
        ))}
      </div>
    </section>
  )
}
