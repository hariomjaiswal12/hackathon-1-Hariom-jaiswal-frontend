import { aboutImages } from "@/data/about"
import { contact } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function ContactClose() {
  return (
    <section className="contact-close" id="write">
      <img src={aboutImages.orchard} alt="Apple trees in the Iturrieta orchard" />
      <div className="contact-close-overlay" aria-hidden="true" />
      <div className="contact-close-copy">
        <div className="reveal">
          <p className="kicker">Zatozte</p>
          <h2>
            The table
            <br />
            <em>is yours.</em>
          </h2>
          <p>Call, write, or send a message. We'll keep a place in Aramaio.</p>
          <div className="actions">
            <a className="btn gold" href={contact.phoneHref}>
              Call {contact.phoneShort} <Arrow />
            </a>
            <a className="line-link" href={contact.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp <Arrow />
            </a>
          </div>
          <div className="contact-close-links">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              {contact.instagramHandle}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
