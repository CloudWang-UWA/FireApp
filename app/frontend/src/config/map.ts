import type { BasemapKey, LayerKey } from '../types/map'

// Base URL for backend API, fallback to local server during development
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

// Key used to store authentication token in localStorage
export const TOKEN_STORAGE_KEY = 'fire-app-auth-token'

// Initial map center (Albany region)
export const INITIAL_CENTER: [number, number] = [-34.95, 117.88]

// Configuration for available data layers (used in UI and map rendering)
export const LAYER_CONFIG: Array<{
  key: LayerKey
  label: string
  color: string
}> = [
  { key: 'site', label: 'Site', color: '#c24d2c' },
  { key: 'granite', label: 'Granite Outcrops', color: '#6c7a2b' },
  { key: 'fuel', label: 'Fuel Load', color: '#d08c00' },
  { key: 'vegetation', label: 'Vegetation', color: '#237a57' },
  { key: 'slope', label: 'Slope', color: '#355c9a' },
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
