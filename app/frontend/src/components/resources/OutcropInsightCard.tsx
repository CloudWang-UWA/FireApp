import { Gem } from 'lucide-react'
import type { FactorData } from './mockHeritageInsights'

export function OutcropInsightCard({ factor }: { factor: FactorData }) {
  return (
    <article className="si-outcrop-card">
      <header>
        <div className="si-outcrop-badge">
          <Gem size={16} />
        </div>
        <div>
          <p className="si-outcrop-label">{factor.label}</p>
          <p className="si-outcrop-subtitle">{factor.subtitle}</p>
        </div>
      </header>

      <div className="si-outcrop-illustration" aria-hidden="true">
        <svg viewBox="0 0 220 120" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rockTone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7b5d56" />
              <stop offset="100%" stopColor="#b28a7f" />
            </linearGradient>
            <linearGradient id="groundTone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8f6aa9" />
              <stop offset="100%" stopColor="#cf9a6d" />
            </linearGradient>
          </defs>
          <rect x="0" y="70" width="220" height="50" fill="url(#groundTone)" opacity="0.22" />
          <path d="M15 95 L46 38 L84 84 L118 42 L150 88 L188 56 L205 95 Z" fill="url(#rockTone)" opacity="0.95" />
          <circle cx="138" cy="52" r="10" fill="#f4e8d6" opacity="0.86" />
        </svg>
      </div>

      <p className="si-outcrop-value">{factor.value}</p>
      <p className="si-outcrop-note">{factor.description}</p>

      <div className="si-outcrop-progress">
        <div style={{ width: `${factor.contributionPct}%` }} />
      </div>
    </article>
  )
}
