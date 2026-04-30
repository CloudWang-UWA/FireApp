import type { LucideIcon } from 'lucide-react'
import type { FactorData } from './mockHeritageInsights'

export function FactorCard({
  factor,
  Icon,
}: {
  factor: FactorData
  Icon: LucideIcon
}) {
  return (
    <article className={`si-factor-card ${factor.tone}`}>
      <div className="si-factor-card-head">
        <div className="si-factor-title-wrap">
          <div className="si-factor-icon">
            <Icon size={16} />
          </div>
          <div>
            <p className="si-factor-label">{factor.label}</p>
            <p className="si-factor-subtitle">{factor.subtitle}</p>
          </div>
        </div>
        <span className="si-factor-chip">{factor.contributionPct}%</span>
      </div>

      <p className="si-factor-value">{factor.value}</p>
      <p className="si-factor-description">{factor.description}</p>

      <div className="si-factor-progress">
        <div style={{ width: `${factor.contributionPct}%` }} />
      </div>
    </article>
  )
}
