import { LAYER_CONFIG } from '../../config/map'
import type { LayerKey, LayerStateMap } from '../../types/map'

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
  return (
    <div className="status-card">
      <h2>Layers</h2>
      <div className="layer-list">
        {/* Render available layers from configuration */}
        {LAYER_CONFIG.map(({ key, label, color }) => (
          <label className="layer-item" key={key}>
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
              <span className="swatch" style={{ backgroundColor: color }} />
              <span>{label}</span>
            </span>
            <span className="layer-meta">
              {layers[key].isLoading
                ? 'Loading...'
                : `${layers[key].data?.features.length ?? 0} features`}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
