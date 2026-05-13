import { useId } from 'react'
import type { SiteInsightsApiResponse } from '../../api/risk'
import { Gem, History, MapPin, Mountain, Flame, Shield, Target } from 'lucide-react'
import { LocationPreviewCard } from './LocationPreviewCard'
import {
  formatApiLevel,
  formatFireHistory,
  formatScoreAsPercent,
  hasFireHistory,
  hasGraniteData,
  nonEmptyString,
  roundSlopeOneDecimal,
  riskLevelTone,
} from './siteInsightsFormat'
import './SiteInsightsDashboard.css'

const RPM_INNER = 88
const RPM_PAD = 6

function RiskPriorityMatrix({
  riskScore,
  sitePriorityScore,
}: {
  riskScore: number | null
  sitePriorityScore: number | null
}) {
  const uid = useId().replace(/:/g, '')
  const gradId = `siRpmHeat-${uid}`

  const rx =
    typeof riskScore === 'number' && !Number.isNaN(riskScore)
      ? Math.min(1, Math.max(0, riskScore))
      : null
  const py =
    typeof sitePriorityScore === 'number' && !Number.isNaN(sitePriorityScore)
      ? Math.min(1, Math.max(0, sitePriorityScore))
      : null
  const hasPoint = rx != null && py != null

  const x0 = RPM_PAD
  const y0 = RPM_PAD
  const plot = RPM_INNER
  const x1 = x0 + plot
  const y1 = y0 + plot

  const cx = hasPoint ? x0 + rx * plot : (x0 + x1) / 2
  const cy = hasPoint ? y0 + (1 - py) * plot : (y0 + y1) / 2

  const t1 = x0 + plot / 3
  const t2 = x0 + (2 * plot) / 3

  return (
    <div className="si-dash-rpm" role="img" aria-label="Risk score versus site priority score matrix">
      <div className="si-dash-rpm-y-axis" aria-hidden>
        <span>High</span>
        <span>Medium</span>
        <span>Low</span>
      </div>
      <div className="si-dash-rpm-plot-wrap">
        <svg
          className="si-dash-rpm-svg"
          viewBox={`0 0 ${RPM_PAD * 2 + RPM_INNER} ${RPM_PAD * 2 + RPM_INNER}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d6b52" stopOpacity="0.92" />
              <stop offset="38%" stopColor="#c4a43a" stopOpacity="0.88" />
              <stop offset="72%" stopColor="#d9783d" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#a82e1f" stopOpacity="0.92" />
            </linearGradient>
          </defs>
          <rect
            x={x0}
            y={y0}
            width={plot}
            height={plot}
            rx="8"
            className="si-dash-rpm-frame"
            fill={`url(#${gradId})`}
          />
          <line x1={t1} y1={y0} x2={t1} y2={y1} className="si-dash-rpm-grid" />
          <line x1={t2} y1={y0} x2={t2} y2={y1} className="si-dash-rpm-grid" />
          <line x1={x0} y1={y0 + plot / 3} x2={x1} y2={y0 + plot / 3} className="si-dash-rpm-grid" />
          <line x1={x0} y1={y0 + (2 * plot) / 3} x2={x1} y2={y0 + (2 * plot) / 3} className="si-dash-rpm-grid" />
          <rect
            x={x0}
            y={y0}
            width={plot}
            height={plot}
            rx="8"
            fill="none"
            className="si-dash-rpm-border"
          />
          {hasPoint ? (
            <g className="si-dash-rpm-marker">
              <circle cx={cx} cy={cy} r="7" className="si-dash-rpm-marker-halo" />
              <circle cx={cx} cy={cy} r="4.5" className="si-dash-rpm-marker-dot" />
            </g>
          ) : (
            <text x={(x0 + x1) / 2} y={(y0 + y1) / 2} className="si-dash-rpm-na" textAnchor="middle" dominantBaseline="middle">
              —
            </text>
          )}
        </svg>
      </div>
      <div className="si-dash-rpm-x-axis" aria-hidden>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>
  )
}

type SlopeInclineTier = 'low' | 'moderate' | 'steep'

function slopeInclineTier(deg: number | null): SlopeInclineTier | null {
  if (deg == null || Number.isNaN(deg)) return null
  if (deg < 5) return 'low'
  if (deg < 15) return 'moderate'
  return 'steep'
}

function slopeClassificationLabel(deg: number | null): string | null {
  const t = slopeInclineTier(deg)
  if (t === 'low') return 'Low slope'
  if (t === 'moderate') return 'Moderate slope'
  if (t === 'steep') return 'Steep slope'
  return null
}

/** Maps slope_deg to horizontal marker position (0–100%); scale uses full bar for sub-10° readability. */
const SLOPE_BAR_SCALE_MAX = 22.5

function slopeMarkerPercent(deg: number): number {
  const clamped = Math.min(Math.max(deg, 0), SLOPE_BAR_SCALE_MAX)
  return (clamped / SLOPE_BAR_SCALE_MAX) * 100
}

function SlopeClassificationBar({ slopeDeg }: { slopeDeg: number | null }) {
  const hasValue = slopeDeg != null && !Number.isNaN(slopeDeg)
  const pct = hasValue ? slopeMarkerPercent(slopeDeg) : null

  return (
    <div
      className={`si-dash-slope-bar-wrap${hasValue ? '' : ' si-dash-slope-bar-wrap--empty'}`}
      role="img"
      aria-label={
        hasValue
          ? `Terrain slope ${slopeDeg} degrees on classification bar from 0 to ${SLOPE_BAR_SCALE_MAX} degrees scale`
          : 'Slope classification bar, no value'
      }
    >
      <div className="si-dash-slope-bar" aria-hidden>
        <div className="si-dash-slope-seg si-dash-slope-seg--low" />
        <div className="si-dash-slope-seg si-dash-slope-seg--mod" />
        <div className="si-dash-slope-seg si-dash-slope-seg--steep" />
        {pct != null ? (
          <div
            className="si-dash-slope-marker"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          />
        ) : null}
      </div>
      <div className="si-dash-slope-band-labels" aria-hidden>
        <span>0–5°</span>
        <span>5–15°</span>
        <span>15°+</span>
      </div>
    </div>
  )
}

/** Fuel category from fuel_label text only (keyword match). */
type FuelCombustCategory = 'grass' | 'shrub' | 'woodland' | 'forest'

const FUEL_COMBUST_ORDER: FuelCombustCategory[] = ['grass', 'shrub', 'woodland', 'forest']

const FUEL_COMBUST_DISPLAY: Record<FuelCombustCategory, string> = {
  grass: 'Grass',
  shrub: 'Shrub',
  woodland: 'Woodland',
  forest: 'Forest',
}

function fuelCombustCategoryFromLabel(raw: string | null | undefined): FuelCombustCategory | null {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
  if (!s) return null

  const rules: { cat: FuelCombustCategory; keys: string[] }[] = [
    {
      cat: 'forest',
      keys: [
        'rainforest',
        'rain forest',
        'closed forest',
        'dense forest',
        'jungle',
        'conifer',
        'boreal',
        'redwood',
        'sequoia',
        'timber',
        'forest',
      ],
    },
    {
      cat: 'woodland',
      keys: [
        'woodland',
        'savannah',
        'savanna',
        'parkland',
        'open forest',
        'sparse forest',
        'open woodland',
        'wood lot',
        'woodlot',
      ],
    },
    {
      cat: 'shrub',
      keys: [
        'shrubland',
        'chaparral',
        'scrubland',
        'scrub',
        'mallee',
        'heath',
        'garrigue',
        'maquis',
        'fynbos',
        'sagebrush',
        'brush',
        'shrub',
      ],
    },
    {
      cat: 'grass',
      keys: [
        'grassland',
        'prairie',
        'pasture',
        'meadow',
        'steppe',
        'tundra',
        'cropland',
        'agricultural',
        'hay',
        'herbaceous',
        'rush',
        'sedge',
        'turf',
        'grass',
      ],
    },
  ]

  for (const { cat, keys } of rules) {
    for (const k of keys) {
      if (s.includes(k)) return cat
    }
  }
  return null
}

const FUEL_SPREAD_FILLED: Record<FuelCombustCategory, number> = {
  grass: 2,
  shrub: 3,
  woodland: 4,
  forest: 5,
}

function FuelSpreadPotential({ activeCategory }: { activeCategory: FuelCombustCategory | null }) {
  const filled =
    activeCategory != null ? FUEL_SPREAD_FILLED[activeCategory] : 0

  return (
    <div
      className="si-dash-fuel-spread"
      aria-label={
        activeCategory != null
          ? `Spread potential indicator, ${filled} of five for ${FUEL_COMBUST_DISPLAY[activeCategory]} fuel`
          : 'Spread potential indicator, not set'
      }
    >
      <span className="si-dash-fuel-spread-label">Spread Potential</span>
      <span className="si-dash-fuel-spread-dots" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={
              i < filled ? 'si-dash-fuel-dot si-dash-fuel-dot--on' : 'si-dash-fuel-dot si-dash-fuel-dot--off'
            }
          />
        ))}
      </span>
    </div>
  )
}

function FuelCategoryGrid({ activeCategory }: { activeCategory: FuelCombustCategory | null }) {
  return (
    <div
      className="si-dash-fuel-cat-grid"
      role="list"
      aria-label={
        activeCategory != null
          ? `Fuel category tiles; ${FUEL_COMBUST_DISPLAY[activeCategory]} selected from label text`
          : 'Fuel category tiles; none selected from label text'
      }
    >
      {FUEL_COMBUST_ORDER.map((cat) => {
        const isActive = activeCategory === cat
        return (
          <div
            key={cat}
            role="listitem"
            className={`si-dash-fuel-tile si-dash-fuel-tile--${cat}${isActive ? ' si-dash-fuel-tile--active' : ''}`}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="si-dash-fuel-tile-label">{FUEL_COMBUST_DISPLAY[cat]}</span>
          </div>
        )
      })}
    </div>
  )
}

function levelBadgeClass(level: unknown): string {
  return `si-dash-badge-level ${riskLevelTone(level)}`
}

/** Upper semicircle: φ runs π (left, low score) → 0 (right, high score). */
const HAZARD_ARC_PHI_LOW_END = (2 * Math.PI) / 3
const HAZARD_ARC_PHI_MED_END = Math.PI / 3
const HAZARD_SCORE_GAUGE_MAX = 7

function polar(cx: number, cy: number, r: number, phi: number) {
  return {
    x: cx + r * Math.cos(phi),
    y: cy - r * Math.sin(phi),
  }
}

function donutSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  phiStart: number,
  phiEnd: number,
) {
  const p1 = polar(cx, cy, rOut, phiStart)
  const p2 = polar(cx, cy, rOut, phiEnd)
  const p3 = polar(cx, cy, rIn, phiEnd)
  const p4 = polar(cx, cy, rIn, phiStart)
  return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 0 0 ${p4.x} ${p4.y} Z`
}

function hazardIndicatorPhi(score: number | null, levelRaw: unknown): number | null {
  if (typeof score === 'number' && !Number.isNaN(score)) {
    const clamped = Math.min(Math.max(score, 0), HAZARD_SCORE_GAUGE_MAX)
    return Math.PI * (1 - clamped / HAZARD_SCORE_GAUGE_MAX)
  }
  const L = String(levelRaw ?? '')
    .trim()
    .toUpperCase()
  if (L === 'LOW') return (Math.PI + HAZARD_ARC_PHI_LOW_END) / 2
  if (L === 'MEDIUM') return Math.PI / 2
  if (L === 'HIGH') return HAZARD_ARC_PHI_MED_END / 2
  return null
}

function HazardSemiGauge({
  hazardScore,
  hazardLevel,
  scoreDisplay,
}: {
  hazardScore: number | null
  hazardLevel: unknown
  scoreDisplay: string
}) {
  const filterId = `siHazardGaugeShadow-${useId().replace(/:/g, '')}`
  const cx = 100
  const cy = 100
  const rOut = 78
  const rIn = 48
  const phiLow = Math.PI
  const phiMed = HAZARD_ARC_PHI_LOW_END
  const phiHigh = HAZARD_ARC_PHI_MED_END
  const phiEnd = 0

  const pathLow = donutSectorPath(cx, cy, rIn, rOut, phiLow, phiMed)
  const pathMed = donutSectorPath(cx, cy, rIn, rOut, phiMed, phiHigh)
  const pathHigh = donutSectorPath(cx, cy, rIn, rOut, phiHigh, phiEnd)

  const phiNeedle = hazardIndicatorPhi(hazardScore, hazardLevel)
  const needleLen = rOut + 8
  const tip = phiNeedle != null ? polar(cx, cy, needleLen, phiNeedle) : null

  const hasData = phiNeedle != null

  return (
    <div className={`si-dash-hazard-gauge${hasData ? '' : ' si-dash-hazard-gauge--empty'}`}>
      <svg
        className="si-dash-hazard-gauge-svg"
        viewBox="0 0 200 112"
        aria-hidden
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <path className="si-dash-hazard-seg si-dash-hazard-seg--low" d={pathLow} />
          <path className="si-dash-hazard-seg si-dash-hazard-seg--med" d={pathMed} />
          <path className="si-dash-hazard-seg si-dash-hazard-seg--high" d={pathHigh} />
        </g>
        {tip ? (
          <line className="si-dash-hazard-needle" x1={cx} y1={cy} x2={tip.x} y2={tip.y} />
        ) : null}
        {tip ? <circle className="si-dash-hazard-needle-cap" cx={tip.x} cy={tip.y} r="5" /> : null}
        <circle className="si-dash-hazard-hub" cx={cx} cy={cy} r="7" />
      </svg>
      <div className="si-dash-hazard-seg-labels" aria-hidden>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
      <div className="si-dash-hazard-foot">
        <p className="si-dash-hazard-score">{scoreDisplay}</p>
        {formatApiLevel(hazardLevel) ? (
          <span className={levelBadgeClass(hazardLevel)}>{formatApiLevel(hazardLevel)}</span>
        ) : (
          <span className="si-dash-chip-value">—</span>
        )}
      </div>
    </div>
  )
}

export function SiteInsightsMainPanels({ api }: { api: SiteInsightsApiResponse }) {
  const riskScoreNum =
    typeof api.risk_score === 'number' && !Number.isNaN(api.risk_score) ? api.risk_score : null
  const sitePriorityNum =
    typeof api.site_priority_score === 'number' && !Number.isNaN(api.site_priority_score)
      ? api.site_priority_score
      : null
  const hazardScoreNum =
    typeof api.hazard_score === 'number' && !Number.isNaN(api.hazard_score) ? api.hazard_score : null
  const hazardScoreText = hazardScoreNum != null ? String(hazardScoreNum) : '—'
  const slopeText = roundSlopeOneDecimal(api.slope_deg)
  const slopeNum =
    typeof api.slope_deg === 'number' && !Number.isNaN(api.slope_deg) ? api.slope_deg : null
  const slopeClassLabel = slopeClassificationLabel(slopeNum)
  const fuelLabelClean = nonEmptyString(api.fuel_label)
  const fuelCategoryActive = fuelLabelClean ? fuelCombustCategoryFromLabel(fuelLabelClean) : null

  const overviewSiteName = nonEmptyString(api.site_name)

  return (
    <div className="si-dash">
      <header className="si-dash-main-header">
        <h2>Site Overview</h2>
        <p className="si-dash-site-context-title">{overviewSiteName ?? '—'}</p>
      </header>

      <div className="si-dash-hero">
        <section className="si-dash-card si-dash-card--risk-priority">
          <div className="si-dash-card-head">
            <div>
              <h2>Risk &amp; Site Priority</h2>
              <p>
                Compares the site&apos;s overall risk score with its priority level. Higher values indicate
                sites that may need closer monitoring.
              </p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <Target size={20} />
            </span>
          </div>
          <div className="si-dash-risk-body">
            <RiskPriorityMatrix riskScore={riskScoreNum} sitePriorityScore={sitePriorityNum} />
            <div className="si-dash-stat-grid">
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Risk level</span>
                {formatApiLevel(api.risk_level) ? (
                  <span className={levelBadgeClass(api.risk_level)}>{formatApiLevel(api.risk_level)}</span>
                ) : (
                  <span className="si-dash-chip-value">—</span>
                )}
              </div>
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Site priority level</span>
                {formatApiLevel(api.site_priority_level) ? (
                  <span className={levelBadgeClass(api.site_priority_level)}>
                    {formatApiLevel(api.site_priority_level)}
                  </span>
                ) : (
                  <span className="si-dash-chip-value">—</span>
                )}
              </div>
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Risk score</span>
                <span className="si-dash-chip-value">{formatScoreAsPercent(api.risk_score) ?? '—'}</span>
              </div>
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Site priority score</span>
                <span className="si-dash-chip-value">{formatScoreAsPercent(api.site_priority_score) ?? '—'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="si-dash-card si-dash-card--hazard">
          <div className="si-dash-card-head">
            <div>
              <h2>Hazard Summary</h2>
              <p>
                Shows hazard severity on a 0–7 scale, where higher values indicate greater fire hazard.
              </p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <Shield size={20} />
            </span>
          </div>
          <HazardSemiGauge
            hazardScore={hazardScoreNum}
            hazardLevel={api.hazard_level}
            scoreDisplay={hazardScoreText}
          />
        </section>
      </div>

      <div className="si-dash-bento">
        <section className="si-dash-card">
          <div className="si-dash-card-head">
            <div>
              <h2>Slope Profile</h2>
              <p>
                Shows the terrain slope at the selected site. Lower slopes indicate flatter ground; higher
                slopes indicate steeper terrain.
              </p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <Mountain size={20} />
            </span>
          </div>
          <div className="si-dash-slope-body">
            <SlopeClassificationBar slopeDeg={slopeNum} />
            <div>
              <p className="si-dash-slope-deg">{slopeText != null ? `${slopeText}°` : '—'}</p>
              <p className="si-dash-slope-unit">Degrees</p>
              <p className="si-dash-slope-class">{slopeClassLabel ?? '—'}</p>
            </div>
          </div>
        </section>

        <section className="si-dash-card">
          <div className="si-dash-card-head">
            <div>
              <h2>Fuel Type</h2>
              <p>Shows the vegetation or fuel classification associated with the site.</p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <Flame size={20} />
            </span>
          </div>
          <div className="si-dash-fuel-body">
            <div className="si-dash-fuel-headline">
              <p className="si-dash-fuel-title">{fuelLabelClean ?? 'No label returned'}</p>
              <span className="si-dash-fuel-code-badge">
                {typeof api.fuel_code === 'number' && !Number.isNaN(api.fuel_code) ? api.fuel_code : '—'}
              </span>
            </div>
            <FuelSpreadPotential activeCategory={fuelCategoryActive} />
            <FuelCategoryGrid activeCategory={fuelCategoryActive} />
          </div>
        </section>

        <section className="si-dash-card">
          <div className="si-dash-card-head">
            <div>
              <h2>Fire History</h2>
              <p>Shows any recorded fire history linked to the selected site.</p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <History size={20} />
            </span>
          </div>
          {hasFireHistory(api) ? (
            <div className="si-dash-chip" style={{ marginTop: '0.25rem' }}>
              <span className="si-dash-chip-label">Recorded</span>
              <span className="si-dash-chip-value">{formatFireHistory(api)}</span>
            </div>
          ) : (
            <div className="si-dash-empty si-dash-empty--fire">
              <span className="si-dash-empty-icon" aria-hidden>
                <History size={18} strokeWidth={1.5} />
              </span>
              <p>No recorded fire history available</p>
            </div>
          )}
        </section>

        <section className="si-dash-card">
          <div className="si-dash-card-head">
            <div>
              <h2>Granite Outcrop</h2>
              <p>
                Shows whether nearby granite outcrops may influence fire behavior around heritage sites.
              </p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <Gem size={20} />
            </span>
          </div>
          {hasGraniteData(api) ? (
            <div className="si-dash-stat-grid" style={{ marginTop: '0.25rem' }}>
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Granite score</span>
                <span className="si-dash-chip-value">
                  {api.granite_score != null &&
                  typeof api.granite_score === 'number' &&
                  !Number.isNaN(api.granite_score)
                    ? String(api.granite_score)
                    : '—'}
                </span>
              </div>
              <div className="si-dash-chip">
                <span className="si-dash-chip-label">Granite level</span>
                {formatApiLevel(api.granite_level) ? (
                  <span className={levelBadgeClass(api.granite_level)}>{formatApiLevel(api.granite_level)}</span>
                ) : (
                  <span className="si-dash-chip-value">—</span>
                )}
              </div>
            </div>
          ) : (
            <div className="si-dash-empty si-dash-empty--granite">
              <span className="si-dash-empty-icon" aria-hidden>
                <Gem size={18} strokeWidth={1.5} />
              </span>
              <p>No granite outcrop influence detected</p>
            </div>
          )}
        </section>

        <section className="si-dash-card si-dash-card--wide">
          <div className="si-dash-card-head">
            <div>
              <h2>Location</h2>
              <p>Shows the selected site location and coordinates.</p>
            </div>
            <span className="si-dash-icon" aria-hidden>
              <MapPin size={20} />
            </span>
          </div>
          <div className="si-dash-coords">
            <div className="si-dash-coord-pill">
              <span>Latitude</span>
              <span>
                {typeof api.latitude === 'number' && !Number.isNaN(api.latitude) ? String(api.latitude) : '—'}
              </span>
            </div>
            <div className="si-dash-coord-pill">
              <span>Longitude</span>
              <span>
                {typeof api.longitude === 'number' && !Number.isNaN(api.longitude)
                  ? String(api.longitude)
                  : '—'}
              </span>
            </div>
          </div>
          <LocationPreviewCard
            latitude={api.latitude}
            longitude={api.longitude}
            siteName={api.site_name ?? null}
            siteId={api.site_id ?? null}
            areaName={api.area_name ?? null}
            variant="embedded"
          />
        </section>
      </div>
    </div>
  )
}
