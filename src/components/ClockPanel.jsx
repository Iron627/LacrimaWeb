import { formatClock } from '../clocks/clockController'

export function ClockPanel({ clock, humanColor, engineThinking }) {
  const rows = [
    { color: 'b', label: humanColor === 'b' ? 'Human' : 'Lacrima', ms: clock.blackMs },
    { color: 'w', label: humanColor === 'w' ? 'Human' : 'Lacrima', ms: clock.whiteMs },
  ]

  return (
    <section className="panel clock-panel">
      {rows.map((row) => (
        <div
          className={`clock-row ${clock.activeColor === row.color && clock.running ? 'active' : ''}`}
          key={row.color}
        >
          <span>{row.label} {row.color === 'w' ? 'White' : 'Black'}</span>
          <strong>{formatClock(row.ms)}</strong>
        </div>
      ))}
      <div className="small-note">{engineThinking ? 'Lacrima is thinking' : 'Clock waits on move'}</div>
    </section>
  )
}
