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

  mark(squareStyles, lastMove?.from, { background: 'rgba(205, 170, 74, 0.62)' })
  mark(squareStyles, lastMove?.to, { background: 'rgba(205, 170, 74, 0.62)' })
  mark(squareStyles, thinkingMove?.from, { boxShadow: 'inset 0 0 0 4px rgba(112, 161, 255, 0.9)' })
  mark(squareStyles, thinkingMove?.to, { boxShadow: 'inset 0 0 0 4px rgba(112, 161, 255, 0.9)' })
  mark(squareStyles, checkSquare, { background: 'rgba(199, 77, 62, 0.68)' })

  for (const square of legalTargets) {
    mark(squareStyles, square, {
      background:
        'radial-gradient(circle, rgba(30, 30, 28, 0.38) 0 18%, transparent 20%)',
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
          lightSquareStyle: { backgroundColor: '#baca44' },
          boardStyle: {
            borderRadius: 3,
            boxShadow: '0 12px 34px rgba(0, 0, 0, 0.34)',
          },
        }}
      />
    </div>
  )
}
