import { Chess } from 'chess.js'
import {
  STARTING_FEN,
  areKingsAdjacent,
  getKingSquares,
  hasPawnOnBackRank,
  removeCastlingForSquare,
  removePieceFromFen as removePiece,
} from './fenUtils'

const SIMPLE_ODDS_SQUARES = {
  rook: {
    w: { queen: 'a1', king: 'h1' },
    b: { queen: 'a8', king: 'h8' },
  },
  knight: {
    w: { queen: 'b1', king: 'g1' },
    b: { queen: 'b8', king: 'g8' },
  },
}

export function removePieceFromFen(fen, square) {
  return removePiece(fen, square)
}

export function validateOddsFen(fen) {
  const kings = getKingSquares(fen)
  if (!kings.w || !kings.b) {
    return { valid: false, reason: 'Both kings must exist.' }
  }

  if (areKingsAdjacent(kings.w, kings.b)) {
    return { valid: false, reason: 'Kings cannot be adjacent.' }
  }

  if (hasPawnOnBackRank(fen)) {
    return { valid: false, reason: 'Pawns cannot be on the first or eighth rank.' }
  }

  try {
    new Chess(fen)
  } catch (error) {
    return { valid: false, reason: error.message }
  }

  return { valid: true, reason: null }
}

export function createOddsFen({
  humanColor,
  oddsType,
  oddsGiver,
  side = 'queen',
  removedPieces = [],
}) {
  let fen = STARTING_FEN
  const engineColor = humanColor === 'w' ? 'b' : 'w'
  const giverColor = oddsGiver === 'engine' ? engineColor : humanColor

  const squaresToRemove =
    oddsType === 'custom'
      ? removedPieces
      : oddsType === 'none'
        ? []
        : [SIMPLE_ODDS_SQUARES[oddsType]?.[giverColor]?.[side]].filter(Boolean)

  for (const square of squaresToRemove) {
    fen = removePiece(fen, square)
  }

  const parts = fen.split(' ')
  for (const square of squaresToRemove) {
    parts[2] = removeCastlingForSquare(parts[2], square)
  }
  fen = parts.join(' ')

  const validation = validateOddsFen(fen)
  if (!validation.valid) {
    throw new Error(validation.reason)
  }

  return fen
}
