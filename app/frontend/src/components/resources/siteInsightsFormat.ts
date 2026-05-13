import type { SiteInsightsApiResponse } from '../../api/risk'

export function nonEmptyString(value: unknown): string | undefined {
  if (value == null) return undefined
  const s = String(value).trim()
  return s.length > 0 ? s : undefined
}

/** Display label for API enum-style levels (e.g. MEDIUM → Medium). */
export function formatApiLevel(level: unknown): string | undefined {
  const raw = nonEmptyString(level)
  if (!raw) return undefined
  const n = raw.toUpperCase()
  return n.charAt(0) + n.slice(1).toLowerCase()
}

/** Badge tone class suffix: high | medium | low | unknown */
export function riskLevelTone(level: unknown): string {
  const n = nonEmptyString(level)?.toUpperCase()
  if (n === 'HIGH') return 'high'
  if (n === 'MEDIUM') return 'medium'
  if (n === 'LOW') return 'low'
  return 'unknown'
}

export function formatScoreAsPercent(score: unknown): string | undefined {
  if (typeof score !== 'number' || Number.isNaN(score)) return undefined
  const pct = Math.round(score * 100)
  return `${pct}%`
}

export function roundSlopeOneDecimal(deg: unknown): string | undefined {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return undefined
  return deg.toFixed(1)
}

/** Valid discrete site vulnerability scores from the risk pipeline (1–3). */
export function parseSiteVulnerabilityScore(raw: unknown): number | null {
  if (typeof raw !== 'number' || Number.isNaN(raw)) return null
  const n = Math.round(raw)
  if (n < 1 || n > 3) return null
  return n
}

export function hasFireHistory(api: SiteInsightsApiResponse): boolean {
  const y = api.fire_year
  const t = nonEmptyString(api.fire_type)
  if (typeof y === 'number' && !Number.isNaN(y)) return true
  return t != null
}

export function formatFireHistory(api: SiteInsightsApiResponse): string | undefined {
  const y = api.fire_year
  const t = nonEmptyString(api.fire_type)
  const yearOk = typeof y === 'number' && !Number.isNaN(y)
  if (yearOk && t) return `${Math.trunc(y)} · ${t}`
  if (yearOk) return `${Math.trunc(y)}`
  if (t) return t
  return undefined
}

export function hasGraniteData(api: SiteInsightsApiResponse): boolean {
  if (api.granite_score != null && typeof api.granite_score === 'number' && !Number.isNaN(api.granite_score)) {
    return true
  }
  return nonEmptyString(api.granite_level) != null
}

/** 0–1 score for gauge: prefers site_priority_score, then risk_score (API order). */
export function primaryScore01(api: SiteInsightsApiResponse): number | null {
  const sp = api.site_priority_score
  const rs = api.risk_score
  if (typeof sp === 'number' && !Number.isNaN(sp)) {
    return Math.min(1, Math.max(0, sp))
  }
  if (typeof rs === 'number' && !Number.isNaN(rs)) {
    return Math.min(1, Math.max(0, rs))
  }
  return null
}

/**
 * Normalized 0–1 fill for hazard meter from raw hazard_score only.
 * Uses a fixed upper bound so the bar reflects the returned score without inventing extra metrics.
 */
export const HAZARD_SCORE_VISUAL_MAX = 7

export function hazardScoreFillRatio(score: unknown): number | null {
  if (typeof score !== 'number' || Number.isNaN(score)) return null
  return Math.min(1, Math.max(0, score / HAZARD_SCORE_VISUAL_MAX))
}

/** Slope (degrees) clamped for SVG layout only; display text still uses raw API value. */
export function slopeDegForVisual(deg: unknown): number | null {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return null
  return Math.min(Math.max(deg, 0), 55)
}
