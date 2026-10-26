type MenuCardProps = {
  index: number
  name: string
  description: string
  image: string
}

export function MenuCard({ index, name, description, image }: MenuCardProps) {
  const number = String(index + 1).padStart(2, "0")

  return (
    <article className="dish reveal">
      <div>
        <img src={image} alt={name} />
        <span>{number}</span>
      </div>
      <h3>{name}</h3>
      <p>{description}</p>
    </article>
  )
}
