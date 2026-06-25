import { Chess } from 'chess.js'

const FILES = 'abcdefgh'

function isSquare(square) {
  return /^[a-h][1-8]$/.test(square)
}

function coords(square) {
  return {
    file: FILES.indexOf(square[0]),
    rank: Number(square[1]),
  }
}

function absDelta(from, to) {
  const a = coords(from)
  const b = coords(to)
  return {
    file: Math.abs(b.file - a.file),
    rank: Math.abs(b.rank - a.rank),
    signedRank: b.rank - a.rank,
  }
}

function matchesPieceGeometry(piece, from, to) {
  const delta = absDelta(from, to)

  if (piece.type === 'n') return delta.file * delta.rank === 2
  if (piece.type === 'b') return delta.file === delta.rank && delta.file > 0
  if (piece.type === 'r') return (delta.file === 0) !== (delta.rank === 0)
  if (piece.type === 'q') {
    return delta.file === delta.rank || (delta.file === 0) !== (delta.rank === 0)
  }
  if (piece.type === 'k') return Math.max(delta.file, delta.rank) === 1

  const forward = piece.color === 'w' ? 1 : -1
  const startRank = piece.color === 'w' ? 2 : 7
  if (piece.type === 'p') {
    if (delta.file === 1 && delta.signedRank === forward) return true
    if (delta.file === 0 && delta.signedRank === forward) return true
    return delta.file === 0 && coords(from).rank === startRank && delta.signedRank === forward * 2
  }

  return false
}

export function isObviouslyPossiblePremove(game, premove, humanColor) {
  if (!isSquare(premove.from) || !isSquare(premove.to) || premove.from === premove.to) return false

  const piece = game.get(premove.from)
  if (!piece || piece.color !== humanColor) return false

  return matchesPieceGeometry(piece, premove.from, premove.to)
}

export function playNextPremove(game, queue, humanColor) {
  const [next, ...remaining] = queue
  if (!next) return { game, move: null, remaining }

  const nextGame = new Chess(game.fen())
  try {
    nextGame.loadPgn(game.pgn())
  } catch {
    nextGame.load(game.fen())
  }

  const piece = nextGame.get(next.from)
  if (!piece || piece.color !== humanColor || nextGame.turn() !== humanColor) {
    return { game, move: null, remaining: [] }
  }

  const move = nextGame.move({ from: next.from, to: next.to, promotion: 'q' })
  if (!move) return { game, move: null, remaining: [] }

  return { game: nextGame, move, remaining }
}
