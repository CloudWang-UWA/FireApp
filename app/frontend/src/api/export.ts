import { API_BASE_URL } from '../config/map'

export type ExportBounds = {
  north: number
  south: number
  east: number
  west: number
}

export type ExportFormat = 'csv' | 'xlsx'

export async function downloadExportFile({
  layerName,
  format,
  bounds,
}: {
  layerName: string
  format: ExportFormat
  bounds: ExportBounds
}) {
  const response = await fetch(`${API_BASE_URL}/api/export/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      layerName,
      format,
      bounds,
    }),
  })

  if (!response.ok) {
    let message = 'Export failed'

    try {
      const payload = (await response.json()) as { error?: string }
      message = payload.error ?? message
    } catch {
      // keep default message
    }

    throw new Error(message)
  }

  const blob = await response.blob()
  const fileExtension = format === 'xlsx' ? 'xlsx' : 'csv'
  const downloadName = `${layerName}-export.${fileExtension}`

  const objectUrl = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = downloadName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(objectUrl)
}