import { BoardView } from './BoardView'

export function OddsPanel({
  odds,
  setOdds,
  setupFen,
  humanColor,
  removedPieces,
  onToggleRemovedPiece,
  validation,
  disabled,
}) {
  const isCustom = odds.oddsType === 'custom'

  function update(key, value) {
    setOdds((current) => ({ ...current, [key]: value }))
  }

  return (
    <section className="panel">
      <h2>Material Odds</h2>
      <label>
        Odds type
        <select disabled={disabled} value={odds.oddsType} onChange={(event) => update('oddsType', event.target.value)}>
          <option value="none">No odds</option>
          <option value="rook">Rook odds</option>
          <option value="knight">Knight odds</option>
          <option value="custom">Custom remove pieces</option>
        </select>
      </label>

      {odds.oddsType !== 'none' && (
        <div className="time-grid">
          {odds.oddsType !== 'custom' && (
            <label>
              Giver
              <select disabled={disabled} value={odds.oddsGiver} onChange={(event) => update('oddsGiver', event.target.value)}>
                <option value="engine">Lacrima gives odds</option>
                <option value="human">Human gives odds</option>
              </select>
            </label>
          )}
          {odds.oddsType !== 'custom' && (
            <label>
              Side
              <select disabled={disabled} value={odds.side} onChange={(event) => update('side', event.target.value)}>
                <option value="queen">Queen-side</option>
                <option value="king">King-side</option>
              </select>
            </label>
          )}
        </div>
      )}

      {isCustom && (
        <div className="setup-board">
          <BoardView
            allowDragging={false}
            fen={setupFen}
            orientation={humanColor === 'w' ? 'white' : 'black'}
            onSquareClick={disabled ? null : onToggleRemovedPiece}
          />
          <div className={validation.valid ? 'small-note' : 'warning'}>
            {validation.valid
              ? `${removedPieces.length} piece${removedPieces.length === 1 ? '' : 's'} removed`
              : validation.reason}
          </div>
        </div>
      )}
    </section>
  )
}
