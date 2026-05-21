export function AboutPage() {
  return (
    <article className="about-layout">
      <header className="about-hero">
        <p className="about-eyebrow">Heritage Fire Watch</p>
        <h1>About</h1>
        <p className="about-lead">
          Heritage Fire Watch is a map-based planning support tool for viewing 
          cultural heritage sites and indicative fire vulnerability in the Albany area.
        </p>
      </header>

      <section className="about-section">
        <h2>What this tool does</h2>
        <p>
          This application brings heritage site information, environmental layers, 
          and risk information into one interface so users can explore site context easily.
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
            <h3>Site Upload & Site Insights</h3>
            <ul className="about-list">
              <li>Use Site Upload to record a newly identified site.</li>
              <li>
                Use Site Insights to review details for selected heritage sites.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>ICIP / IDaS / Conditions of use</h2>
        <p className="about-muted">
          Please respect ICIP, IDaS, and the conditions of use when viewing or using cultural heritage information.
        </p>
      </section>

      <section className="about-section">
        <h2>Project partners</h2>
        <div className="logo-row" aria-label="Collaboration logos">
          <div className="partner-card">
            <img
              src="/logos/WKSNLogo.webp"
              alt="Wagyl Kaip logo"
              loading="lazy"
            />
            <div>
              <h3>Wagyl Kaip Southern Noongar Aboriginal Corporation</h3>
              <p>Project partner</p>
            </div>
          </div>
          <div className="partner-card">
            <img
              src="/logos/uwa-university-perth-seeklogo.png"
              alt="UWA logo"
              loading="lazy"
            />
            <div>
              <h3>University of Western Australia</h3>
              <p>Project partner</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Contact information</h2>
        <div className="about-contact-grid">
          <div>
            <h3>Wagyl Kaip Southern Noongar Aboriginal Corporation</h3>
            <p>45-47 Serpentine Road, Albany WA 6330</p>
            <p>Phone: 08 8166 1940</p>
            <p>General enquiries: kaya@wagylkaip.org.au</p>
            <p>Heritage: heritage@wagylkaip.org.au</p>
          </div>
          <div>
            <h3>Sean Winter</h3>
            <p>Cultural and Statutory Fire Coordinator</p>
            <p>Wagyl Kaip Southern Noongar Aboriginal Corporation</p>
            <p>Email: sean.winter@wagylkaip.org.au</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Heritage Sites</h2>
        <div
          className="thumbnail-grid"
          aria-label="Heritage sites thumbnails"
        >
          <div className="thumbnail-tile" aria-label="Tamungup heritage site thumbnail">
            <div className="thumbnail">
              <img
                src="/images/heritage-thumbnails/Heritage_Tamungup__Kalgan_Rivermouth.jpg"
                alt="Tamungup heritage site thumbnail"
                loading="lazy"
              />
            </div>
            <div className="thumbnail-caption">Tamungup</div>
          </div>
          <div className="thumbnail-tile" aria-label="Kep Mardjit heritage site thumbnail">
            <div className="thumbnail">
              <img
                src="/images/heritage-thumbnails/Heritage_Kep_Mardjit__Vancouver_Spring.jpg"
                alt="Kep Mardjit heritage site thumbnail"
                loading="lazy"
              />
            </div>
            <div className="thumbnail-caption">Kep Mardjit</div>
          </div>
          <div className="thumbnail-tile" aria-label="Manitchpurting heritage site thumbnail">
            <div className="thumbnail">
              <img
                src="/images/heritage-thumbnails/Heritage_Manitchpurting__rocky_outcrop_NW_of_Mt_Melville_summit__jpg.png"
                alt="Manitchpurting heritage site thumbnail"
                loading="lazy"
              />
            </div>
            <div className="thumbnail-caption">Manitchpurting</div>
          </div>
        </div>
        <p className="about-image-credit">
          Heritage images and place names sourced from the City of Albany
          Aboriginal Cultural Heritage page.
        </p>
      </section>
    </article>
  )
}

