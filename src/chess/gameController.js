import { Chess } from 'chess.js'

export function createGame(fen) {
  return new Chess(fen)
}

export function applyUciMove(game, uciMove) {
  if (!uciMove || uciMove === '(none)') return null
  return game.move({
    from: uciMove.slice(0, 2),
    to: uciMove.slice(2, 4),
    promotion: uciMove[4] || 'q',
  })
}

export function moveToUci(move) {
  return `${move.from}${move.to}${move.promotion || ''}`
}

export function gameStatus(game, flaggedColor = null) {
  if (flaggedColor) return `${flaggedColor === 'w' ? 'White' : 'Black'} flagged`
  if (game.isCheckmate()) return 'Checkmate'
  if (game.isDraw()) return 'Draw'
  if (game.isCheck()) return 'Check'
  return game.turn() === 'w' ? 'White to move' : 'Black to move'
}

export function legalTargets(game, square) {
  return game.moves({ square, verbose: true }).map((move) => move.to)
}
