import { formatNps } from '../chess/uciParser'

export function EngineStatus({ status, depth, nps, error, onStop, canStop }) {
  return (
    <section className="panel status-panel">
      <h2>Lacrima</h2>
      <div className="status-line">
        <span>{status}</span>
        <button type="button" disabled={!canStop} onClick={onStop}>
          Stop
        </button>
      </div>
      <dl>
        <div>
          <dt>Depth</dt>
          <dd>{depth ?? '—'}</dd>
        </div>
        <div>
          <dt>NPS</dt>
          <dd>{formatNps(nps)}</dd>
        </div>
      </dl>
      {error && <p className="warning">{error}</p>}
    </section>
  )
}
