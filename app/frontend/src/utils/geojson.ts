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

function getLevelLabel(level: unknown) {
  const numericLevel = Number(level)

  if (numericLevel === 3) return 'High'
  if (numericLevel === 2) return 'Medium'
  if (numericLevel === 1) return 'Low'
  return String(level)
}

function getLevelColor(level: unknown, useColourBlindRiskColours = false) {
  const numericLevel = Number(level)

  if (useColourBlindRiskColours) {
    if (numericLevel === 3) return '#cc79a7'
    if (numericLevel === 2) return '#e69f00'
    if (numericLevel === 1) return '#0072b2'
    return '#4b5563'
  }

  if (numericLevel === 3) return '#d73027'
  if (numericLevel === 2) return '#f59e0b'
  if (numericLevel === 1) return '#22c55e'
  return '#4b5563'
}

function formatPopupValue(value: unknown) {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(2)
  }

  return String(value)
}

function buildPopupRows(
  rows: Array<[string, unknown, boolean?]>,
  useColourBlindRiskColours = false,
) {
  return rows
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([label, value, isLevel]) => {
      if (isLevel) {
        return `<div><strong>${label}:</strong> <span style="color: ${getLevelColor(value, useColourBlindRiskColours)}; font-weight: 700;">${getLevelLabel(value)}</span></div>`
      }

      return `<div><strong>${label}:</strong> ${formatPopupValue(value)}</div>`
    })
    .join('')
}

function withInsightsLink(body: string, href: string) {
  return `${body}<div class="map-popup-insights-wrap"><a class="map-popup-insights-btn" href="${href}">View Site Insights</a></div>`
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

    const state = layers[key]

    if (state.kind === 'image_overlay') {
      const overlayBounds = state.overlay?.bounds
      if (overlayBounds) {
        bounds.extend(L.latLngBounds(overlayBounds))
      }
      continue
    }

    const data = state.geojson
    if (!data || data.features.length === 0) continue

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
  useColourBlindRiskColours = false,
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

    const rows: Array<[string, unknown, boolean?]> = [
      ['site_name', properties.name ?? properties.place_name],
      ['site_type', siteType],
      ['ach_identifier', properties.ach_identifier],
      ['place_type', properties.place_type],
      ['fuel_type', properties.fuel_type],
      ['hazard_score', properties.hazard_score],
      ['site_vulnerability_score', properties.site_vulnerability_score],
      ['recorded_site_priority_score', properties.recorded_site_priority_score],
      ['recorded_site_priority_level', properties.recorded_site_priority_level, true],
    ]

    const achRaw = properties.ach_identifier
    const achStr =
      achRaw != null && String(achRaw).trim() !== '' ? String(achRaw).trim() : null
    const href = achStr
      ? `/resources/heritage-site-insights?siteId=${encodeURIComponent(achStr)}`
      : '/resources/heritage-site-insights'
    return withInsightsLink(
      buildPopupRows(rows, useColourBlindRiskColours),
      href,
    )
  }

  if (layerKey === 'precaution_zone') {
    const rows: Array<[string, unknown, boolean?]> = [
      ['Risk score', properties.precaution_zone_score],
      ['Risk level', properties.precaution_zone_level, true],
    ]

    return buildPopupRows(rows, useColourBlindRiskColours)
  }

  if (layerKey === 'uploaded_site_priority') {
    const rows: Array<[string, unknown, boolean?]> = [
      ['Site name', properties.name],
      ['Place type', properties.place_type],
      ['Priority score', properties.site_priority_score],
      ['Priority level', properties.site_priority_level, true],
    ]

    return withInsightsLink(
      buildPopupRows(rows, useColourBlindRiskColours),
      '/resources/heritage-site-insights',
    )
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
