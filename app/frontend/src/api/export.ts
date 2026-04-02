import { API_BASE_URL } from '../config/map'

export async function fetchExportStatus() {
  const response = await fetch(`${API_BASE_URL}/api/export/status`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
