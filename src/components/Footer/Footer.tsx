import { Link } from "react-router-dom"
import { contact } from "@/data/site"

export function Footer() {
  return (
    <footer>
      <div className="footer-brand">
        <Link className="logo" to="/">
          <b>I</b>
          <span>
            ITURRIETA
            <small>ARAMAIO</small>
          </span>
        </Link>
        <h2>
          From the apple
          <br />
          <em>to the table.</em>
        </h2>
      </div>
      <div className="footer-cols">
        <div>
          <span>Explore</span>
          <Link to="/about">About us</Link>
          <Link to="/#book">Book a table</Link>
          <Link to="/#menu">Menu</Link>
        </div>
        <div>
          <span>Contact</span>
          <a href={contact.phoneHref}>{contact.phone}</a>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <a href="#instagram">Instagram</a>
        </div>
        <div>
          <span>Language</span>
          <p>
            ES &nbsp; <b>EN</b> &nbsp; EU
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        © 2025 Sidrería Iturrieta <span>Aramaio · Basque Country</span>
      </div>
    </footer>
  )
}
