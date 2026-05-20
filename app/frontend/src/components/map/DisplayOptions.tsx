export function DisplayOptions({
  useColourBlindRiskColours,
  setUseColourBlindRiskColours,
}: {
  useColourBlindRiskColours: boolean
  setUseColourBlindRiskColours: (value: boolean) => void
}) {
  return (
    <div className="status-card">
      <h2>Display</h2>
      <label className="display-toggle">
        <span>Colour-blind friendly colours</span>
        <input
          type="checkbox"
          checked={useColourBlindRiskColours}
          onChange={(event) =>
            setUseColourBlindRiskColours(event.target.checked)
          }
        />
        <span className="display-toggle-track" aria-hidden="true">
          <span className="display-toggle-knob" />
        </span>
      </label>
    </div>
  )
}
