export function RiskIndicators() {
  return (
    <div className="risk-indicators">
      <section className="indicator-card">
        <div className="indicator-icon indicator-icon--green" aria-hidden="true">
          <span className="indicator-dot" />
        </div>
        <div className="indicator-copy">
          <h3>Slope profile</h3>
          <p>Terrain gradient across site boundary</p>
        </div>
        <div className="indicator-value">17°</div>
      </section>

      <section className="indicator-card">
        <div className="indicator-icon indicator-icon--olive" aria-hidden="true">
          <span className="indicator-dot" />
        </div>
        <div className="indicator-copy">
          <h3>Fuel age</h3>
          <p>Estimated vegetation maturity</p>
        </div>
        <div className="indicator-value">
          11
          <span className="indicator-unit">yrs</span>
        </div>
      </section>

      <section className="indicator-card">
        <div className="indicator-icon indicator-icon--orange" aria-hidden="true">
          <span className="indicator-dot" />
        </div>
        <div className="indicator-copy">
          <h3>Outcrop index</h3>
          <p>Granite exposure reducing spread</p>
        </div>
        <div className="indicator-value">43%</div>
      </section>

      <button className="indicator-cta" type="button">
        View assessment summary
      </button>
    </div>
  )
}

