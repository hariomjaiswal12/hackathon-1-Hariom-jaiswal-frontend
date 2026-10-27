export function BusService() {
  return (
    <section className="bus" id="bus">
      <div className="bus-copy reveal">
        <p className="kicker dark">Bus zerbitzua</p>
        <h2>
          A seat on the bus,
          <br />
          <em>during txotx.</em>
        </h2>
        <p>
          During txotx season we run a bus from Vitoria-Gasteiz. Sixteen euros, there and back.
          Groups from Debagoiena or other parts of Álava can ask us to arrange a service.
        </p>
      </div>
      <div className="bus-line reveal" aria-label="Bus times from Vitoria">
        <div>
          <strong>13:30</strong>
          <span>Departure from Vitoria</span>
        </div>
        <i aria-hidden="true" />
        <div>
          <strong>18:00</strong>
          <span>Return from Iturrieta</span>
        </div>
      </div>
      <ul className="bus-notes reveal">
        <li>Lunches follow this timetable. Dinners are by arrangement — ask us about the times.</li>
        <li>Minimum 20 people. Say in your booking how many will use the bus.</li>
        <li>Cancellations less than a week in advance are non-refundable.</li>
      </ul>
    </section>
  )
}
