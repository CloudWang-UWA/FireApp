import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

export function MiniVisualizations({
  windRose,
  vegetationDistribution,
  fuelAgeDistribution,
}: {
  windRose: Array<{ direction: string; value: number }>
  vegetationDistribution: Array<{ bucket: string; value: number }>
  fuelAgeDistribution: Array<{ name: string; value: number; color: string }>
}) {
  return (
    <section className="si-mini-grid">
      <article className="si-card si-mini-card">
        <h3>Wind exposure rose</h3>
        <div className="si-mini-chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={windRose}>
              <PolarGrid stroke="rgba(75,112,137,0.22)" />
              <PolarAngleAxis dataKey="direction" tick={{ fontSize: 10, fill: '#6a6159' }} />
              <PolarRadiusAxis axisLine={false} tick={false} />
              <Radar dataKey="value" stroke="#4f88be" fill="#4f88be" fillOpacity={0.4} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid rgba(52,96,117,0.18)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 24px rgba(16,41,51,0.14)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#2c5568', fontWeight: 700 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="si-card si-mini-card">
        <h3>Vegetation density</h3>
        <div className="si-mini-chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vegetationDistribution} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10, fill: '#6a6159' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid rgba(53,96,71,0.18)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 24px rgba(16,41,30,0.14)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#2f5f49', fontWeight: 700 }}
              />
              <Bar dataKey="value" fill="#3f8f5b" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="si-card si-mini-card">
        <h3>Fuel age distribution</h3>
        <div className="si-mini-chart-wrap">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={fuelAgeDistribution} dataKey="value" innerRadius={42} outerRadius={72} paddingAngle={2}>
                {fuelAgeDistribution.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(255,255,255,0.96)',
                  border: '1px solid rgba(117,82,49,0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 12px 24px rgba(44,28,14,0.14)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#6e4c2d', fontWeight: 700 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  )
}
