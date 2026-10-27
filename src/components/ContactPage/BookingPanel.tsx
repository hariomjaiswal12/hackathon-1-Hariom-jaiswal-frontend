import { contact } from "@/data/site"
import { Arrow } from "@/components/UI/Arrow"

export function BookingPanel() {
  return (
    <section className="bookings" id="bookings">
      <div className="bookings-layout reveal">
        <div>
          <p className="kicker">Erreserbak</p>
          <h2>
            Book by
            <br />
            <em>phone.</em>
          </h2>
        </div>
        <div>
          <p>
            We take bookings by phone and WhatsApp. Call us and we'll confirm your table right
            away.
          </p>
          <div className="actions">
            <a className="btn gold" href={contact.phoneHref}>
              Call us now <Arrow />
            </a>
            <a className="line-link" href={contact.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp <Arrow />
            </a>
          </div>
          <p className="bookings-mail">
            If you prefer, write to <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </div>
      </div>
      <ul className="bookings-notes reveal">
        <li>
          <strong>Hours</strong>
          <span>Taken from the published weekly schedule</span>
        </li>
        <li>
          <strong>Closures</strong>
          <span>Shown when the restaurant marks a closed day</span>
        </li>
        <li>
          <strong>Groups</strong>
          <span>Ask when you call</span>
        </li>
      </ul>
    </section>
  )
}
