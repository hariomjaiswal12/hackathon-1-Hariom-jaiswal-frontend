import { aboutImages } from "@/data/about"

export function BarrelSection() {
  return (
    <section className="barrels grain" id="barrels">
      <div className="barrel-frame reveal">
        <img src={aboutImages.barrel} alt="Cider resting in wooden barrels" />
      </div>
      <div className="barrel-copy reveal">
        <p className="kicker">Kupelan · In the barrel</p>
        <h2>
          Time does
          <br />
          <em>the rest.</em>
        </h2>
        <p>After the harvest, the cider rests and develops naturally in the barrel.</p>
      </div>
    </section>
  )
}
