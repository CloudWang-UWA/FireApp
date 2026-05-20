import type { LayerKey, LayerStateMap } from '../../types/map'
import './SiteOverview.css'

type SiteOverviewProps = {
  layers: LayerStateMap
  onViewSite: (selection: {
    layerKey: LayerKey
    feature: GeoJSON.Feature
  }) => void
}

type SiteRow = {
  id: string
  name: string
  source: string
  placeType: string
  riskLevel: string
  layerKey: LayerKey
  feature: GeoJSON.Feature
}

function text(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function levelLabel(value: unknown): string {
  const level = Number(value)

  if (level === 3) return 'High'
  if (level === 2) return 'Medium'
  if (level === 1) return 'Low'

  return text(value) || 'Unknown'
}

function sourceLabel(value: unknown, layerKey: LayerKey): string {
  if (layerKey === 'uploaded_site_priority') return 'Uploaded'

  const source = text(value).toLowerCase()
  if (source === 'registered') return 'ACHIS Registered'
  if (source === 'lodged') return 'ACHIS Lodged'
  if (source === 'council') return 'Council'

  return text(value) || 'Recorded'
}

function siteId(properties: GeoJSON.GeoJsonProperties, fallback: number) {
  return (
    text(properties?.ach_identifier) ||
    text(properties?.place_no) ||
    text(properties?.id) ||
    `site-${fallback + 1}`
  )
}

function siteName(properties: GeoJSON.GeoJsonProperties, fallbackId: string) {
  return (
    text(properties?.name) ||
    text(properties?.place_name) ||
    text(properties?.site_name) ||
    fallbackId
  )
}

function buildRows(layers: LayerStateMap): SiteRow[] {
  const layerKeys: LayerKey[] = [
    'recorded_site_priority',
    'uploaded_site_priority',
  ]

  return layerKeys.flatMap((layerKey) => {
    const features = layers[layerKey].geojson?.features ?? []

    return features.map((feature, index) => {
      const properties = feature.properties ?? {}
      const id = siteId(properties, index)
      const isUploaded = layerKey === 'uploaded_site_priority'

      return {
        id,
        name: siteName(properties, id),
        source: sourceLabel(properties.source, layerKey),
        placeType: text(properties.place_type) || 'Not specified',
        riskLevel: levelLabel(
          isUploaded
            ? properties.site_priority_level
            : properties.recorded_site_priority_level,
        ),
        layerKey,
        feature,
      }
    })
  })
}

export function SiteOverview({ layers, onViewSite }: SiteOverviewProps) {
  const rows = buildRows(layers)
  const isLoading =
    layers.recorded_site_priority.isLoading ||
    layers.uploaded_site_priority.isLoading
  const error =
    layers.recorded_site_priority.error || layers.uploaded_site_priority.error

  return (
    <section className="site-overview">
      <header className="site-overview-header">
        <div>
          <p className="eyebrow">Site overview</p>
          <h1>All Sites</h1>
          <p className="intro">
            Recorded and uploaded site priority records in one list.
          </p>
        </div>
        <div className="site-overview-count">
          <strong>{rows.length}</strong>
          <span>sites</span>
        </div>
      </header>

      <div className="site-overview-table-wrap">
        {error ? <p className="feedback error">{error}</p> : null}

        <table className="site-overview-table">
          <thead>
            <tr>
              <th>Site</th>
              <th>Source</th>
              <th>Risk level</th>
              <th>Place type</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.layerKey}-${row.id}`}>
                <td>
                  <strong>{row.name}</strong>
                  <span>{row.id}</span>
                </td>
                <td>{row.source}</td>
                <td>
                  <span
                    className={`risk-pill risk-pill--${row.riskLevel.toLowerCase()}`}
                  >
                    {row.riskLevel}
                  </span>
                </td>
                <td>{row.placeType}</td>
                <td>
                  <button
                    className="secondary-button site-overview-action"
                    onClick={() =>
                      onViewSite({
                        layerKey: row.layerKey,
                        feature: row.feature,
                      })
                    }
                    type="button"
                  >
                    View insights
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 ? (
          <p className="site-overview-empty">No sites available yet.</p>
        ) : null}

        {isLoading ? (
          <p className="site-overview-empty">Loading site records...</p>
        ) : null}
      </div>
    </section>
  )
}
