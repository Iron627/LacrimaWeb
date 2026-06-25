import { TIME_CONTROL_PRESETS } from '../clocks/timeControls'

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
      <div className="segmented">
        {TIME_CONTROL_PRESETS.map((preset) => (
          <button
            type="button"
            className={preset.id === presetId ? 'selected' : ''}
            disabled={disabled}
            key={preset.id}
            onClick={() => setPresetId(preset.id)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <label>
        Human color
        <select disabled={disabled} value={humanColor} onChange={(event) => setHumanColor(event.target.value)}>
          <option value="w">White</option>
          <option value="b">Black</option>
        </select>
      </label>

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
