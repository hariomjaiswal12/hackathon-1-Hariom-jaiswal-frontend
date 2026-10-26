import type { PointerEvent } from "react"
import { products } from "@/data/about"

function shiftImage(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return
  const bounds = event.currentTarget.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5
  event.currentTarget.style.setProperty("--mx", `${(x * 14).toFixed(1)}px`)
  event.currentTarget.style.setProperty("--my", `${(y * 10).toFixed(1)}px`)
}

export function ProductCollage() {
  return (
    <section className="products" id="products">
      <div className="products-head reveal">
        <p className="kicker dark">From the farmhouse</p>
        <h2>
          What the orchard
          <br />
          <em>gives us.</em>
        </h2>
      </div>
      <div className="collage">
        {products.map((product) => (
          <figure
            className={product.className}
            key={product.title}
            onPointerMove={shiftImage}
            onPointerLeave={(event) => {
              event.currentTarget.style.removeProperty("--mx")
              event.currentTarget.style.removeProperty("--my")
            }}
          >
            <img src={product.image} alt={product.title} />
            <figcaption>
              <strong>{product.title}</strong>
              <span>{product.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
