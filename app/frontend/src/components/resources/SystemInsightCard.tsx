import { Activity, Route, ScanSearch, ShieldCheck, Siren } from 'lucide-react'

const ACTION_ICONS = [Siren, Route, Activity, ScanSearch]

export function SystemInsightCard({
  summary,
  actions,
}: {
  summary: string
  actions: Array<{ title: string; detail: string }>
}) {
  return (
    <section className="si-card si-system-card">
      <div className="si-system-head">
        <div className="si-system-icon">
          <ShieldCheck size={18} />
        </div>
        <div>
          <h2>System insight</h2>
          <p>{summary}</p>
        </div>
      </div>

      <div className="si-system-actions">
        {actions.map((action, index) => {
          const Icon = ACTION_ICONS[index % ACTION_ICONS.length]
          return (
            <article key={action.title}>
              <div className="si-system-action-icon">
                <Icon size={14} />
              </div>
              <h3>{action.title}</h3>
              <p>{action.detail}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
