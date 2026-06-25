import { Chess } from 'chess.js'

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function squareColor(square) {
  return square.endsWith('1') || square.endsWith('2') ? 'w' : 'b'
}

export function removeCastlingForSquare(castling, square) {
  let rights = castling === '-' ? '' : castling
  const removals = {
    a1: 'Q',
    h1: 'K',
    e1: 'KQ',
    a8: 'q',
    h8: 'k',
    e8: 'kq',
  }

  for (const right of removals[square] || '') {
    rights = rights.replace(right, '')
  }

  return rights || '-'
}

export function removePieceFromFen(fen, square) {
  const chess = new Chess(fen)
  chess.remove(square)
  const parts = chess.fen().split(' ')
  parts[2] = removeCastlingForSquare(parts[2], square)
  return parts.join(' ')
}

export function getKingSquares(fen) {
  const chess = new Chess(fen, { skipValidation: true })
  const kings = { w: null, b: null }

  for (const square of chess.board().flat()) {
    if (square?.type === 'k') {
      kings[square.color] = square.square
    }
  }

  return kings
}

export function areKingsAdjacent(whiteKing, blackKing) {
  if (!whiteKing || !blackKing) return false
  const fileDistance = Math.abs(whiteKing.charCodeAt(0) - blackKing.charCodeAt(0))
  const rankDistance = Math.abs(Number(whiteKing[1]) - Number(blackKing[1]))
  return fileDistance <= 1 && rankDistance <= 1
}

export function hasPawnOnBackRank(fen) {
  const boardPart = fen.split(' ')[0]
  const ranks = boardPart.split('/')
  return /p/i.test(ranks[0]) || /p/i.test(ranks[7])
}
