import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchLayer } from '../../api/layers'
import type { SiteInsightsApiResponse } from '../../api/risk'
import type { LayerKey } from '../../types/map'
import './HeritageSiteInsights.css'
import { InsightSidebar } from './InsightSidebar'
import { SiteInsightsMainPanels } from './SiteInsightsMainPanels'

type SelectedInsightFeature = {
  layerKey: LayerKey
  feature: GeoJSON.Feature
}

function nativeNumber(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function nativeText(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

function levelName(value: unknown): string | null {
  const level = nativeNumber(value)
  if (level === 3) return 'HIGH'
  if (level === 2) return 'MEDIUM'
  if (level === 1) return 'LOW'
  return nativeText(value)
}

function siteTypeLabel(source: unknown): string | null {
  const raw = nativeText(source)
  if (!raw) return null
  const lower = raw.toLowerCase()
  if (lower === 'registered') return 'ACHIS Registered'
  if (lower === 'lodged') return 'ACHIS Lodged'
  if (lower === 'council') return 'Council'
  return raw
}

function siteDisplayId(properties: GeoJSON.GeoJsonProperties): string | null {
  const achId = nativeText(properties?.ach_identifier)
  if (achId) return achId

  const councilId = nativeText(properties?.place_no)
  if (councilId) return councilId

  const uploadId = nativeText(properties?.id)
  if (uploadId) return uploadId

  return null
}

// GeoJSON stores coordinates differently for points, lines, and polygons.
// Flatten them into one list so the preview map can place a simple site marker.
function collectPositions(geometry: GeoJSON.Geometry | null | undefined): number[][] {
  if (!geometry) return []
  if (geometry.type === 'Point') return [geometry.coordinates as number[]]
  if (geometry.type === 'MultiPoint' || geometry.type === 'LineString') {
    return geometry.coordinates as number[][]
  }
  if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).flat()
  }
  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates as number[][][][]).flat(2)
  }
  return []
}

// get marker position for the small preview map.
function getMapMarkerPosition(geometry: GeoJSON.Geometry | null | undefined) {
  const positions = collectPositions(geometry).filter(
    (position) =>
      typeof position[0] === 'number' &&
      !Number.isNaN(position[0]) &&
      typeof position[1] === 'number' &&
      !Number.isNaN(position[1]),
  )
  if (positions.length === 0) {
    return { latitude: null, longitude: null }
  }

  const totals = positions.reduce(
    (sum, position) => ({
      longitude: sum.longitude + position[0],
      latitude: sum.latitude + position[1],
    }),
    { latitude: 0, longitude: 0 },
  )

  return {
    latitude: totals.latitude / positions.length,
    longitude: totals.longitude / positions.length,
  }
}

function mapFeatureToInsights(
  layerKey: LayerKey,
  feature: GeoJSON.Feature,
): SiteInsightsApiResponse {
  const properties = feature.properties ?? {}
  const { latitude, longitude } = getMapMarkerPosition(feature.geometry)
  const isUploadedSite = layerKey === 'uploaded_site_priority'
  const priorityScore = nativeNumber(
    isUploadedSite
      ? properties.site_priority_score
      : properties.recorded_site_priority_score,
  )
  const priorityLevel = levelName(
    isUploadedSite
      ? properties.site_priority_level
      : properties.recorded_site_priority_level,
  )

  return {
    site_id: siteDisplayId(properties),
    site_name: nativeText(properties.name) ?? nativeText(properties.place_name),
    site_type: isUploadedSite ? 'Uploaded Site' : siteTypeLabel(properties.source),
    ach_identifier: nativeText(properties.ach_identifier),
    place_type: nativeText(properties.place_type),
    area_name: null,
    latitude,
    longitude,
    risk_level: priorityLevel,
    risk_score: priorityScore,
    predicted_probability: null,
    site_vulnerability_score: nativeNumber(properties.site_vulnerability_score),
    slope_deg: nativeNumber(properties.slope_deg),
    fuel_code: nativeNumber(properties.fuel_code),
    fuel_label: nativeText(properties.fuel_type),
    fire_year: nativeNumber(properties.fire_year),
    fire_type: nativeText(properties.fire_type),
    hazard_score: nativeNumber(properties.hazard_score),
    hazard_level: levelName(properties.hazard_level),
    site_priority_score: priorityScore,
    site_priority_level: priorityLevel,
    granite_score: null,
    granite_level: null,
  }
}

function findRecordedSite(
  recordedSites: GeoJSON.FeatureCollection | null | undefined,
  siteIdFromUrl: string | null,
) {
  if (!recordedSites?.features.length) return null

  const siteId = siteIdFromUrl?.trim()
  if (!siteId) return recordedSites.features[0]

  return (
    recordedSites.features.find((feature) => {
      const achIdentifier = feature.properties?.ach_identifier
      return achIdentifier != null && String(achIdentifier).trim() === siteId
    }) ?? null
  )
}

function csvCell(value: unknown): string {
  if (value == null) return ''
  const text = String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

function fileSafeName(value: unknown): string {
  const raw = nativeText(value) ?? 'site-insights'
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'site-insights'
}

function downloadCurrentSiteCsv(insights: SiteInsightsApiResponse) {
  const fields: Array<[string, unknown]> = [
    ['site_id', insights.site_id],
    ['site_name', insights.site_name],
    ['source', insights.site_type],
    ['ach_identifier', insights.ach_identifier],
    ['area_name', insights.area_name],
    ['place_type', insights.place_type],
    ['latitude', insights.latitude],
    ['longitude', insights.longitude],
    ['risk_level', insights.risk_level],
    ['risk_score', insights.risk_score],
    ['site_priority_level', insights.site_priority_level],
    ['site_priority_score', insights.site_priority_score],
    ['site_vulnerability_score', insights.site_vulnerability_score],
    ['hazard_level', insights.hazard_level],
    ['hazard_score', insights.hazard_score],
    ['slope_deg', insights.slope_deg],
    ['fuel_code', insights.fuel_code],
    ['fuel_label', insights.fuel_label],
    ['fire_year', insights.fire_year],
    ['fire_type', insights.fire_type],
    ['granite_score', insights.granite_score],
    ['granite_level', insights.granite_level],
  ]

  const csv = [
    fields.map(([key]) => csvCell(key)).join(','),
    fields.map(([, value]) => csvCell(value)).join(','),
  ].join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `${fileSafeName(insights.site_name ?? insights.site_id)}-site-insights.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export function HeritageSiteInsights({
  onBackToMap,
  recordedSiteData,
  selectedFeature,
}: {
  onBackToMap?: () => void
  recordedSiteData?: GeoJSON.FeatureCollection | null
  selectedFeature?: SelectedInsightFeature | null
}) {
  const [searchParams] = useSearchParams()
  const siteIdFromUrl = searchParams.get('siteId')
  const initialFeature = findRecordedSite(recordedSiteData, siteIdFromUrl)

  const [insights, setInsights] = useState<SiteInsightsApiResponse | null>(
    selectedFeature
      ? mapFeatureToInsights(selectedFeature.layerKey, selectedFeature.feature)
      : initialFeature
        ? mapFeatureToInsights('recorded_site_priority', initialFeature)
        : null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInsights = useCallback(async (signal?: AbortSignal) => {
    if (selectedFeature) {
      setInsights(mapFeatureToInsights(selectedFeature.layerKey, selectedFeature.feature))
      setError(null)
      setIsLoading(false)
      return
    }

    if (recordedSiteData) {
      const selectedFeature = findRecordedSite(recordedSiteData, siteIdFromUrl)
      if (selectedFeature) {
        setInsights(mapFeatureToInsights('recorded_site_priority', selectedFeature))
        setError(null)
      } else {
        const siteId = siteIdFromUrl?.trim()
        setInsights(null)
        setError(siteId ? `No site found for siteId ${siteId}` : 'No recorded sites available')
      }
      setIsLoading(false)
      return
    }

    setError(null)
    try {
      const recordedSites =
        recordedSiteData ?? await fetchLayer('recorded_site_priority', { signal })
      if (signal?.aborted) return

      const siteId = siteIdFromUrl?.trim() ?? null
      const selectedFeature = findRecordedSite(recordedSites, siteId)

      if (!selectedFeature) {
        throw new Error(siteId ? `No site found for siteId ${siteId}` : 'No recorded sites available')
      }

      setInsights(mapFeatureToInsights('recorded_site_priority', selectedFeature))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      const message = e instanceof Error ? e.message : 'Failed to load site insights'
      if (!signal?.aborted) {
        setError(message)
        setInsights(null)
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [recordedSiteData, selectedFeature, siteIdFromUrl])

  useEffect(() => {
    const controller = new AbortController()
    void loadInsights(controller.signal)
    return () => controller.abort()
  }, [loadInsights])

  return (
    <article className="si-page">
      {error ? (
        <div className="si-insights-error-banner" role="alert">
          <span>{error}</span>
          <button className="si-insights-retry" type="button" onClick={() => void loadInsights()}>
            Retry
          </button>
        </div>
      ) : null}

      <section className="si-layout">
        <InsightSidebar
          insights={insights}
          onExportSite={insights ? () => downloadCurrentSiteCsv(insights) : undefined}
          onBackToMap={onBackToMap}
        />

        <main className="si-main">
          {insights ? (
            <SiteInsightsMainPanels api={insights} />
          ) : !isLoading && error ? (
            <section className="si-card si-main-empty">
              <h2>Data unavailable</h2>
              <p>Site insights could not be loaded. Use Retry above, then return to the map.</p>
            </section>
          ) : null}
        </main>
      </section>
    </article>
  )
}
