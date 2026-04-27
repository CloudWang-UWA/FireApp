import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { FactorData } from './mockHeritageInsights'

export function RelativeContributionCard({
  factors,
}: {
  factors: FactorData[]
}) {
  return (
    <section className="si-card si-contribution-card">
      <h2>Relative contribution</h2>
      <div className="si-contribution-layout">
        <div className="si-contribution-bars">
          {factors.map((factor) => (
            <div className="si-contribution-row" key={factor.key}>
              <div className="si-contribution-label-row">
                <span>{factor.label}</span>
                <strong>{factor.contributionPct}%</strong>
              </div>
              <div className="si-contribution-track">
                <div style={{ width: `${factor.contributionPct}%`, backgroundColor: factor.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="si-contribution-donut-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={factors} dataKey="contributionPct" innerRadius={54} outerRadius={86} paddingAngle={2}>
                {factors.map((factor) => (
                  <Cell key={factor.key} fill={factor.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid rgba(52,82,77,0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 14px 28px rgba(18,38,34,0.14)',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#2f544f' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  )
}
