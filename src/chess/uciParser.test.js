import { describe, expect, it, vi } from 'vitest'
import {
  deriveNps,
  extractFirstPvMove,
  formatEval,
  normalizeScoreToWhite,
  parseBestMove,
  parseInfo,
} from './uciParser'

describe('uciParser', () => {
  it('parses UCI info lines with depth, score, nodes, time, and pv', () => {
    expect(parseInfo('info depth 7 score cp 18 nodes 92344 time 120 pv e2e4 e7e5')).toEqual({
      depth: 7,
      scoreCp: 18,
      mate: null,
      nodes: 92344,
      timeMs: 120,
      pv: ['e2e4', 'e7e5'],
      currentBestMove: 'e2e4',
    })
  })

  it('parses mate scores and missing optional fields', () => {
    expect(parseInfo('info score mate -3 pv h7h8q')).toMatchObject({
      mate: -3,
      scoreCp: null,
      nodes: null,
      currentBestMove: 'h7h8q',
    })
  })

  it('extracts the first pv move without requiring the full line', () => {
    expect(extractFirstPvMove('info depth 5 pv g1f3')).toBe('g1f3')
    expect(extractFirstPvMove('info depth 5 nodes 100')).toBeNull()
  })

  it('parses bestmove and ignores non-bestmove lines', () => {
    expect(parseBestMove('bestmove e2e4 ponder e7e5')).toBe('e2e4')
    expect(parseBestMove('info depth 1')).toBeNull()
  })

  it('normalizes engine-side scores to White perspective', () => {
    expect(normalizeScoreToWhite({ scoreCp: 32, mate: null, sideToMove: 'w' })).toEqual({
      cpWhite: 32,
      mateWhite: null,
    })
    expect(normalizeScoreToWhite({ scoreCp: 32, mate: 4, sideToMove: 'b' })).toEqual({
      cpWhite: -32,
      mateWhite: -4,
    })
  })

  it('formats centipawn and mate evals', () => {
    expect(formatEval({ cpWhite: 32, mateWhite: null })).toBe('+0.32')
    expect(formatEval({ cpWhite: -115, mateWhite: null })).toBe('-1.15')
    expect(formatEval({ cpWhite: null, mateWhite: 3 })).toBe('M3')
    expect(formatEval({ cpWhite: null, mateWhite: -2 })).toBe('-M2')
    expect(formatEval({ cpWhite: 999, mateWhite: null })).toBe('M1')
    expect(formatEval({ cpWhite: 998, mateWhite: null })).toBe('M2')
    expect(formatEval({ cpWhite: -999, mateWhite: null })).toBe('-M1')
  })

  it('derives nps from UCI time first and wall-clock time second', () => {
    expect(deriveNps({ nodes: 123456, timeMs: 1000, searchStartedAt: 10 })).toBe(123456)

    vi.spyOn(performance, 'now').mockReturnValue(1510)
    expect(deriveNps({ nodes: 7500, timeMs: null, searchStartedAt: 10 })).toBe(5000)
    vi.restoreAllMocks()
  })
})
