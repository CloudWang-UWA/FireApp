import { useState } from 'react'

import {
  downloadExportFile,
  type ExportBounds,
  type ExportFormat,
} from '../../api/export'

const EXPORTABLE_LAYERS = [
  { key: 'recorded_site_priority', label: 'Recorded site priority' },
  { key: 'uploaded_sites', label: 'Uploaded sites' },
  { key: 'precaution_zone', label: 'Precaution zone' },
  { key: 'granite', label: 'Granite' },
  { key: 'fire_history', label: 'Fire history' },
] as const

export function Export({
  mapBounds,
}: {
  mapBounds: ExportBounds | null
}) {
  const [layerName, setLayerName] = useState<string>('recorded_site_priority')
  const [format, setFormat] = useState<ExportFormat>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  async function handleExport() {
    if (!mapBounds) {
      setExportError('Map bounds are not available yet')
      setExportMessage('')
      return
    }

    setIsExporting(true)
    setExportError('')
    setExportMessage('')

    try {
      await downloadExportFile({
        layerName,
        format,
        bounds: mapBounds,
      })

      setExportMessage(
        `Downloaded ${layerName} records from the current map area as ${format.toUpperCase()}.`,
      )
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="status-card">
      <h2>Export</h2>
      <p>
        Export records from the current visible map area as a spreadsheet-ready
        file.
      </p>

      <label className="field">
  <span>Layer</span>
    <select
      value={layerName}
      onChange={(event) => {
        setLayerName(event.target.value)
        setExportMessage('')
        setExportError('')
        }}
        >
        {EXPORTABLE_LAYERS.map((layer) => (
          <option key={layer.key} value={layer.key}>
            {layer.label}
          </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Format</span>
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as ExportFormat)}
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel (.xlsx)</option>
        </select>
      </label>

      <button
        className="primary-button export-download-button"
        type="button"
        disabled={isExporting || !mapBounds}
        onClick={() => void handleExport()}
      >
        {isExporting ? 'Exporting...' : 'Download export'}
      </button>

      {!mapBounds && (
        <p className="feedback error">
          Pan or zoom the map first so the reporting area can be detected.
        </p>
      )}

      {exportMessage && <p className="feedback success">{exportMessage}</p>}
      {exportError && <p className="feedback error">{exportError}</p>}
    </div>
  )
}
