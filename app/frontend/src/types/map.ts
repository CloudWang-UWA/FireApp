export type LayerKey =
  | 'recorded_site_priority'
  | 'precaution_zone'
export type BasemapKey = 'osm' | 'googleSat'

export type GeoJsonData = GeoJSON.FeatureCollection

export type LayerState = {
  data: GeoJsonData | null
  isLoading: boolean
  error: string | null
}

export type LayerStateMap = Record<LayerKey, LayerState>
