import { About } from "@/components/About/About"
import { BookingSection } from "@/components/BookingSection/BookingSection"
import { Hero } from "@/components/Hero/Hero"
import { LocationSection } from "@/components/LocationSection/LocationSection"
import { MenuSection } from "@/components/MenuSection/MenuSection"
import { StorySection } from "@/components/StorySection/StorySection"
import { useReveal } from "@/hooks/useReveal"

export function Home() {
  useReveal()

  return (
    <main id="content" className="page-enter">
      <Hero />
      <About />
      <StorySection />
      <BookingSection />
      <MenuSection />
      <LocationSection />
    </main>
  )
}
