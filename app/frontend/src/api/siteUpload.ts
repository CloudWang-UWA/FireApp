import { API_BASE_URL } from '../config/map'

// Request body for creating a new site upload
export type SiteUploadRequest = {
  name: string
  placeType: string
  notes: string
  latitude: number
  longitude: number
  siteSizeM: number
  locationSource: 'manual' | 'device_gps'
}

export type UploadedSiteRecord = {
  id: number
  name: string
  placeType: string
  notes: string | null
  latitude: number
  longitude: number
  siteSizeM: number
  locationSource: 'manual' | 'device_gps'
  status: string
  createdByUserId: number
  createdAt: string
  updatedAt: string
}

export type SiteUploadResponse = {
  site: UploadedSiteRecord
  insideStudyArea: boolean
  riskAvailable: boolean
  outOfAreaWarning: string | null
}

async function parseResponse(response: Response): Promise<SiteUploadResponse> {
  const result = (await response.json()) as {
    error?: string
  } & SiteUploadResponse

  if (!response.ok) {
    throw new Error(result.error ?? 'Request failed')
  }

  return result as SiteUploadResponse
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
): Promise<SiteUploadResponse> {
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
