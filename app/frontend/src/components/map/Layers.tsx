import { LAYER_CONFIG } from '../../config/map'
import type { LayerKey, LayerStateMap } from '../../types/map'

const FUEL_LEGEND_ITEMS = [
  { code: 230, label: 'Forest' },
  { code: 423, label: 'Woodland' },
  { code: 510, label: 'Shrubland' },
  { code: 631, label: 'Grassland' },
  { code: 800, label: 'Wetlands' },
  { code: 950, label: 'Built-up' },
]

function fuelColor(code: number) {
  const red = ((code * 37) % 180) + 50
  const green = ((code * 67) % 180) + 50
  const blue = ((code * 97) % 180) + 50

  return `rgb(${red}, ${green}, ${blue})`
}

// Layer control panel for toggling map layers
export function Layers({
  layers,
  visibleLayers,
  setVisibleLayers,
}: {
  layers: LayerStateMap
  visibleLayers: Record<LayerKey, boolean>
  setVisibleLayers: (
    updater: (current: Record<LayerKey, boolean>) => Record<LayerKey, boolean>,
  ) => void
}) {
  function getLayerMeta(key: LayerKey) {
    if (layers[key].isLoading) {
      return 'Loading...'
    }

    const state = layers[key]

    if (state.error) {
      return 'Failed to load'
    }

    if (state.kind === 'image_overlay') {
      return state.overlay ? 'Overlay ready' : ''
    }

    if (key === 'precaution_zone' || key === 'granite' || key === 'fire_history') {
      return ''
    }

    const count = state.geojson?.features.length ?? 0
    return `${count} sites`
  }

  return (
    <div className="status-card">
      <h2>Layers</h2>
      <div className="layer-list">
        {/* Render available layers from configuration */}
        {LAYER_CONFIG.map(({ key, label }) => (
          <div className="layer-group" key={key}>
            <label className="layer-item">
              <span className="layer-toggle">
                <input
                  type="checkbox"
                  checked={visibleLayers[key]}
                  onChange={() =>
                    setVisibleLayers((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                />
                <span>{label}</span>
              </span>
              {getLayerMeta(key) ? (
                <span className="layer-meta">{getLayerMeta(key)}</span>
              ) : null}
            </label>

            {key === 'fuel' && visibleLayers.fuel && layers.fuel.overlay ? (
              <div className="fuel-legend">
                <p>Common fuel classes</p>
                <div className="fuel-legend-list">
                  {FUEL_LEGEND_ITEMS.map((item) => (
                    <span className="fuel-legend-item" key={item.code}>
                      <span
                        className="fuel-legend-swatch"
                        style={{ backgroundColor: fuelColor(item.code) }}
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
