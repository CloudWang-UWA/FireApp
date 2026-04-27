import { Circle, CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import { Layers } from 'lucide-react'
import type { HeritageInsightsModel } from './mockHeritageInsights'

export function LocationPreviewCard({
  location,
}: {
  location: HeritageInsightsModel['locationPreview']
}) {
  return (
    <section className="si-card si-location-card">
      <header>
        <h2>{location.title}</h2>
        <p>{location.description}</p>
        <p className="si-location-coords">{location.coordinatesText}</p>
      </header>

      <div className="si-location-map-wrap">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={12}
          className="si-location-map"
          zoomControl={false}
          attributionControl={false}
          dragging={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          touchZoom={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Circle
            center={[location.lat, location.lng]}
            radius={location.radiusMeters}
            pathOptions={{ color: '#2f8e73', fillColor: '#2f8e73', fillOpacity: 0.15, weight: 2 }}
          />
          <CircleMarker
            center={[location.lat, location.lng]}
            radius={7}
            pathOptions={{ color: '#f7fffc', fillColor: '#1f6e5b', fillOpacity: 1, weight: 2 }}
          />
        </MapContainer>

        <div className="si-map-legend">
          <p>
            <Layers size={13} />
            Legend
          </p>
          {location.legend.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
