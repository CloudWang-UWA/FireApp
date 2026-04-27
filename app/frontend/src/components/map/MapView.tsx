import { useEffect } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng, Layer as LeafletLayer, Map as LeafletMap } from 'leaflet'

import type { ExportBounds } from '../../api/export'
import { BASEMAP_CONFIG, INITIAL_CENTER, LAYER_CONFIG } from '../../config/map'
import type { BasemapKey, LayerKey, LayerStateMap } from '../../types/map'
import { buildPopupContent, getCombinedLayerBounds } from '../../utils/geojson'

function toExportBounds(map: LeafletMap): ExportBounds {
  const bounds = map.getBounds()

  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  }
}

// Keep the map view focused on the loaded project layers
function MapViewController({
  layers,
}: {
  layers: LayerStateMap
}) {
  const map = useMap()

  useEffect(() => {
    const bounds = getCombinedLayerBounds(layers)

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] })
    }
  }, [layers, map])

  return null
}

// Report the current visible map bounds back to the parent
function MapBoundsTracker({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: ExportBounds) => void
}) {
  const map = useMapEvents({
  moveend() {
    if (onBoundsChange) {
      onBoundsChange(toExportBounds(map))
    }
  },
  zoomend() {
    if (onBoundsChange) {
      onBoundsChange(toExportBounds(map))
    }
  },
})

  useEffect(() => {
  if (onBoundsChange) {
    onBoundsChange(toExportBounds(map))
  }
}, [map, onBoundsChange])

  return null
function getPriorityColor(level: unknown) {
  if (level === 3) return '#d73027'
  if (level === 2) return '#fdb863'
  if (level === 1) return '#fddbc7'
  return '#d9d9d9'
}

// Render visible GeoJSON layers on top of the selected basemap
export function MapView({
  basemap,
  layers,
  visibleLayers,
  onBoundsChange,
}: {
  basemap: BasemapKey
  layers: LayerStateMap
  visibleLayers: Record<LayerKey, boolean>
  onBoundsChange: (bounds: ExportBounds) => void
}) {
  return (
    <section className="map-panel">
      <MapContainer
        center={INITIAL_CENTER}
        zoom={10}
        scrollWheelZoom
        className="map-view"
      >
        <TileLayer
          key={basemap}
          attribution={BASEMAP_CONFIG[basemap].attribution}
          maxZoom={BASEMAP_CONFIG[basemap].maxZoom}
          subdomains={BASEMAP_CONFIG[basemap].subdomains}
          url={BASEMAP_CONFIG[basemap].url}
        />

        <MapViewController layers={layers} />
        <MapBoundsTracker onBoundsChange={onBoundsChange} />

        {LAYER_CONFIG.map(({ key, color }) => {
          const data = layers[key].data
          if (!visibleLayers[key] || !data) {
            return null
          }

          return (
            <GeoJSON
              key={key}
              data={data}
              style={(feature) => {
                const priorityLevel =
                  key === 'recorded_site_priority'
                    ? feature?.properties?.recorded_site_priority_level
                    : feature?.properties?.precaution_zone_level
                const fillColor = getPriorityColor(priorityLevel)

                return {
                  color: key === 'recorded_site_priority' ? fillColor : 'transparent',
                  weight: key === 'recorded_site_priority' ? 2 : 0,
                  fillColor,
                  fillOpacity:
                    key === 'recorded_site_priority' ? 0.55 : 0.24,
                }
              }}
              pointToLayer={(_feature, latlng: LatLng) =>
                L.circleMarker(latlng, {
                  radius: 6,
                  color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 1,
                })
              }
              onEachFeature={(feature: GeoJSON.Feature, layer: LeafletLayer) => {
                layer.bindPopup(buildPopupContent(key, feature.properties))
              }}
            />
          )
        })}
      </MapContainer>
    </section>
  )
}