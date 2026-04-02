import { BASEMAP_CONFIG } from '../../config/map'
import type { BasemapKey } from '../../types/map'

export function Basemap({
  basemap,
  setBasemap,
}: {
  basemap: BasemapKey
  setBasemap: (basemap: BasemapKey) => void
}) {
  return (
    <div className="status-card">
      <h2>Basemap</h2>
      <div className="layer-list">
        {(Object.entries(BASEMAP_CONFIG) as Array<
          [BasemapKey, (typeof BASEMAP_CONFIG)[BasemapKey]]
        >).map(([key, config]) => (
          <label className="layer-item" key={key}>
            <span className="layer-toggle">
              <input
                type="radio"
                name="basemap"
                checked={basemap === key}
                onChange={() => setBasemap(key)}
              />
              <span>{config.label}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
