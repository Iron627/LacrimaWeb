import { TIME_CONTROL_PRESETS } from '../clocks/timeControls'
import { Badge, Bot, Clock3, Rabbit, Timer, User } from 'lucide-react'

const PRESET_ICONS = {
  'rapid-10-0': Clock3,
  'blitz-3-2': Rabbit,
  'bullet-1-0': Timer,
  'custom-imbalanced': Badge,
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
    <section className="panel">
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
              <span>{preset.label}</span>
            </button>
          )
        })}
      </div>

      <div className="choice-pair" aria-label="Human color">
        <button
          type="button"
          className={`choice-card ${humanColor === 'w' ? 'selected' : ''}`}
          disabled={disabled}
          onClick={() => setHumanColor('w')}
        >
          <User size={16} />
          <span>Human White</span>
        </button>
        <button
          type="button"
          className={`choice-card ${humanColor === 'b' ? 'selected' : ''}`}
          disabled={disabled}
          onClick={() => setHumanColor('b')}
        >
          <Bot size={16} />
          <span>Human Black</span>
        </button>
      </div>

      {isCustom && (
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
      )}
    </section>
  )
}
