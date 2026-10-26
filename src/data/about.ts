import { images } from "@/data/site"

export const aboutImages = {
  hero: "/images/about-hero.jpg",
  farm: "/images/about-farm.jpg",
  mountains: "/images/about-mountains.jpg",
  barrel: "/images/about-barrel.jpg",
  bottle: "/images/about-bottle.jpg",
  juice: "/images/about-juice.jpg",
  sparkling: "/images/about-sparkling.jpg",
  family: "/images/about-family.jpg",
  fruit: "/images/about-fruit.jpg",
  orchard: images.orchard,
  apples: images.apples,
  press: images.press,
  ferment: images.ferment,
} as const

export const milestones = [
  { value: 1997, suffix: "", label: "Arrival in Aramaio" },
  { value: 1998, suffix: "", label: "Cider house opens" },
  { value: 600, suffix: "", label: "First apple trees" },
  { value: 1400, suffix: "+", label: "Apple trees today" },
  { value: 20, suffix: "+", label: "Years of cider making" },
] as const

export const peaks = [
  { name: "Orixol", side: "North", note: "A northern wall above the valley." },
  { name: "Anboto", side: "North", note: "The ridge the valley looks toward." },
  { name: "Udalaitz", side: "North", note: "Stone and cloud on the northern line." },
  { name: "Murugain", side: "East", note: "An eastern shoulder of the basin." },
  { name: "Kurtzebarri", side: "East", note: "Where the Atlantic weather arrives." },
  { name: "Aloña", side: "East", note: "A quiet crest beyond the orchards." },
  { name: "Aizkorri", side: "East", note: "The high country that closes the view." },
] as const

export const peakMarkers = [
  { name: "Orixol", x: "16%", y: "30%" },
  { name: "Anboto", x: "36%", y: "20%" },
  { name: "Udalaitz", x: "54%", y: "27%" },
  { name: "Murugain", x: "70%", y: "38%" },
  { name: "Kurtzebarri", x: "24%", y: "58%" },
  { name: "Aloña", x: "46%", y: "64%" },
  { name: "Aizkorri", x: "74%", y: "56%" },
] as const

export const harvestStages = [
  {
    number: "01",
    title: "Orchard",
    text: "Basque and Asturian varieties, grown slowly on the farm.",
    image: aboutImages.orchard,
  },
  {
    number: "02",
    title: "Harvest",
    text: "Picked by hand when the fruit is ready, not before.",
    image: aboutImages.apples,
  },
  {
    number: "03",
    title: "Press",
    text: "Selected fruit, pressed with nothing added.",
    image: aboutImages.press,
  },
  {
    number: "04",
    title: "Ferment",
    text: "The juice rests and becomes cider on its own time.",
    image: aboutImages.barrel,
  },
  {
    number: "05",
    title: "Cider",
    text: "Certified natural organic cider, poured at the table.",
    image: aboutImages.bottle,
  },
] as const

export const organicPillars = [
  {
    number: "01",
    title: "Healthy apple trees",
    text: "Sunny, well-ventilated orchards with diverse varieties.",
  },
  {
    number: "02",
    title: "Pruning & care",
    text: "Carefully maintained throughout the seasons.",
  },
  {
    number: "03",
    title: "Our own products",
    text: "Organic cider, apple juice, vinegar and apple cava.",
  },
] as const

export const products = [
  { title: "Cider", text: "Natural, from our own fruit.", image: aboutImages.bottle, className: "shot-a" },
  { title: "Apple juice", text: "Pressed and left as it is.", image: aboutImages.juice, className: "shot-b" },
  { title: "The orchard", text: "Fruit before it becomes anything else.", image: aboutImages.fruit, className: "shot-c" },
  { title: "Apple cava", text: "A brighter pour from the same land.", image: aboutImages.sparkling, className: "shot-d" },
  { title: "From the trees", text: "Organic, seasonal, ours.", image: aboutImages.apples, className: "shot-e" },
] as const
