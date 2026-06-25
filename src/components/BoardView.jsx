import { useRef } from 'react'
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
  selectedSquare,
  thinkingMove,
  premoves = [],
  legalTargets = [],
  checkSquare,
  allowDragging = true,
  premoveMode = false,
  onRightClick,
}) {
  const pointerStartSquare = useRef(null)
  const pointerDropRef = useRef(null)
  const squareStyles = {}

  function squareFromPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = rect.width / 8
    const col = Math.max(0, Math.min(7, Math.floor((event.clientX - rect.left) / size)))
    const row = Math.max(0, Math.min(7, Math.floor((event.clientY - rect.top) / size)))
    const fileIndex = orientation === 'white' ? col : 7 - col
    const rank = orientation === 'white' ? 8 - row : row + 1
    return `${String.fromCharCode(97 + fileIndex)}${rank}`
  }

  function onPointerDownCapture(event) {
    if (!premoveMode) return
    pointerStartSquare.current = squareFromPointer(event)
  }

  function onPointerUpCapture(event) {
    if (!premoveMode || !pointerStartSquare.current) return
    const sourceSquare = pointerStartSquare.current
    const targetSquare = squareFromPointer(event)
    pointerStartSquare.current = null
    pointerDropRef.current = { from: sourceSquare, to: targetSquare, at: Date.now() }
    onDrop?.(sourceSquare, targetSquare)
  }

  function handleContextMenu(event) {
    event.preventDefault()
    pointerStartSquare.current = null
    onRightClick?.()
  }

  mark(squareStyles, lastMove?.from, { background: 'rgba(205, 170, 74, 0.62)' })
  mark(squareStyles, lastMove?.to, { background: 'rgba(205, 170, 74, 0.62)' })
  mark(squareStyles, selectedSquare, { boxShadow: 'inset 0 0 0 4px rgba(255, 255, 255, 0.55)' })
  mark(squareStyles, thinkingMove?.from, { boxShadow: 'inset 0 0 0 4px rgba(80, 156, 255, 0.94)' })
  mark(squareStyles, thinkingMove?.to, { boxShadow: 'inset 0 0 0 4px rgba(80, 156, 255, 0.94)' })
  premoves.forEach((premove, index) => {
    const opacity = Math.max(0.45, 0.95 - index * 0.12)
    mark(squareStyles, premove.from, {
      boxShadow: `inset 0 0 0 4px rgba(198, 132, 255, ${opacity})`,
    })
    mark(squareStyles, premove.to, {
      boxShadow: `inset 0 0 0 4px rgba(198, 132, 255, ${opacity})`,
      background: `linear-gradient(135deg, rgba(198, 132, 255, ${opacity * 0.28}), transparent)`,
    })
  })
  mark(squareStyles, checkSquare, { background: 'rgba(199, 77, 62, 0.68)' })

  for (const square of legalTargets) {
    mark(squareStyles, square, {
      background:
        'radial-gradient(circle, rgba(30, 30, 28, 0.38) 0 18%, transparent 20%)',
    })
  }

  return (
    <div
      className="board-shell"
      onPointerDownCapture={onPointerDownCapture}
      onPointerUpCapture={onPointerUpCapture}
      onMouseDownCapture={onPointerDownCapture}
      onMouseUpCapture={onPointerUpCapture}
      onContextMenu={handleContextMenu}
    >
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
            const pointerDrop = pointerDropRef.current
            if (
              premoveMode &&
              pointerDrop?.from === sourceSquare &&
              pointerDrop?.to === targetSquare &&
              Date.now() - pointerDrop.at < 400
            ) {
              return true
            }
            return onDrop?.(sourceSquare, targetSquare) || false
          },
          onPieceClick: ({ square }) => square && onSquareClick?.(square),
          onSquareClick: ({ square }) => onSquareClick?.(square),
          darkSquareStyle: { backgroundColor: '#b58863' },
          lightSquareStyle: { backgroundColor: '#f0d9b5' },
          boardStyle: {
            borderRadius: 3,
            boxShadow: '0 12px 34px rgba(0, 0, 0, 0.34)',
          },
        }}
      />
    </div>
  )
}
