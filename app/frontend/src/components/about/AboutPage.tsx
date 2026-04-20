export function AboutPage() {
  return (
    <article className="about-layout">
      <header className="about-hero">
        <p className="about-eyebrow">Karla Heritage Watch</p>
        <h1>About</h1>
        <p className="about-lead">
          Karla Heritage Watch (Albany, WA Region) is a map-based decision support
          tool for exploring fire vulnerability context around heritage sites.
        </p>
      </header>

      <section className="about-section">
        <h2>What this tool does</h2>
        <p>
          This application brings layers, basemaps, and site information into one
          coherent workflow so users with different levels of technical expertise
          can explore context and generate insights.
        </p>
      </section>

      <section className="about-section">
        <h2>How to use it</h2>
        <div className="about-two-col">
          <div>
            <h3>Risk Map</h3>
            <ul className="about-list">
              <li>Sign in to access the map.</li>
              <li>Toggle Layers on/off to control what appears.</li>
              <li>Switch Basemap to change the background.</li>
              <li>Click features to view details in popups.</li>
            </ul>
          </div>
          <div>
            <h3>Site Upload & Resources</h3>
            <ul className="about-list">
              <li>Use Site Upload to record a newly identified site.</li>
              <li>
                Use Site Insights (Resources) for Heritage Site Insights content.
              </li>
              <li>Reports is a placeholder until report outputs are defined.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>ICIP / IDaS / Conditions of use</h2>
        <p className="about-muted">
          Placeholder statement about ICIP and IDaS, who the website/app belongs to,
          who can use it, and conditions of use. Logos will be provided later.
        </p>
        <div className="logo-row" aria-label="Collaboration logos (placeholder)">
          <div className="logo placeholder">Wagyl Kaip logo</div>
          <div className="logo placeholder">UWA logo</div>
        </div>
      </section>

      <section className="about-section">
        <h2>Heritage thumbnails</h2>
        <p className="about-muted">Placeholders until images are provided.</p>
        <div className="thumbnail-grid" aria-label="Heritage type thumbnails (placeholder)">
          <div className="thumbnail placeholder" />
          <div className="thumbnail placeholder" />
          <div className="thumbnail placeholder" />
        </div>
      </section>
    </article>
  )
}

