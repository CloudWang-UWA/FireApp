export type LayerKey =
  | 'recorded_site_priority'
  | 'precaution_zone'
  | 'uploaded_site_priority'
  | 'granite'
  | 'fire_history'
  | 'fuel'
  | 'slope'
export type BasemapKey = 'osm' | 'googleSat'

export type GeoJsonData = GeoJSON.FeatureCollection

export type RasterOverlayData = {
  name: string
  type: 'image_overlay'
  image_url: string
  bounds: [[number, number], [number, number]]
}

export type LayerKind = 'geojson' | 'image_overlay'

export type LayerState = {
  kind: LayerKind
  geojson: GeoJsonData | null
  overlay: RasterOverlayData | null
  isLoading: boolean
  error: string | null
}

export type LayerStateMap = Record<LayerKey, LayerState>
