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
  const renderOrder: LayerKey[] = [
    'precaution_zone',
    'recorded_site_priority',
    'uploaded_site_priority',
  ]

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
        {renderOrder.map((key) => {
          const layerConfig = LAYER_CONFIG.find((layer) => layer.key === key)
          if (!layerConfig) {
            return null
          }

          const { color } = layerConfig
          const data = layers[key].data
          if (!visibleLayers[key] || !data) {
            return null
          }

          return (
            <GeoJSON
              key={key}
              data={data}
              style={(feature) => {
                let priorityLevel
                const isPriorityLayer =
                  key === 'recorded_site_priority' ||
                  key === 'uploaded_site_priority'

                if (key === 'recorded_site_priority') {
                  priorityLevel = feature?.properties?.recorded_site_priority_level
                } else if (key === 'uploaded_site_priority') {
                  priorityLevel = feature?.properties?.site_priority_level
                } else {
                  priorityLevel = feature?.properties?.precaution_zone_level
                }

                const fillColor = getPriorityColor(priorityLevel)

                return {
                  color: isPriorityLayer ? fillColor : 'transparent',
                  weight: isPriorityLayer ? 2 : 0,
                  fillColor,
                  fillOpacity: isPriorityLayer ? 0.55 : 0.24,
                }
              }}
              pointToLayer={(_feature, latlng: LatLng) =>
                L.circleMarker(latlng, {
                  radius: 6,
                  color: key === 'uploaded_site_priority' ? '#8c510a' : color,
                  fillColor:
                    key === 'uploaded_site_priority'
                      ? getPriorityColor(
                          _feature?.properties?.site_priority_level,
                        )
                      : color,
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
