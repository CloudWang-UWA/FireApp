import { Gauge, Layers, ShieldAlert, Tag, Trees } from 'lucide-react'
import type { SiteInsightsApiResponse } from '../../api/risk'
import {
  formatApiLevel,
  nonEmptyString,
  parseSiteVulnerabilityScore,
  riskLevelTone,
} from './siteInsightsFormat'

export function InsightSidebar({
  insights,
  onExportSite,
  onBackToMap,
}: {
  insights: SiteInsightsApiResponse | null
  onExportSite?: () => void
  onBackToMap?: () => void
}) {
  const siteName = insights ? nonEmptyString(insights.site_name) : undefined
  const siteId = insights ? nonEmptyString(insights.site_id) : undefined
  const siteType = insights ? nonEmptyString(insights.site_type) : undefined
  const placeType = insights ? nonEmptyString(insights.place_type) : undefined
  const riskLabel = insights ? formatApiLevel(insights.risk_level) : undefined
  const riskTone = insights ? riskLevelTone(insights.risk_level) : 'unknown'

  const vulnerabilityScore = insights
    ? parseSiteVulnerabilityScore(insights.site_vulnerability_score)
    : null
  const vulnerabilitySeverityLabel =
    vulnerabilityScore == null
      ? null
      : vulnerabilityScore === 1
        ? 'LOW'
        : vulnerabilityScore === 2
          ? 'MEDIUM'
          : 'HIGH'

  return (
    <aside className="si-sidebar si-card">
      <p className="si-sidebar-label">Selected heritage site</p>
      <h1 className="si-sidebar-title">Site Insights</h1>
      <p className="si-site-name">{siteName ?? '-'}</p>

      <div className="si-meta-card">
        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
            <Tag size={14} />
          </span>
          <div>
            <p className="si-meta-key">Site ID</p>
            <p className="si-meta-value">{siteId ?? 'Unavailable'}</p>
          </div>
        </div>

        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
            <Layers size={14} />
          </span>
          <div>
            <p className="si-meta-key">Source</p>
            <p className="si-meta-value">{siteType ?? 'Unavailable'}</p>
          </div>
        </div>

        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
            <ShieldAlert size={14} />
          </span>
          <div>
            <p className="si-meta-key">Risk level</p>
            {riskLabel ? (
              <span className={`si-risk-badge ${riskTone}`}>{riskLabel} risk</span>
            ) : (
              <span className="si-meta-value si-meta-value--muted">-</span>
            )}
          </div>
        </div>

        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
            <Trees size={14} />
          </span>
          <div>
            <p className="si-meta-key">Place type</p>
            <p className="si-meta-value">{placeType ?? 'Unavailable'}</p>
          </div>
        </div>
      </div>

      <section className="si-probability-card">
        <div className="si-probability-head">
          <p>Site Vulnerability</p>
          <Gauge size={16} aria-hidden />
        </div>
        <p className="si-probability-card-desc">
          Shows site vulnerability on a 1-3 scale, where 1 is low vulnerability and 3 is high vulnerability.
        </p>
        {vulnerabilityScore != null ? (
          <>
            <p className="si-probability-value">{vulnerabilityScore}</p>
            <p className="si-probability-subtext si-vuln-severity-label">{vulnerabilitySeverityLabel}</p>
            <div className="si-vuln-segments" aria-hidden="true">
              <div className="si-vuln-bar">
                <div
                  className={`si-vuln-piece si-vuln-piece--low${
                    vulnerabilityScore === 1 ? ' si-vuln-piece--active' : ''
                  }`}
                />
                <div
                  className={`si-vuln-piece si-vuln-piece--med${
                    vulnerabilityScore === 2 ? ' si-vuln-piece--active' : ''
                  }`}
                />
                <div
                  className={`si-vuln-piece si-vuln-piece--high${
                    vulnerabilityScore === 3 ? ' si-vuln-piece--active' : ''
                  }`}
                />
              </div>
              <div className="si-vuln-bar-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="si-probability-value si-probability-value--pending">Unavailable</p>
            <div className="si-vuln-segments si-vuln-segments--muted" aria-hidden="true">
              <div className="si-vuln-bar">
                <div className="si-vuln-piece si-vuln-piece--low" />
                <div className="si-vuln-piece si-vuln-piece--med" />
                <div className="si-vuln-piece si-vuln-piece--high" />
              </div>
              <div className="si-vuln-bar-labels">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="si-sidebar-actions">
        <button className="primary-button si-export-site-button" type="button" disabled={!insights} onClick={onExportSite}>
          Export this site
        </button>
        <button className="secondary-button" type="button" onClick={onBackToMap}>
          Back to map
        </button>
      </div>
    </aside>
  )
}
