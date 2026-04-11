import { API_BASE_URL } from '../config/map'

// Check the status of the site upload module.
export async function fetchSiteUploadStatus() {
  const response = await fetch(`${API_BASE_URL}/api/site-upload/status`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
