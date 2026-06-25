export const TIME_CONTROL_PRESETS = [
  {
    id: 'rapid-10-0',
    label: '10 minute',
    white: { initialMs: 10 * 60 * 1000, incrementMs: 0 },
    black: { initialMs: 10 * 60 * 1000, incrementMs: 0 },
  },
  {
    id: 'blitz-3-2',
    label: '3+2',
    white: { initialMs: 3 * 60 * 1000, incrementMs: 2 * 1000 },
    black: { initialMs: 3 * 60 * 1000, incrementMs: 2 * 1000 },
  },
  {
    id: 'bullet-1-0',
    label: 'Bullet',
    white: { initialMs: 60 * 1000, incrementMs: 0 },
    black: { initialMs: 60 * 1000, incrementMs: 0 },
  },
  {
    id: 'custom-imbalanced',
    label: 'Custom / Time odds',
    custom: true,
  },
]

export function minutesToMs(minutes) {
  return Math.max(0, Number(minutes) || 0) * 60 * 1000
}

export function secondsToMs(seconds) {
  return Math.max(0, Number(seconds) || 0) * 1000
}

export function createClockConfig({
  presetId,
  humanColor = 'w',
  human = { initialMinutes: 10, incrementSeconds: 0 },
  engine = { initialMinutes: 1, incrementSeconds: 0 },
}) {
  const preset = TIME_CONTROL_PRESETS.find((item) => item.id === presetId) || TIME_CONTROL_PRESETS[0]

  if (!preset.custom) {
    return {
      white: { ...preset.white },
      black: { ...preset.black },
    }
  }

  const humanConfig = {
    initialMs: minutesToMs(human.initialMinutes),
    incrementMs: secondsToMs(human.incrementSeconds),
  }
  const engineConfig = {
    initialMs: minutesToMs(engine.initialMinutes),
    incrementMs: secondsToMs(engine.incrementSeconds),
  }

  return humanColor === 'w'
    ? { white: humanConfig, black: engineConfig }
    : { white: engineConfig, black: humanConfig }
}
