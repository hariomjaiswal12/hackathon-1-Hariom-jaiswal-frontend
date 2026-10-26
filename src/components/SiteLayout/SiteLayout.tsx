import type { ReactNode } from "react"
import { Footer } from "@/components/Footer/Footer"
import { Navbar } from "@/components/Navbar/Navbar"
import { WhatsAppButton } from "@/components/UI/WhatsAppButton"

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#content">
        Skip to content
      </a>
      <Navbar />
      {children}
      <Footer />
      <WhatsAppButton />
    </>
  )
}
