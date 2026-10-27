export const houseFacts = [
  { label: "Address", value: "Arraga auzoa, 2", detail: "01169 Aramaio · Álava" },
  { label: "Bookings", value: "685 72 15 93", detail: "Phone and WhatsApp" },
  { label: "Email", value: "info@iturrieta.eus", detail: "For a written request" },
  { label: "Instagram", value: "@iturrietasagardotegia", detail: "The house, in season" },
] as const

export const routes = [
  {
    id: "vitoria",
    from: "Vitoria-Gasteiz",
    steps: ["N-240 to Legutio", "A-2620 to Aramaio (Ibarra)", "A-4025 up to the farmhouse"],
    href: "https://www.google.com/maps/dir/?api=1&origin=Vitoria-Gasteiz&destination=Arraga+auzoa+2,+01169+Aramaio",
  },
  {
    id: "donostia",
    from: "Donostia",
    steps: ["A-8 towards Arrasate-Mondragón", "Exit 130", "First entrance into Ibarra, then the wooden Iturrieta sign"],
    href: "https://www.google.com/maps/dir/?api=1&origin=Donostia&destination=Arraga+auzoa+2,+01169+Aramaio",
  },
  {
    id: "bilbao",
    from: "Bilbao",
    steps: ["Follow the valley road to Aramaio", "Look for the wooden Iturrieta sign before Arraga"],
    href: "https://www.google.com/maps/dir/?api=1&origin=Bilbao&destination=Arraga+auzoa+2,+01169+Aramaio",
  },
] as const
