import { API_BASE_URL } from '../config/map'
import type { LayerKey, RasterOverlayData } from '../types/map'

// Fetch a GIS layer from the backend by layer key
export async function fetchLayer(
  layerKey: LayerKey,
  options?: { signal?: AbortSignal },
) {
  const layerPath =
    layerKey === 'uploaded_site_priority' ? 'uploaded-sites' : layerKey

  const response = await fetch(`${API_BASE_URL}/api/layers/${layerPath}`, {
    signal: options?.signal,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function fetchOverlay(layerKey: 'fuel' | 'slope'): Promise<RasterOverlayData> {
  const response = await fetch(`${API_BASE_URL}/api/layers/${layerKey}/overlay`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
