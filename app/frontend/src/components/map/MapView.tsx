import { useEffect } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng, Layer as LeafletLayer } from 'leaflet'

import { BASEMAP_CONFIG, INITIAL_CENTER, LAYER_CONFIG } from '../../config/map'
import type { BasemapKey, LayerKey, LayerStateMap } from '../../types/map'
import { buildPopupContent, getCombinedLayerBounds } from '../../utils/geojson'

// Keep the map view focused on the loaded project layers
function MapViewController({ layers }: { layers: LayerStateMap }) {
  const map = useMap()

  useEffect(() => {
    // Start with a view that covers the loaded project layers.
    const bounds = getCombinedLayerBounds(layers)

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [24, 24] })
    }
  }, [layers, map])

  return null
}

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
}: {
  basemap: BasemapKey
  layers: LayerStateMap
  visibleLayers: Record<LayerKey, boolean>
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
        
        {/* Fit the map to loaded layer bounds */}
        <MapViewController layers={layers} />
        
        {/* Render configured layers that are visible and already loaded */}
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
                    : feature?.properties?.potential_heritage_precaution_level
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
