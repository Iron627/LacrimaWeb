import { formatNps } from '../chess/uciParser'

function formatElapsed(ms) {
  if (ms == null) return '-'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function EngineStatus({ status, perf, error }) {
  return (
    <section className="panel status-panel">
      <h2>Lacrima</h2>
      <div className="status-line">
        <span>{status}</span>
        <span className="runtime-mode">{perf.runtimeMode}</span>
      </div>
      <dl className="perf-grid">
        <div>
          <dt>Depth</dt>
          <dd>{perf.depth ?? '-'}</dd>
        </div>
        <div>
          <dt>Nodes</dt>
          <dd>{perf.nodes?.toLocaleString() ?? '-'}</dd>
        </div>
        <div>
          <dt>Elapsed</dt>
          <dd>{formatElapsed(perf.elapsedMs)}</dd>
        </div>
        <div>
          <dt>NPS</dt>
          <dd>{formatNps(perf.nps)}</dd>
        </div>
      </dl>
      <div className="uci-command">
        <span>Latest UCI</span>
        <code>{perf.latestCommand || '-'}</code>
      </div>
      <p className="small-note">Go WASM can be slower than native; this panel includes browser and worker overhead.</p>
      {error && <p className="warning">{error}</p>}
    </section>
  )
}
