import { API_BASE_URL } from '../config/map'
import type { LayerKey } from '../types/map'

// Fetch a GIS layer from the backend by layer key
export async function fetchLayer(layerKey: LayerKey) {
  const response = await fetch(`${API_BASE_URL}/api/layers/${layerKey}`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
