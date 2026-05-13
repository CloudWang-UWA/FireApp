import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import { Link } from 'react-router-dom'

import { BASEMAP_CONFIG } from '../../config/map'

const SITE_MAP_BASEMAP = BASEMAP_CONFIG.osm

type LocationPreviewCardProps = {
  latitude?: number | null
  longitude?: number | null
  siteName?: string | null
  siteId?: string | null
  areaName?: string | null
  /** When set, map sits inside a parent dashboard card (no outer si-card / duplicate title). */
  variant?: 'card' | 'embedded'
}

function SiteLocationPopup({
  siteName,
  siteId,
  areaName,
}: {
  siteName: string | null
  siteId: string | null
  areaName: string | null
}) {
  return (
    <div className="si-site-loc-popup">
      <p className="si-site-loc-popup-title">{siteName ?? '—'}</p>
      <dl className="si-site-loc-popup-dl">
        <div>
          <dt>Site ID</dt>
          <dd>{siteId ?? '—'}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{areaName ?? '—'}</dd>
        </div>
      </dl>
    </div>
  )
}

function RiskMapLink({ className }: { className?: string }) {
  return (
    <Link to="/app" className={className ?? 'si-dash-loc-risk-link'}>
      View All Sites
    </Link>
  )
}

export function LocationPreviewCard({
  latitude,
  longitude,
  siteName = null,
  siteId = null,
  areaName = null,
  variant = 'card',
}: LocationPreviewCardProps) {
  const hasCoords =
    typeof latitude === 'number' &&
    !Number.isNaN(latitude) &&
    typeof longitude === 'number' &&
    !Number.isNaN(longitude)

  if (!hasCoords) {
    if (variant === 'embedded') {
      return (
        <p className="si-location-unavailable si-location-unavailable--embed">
          Latitude and longitude were not returned for this site, so the map cannot be shown.
        </p>
      )
    }
    return (
      <section className="si-card si-location-card">
        <header>
          <h2>Location preview</h2>
          <p>Map view when coordinates are available from the API.</p>
          <p className="si-location-coords si-location-coords--muted">Coordinates not available</p>
        </header>
        <p className="si-location-unavailable">
          Latitude and longitude were not returned for this site, so the map cannot be shown.
        </p>
      </section>
    )
  }

  const coordinatesText = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
  const center: [number, number] = [latitude, longitude]
  const nameStr = siteName != null && String(siteName).trim() ? String(siteName).trim() : null
  const idStr = siteId != null && String(siteId).trim() ? String(siteId).trim() : null
  const areaStr = areaName != null && String(areaName).trim() ? String(areaName).trim() : null

  const mapBlock = (
    <div className="si-location-map-wrap si-location-map-wrap--interactive">
      <MapContainer
        key={`${latitude}-${longitude}`}
        center={center}
        zoom={15}
        className="si-location-map"
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        zoomControl
        attributionControl
      >
        <TileLayer
          url={SITE_MAP_BASEMAP.url}
          attribution={SITE_MAP_BASEMAP.attribution}
          maxZoom={SITE_MAP_BASEMAP.maxZoom}
          subdomains={SITE_MAP_BASEMAP.subdomains}
        />
        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{
            color: '#f7fffc',
            fillColor: '#1f6e5b',
            fillOpacity: 1,
            weight: 2,
          }}
          eventHandlers={{
            add: (e) => {
              e.target.openPopup()
            },
          }}
        >
          <Popup>
            <SiteLocationPopup siteName={nameStr} siteId={idStr} areaName={areaStr} />
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  )

  if (variant === 'embedded') {
    return (
      <div className="si-dash-embed-map">
        {mapBlock}
        <div className="si-dash-loc-map-actions">
          <RiskMapLink />
        </div>
      </div>
    )
  }

  return (
    <section className="si-card si-location-card">
      <header>
        <h2>Location preview</h2>
        <p>Site centroid from the risk dataset.</p>
        <p className="si-location-coords">{coordinatesText}</p>
      </header>

      {mapBlock}
      <div className="si-location-card-map-actions">
        <RiskMapLink className="si-dash-loc-risk-link si-location-card-risk-link" />
      </div>
    </section>
  )
}
