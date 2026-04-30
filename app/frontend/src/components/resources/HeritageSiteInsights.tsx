import { Flame, Mountain, Trees, Wind, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import './HeritageSiteInsights.css'
import { FactorCard } from './FactorCard'
import { InsightSidebar } from './InsightSidebar'
import { LocationPreviewCard } from './LocationPreviewCard'
import { MiniVisualizations } from './MiniVisualizations'
import { OutcropInsightCard } from './OutcropInsightCard'
import { RelativeContributionCard } from './RelativeContributionCard'
import { SystemInsightCard } from './SystemInsightCard'
import { TerrainProfileCard } from './TerrainProfileCard'
import { MOCK_HERITAGE_INSIGHTS, type FactorKey } from './mockHeritageInsights'

const FACTOR_ICONS: Record<FactorKey, LucideIcon> = {
  slope_profile: Mountain,
  fuel_age: Flame,
  wind_exposure: Wind,
  vegetation_density: Trees,
  outcrop_index: BarChart3,
}

export function HeritageSiteInsights({
  onBackToMap,
}: {
  onBackToMap?: () => void
}) {
  const data = MOCK_HERITAGE_INSIGHTS
  const primaryFactors = data.factors.filter((factor) => factor.key !== 'outcrop_index')
  const outcrop = data.factors.find((factor) => factor.key === 'outcrop_index')

  return (
    <article className="si-page">
      <section className="si-layout">
        <InsightSidebar data={data} onBackToMap={onBackToMap} />

        <main className="si-main">
          <header className="si-card si-main-header">
            <h2>Factor Breakdown</h2>
            <p>
              Site-level vulnerability factors and model contributions for the selected
              heritage location.
            </p>
          </header>

          <section className="si-main-top">
            <section className="si-card si-primary-factors-card">
              <h2>Primary factors</h2>
              <div className="si-primary-factor-grid">
                {primaryFactors.map((factor) => {
                  const Icon = FACTOR_ICONS[factor.key]
                  return <FactorCard key={factor.key} factor={factor} Icon={Icon} />
                })}
              </div>
            </section>

            <section className="si-card si-outcrop-card-shell">
              {outcrop ? <OutcropInsightCard factor={outcrop} /> : null}
            </section>
          </section>

          <section className="si-main-middle">
            <LocationPreviewCard location={data.locationPreview} />
            <TerrainProfileCard points={data.elevationProfile} />
          </section>

          <MiniVisualizations
            windRose={data.windRose}
            vegetationDistribution={data.vegetationHistogram}
            fuelAgeDistribution={data.fuelAgeDistribution}
          />

          <RelativeContributionCard factors={data.factors} />
          <SystemInsightCard summary={data.systemSummary} actions={data.systemActions} />
        </main>
      </section>
    </article>
  )
}

