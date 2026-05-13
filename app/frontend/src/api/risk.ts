import { API_BASE_URL } from '../config/map'

// Check whether precomputed risk data is available
export async function fetchRiskStatus() {
  const response = await fetch(`${API_BASE_URL}/api/risk/status`)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}

export type SiteInsightsApiResponse = {
  site_id?: string | null
  site_name?: string | null
  site_type?: string | null
  ach_identifier?: string | null
  place_type?: string | null
  area_name?: string | null
  latitude?: number | null
  longitude?: number | null
  risk_level?: string | null
  risk_score?: number | null
  predicted_probability?: number | null
  slope_deg?: number | null
  fuel_code?: number | null
  fuel_label?: string | null
  fire_year?: number | null
  fire_type?: string | null
  hazard_score?: number | null
  hazard_level?: string | null
  site_priority_score?: number | null
  site_priority_level?: string | null
  site_vulnerability_score?: number | null
  granite_score?: number | null
  granite_level?: string | null
}

export async function fetchSiteInsights(options?: {
  siteId?: string | null
  signal?: AbortSignal
}): Promise<SiteInsightsApiResponse> {
  const siteId = options?.siteId != null ? String(options.siteId).trim() : ''
  const signal = options?.signal
  const params = new URLSearchParams()
  if (siteId) {
    params.set('site_id', siteId)
  }
  const query = params.toString()
  const url =
    query.length > 0
      ? `${API_BASE_URL}/api/risk/site-insights?${query}`
      : `${API_BASE_URL}/api/risk/site-insights`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
