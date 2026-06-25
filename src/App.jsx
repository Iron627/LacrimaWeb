import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'
import './App.css'
import { BoardView } from './components/BoardView'
import { ClockPanel } from './components/ClockPanel'
import { EngineStatus } from './components/EngineStatus'
import { EvalBar } from './components/EvalBar'
import { MoveList } from './components/MoveList'
import { OddsPanel } from './components/OddsPanel'
import { TimeControlPicker } from './components/TimeControlPicker'
import { UciConsole } from './components/UciConsole'
import { addIncrement, createClockState, flagStatus, startClock, stopClockForMove, tickClock } from './clocks/clockController'
import { createClockConfig } from './clocks/timeControls'
import { applyUciMove, createGame, gameStatus, legalTargets, moveToUci } from './chess/gameController'
import { STARTING_FEN, removePieceFromFen } from './chess/fenUtils'
import { createOddsFen, validateOddsFen } from './chess/odds'
import { LacrimaAdapter } from './engines/lacrimaAdapter'

const DEFAULT_CUSTOM_TIME = {
  human: { initialMinutes: 10, incrementSeconds: 0 },
  engine: { initialMinutes: 1, incrementSeconds: 0 },
}

function locateKing(game, color) {
  return game.board().flat().find((piece) => piece?.type === 'k' && piece.color === color)?.square || null
}

function moveLayerFromUci(move) {
  return move ? { from: move.slice(0, 2), to: move.slice(2, 4) } : null
}

function App() {
  const adapterRef = useRef(null)
  const gameRef = useRef(createGame(STARTING_FEN))
  const clockRef = useRef(null)
  const engineColorRef = useRef('b')

  const [humanColor, setHumanColor] = useState('w')
  const [presetId, setPresetId] = useState('rapid-10-0')
  const [customTime, setCustomTime] = useState(DEFAULT_CUSTOM_TIME)
  const [odds, setOdds] = useState({ oddsType: 'none', oddsGiver: 'engine', side: 'queen' })
  const [removedPieces, setRemovedPieces] = useState([])
  const [game, setGame] = useState(gameRef.current)
  const [clock, setClock] = useState(() => createClockState(createClockConfig({ presetId })))
  const [gameStarted, setGameStarted] = useState(false)
  const [engineStatus, setEngineStatus] = useState('Idle')
  const [engineThinking, setEngineThinking] = useState(false)
  const [engineError, setEngineError] = useState('')
  const [lastMove, setLastMove] = useState(null)
  const [thinkingMove, setThinkingMove] = useState(null)
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState([])
  const [evalState, setEvalState] = useState({ cpWhite: null, mateWhite: null })
  const [showEvalBar, setShowEvalBar] = useState(true)
  const [nps, setNps] = useState(null)
  const [depth, setDepth] = useState(null)
  const [uciLines, setUciLines] = useState([])
  const [flaggedColor, setFlaggedColor] = useState(null)

  const engineColor = humanColor === 'w' ? 'b' : 'w'
  engineColorRef.current = engineColor

  const clockConfig = useMemo(
    () => createClockConfig({ presetId, humanColor, human: customTime.human, engine: customTime.engine }),
    [presetId, humanColor, customTime],
  )

  const setupFen = useMemo(() => {
    if (odds.oddsType !== 'custom') {
      return createOddsFen({ humanColor, ...odds, removedPieces: [] })
    }

    return removedPieces.reduce((fen, square) => removePieceFromFen(fen, square), STARTING_FEN)
  }, [humanColor, odds, removedPieces])

  const setupValidation = useMemo(() => validateOddsFen(setupFen), [setupFen])

  function syncClock(nextClock) {
    clockRef.current = nextClock
    setClock(nextClock)
    return nextClock
  }

  function syncGame(nextGame) {
    gameRef.current = nextGame
    setGame(new Chess(nextGame.fen()))
  }

  useEffect(() => {
    const adapter = new LacrimaAdapter()
    adapterRef.current = adapter

    const disposers = [
      adapter.onLine((line) => setUciLines((lines) => [...lines.slice(-120), line])),
      adapter.onInfo((message) => {
        setDepth(message.info.depth)
        setEngineStatus(message.info.depth ? `Thinking depth ${message.info.depth}` : 'Thinking')
      }),
      adapter.onThinkingMove((move) => setThinkingMove(moveLayerFromUci(move))),
      adapter.onEval((message) => setEvalState({ cpWhite: message.cpWhite, mateWhite: message.mateWhite })),
      adapter.onNps((message) => setNps(message.nps)),
      adapter.onError((message) => {
        setEngineError(message.message || String(message))
        setEngineStatus('Engine error')
        setEngineThinking(false)
      }),
      adapter.onBestMove((move) => applyEngineMove(move)),
    ]

    return () => {
      disposers.forEach((dispose) => dispose())
      adapter.quit()
    }
  }, [])

  useEffect(() => {
    if (gameStarted) return
    const nextClock = createClockState({ ...clockConfig, activeColor: 'w' })
    syncClock(nextClock)
  }, [clockConfig, gameStarted])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!clockRef.current?.running || flaggedColor) return
      const nextClock = syncClock(tickClock(clockRef.current))
      const flag = flagStatus(nextClock)
      if (flag.flagged) {
        setFlaggedColor(flag.color)
        setEngineThinking(false)
        setEngineStatus(`${flag.color === 'w' ? 'White' : 'Black'} flagged`)
      }
    }, 200)

    return () => window.clearInterval(id)
  }, [flaggedColor])

  async function prepareEngine() {
    setEngineError('')
    setEngineStatus('Loading Lacrima')
    await adapterRef.current.load()
    adapterRef.current.initUci()
    setEngineStatus('Ready')
  }

  function requestEngineMove(nextGame = gameRef.current, baseClock = clockRef.current) {
    if (nextGame.isGameOver() || flaggedColor) return

    const startedClock = syncClock(startClock({ ...baseClock, activeColor: engineColorRef.current }))
    setEngineThinking(true)
    setThinkingMove(null)
    setNps(null)
    setDepth(null)
    setEngineStatus('Thinking')

    adapterRef.current.setPositionFen(nextGame.fen())
    adapterRef.current.goClock({
      whiteMs: startedClock.whiteMs,
      blackMs: startedClock.blackMs,
      whiteIncrementMs: startedClock.whiteIncrementMs,
      blackIncrementMs: startedClock.blackIncrementMs,
    })
  }

  async function startGame() {
    if (!setupValidation.valid) return

    const startingFen = createOddsFen({
      humanColor,
      oddsType: odds.oddsType,
      oddsGiver: odds.oddsGiver,
      side: odds.side,
      removedPieces,
    })
    const nextGame = createGame(startingFen)
    const nextClock = createClockState({ ...clockConfig, activeColor: nextGame.turn() })

    syncGame(nextGame)
    syncClock(nextClock)
    setGameStarted(true)
    setFlaggedColor(null)
    setLastMove(null)
    setThinkingMove(null)
    setSelectedSquare(null)
    setLegalMoveSquares([])
    setEvalState({ cpWhite: null, mateWhite: null })
    setUciLines([])

    try {
      await prepareEngine()
      adapterRef.current.newGame()
      adapterRef.current.setPositionFen(startingFen)
      if (nextGame.turn() === engineColor) requestEngineMove(nextGame, nextClock)
    } catch (error) {
      setEngineError(error.message || String(error))
      setEngineStatus('Engine error')
    }
  }

  function resetGame() {
    const nextGame = createGame(STARTING_FEN)
    syncGame(nextGame)
    syncClock(createClockState({ ...clockConfig, activeColor: 'w' }))
    setGameStarted(false)
    setFlaggedColor(null)
    setEngineThinking(false)
    setLastMove(null)
    setThinkingMove(null)
    setSelectedSquare(null)
    setLegalMoveSquares([])
    setEngineStatus('Idle')
  }

  function applyHumanMove(from, to) {
    if (!gameStarted || engineThinking || game.turn() !== humanColor || flaggedColor) return false
    const nextGame = createGame(game.fen())
    const move = nextGame.move({ from, to, promotion: 'q' })
    if (!move) return false

    syncGame(nextGame)
    setLastMove({ from: move.from, to: move.to })
    setSelectedSquare(null)
    setLegalMoveSquares([])

    const stoppedClock = syncClock(stopClockForMove(clockRef.current, humanColor))
    if (nextGame.isGameOver()) return true

    requestEngineMove(nextGame, stoppedClock)
    return true
  }

  function applyEngineMove(move) {
    const nextGame = createGame(gameRef.current.fen())
    const played = applyUciMove(nextGame, move)
    setEngineThinking(false)
    setThinkingMove(null)
    setEngineStatus('Ready')

    if (!played) return

    syncGame(nextGame)
    setLastMove({ from: played.from, to: played.to })
    const stoppedClock = stopClockForMove(clockRef.current, engineColorRef.current)
    syncClock(nextGame.isGameOver() ? stoppedClock : { ...stoppedClock, activeColor: humanColor })
  }

  function stopEngine() {
    adapterRef.current?.stop()
    setEngineThinking(false)
    setThinkingMove(null)
    setEngineStatus('Stopped')
  }

  function toggleRemovedPiece(square) {
    if (removedPieces.includes(square)) {
      setRemovedPieces((current) => current.filter((item) => item !== square))
      return
    }

    const piece = new Chess(setupFen, { skipValidation: true }).get(square)
    if (!piece || piece.type === 'k') return
    setRemovedPieces((current) => [...current, square])
  }

  function onSquareClick(square) {
    if (!gameStarted || engineThinking || game.turn() !== humanColor) return

    if (selectedSquare && legalMoveSquares.includes(square)) {
      applyHumanMove(selectedSquare, square)
      return
    }

    const piece = game.get(square)
    if (piece?.color === humanColor) {
      setSelectedSquare(square)
      setLegalMoveSquares(legalTargets(game, square))
    } else {
      setSelectedSquare(null)
      setLegalMoveSquares([])
    }
  }

  const checkSquare = game.isCheck() ? locateKing(game, game.turn()) : null
  const status = gameStatus(game, flaggedColor)

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>LacrimaWeb</h1>
          <p>{status}</p>
        </div>
        <div className="actions">
          <span>{gameStarted ? 'Game active' : 'Setup'}</span>
          <button type="button" onClick={startGame} disabled={gameStarted || !setupValidation.valid}>
            Start
          </button>
          <button type="button" onClick={resetGame}>
            New
          </button>
        </div>
      </header>

      <section className="layout">
        <aside className="sidebar">
          <TimeControlPicker
            presetId={presetId}
            setPresetId={setPresetId}
            humanColor={humanColor}
            setHumanColor={setHumanColor}
            customTime={customTime}
            setCustomTime={setCustomTime}
            disabled={gameStarted}
          />
          <OddsPanel
            odds={odds}
            setOdds={setOdds}
            setupFen={setupFen}
            humanColor={humanColor}
            removedPieces={removedPieces}
            onToggleRemovedPiece={toggleRemovedPiece}
            validation={setupValidation}
            disabled={gameStarted}
          />
        </aside>

        <section className="board-area">
          <div className="board-with-eval">
            <BoardView
              allowDragging={gameStarted && !engineThinking && game.turn() === humanColor}
              fen={game.fen()}
              orientation={humanColor === 'w' ? 'white' : 'black'}
              lastMove={lastMove}
              thinkingMove={thinkingMove}
              legalTargets={legalMoveSquares}
              checkSquare={checkSquare}
              onDrop={applyHumanMove}
              onSquareClick={onSquareClick}
            />
            <EvalBar
              show={showEvalBar}
              setShow={setShowEvalBar}
              cpWhite={evalState.cpWhite}
              mateWhite={evalState.mateWhite}
            />
          </div>
        </section>

        <aside className="sidebar right">
          <ClockPanel clock={clock} humanColor={humanColor} engineThinking={engineThinking} />
          <EngineStatus
            status={engineStatus}
            depth={depth}
            nps={nps}
            error={engineError}
            onStop={stopEngine}
            canStop={engineThinking}
          />
          <MoveList moves={game.history()} />
          <UciConsole lines={uciLines} />
        </aside>
      </section>
    </main>
  )
}

export default App
