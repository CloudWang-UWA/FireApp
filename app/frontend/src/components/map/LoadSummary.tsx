export function LoadSummary({
  summary,
}: {
  summary: Array<{
    key: string
    label: string
    featureCount: number
    isLoading: boolean
    error: string | null
  }>
}) {
  return (
    <div className="status-card">
      <h2>Load summary</h2>
      <ul className="summary-list">
        {summary.map(({ key, label, featureCount, isLoading, error }) => (
          <li key={key}>
            <strong>{label}</strong>
            <span>
              {isLoading && ' Loading'}
              {!isLoading && !error && ` ${featureCount} features ready`}
              {error && ` Error: ${error}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
