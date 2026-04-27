import {
  AlertTriangle,
  BookOpenText,
  Flame,
  MapPinned,
  ShieldAlert,
  Tag,
} from 'lucide-react'
import type { HeritageInsightsModel } from './mockHeritageInsights'

export function InsightSidebar({
  data,
  onBackToMap,
}: {
  data: HeritageInsightsModel
  onBackToMap?: () => void
}) {
  const pointerLeft = `${Math.round(data.predictedProbability * 100)}%`
  const riskTone = data.riskLevel.toLowerCase()

  return (
    <aside className="si-sidebar si-card">
      <p className="si-sidebar-label">{data.siteLabel}</p>
      <h1 className="si-sidebar-title">Site Insights</h1>
      <p className="si-site-name">{data.siteTitle}</p>

      <div className="si-meta-card">
        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
          <Tag size={14} />
          </span>
          <div>
            <p className="si-meta-key">Site ID</p>
            <p className="si-meta-value">{data.siteId}</p>
          </div>
        </div>
        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
          <MapPinned size={14} />
          </span>
          <div>
            <p className="si-meta-key">Area / Site Name</p>
            <p className="si-meta-value">{data.areaName}</p>
          </div>
        </div>
        <div className="si-meta-row">
          <span className="si-meta-icon-wrap">
          <ShieldAlert size={14} />
          </span>
          <div>
            <p className="si-meta-key">Risk level</p>
            <span className={`si-risk-badge ${riskTone}`}>{data.riskLevel} risk</span>
          </div>
        </div>
      </div>

      <section className="si-probability-card">
        <div className="si-probability-head">
          <p>Predicted probability</p>
          <Flame size={16} />
        </div>
        <p className="si-probability-value">
          {Math.round(data.predictedProbability * 100)}%
        </p>
        <p className="si-probability-subtext">{data.probabilitySubtitle}</p>
        <div className="si-risk-scale" aria-hidden="true">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
          <i style={{ left: pointerLeft }} />
        </div>
      </section>

      <section className="si-interpretation-card">
        <h3>Risk interpretation</h3>
        <ul>
          {data.interpretationBullets.map((bullet) => (
            <li key={bullet}>
              <span className="si-bullet-icon-wrap">
              <AlertTriangle size={13} />
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="si-sidebar-actions">
        <button className="secondary-button" type="button" onClick={onBackToMap}>
          Back to map
        </button>
        <button className="primary-button si-primary-action" type="button">
          <BookOpenText size={15} />
          View method
        </button>
      </div>
    </aside>
  )
}
