import { API_BASE_URL } from '../config/map'

// Check the status of the upload request
export async function fetchUploadStatus() {
  const response = await fetch(`${API_BASE_URL}/api/upload/status`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
