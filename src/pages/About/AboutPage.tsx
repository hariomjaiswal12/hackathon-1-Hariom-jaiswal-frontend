import "@/styles/about.css"
import { AboutCta } from "@/components/AboutPage/AboutCta"
import { AboutHero } from "@/components/AboutPage/AboutHero"
import { BarrelSection } from "@/components/AboutPage/BarrelSection"
import { FamilySection } from "@/components/AboutPage/FamilySection"
import { FarmhouseBand } from "@/components/AboutPage/FarmhouseBand"
import { HarvestSection } from "@/components/AboutPage/HarvestSection"
import { OrganicSection } from "@/components/AboutPage/OrganicSection"
import { OriginStory } from "@/components/AboutPage/OriginStory"
import { ProductCollage } from "@/components/AboutPage/ProductCollage"
import { ValleySection } from "@/components/AboutPage/ValleySection"
import { useReveal } from "@/hooks/useReveal"

export function AboutPage() {
  useReveal()

  return (
    <main id="content" className="page-enter">
      <AboutHero />
      <OriginStory />
      <FarmhouseBand />
      <ValleySection />
      <HarvestSection />
      <OrganicSection />
      <ProductCollage />
      <BarrelSection />
      <FamilySection />
      <AboutCta />
    </main>
  )
}
