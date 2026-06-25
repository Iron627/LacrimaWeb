import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { createOddsFen, removePieceFromFen, validateOddsFen } from './odds'
import { STARTING_FEN } from './fenUtils'

describe('odds', () => {
  it('returns the standard starting FEN for no odds', () => {
    expect(createOddsFen({
      humanColor: 'w',
      oddsType: 'none',
      oddsGiver: 'engine',
      removedPieces: [],
    })).toBe(STARTING_FEN)
  })

  it('removes a queen-side rook from the engine side and updates castling rights', () => {
    const fen = createOddsFen({
      humanColor: 'w',
      oddsType: 'rook',
      oddsGiver: 'engine',
      side: 'queen',
      removedPieces: [],
    })

    expect(new Chess(fen).get('a8')).toBeUndefined()
    expect(fen.split(' ')[2]).toBe('KQk')
  })

  it('removes a king-side knight from the human side', () => {
    const fen = createOddsFen({
      humanColor: 'b',
      oddsType: 'knight',
      oddsGiver: 'human',
      side: 'king',
      removedPieces: [],
    })

    expect(new Chess(fen).get('g8')).toBeUndefined()
  })

  it('removes any number of custom pieces and keeps a valid FEN', () => {
    const fen = createOddsFen({
      humanColor: 'w',
      oddsType: 'custom',
      oddsGiver: 'engine',
      removedPieces: ['a7', 'b8', 'h8'],
    })

    const chess = new Chess(fen)
    expect(chess.get('a7')).toBeUndefined()
    expect(chess.get('b8')).toBeUndefined()
    expect(chess.get('h8')).toBeUndefined()
    expect(fen.split(' ')[2]).toBe('KQq')
  })

  it('rejects setups without both kings', () => {
    expect(() =>
      createOddsFen({
        humanColor: 'w',
        oddsType: 'custom',
        oddsGiver: 'engine',
        removedPieces: ['e8'],
      }),
    ).toThrow(/both kings/i)
  })

  it('rejects adjacent kings and pawns on back ranks', () => {
    expect(validateOddsFen('8/8/8/8/8/8/4k3/4K3 w - - 0 1').valid).toBe(false)
    expect(validateOddsFen('4k3/8/8/8/8/8/8/P3K3 w - - 0 1').valid).toBe(false)
  })

  it('can remove a piece from an arbitrary FEN square', () => {
    const fen = removePieceFromFen(STARTING_FEN, 'a1')
    expect(new Chess(fen).get('a1')).toBeUndefined()
    expect(fen.split(' ')[2]).toBe('Kkq')
  })
})
