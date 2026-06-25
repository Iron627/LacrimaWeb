import { Chessboard } from 'react-chessboard'

function mark(styles, square, style) {
  if (!square) return styles
  styles[square] = { ...(styles[square] || {}), ...style }
  return styles
}

export function BoardView({
  fen,
  orientation,
  onDrop,
  onSquareClick,
  lastMove,
  thinkingMove,
  legalTargets = [],
  checkSquare,
  allowDragging = true,
}) {
  const squareStyles = {}

  mark(squareStyles, lastMove?.from, { background: 'rgba(219, 171, 68, 0.45)' })
  mark(squareStyles, lastMove?.to, { background: 'rgba(219, 171, 68, 0.45)' })
  mark(squareStyles, thinkingMove?.from, { boxShadow: 'inset 0 0 0 4px rgba(59, 130, 246, 0.8)' })
  mark(squareStyles, thinkingMove?.to, { boxShadow: 'inset 0 0 0 4px rgba(59, 130, 246, 0.8)' })
  mark(squareStyles, checkSquare, { background: 'rgba(220, 38, 38, 0.55)' })

  for (const square of legalTargets) {
    mark(squareStyles, square, {
      background:
        'radial-gradient(circle, rgba(43, 93, 69, 0.55) 0 18%, transparent 20%)',
    })
  }

  return (
    <div className="board-shell">
      <Chessboard
        options={{
          id: 'lacrima-board',
          position: fen,
          boardOrientation: orientation,
          squareStyles,
          allowDragging,
          animationDurationInMs: 120,
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!targetSquare) return false
            return onDrop?.(sourceSquare, targetSquare) || false
          },
          onSquareClick: ({ square }) => onSquareClick?.(square),
          darkSquareStyle: { backgroundColor: '#769656' },
          lightSquareStyle: { backgroundColor: '#eeeed2' },
          boardStyle: {
            borderRadius: 6,
            boxShadow: '0 20px 50px rgba(18, 24, 38, 0.18)',
          },
        }}
      />
    </div>
  )
}
