import { aboutImages, milestones } from "@/data/about"
import { useCountUp, useInView } from "@/hooks/useCountUp"

function Milestone({
  value,
  suffix,
  label,
}: {
  value: number
  suffix: string
  label: string
}) {
  const { ref, visible } = useInView<HTMLDivElement>(0.5)
  const count = useCountUp(value, visible)
  const display = value >= 1000 ? count.toLocaleString("en-GB") : String(count)

  return (
    <div ref={ref}>
      <strong>
        {display}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  )
}

export function OriginStory() {
  return (
    <section className="origin" id="origin">
      <div className="origin-layout">
        <div className="reveal">
          <p className="kicker dark">The farmhouse</p>
          <h2>
            From Vitoria to Aramaio,
            <br />
            <em>since 1997.</em>
          </h2>
        </div>
        <div className="origin-copy reveal">
          <p>
            Iturrieta is a family farming and livestock project. In 1997 we moved from Vitoria to
            this beautiful farmhouse in Aramaio and transformed the cattle and sheep stables into a
            cider house.
          </p>
          <p>It opened on 25 July 1998, St. James&apos;s Day.</p>
          <p>
            Initially, we planted 600 apple trees. Today we care for around 1,400 trees, combining
            Basque and Asturian varieties.
          </p>
          <p>
            After more than two decades in the cider world, we now produce certified natural organic
            cider.
          </p>
          <figure>
            <img src={aboutImages.apples} alt="Apples gathered from the Iturrieta orchard" />
            <figcaption>Basque and Asturian varieties</figcaption>
          </figure>
        </div>
      </div>
      <div className="origin-stats reveal" aria-label="Iturrieta milestones">
        {milestones.map((item) => (
          <Milestone key={item.label} value={item.value} suffix={item.suffix} label={item.label} />
        ))}
      </div>
    </section>
  )
}
