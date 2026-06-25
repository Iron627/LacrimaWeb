import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { isObviouslyPossiblePremove, playNextPremove } from './premoves'

describe('premoves', () => {
  it('requires a human piece on the source square', () => {
    const game = new Chess()

    expect(isObviouslyPossiblePremove(game, { from: 'g1', to: 'f3' }, 'w')).toBe(true)
    expect(isObviouslyPossiblePremove(game, { from: 'g8', to: 'f6' }, 'w')).toBe(false)
    expect(isObviouslyPossiblePremove(game, { from: 'a3', to: 'a4' }, 'w')).toBe(false)
  })

  it('rejects clearly impossible piece geometry before queueing', () => {
    const game = new Chess()

    expect(isObviouslyPossiblePremove(game, { from: 'g1', to: 'g3' }, 'w')).toBe(false)
    expect(isObviouslyPossiblePremove(game, { from: 'e2', to: 'e4' }, 'w')).toBe(true)
    expect(isObviouslyPossiblePremove(game, { from: 'c1', to: 'g5' }, 'w')).toBe(true)
  })

  it('executes the next legal premove and preserves remaining queued premoves', () => {
    const game = new Chess()
    game.move('e4')
    game.move('e5')

    const result = playNextPremove(game, [
      { from: 'g1', to: 'f3' },
      { from: 'f1', to: 'c4' },
    ], 'w')

    expect(result.move.san).toBe('Nf3')
    expect(result.remaining).toEqual([{ from: 'f1', to: 'c4' }])
    expect(result.game.history()).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('silently clears the queue when the next premove is illegal in the resulting position', () => {
    const game = new Chess()
    game.move('e4')
    game.move('d5')

    const result = playNextPremove(game, [
      { from: 'e2', to: 'e4' },
      { from: 'g1', to: 'f3' },
    ], 'w')

    expect(result.move).toBeNull()
    expect(result.remaining).toEqual([])
  })
})
