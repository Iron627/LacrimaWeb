import { BoardView } from './BoardView'
import { Bot, Castle, CircleSlash, Crown, MousePointer2, ShieldMinus, User } from 'lucide-react'

const ODDS_TYPES = [
  { id: 'none', label: 'No odds', Icon: CircleSlash },
  { id: 'rook', label: 'Rook', Icon: Castle },
  { id: 'knight', label: 'Knight', Icon: ShieldMinus },
  { id: 'custom', label: 'Custom', Icon: MousePointer2 },
]

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
      <div className="choice-grid odds-choices">
        {ODDS_TYPES.map(({ id, label, Icon }) => (
          <button
            type="button"
            className={`choice-card ${odds.oddsType === id ? 'selected' : ''}`}
            disabled={disabled}
            key={id}
            onClick={() => update('oddsType', id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {odds.oddsType !== 'none' && (
        <div className="odds-subgrid">
          {odds.oddsType !== 'custom' && (
            <div className="choice-pair compact" aria-label="Odds giver">
              <button
                type="button"
                className={`choice-card ${odds.oddsGiver === 'engine' ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => update('oddsGiver', 'engine')}
              >
                <Bot size={15} />
                <span>Lacrima gives</span>
              </button>
              <button
                type="button"
                className={`choice-card ${odds.oddsGiver === 'human' ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => update('oddsGiver', 'human')}
              >
                <User size={15} />
                <span>Human gives</span>
              </button>
            </div>
          )}
          {odds.oddsType !== 'custom' && (
            <div className="choice-pair compact" aria-label="Odds side">
              <button
                type="button"
                className={`choice-card ${odds.side === 'queen' ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => update('side', 'queen')}
              >
                <Crown size={15} />
                <span>Queen-side</span>
              </button>
              <button
                type="button"
                className={`choice-card ${odds.side === 'king' ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => update('side', 'king')}
              >
                <Castle size={15} />
                <span>King-side</span>
              </button>
            </div>
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
