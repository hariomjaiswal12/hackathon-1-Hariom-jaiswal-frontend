import "@/styles/contact.css"
import { BookingPanel } from "@/components/ContactPage/BookingPanel"
import { BusService } from "@/components/ContactPage/BusService"
import { ContactClose } from "@/components/ContactPage/ContactClose"
import { ContactHero } from "@/components/ContactPage/ContactHero"
import { Directions } from "@/components/ContactPage/Directions"
import { HoursBoard } from "@/components/ContactPage/HoursBoard"
import { HouseDetails } from "@/components/ContactPage/HouseDetails"
import { useReveal } from "@/hooks/useReveal"

export function ContactPage() {
  useReveal()

  return (
    <main id="content" className="page-enter">
      <ContactHero />
      <HouseDetails />
      <BookingPanel />
      <HoursBoard />
      <BusService />
      <Directions />
      <ContactClose />
    </main>
  )
}
