import { cpToEvalPercent, formatEval } from '../chess/uciParser'

export function EvalBar({ show, setShow, cpWhite, mateWhite }) {
  const percent = mateWhite == null
    ? cpToEvalPercent(cpWhite)
    : mateWhite > 0
      ? 100
      : 0

  return (
    <section className="panel eval-panel">
      <label className="inline-toggle">
        <input checked={show} type="checkbox" onChange={(event) => setShow(event.target.checked)} />
        Show eval bar
      </label>
      {show && (
        <div className="eval-row">
          <div className="eval-bar" aria-label="White evaluation">
            <div className="eval-fill" style={{ height: `${percent}%` }} />
          </div>
          <strong>{formatEval({ cpWhite, mateWhite })}</strong>
        </div>
      )}
    </section>
  )
}
