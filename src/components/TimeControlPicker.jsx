import { TIME_CONTROL_PRESETS } from '../clocks/timeControls'
import { Circle, Clock3, SlidersHorizontal, Timer, Zap } from 'lucide-react'

const PRESET_ICONS = {
  'rapid-10-0': Timer,
  'blitz-3-2': Zap,
  'bullet-1-0': Circle,
  'custom-imbalanced': SlidersHorizontal,
}

const PRESET_LABELS = {
  'rapid-10-0': 'Rapid',
  'blitz-3-2': '3+2',
  'bullet-1-0': 'Bullet',
  'custom-imbalanced': 'Odds',
}

export function TimeControlPicker({
  presetId,
  setPresetId,
  humanColor,
  setHumanColor,
  customTime,
  setCustomTime,
  disabled,
}) {
  const isCustom = presetId === 'custom-imbalanced'

  function updateSide(side, key, value) {
    setCustomTime((current) => ({
      ...current,
      [side]: { ...current[side], [key]: value },
    }))
  }

  return (
    <>
    <section className="panel time-panel">
      <h2>Time</h2>
      <div className="choice-grid time-choices">
        {TIME_CONTROL_PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id] || Clock3
          return (
            <button
              type="button"
              className={`choice-card ${preset.id === presetId ? 'selected' : ''}`}
            disabled={disabled}
              key={preset.id}
              onClick={() => setPresetId(preset.id)}
            >
              <Icon size={16} />
              <span>{PRESET_LABELS[preset.id] || preset.label}</span>
            </button>
          )
        })}
      </div>
    </section>

    <section className="panel color-panel">
      <h2>Play As</h2>
      <div className="choice-pair" aria-label="Human color">
        <button
          type="button"
          className={`choice-card king-card ${humanColor === 'w' ? 'selected' : ''}`}
          disabled={disabled}
          onClick={() => setHumanColor('w')}
        >
          <span className="piece-icon white-king">♔</span>
          <span>White</span>
        </button>
        <button
          type="button"
          className={`choice-card king-card ${humanColor === 'b' ? 'selected' : ''}`}
          disabled={disabled}
          onClick={() => setHumanColor('b')}
        >
          <span className="piece-icon black-king">♚</span>
          <span>Black</span>
        </button>
      </div>
    </section>

      {isCustom && (
        <section className="panel custom-time-panel">
          <h2>Time Odds</h2>
        <div className="time-grid">
          <label>
            Human minutes
            <input
              disabled={disabled}
              min="0"
              step="0.5"
              type="number"
              value={customTime.human.initialMinutes}
              onChange={(event) => updateSide('human', 'initialMinutes', event.target.value)}
            />
          </label>
          <label>
            Human increment
            <input
              disabled={disabled}
              min="0"
              type="number"
              value={customTime.human.incrementSeconds}
              onChange={(event) => updateSide('human', 'incrementSeconds', event.target.value)}
            />
          </label>
          <label>
            Engine minutes
            <input
              disabled={disabled}
              min="0"
              step="0.5"
              type="number"
              value={customTime.engine.initialMinutes}
              onChange={(event) => updateSide('engine', 'initialMinutes', event.target.value)}
            />
          </label>
          <label>
            Engine increment
            <input
              disabled={disabled}
              min="0"
              type="number"
              value={customTime.engine.incrementSeconds}
              onChange={(event) => updateSide('engine', 'incrementSeconds', event.target.value)}
            />
          </label>
        </div>
        </section>
      )}
    </>
  )
}
