export type LayerKey = 'site' | 'granite' | 'fuel' | 'vegetation' | 'slope' | 'risk_overview'
export type BasemapKey = 'osm' | 'googleSat'

export type GeoJsonData = GeoJSON.FeatureCollection

export type LayerState = {
  data: GeoJsonData | null
  isLoading: boolean
  error: string | null
}

export type LayerStateMap = Record<LayerKey, LayerState>
