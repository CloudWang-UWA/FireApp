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
  function getLayerMeta(key: LayerKey) {
    if (layers[key].isLoading) {
      return 'Loading...'
    }

    if (key === 'precaution_zone') {
      return ''
    }

    const count = layers[key].data?.features.length ?? 0
    return `${count} sites`
  }

  return (
    <div className="status-card">
      <h2>Layers</h2>
      <div className="layer-list">
        {/* Render available layers from configuration */}
        {LAYER_CONFIG.map(({ key, label }) => (
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
              <span>{label}</span>
            </span>
            {getLayerMeta(key) ? (
              <span className="layer-meta">{getLayerMeta(key)}</span>
            ) : null}
          </label>
        ))}
      </div>
    </div>
  )
}
