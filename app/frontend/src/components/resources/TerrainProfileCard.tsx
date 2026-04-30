import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function TerrainProfileCard({
  points,
}: {
  points: Array<{ x: string; value: number }>
}) {
  return (
    <section className="si-card si-terrain-card">
      <header>
        <h2>Terrain profile</h2>
        <p>Elevation change across modeled boundary segments</p>
      </header>

      <div className="si-terrain-chart-wrap">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={points} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="terrainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4aa475" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#4aa475" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(54,98,84,0.12)" />
            <XAxis
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#6c5f53' }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6c5f53' }} />
            <Tooltip
              cursor={{ stroke: 'rgba(38,100,78,0.35)' }}
              contentStyle={{
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(36,83,74,0.18)',
                borderRadius: '12px',
                boxShadow: '0 14px 28px rgba(14,36,33,0.16)',
                backdropFilter: 'blur(4px)',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#274943', fontWeight: 700 }}
              itemStyle={{ color: '#2f5a53' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2f7f5c"
              strokeWidth={2.5}
              fill="url(#terrainGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
