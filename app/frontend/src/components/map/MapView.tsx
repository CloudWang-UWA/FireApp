import { useEffect } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng, Layer as LeafletLayer } from 'leaflet'

import { BASEMAP_CONFIG, INITIAL_CENTER, LAYER_CONFIG } from '../../config/map'
import type { BasemapKey, LayerKey, LayerStateMap } from '../../types/map'
import { buildPopupContent, getCombinedLayerBounds } from '../../utils/geojson'

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

        <MapViewController layers={layers} />

        {LAYER_CONFIG.map(({ key, color }) => {
          const data = layers[key].data
          if (!visibleLayers[key] || !data) {
            return null
          }

          return (
            <GeoJSON
              key={key}
              data={data}
              style={() => ({
                color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.28,
              })}
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
                layer.bindPopup(buildPopupContent(feature.properties))
              }}
            />
          )
        })}
      </MapContainer>
    </section>
  )
}
