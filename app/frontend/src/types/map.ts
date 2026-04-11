export type LayerKey =
  | 'recorded_site_priority'
  | 'potential_heritage_precaution'
export type BasemapKey = 'osm' | 'googleSat'

export type GeoJsonData = GeoJSON.FeatureCollection

export type LayerState = {
  data: GeoJsonData | null
  isLoading: boolean
  error: string | null
}

export type LayerStateMap = Record<LayerKey, LayerState>
