export const images = {
  hero: "/images/hero.jpg",
  orchard: "/images/orchard.jpg",
  apples: "/images/apples.jpg",
  pour: "/images/pour.jpg",
  table: "/images/table.jpg",
  steak: "/images/steak.jpg",
  cod: "/images/cod.jpg",
  dessert: "/images/dessert.jpg",
  valley: "/images/valley.jpg",
  press: "/images/press.jpg",
  ferment: "/images/ferment.jpg",
} as const

export const contact = {
  phone: "+34 945 000 000",
  phoneHref: "tel:+34945000000",
  email: "kaixo@iturrieta.eus",
  whatsapp: "https://wa.me/34945000000?text=Kaixo%2C%20I%20would%20like%20to%20book%20a%20table",
  maps: "https://maps.google.com/?q=Arraga+auzoa+2+Aramaio",
} as const

export const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Menu", to: "/#menu" },
  { label: "Events", to: "/#events" },
  { label: "Contact", to: "/#visit" },
] as const

export const stages = [
  {
    number: "01",
    title: "Apple",
    text: "Old varieties, grown slowly in our organic orchard.",
    image: images.orchard,
  },
  {
    number: "02",
    title: "Harvest",
    text: "Picked by hand when the valley turns golden.",
    image: images.apples,
  },
  {
    number: "03",
    title: "Press",
    text: "Fruit, patience and nothing unnecessary.",
    image: images.press,
  },
  {
    number: "04",
    title: "Ferment",
    text: "Wild fermentation in our wooden kupelas.",
    image: images.ferment,
  },
  {
    number: "05",
    title: "Table",
    text: "The first pour begins a generous Basque evening.",
    image: images.pour,
  },
] as const

export const dishes = [
  {
    name: "Txuleta",
    description: "Traditional Basque grilled steak · sea salt · fire",
    image: images.steak,
  },
  {
    name: "Bacalao",
    description: "Basque-style cod · peppers · orchard herbs",
    image: images.cod,
  },
  {
    name: "Talo",
    description: "Corn flatbread · local chorizo · cider onions",
    image: images.table,
  },
  {
    name: "Apple",
    description: "Roasted apple · cider caramel · farmhouse cream",
    image: images.dessert,
  },
] as const

export const stats = [
  { value: "1,400", suffix: "+", label: "Organic apple trees" },
  { value: "1998", suffix: "", label: "Family tradition since" },
  { value: "Jan—May", suffix: "", label: "Cider season" },
  { value: "Thu—Sun", suffix: "", label: "Open to gather" },
] as const

export const bookingSteps = [
  "Choose your date",
  "Choose a time",
  "Select guests",
  "Choose your table",
  "Your details",
] as const

export const timeSlots = [
  { time: "19:00", note: "Available" },
  { time: "19:30", note: "Available" },
  { time: "20:00", note: "Most popular" },
  { time: "20:30", note: "Available" },
  { time: "21:00", note: "Available" },
  { time: "21:30", note: "Available" },
] as const

export const tables = [
  { id: 8, capacity: "2 guests", reserved: false, position: "t0" },
  { id: 9, capacity: "4 guests", reserved: false, position: "t1" },
  { id: 10, capacity: "Reserved", reserved: true, position: "t2" },
  { id: 11, capacity: "4 guests", reserved: false, position: "t3" },
  { id: 12, capacity: "2 guests", reserved: false, position: "t4" },
  { id: 14, capacity: "4 guests", reserved: false, position: "t5" },
] as const
