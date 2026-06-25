import { cpToEvalPercent, formatEval } from '../chess/uciParser'

export function EvalBar({ show, cpWhite, mateWhite }) {
  const percent = mateWhite == null
    ? cpToEvalPercent(cpWhite)
    : mateWhite > 0
      ? 100
      : 0

  if (!show) return null

  return (
    <section className="eval-panel">
      <div className="eval-row">
        <div className="eval-bar" aria-label="White evaluation">
          <div className="eval-fill" style={{ height: `${percent}%` }} />
        </div>
        <strong>{formatEval({ cpWhite, mateWhite })}</strong>
      </div>
    </section>
  )
}
