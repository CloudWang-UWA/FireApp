import { useEffect } from 'react'
import { GeoJSON, ImageOverlay, MapContainer, Pane, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng, Layer as LeafletLayer, Map as LeafletMap } from 'leaflet'
import { useNavigate } from 'react-router-dom'

import type { ExportBounds } from '../../api/export'
import { API_BASE_URL, BASEMAP_CONFIG, INITIAL_CENTER, LAYER_CONFIG } from '../../config/map'

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
  const map = useMap()

  useEffect(() => {
    if (!onBoundsChange) {
      return
    }

    const reportBounds = () => onBoundsChange(toExportBounds(map))

    reportBounds()
    map.on('moveend', reportBounds)
    map.on('zoomend', reportBounds)

    return () => {
      map.off('moveend', reportBounds)
      map.off('zoomend', reportBounds)
    }
  }, [map, onBoundsChange])

  return null
}

function getPriorityColor(level: unknown) {
  // Stop-light risk colours: high = red, medium = yellow/orange, low = green.
  if (level === 3) return '#d73027'
  if (level === 2) return '#f59e0b'
  if (level === 1) return '#22c55e'
  return '#d9d9d9'
}

// Render visible GeoJSON layers on top of the selected basemap
export function MapView({
  basemap,
  layers,
  visibleLayers,
  onBoundsChange,
  onViewSiteInsights,
}: {
  basemap: BasemapKey
  layers: LayerStateMap
  visibleLayers: Record<LayerKey, boolean>
  onBoundsChange: (bounds: ExportBounds) => void
  onViewSiteInsights?: (selection: {
    layerKey: LayerKey
    feature: GeoJSON.Feature
  }) => void
}) {
  const navigate = useNavigate()
  const renderOrder: LayerKey[] = [
    'fuel',
    'slope',
    'precaution_zone',
    'granite',
    'fire_history',
    'recorded_site_priority',
    'uploaded_site_priority',
  ]
  const layerPaneMap: Record<LayerKey, string> = {
    fuel: 'rasterOverlayPane',
    slope: 'rasterOverlayPane',
    precaution_zone: 'precautionPane',
    granite: 'contextPane',
    fire_history: 'contextPane',
    recorded_site_priority: 'recordedSitePane',
    uploaded_site_priority: 'uploadedSitePane',
  }

  function resolveImageUrl(imageUrl: string) {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }

    if (!API_BASE_URL) {
      return imageUrl
    }

    return `${API_BASE_URL}${imageUrl}`
  }

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
        <Pane name="rasterOverlayPane" style={{ zIndex: 405 }} />
        <Pane name="contextPane" style={{ zIndex: 410 }} />
        <Pane name="precautionPane" style={{ zIndex: 415 }} />
        <Pane name="recordedSitePane" style={{ zIndex: 420 }} />
        <Pane name="uploadedSitePane" style={{ zIndex: 430 }} />

        <MapViewController layers={layers} />
        <MapBoundsTracker onBoundsChange={onBoundsChange} />

        {renderOrder.map((key) => {
          const layerConfig = LAYER_CONFIG.find((layer) => layer.key === key)
          if (!layerConfig || !visibleLayers[key]) {
            return null
          }

          const state = layers[key]

          if (state.kind === 'image_overlay') {
            const overlay = state.overlay
            if (!overlay) return null

            return (
              <ImageOverlay
                key={key}
                url={resolveImageUrl(overlay.image_url)}
                bounds={overlay.bounds}
                opacity={0.65}
                pane={layerPaneMap[key]}
              />
            )
          }

          const { color } = layerConfig
          const data = state.geojson
          if (!data) {
            return null
          }

          return (
            <GeoJSON
              key={key}
              data={data}
              pane={layerPaneMap[key]}
              style={(feature) => {
                if (key === 'precaution_zone') {
                  const level = feature?.properties?.precaution_zone_level
                  const fillColor = getPriorityColor(level)

                  return {
                    color: 'transparent',
                    weight: 0,
                    fillColor,
                    fillOpacity: 0.24,
                  }
                }

                if (key === 'recorded_site_priority') {
                  const level = feature?.properties?.recorded_site_priority_level
                  const fillColor = getPriorityColor(level)

                  return {
                    color: fillColor,
                    weight: 2,
                    fillColor,
                    fillOpacity: 0.55,
                  }
                }

                if (key === 'uploaded_site_priority') {
                  const level = feature?.properties?.site_priority_level
                  const fillColor = getPriorityColor(level)

                  return {
                    color: fillColor,
                    weight: 2,
                    fillColor,
                    fillOpacity: 0.55,
                  }
                }

                const baseColor = color ?? '#6b7280'

                return {
                  color: baseColor,
                  weight: 1,
                  fillColor: baseColor,
                  fillOpacity: 0.12,
                }
              }}
              pointToLayer={(_feature, latlng: LatLng) =>
                L.circleMarker(latlng, {
                  pane: layerPaneMap[key],
                  radius: 6,
                  color: key === 'uploaded_site_priority' ? '#8c510a' : (color ?? '#6b7280'),
                  fillColor:
                    key === 'uploaded_site_priority'
                      ? getPriorityColor(
                          _feature?.properties?.site_priority_level,
                        )
                      : (color ?? '#6b7280'),
                  fillOpacity: 0.8,
                  weight: 1,
                })
              }
              onEachFeature={(feature: GeoJSON.Feature, layer: LeafletLayer) => {
                layer.bindPopup(buildPopupContent(key, feature.properties))
                layer.on('popupopen', (event) => {
                  const popupElement = event.popup.getElement()
                  const link = popupElement?.querySelector<HTMLAnchorElement>(
                    '.map-popup-insights-btn',
                  )
                  if (!link) return

                  link.onclick = (clickEvent) => {
                    clickEvent.preventDefault()
                    onViewSiteInsights?.({ layerKey: key, feature })
                    const url = new URL(link.href)
                    navigate(`${url.pathname}${url.search}`)
                  }
                })
              }}
            />
          )
        })}
      </MapContainer>
    </section>
  )
}
