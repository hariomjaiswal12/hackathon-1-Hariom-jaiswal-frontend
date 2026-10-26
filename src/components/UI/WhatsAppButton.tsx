import { contact } from "@/data/site"

export function WhatsAppButton() {
  return (
    <a
      className="whatsapp"
      href={contact.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Book through WhatsApp"
    >
      WA
      <span>Book via WhatsApp</span>
    </a>
  )
}
