import L from 'leaflet'

import { LAYER_CONFIG } from '../config/map'
import type { GeoJsonData, LayerKey, LayerStateMap } from '../types/map'

function ringArea(coordinates: number[][]) {
  let area = 0

  for (let index = 0; index < coordinates.length; index += 1) {
    const [x1, y1] = coordinates[index]
    const [x2, y2] = coordinates[(index + 1) % coordinates.length]
    area += x1 * y2 - x2 * y1
  }

  return Math.abs(area) / 2
}

function geometryArea(geometry: GeoJSON.Geometry | null | undefined): number {
  if (!geometry) {
    return 0
  }

  switch (geometry.type) {
    case 'Polygon':
      return geometry.coordinates.reduce(
        (sum, ring) => sum + ringArea(ring as number[][]),
        0,
      )
    case 'MultiPolygon':
      return geometry.coordinates.reduce(
        (sum, polygon) =>
          sum +
          polygon.reduce(
            (polygonSum, ring) => polygonSum + ringArea(ring as number[][]),
            0,
          ),
        0,
      )
    default:
      return 0
  }
}

export function prepareLayerData(layerKey: LayerKey, data: GeoJsonData): GeoJsonData {
  if (layerKey !== 'site') {
    return data
  }

  // Render larger site polygons first so the smaller ones stay clickable.
  return {
    ...data,
    features: [...data.features].sort(
      (left, right) => geometryArea(right.geometry) - geometryArea(left.geometry),
    ),
  }
}

export function getCombinedLayerBounds(layers: LayerStateMap) {
  const bounds = L.latLngBounds([])

  for (const { key } of LAYER_CONFIG) {
    const data = layers[key].data
    if (!data || data.features.length === 0) {
      continue
    }

    const layerBounds = L.geoJSON(data).getBounds()
    if (layerBounds.isValid()) {
      bounds.extend(layerBounds)
    }
  }

  return bounds
}

export function buildPopupContent(
  properties: GeoJSON.GeoJsonProperties | null | undefined,
) {
  if (!properties || Object.keys(properties).length === 0) {
    return '<strong>No properties</strong>'
  }

  // Keep popups short enough that they do not take over the map.
  return Object.entries(properties)
    .slice(0, 8)
    .map(
      ([key, value]) =>
        `<div><strong>${key}:</strong> ${value === null ? 'null' : String(value)}</div>`,
    )
    .join('')
}
