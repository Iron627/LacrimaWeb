import { describe, expect, it } from 'vitest'
import {
  addIncrement,
  createClockState,
  flagStatus,
  startClock,
  stopClockForMove,
  tickClock,
} from './clockController'
import { TIME_CONTROL_PRESETS, createClockConfig } from './timeControls'

describe('timeControls', () => {
  it('defines required presets', () => {
    expect(TIME_CONTROL_PRESETS.map((preset) => preset.id)).toEqual([
      'rapid-10-0',
      'blitz-3-2',
      'bullet-1-0',
      'custom-imbalanced',
    ])
  })

  it('maps custom human and engine odds to selected colors', () => {
    expect(
      createClockConfig({
        presetId: 'custom-imbalanced',
        humanColor: 'w',
        human: { initialMinutes: 10, incrementSeconds: 0 },
        engine: { initialMinutes: 1, incrementSeconds: 2 },
      }),
    ).toEqual({
      white: { initialMs: 600000, incrementMs: 0 },
      black: { initialMs: 60000, incrementMs: 2000 },
    })
  })
})

describe('clockController', () => {
  it('starts the active side and subtracts elapsed time on tick', () => {
    const state = startClock(createClockState({
      white: { initialMs: 60000, incrementMs: 1000 },
      black: { initialMs: 60000, incrementMs: 1000 },
      activeColor: 'w',
    }), 1000)

    expect(tickClock(state, 2500)).toMatchObject({
      whiteMs: 58500,
      blackMs: 60000,
      activeColor: 'w',
      running: true,
      lastTickAt: 2500,
    })
  })

  it('stops the moving side, applies increment, and switches active color', () => {
    const state = tickClock(startClock(createClockState({
      white: { initialMs: 60000, incrementMs: 2000 },
      black: { initialMs: 60000, incrementMs: 0 },
      activeColor: 'w',
    }), 1000), 4000)

    expect(stopClockForMove(state, 'w', 4000)).toMatchObject({
      whiteMs: 59000,
      blackMs: 60000,
      activeColor: 'b',
      running: false,
    })
  })

  it('adds increment to a color without changing the active side', () => {
    expect(addIncrement(createClockState({
      white: { initialMs: 1000, incrementMs: 500 },
      black: { initialMs: 1000, incrementMs: 0 },
      activeColor: 'w',
    }), 'w')).toMatchObject({ whiteMs: 1500 })
  })

  it('detects flag fall locally', () => {
    expect(flagStatus({
      ...createClockState({
        white: { initialMs: 1, incrementMs: 0 },
        black: { initialMs: 1000, incrementMs: 0 },
        activeColor: 'w',
      }),
      whiteMs: 0,
    })).toEqual({ flagged: true, color: 'w' })
  })
})
