import { API_BASE_URL } from '../config/map'

// Request body for creating a new site upload
type SiteUploadRequest = {
  name: string
  placeType: string
  notes: string
  latitude: number
  longitude: number
  siteSizeM: number
  locationSource: 'manual' | 'device_gps'
}

async function parseResponse(response: Response) {
  const result = (await response.json()) as {
    error?: string
    site?: unknown
  }

  if (!response.ok) {
    throw new Error(result.error ?? 'Request failed')
  }

  return result
}

export async function fetchSiteUploadStatus() {
  const response = await fetch(`${API_BASE_URL}/api/site-upload/status`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export async function createSiteUpload(
  token: string,
  siteData: SiteUploadRequest,
) {
  const response = await fetch(`${API_BASE_URL}/api/site-upload/sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(siteData),
  })

  return parseResponse(response)
}
