import type { BasemapKey, LayerKey, LayerKind } from '../types/map'

// Base URL for backend API, fallback to local server during development
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000'

// Key used to store authentication token in localStorage
export const TOKEN_STORAGE_KEY = 'fire-app-auth-token'

// Initial map center (Albany region)
export const INITIAL_CENTER: [number, number] = [-34.95, 117.88]

// Configuration for available data layers (used in UI and map rendering)
export const LAYER_CONFIG: Array<{
  key: LayerKey
  label: string
  kind: LayerKind
  color?: string
}> = [
  {
    key: 'recorded_site_priority',
    label: 'Recorded Site Priority',
    kind: 'geojson',
    color: '#b2182b',
  },
  {
    key: 'precaution_zone',
    label: 'Precaution Areas',
    kind: 'geojson',
    color: '#ef8a62',
  },
  {
    key: 'uploaded_site_priority',
    label: 'Uploaded Site Priority',
    kind: 'geojson',
    color: '#2b8cbe',
  },
  {
    key: 'granite',
    label: 'Granite',
    kind: 'geojson',
    color: '#6b7280',
  },
  {
    key: 'fire_history',
    label: 'Fire History',
    kind: 'geojson',
    color: '#dc2626',
  },
  {
    key: 'fuel',
    label: 'Fuel (overlay)',
    kind: 'image_overlay',
  },
  {
    key: 'slope',
    label: 'Slope (overlay)',
    kind: 'image_overlay',
  },
]

// Configuration for available basemaps
export const BASEMAP_CONFIG: Record<
  BasemapKey,
  {
    label: string
    attribution: string
    maxZoom: number
    subdomains: string[]
    url: string
  }
> = {
  osm: {
    label: 'OpenStreetMap',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  googleSat: {
    label: 'Google Satellite',
    attribution: 'Google Satellite',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  },
}
