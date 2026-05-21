import { useMemo, useState } from 'react'
import { deleteUploadedSite } from '../../api/admin'
import type { LayerKey, LayerStateMap } from '../../types/map'
import type { AuthUser } from '../../types/auth'
import './SiteOverview.css'

type SiteOverviewProps = {
  authToken: string
  currentUser: AuthUser
  layers: LayerStateMap
  onDeleteUploadedSite: () => void
  onViewSite: (selection: {
    layerKey: LayerKey
    feature: GeoJSON.Feature
  }) => void
}

type SiteRow = {
  id: string
  name: string
  sourceKey: string
  source: string
  riskKey: string
  placeType: string
  riskLevel: string
  layerKey: LayerKey
  feature: GeoJSON.Feature
}

type FilterOption = {
  value: string
  label: string
}

function text(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function levelInfo(value: unknown) {
  const level = Number(value)

  if (level === 3) return { key: 'high', label: 'High' }
  if (level === 2) return { key: 'medium', label: 'Medium' }
  if (level === 1) return { key: 'low', label: 'Low' }

  return { key: 'unknown', label: 'Unknown' }
}

function riskClassName(level: string): string {
  return level.toLowerCase().replace(/\s+/g, '-')
}

function sourceInfo(value: unknown, layerKey: LayerKey) {
  if (layerKey === 'uploaded_site_priority') {
    return { key: 'uploaded', label: 'Uploaded' }
  }

  const source = text(value).toLowerCase()
  if (source === 'registered') return { key: 'registered', label: 'ACHIS Registered' }
  if (source === 'lodged') return { key: 'lodged', label: 'ACHIS Lodged' }
  if (source === 'council') return { key: 'council', label: 'Council' }

  return { key: source || 'recorded', label: text(value) || 'Recorded' }
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

function numericSiteId(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function buildRows(layers: LayerStateMap): SiteRow[] {
  const layerKeys: LayerKey[] = [
    'recorded_site_priority',
    'uploaded_site_priority',
  ]
  const rowsBySite = new Map<string, SiteRow>()

  layerKeys.forEach((layerKey) => {
    const features = layers[layerKey].geojson?.features ?? []

    features.forEach((feature, index) => {
      const properties = feature.properties ?? {}
      const id = siteId(properties, index)
      const isUploaded = layerKey === 'uploaded_site_priority'
      const source = sourceInfo(properties.source, layerKey)
      const risk = levelInfo(
        isUploaded
          ? properties.site_priority_level
          : properties.recorded_site_priority_level,
      )
      const rowKey = `${layerKey}-${source.key}-${id}`

      const row = {
        id,
        name: siteName(properties, id),
        sourceKey: source.key,
        source: source.label,
        placeType: text(properties.place_type) || 'Not specified',
        riskKey: risk.key,
        riskLevel: risk.label,
        layerKey,
        feature,
      }
      const existing = rowsBySite.get(rowKey)

      if (!existing || (existing.riskKey === 'unknown' && row.riskKey !== 'unknown')) {
        rowsBySite.set(rowKey, row)
      }
    })
  })

  return [...rowsBySite.values()]
}

export function SiteOverview({
  authToken,
  currentUser,
  layers,
  onDeleteUploadedSite,
  onViewSite,
}: SiteOverviewProps) {
  const rows = useMemo(() => buildRows(layers), [layers])
  const [searchText, setSearchText] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')
  const [deleteError, setDeleteError] = useState('')
  const [deletingSiteId, setDeletingSiteId] = useState<number | null>(null)
  const sourceOptions: FilterOption[] = [
    { value: 'registered', label: 'ACHIS Registered' },
    { value: 'lodged', label: 'ACHIS Lodged' },
    { value: 'council', label: 'Council' },
    { value: 'uploaded', label: 'Uploaded' },
  ].filter((option) => rows.some((row) => row.sourceKey === option.value))
  const riskOptions: FilterOption[] = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'unknown', label: 'Unknown' },
  ]
  const filteredRows = rows.filter((row) => {
    const query = searchText.trim().toLowerCase()
    const matchesSearch =
      !query ||
      row.name.toLowerCase().includes(query) ||
      row.id.toLowerCase().includes(query) ||
      row.placeType.toLowerCase().includes(query)
    const matchesSource = sourceFilter === 'all' || row.sourceKey === sourceFilter
    const matchesRisk = riskFilter === 'all' || row.riskKey === riskFilter

    return matchesSearch && matchesSource && matchesRisk
  })
  const isLoading =
    layers.recorded_site_priority.isLoading ||
    layers.uploaded_site_priority.isLoading
  const error =
    layers.recorded_site_priority.error || layers.uploaded_site_priority.error
  const canDeleteUploadedSites = currentUser.role === 'admin'

  async function handleDeleteUploadedSite(row: SiteRow) {
    const siteId = numericSiteId(row.id)
    if (siteId === null) {
      setDeleteError('This uploaded site cannot be deleted because it has no valid ID.')
      return
    }

    const confirmed = window.confirm(`Delete uploaded site "${row.name}"?`)
    if (!confirmed) return

    setDeleteError('')
    setDeletingSiteId(siteId)

    try {
      await deleteUploadedSite(authToken, siteId)
      onDeleteUploadedSite()
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Uploaded site could not be deleted',
      )
    } finally {
      setDeletingSiteId(null)
    }
  }

  return (
    <section className="site-overview">
      <header className="site-overview-header">
        <div>
          <p className="eyebrow">Site overview</p>
          <h1>All Sites</h1>
          <p className="intro">Showing all recorded and uploaded sites.</p>
        </div>
        <div className="site-overview-count">
          <strong>{filteredRows.length}</strong>
          <span>{filteredRows.length === rows.length ? 'sites' : `of ${rows.length}`}</span>
        </div>
      </header>

      <section className="site-overview-filters" aria-label="Site filters">
        <label className="field">
          Search
          <input
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Name, site ID, or place type"
            type="search"
            value={searchText}
          />
        </label>

        <label className="field">
          Source
          <select
            onChange={(event) => setSourceFilter(event.target.value)}
            value={sourceFilter}
          >
            <option value="all">All sources</option>
            {sourceOptions.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Risk level
          <select
            onChange={(event) => setRiskFilter(event.target.value)}
            value={riskFilter}
          >
            <option value="all">All risk levels</option>
            {riskOptions.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="site-overview-table-wrap">
        {error ? <p className="feedback error">{error}</p> : null}
        {deleteError ? <p className="feedback error">{deleteError}</p> : null}

        <table className="site-overview-table">
          <colgroup>
            <col className="site-overview-col-site" />
            <col className="site-overview-col-source" />
            <col className="site-overview-col-risk" />
            <col className="site-overview-col-place" />
            <col className="site-overview-col-insights" />
            {canDeleteUploadedSites ? (
              <col className="site-overview-col-manage" />
            ) : null}
          </colgroup>
          <thead>
            <tr>
              <th>Site</th>
              <th>Source</th>
              <th>Risk level</th>
              <th>Place type</th>
              <th>Insights</th>
              {canDeleteUploadedSites ? <th>Manage</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={`${row.layerKey}-${row.id}`}>
                <td>
                  <strong>{row.name}</strong>
                  <span>{row.id}</span>
                </td>
                <td>{row.source}</td>
                <td>
                  <span
                    className={`risk-pill risk-pill--${riskClassName(row.riskLevel)}`}
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
                {canDeleteUploadedSites ? (
                  <td>
                    {row.layerKey === 'uploaded_site_priority' ? (
                        <button
                          className="secondary-button site-overview-remove"
                          disabled={deletingSiteId === numericSiteId(row.id)}
                          onClick={() => void handleDeleteUploadedSite(row)}
                          type="button"
                        >
                          {deletingSiteId === numericSiteId(row.id) ? 'Removing...' : 'Remove'}
                        </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 ? (
          <p className="site-overview-empty">No sites available yet.</p>
        ) : null}

        {!isLoading && rows.length > 0 && filteredRows.length === 0 ? (
          <p className="site-overview-empty">No sites match these filters.</p>
        ) : null}

        {isLoading ? (
          <p className="site-overview-empty">Loading site records...</p>
        ) : null}
      </div>
    </section>
  )
}
