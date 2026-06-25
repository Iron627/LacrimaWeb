export function createClockState({ white, black, activeColor = 'w' }) {
  return {
    whiteMs: white.initialMs,
    blackMs: black.initialMs,
    whiteIncrementMs: white.incrementMs,
    blackIncrementMs: black.incrementMs,
    activeColor,
    running: false,
    lastTickAt: null,
  }
}

export function startClock(state, now = performance.now()) {
  if (state.running) return state
  return { ...state, running: true, lastTickAt: now }
}

export function tickClock(state, now = performance.now()) {
  if (!state.running || state.lastTickAt == null) return state
  const elapsed = Math.max(0, now - state.lastTickAt)
  const key = state.activeColor === 'w' ? 'whiteMs' : 'blackMs'
  return {
    ...state,
    [key]: Math.max(0, state[key] - elapsed),
    lastTickAt: now,
  }
}

export function addIncrement(state, color) {
  if (color === 'w') {
    return { ...state, whiteMs: state.whiteMs + state.whiteIncrementMs }
  }
  return { ...state, blackMs: state.blackMs + state.blackIncrementMs }
}

export function stopClockForMove(state, color, now = performance.now()) {
  const ticked = tickClock(state, now)
  const incremented = addIncrement(ticked, color)
  return {
    ...incremented,
    activeColor: color === 'w' ? 'b' : 'w',
    running: false,
    lastTickAt: null,
  }
}

export function flagStatus(state) {
  if (state.whiteMs <= 0) return { flagged: true, color: 'w' }
  if (state.blackMs <= 0) return { flagged: true, color: 'b' }
  return { flagged: false, color: null }
}

export function formatClock(ms) {
  const safeMs = Math.max(0, Math.ceil(ms))
  const totalSeconds = Math.ceil(safeMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
