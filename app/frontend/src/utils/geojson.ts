// Utilities for preparing GeoJSON data for map rendering and popups
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

// Compute polygon area for sorting site features before rendering
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
  if (
    layerKey !== 'recorded_site_priority' &&
    layerKey !== 'precaution_zone'
  ) {
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

// Merge bounds from all loaded layers so the map can fit the full dataset
export function getCombinedLayerBounds(layers: LayerStateMap) {
  const bounds = L.latLngBounds([])

  for (const { key } of LAYER_CONFIG) {
    // Keep the map focused on the study area even if uploaded sites are outside it.
    if (key === 'uploaded_site_priority') {
      continue
    }

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
  layerKey: LayerKey,
  properties: GeoJSON.GeoJsonProperties | null | undefined,
) {
  if (!properties || Object.keys(properties).length === 0) {
    return '<strong>No properties</strong>'
  }

  if (layerKey === 'recorded_site_priority') {
    const source = properties.source
    let siteType: string | undefined

    if (source === 'registered') {
      siteType = 'ACHIS Registered'
    } else if (source === 'lodged') {
      siteType = 'ACHIS Lodged'
    } else if (source === 'council') {
      siteType = 'Council'
    }

    const rows: Array<[string, unknown]> = [
      ['site_name', properties.name ?? properties.place_name],
      ['site_type', siteType],
      ['ach_identifier', properties.ach_identifier],
      ['place_type', properties.place_type],
      ['fuel_type', properties.fuel_type],
      ['hazard_score', properties.hazard_score],
      ['site_vulnerability_score', properties.site_vulnerability_score],
      ['recorded_site_priority_score', properties.recorded_site_priority_score],
      ['recorded_site_priority_level', properties.recorded_site_priority_level],
    ]

    return rows
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(
        ([key, value]) =>
          `<div><strong>${key}:</strong> ${String(value)}</div>`,
      )
      .join('')
  }

  if (layerKey === 'precaution_zone') {
    const rows: Array<[string, unknown]> = [
      ['hazard_score', properties.hazard_score],
      ['hazard_level', properties.hazard_level],
      ['granite_score', properties.granite_score],
      [
        'precaution_zone_score',
        properties.precaution_zone_score,
      ],
      [
        'precaution_zone_level',
        properties.precaution_zone_level,
      ],
    ]

    return rows
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(
        ([key, value]) =>
          `<div><strong>${key}:</strong> ${String(value)}</div>`,
      )
      .join('')
  }

  if (layerKey === 'uploaded_site_priority') {
    const rows: Array<[string, unknown]> = [
      ['name', properties.name],
      ['place_type', properties.place_type],
      ['status', properties.status],
      ['inside_study_area', properties.inside_study_area],
      ['hazard_score', properties.hazard_score],
      ['hazard_level', properties.hazard_level],
      ['site_vulnerability_score', properties.site_vulnerability_score],
      ['site_priority_score', properties.site_priority_score],
      ['site_priority_level', properties.site_priority_level],
    ]

    return rows
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(
        ([key, value]) =>
          `<div><strong>${key}:</strong> ${String(value)}</div>`,
      )
      .join('')
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
