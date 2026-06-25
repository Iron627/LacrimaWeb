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
import { createClockState, flagStatus, startClock, stopClockForMove, tickClock } from './clocks/clockController'
import { createClockConfig } from './clocks/timeControls'
import { applyUciMove, createGame, gameStatus, legalTargets } from './chess/gameController'
import { STARTING_FEN, removePieceFromFen } from './chess/fenUtils'
import { isObviouslyPossiblePremove, playNextPremove } from './chess/premoves'
import { createOddsFen, validateOddsFen } from './chess/odds'
import { deriveNps } from './chess/uciParser'
import { LacrimaAdapter } from './engines/lacrimaAdapter'

const DEFAULT_CUSTOM_TIME = {
  human: { initialMinutes: 10, incrementSeconds: 0 },
  engine: { initialMinutes: 1, incrementSeconds: 0 },
}

const EMPTY_PERF = {
  depth: null,
  nodes: null,
  elapsedMs: null,
  nps: null,
  latestCommand: '',
  runtimeMode: 'Go WASM Worker',
}

function locateKing(game, color) {
  return game.board().flat().find((piece) => piece?.type === 'k' && piece.color === color)?.square || null
}

function moveLayerFromUci(move) {
  return move ? { from: move.slice(0, 2), to: move.slice(2, 4) } : null
}

function isMoveLegal(game, from, to) {
  return game.moves({ verbose: true }).some((move) => move.from === from && move.to === to)
}

function App() {
  const adapterRef = useRef(null)
  const gameRef = useRef(createGame(STARTING_FEN))
  const clockRef = useRef(null)
  const engineColorRef = useRef('b')
  const humanColorRef = useRef('w')
  const premoveQueueRef = useRef([])
  const resignedColorRef = useRef(null)
  const flaggedColorRef = useRef(null)
  const lastInfoUiAtRef = useRef(0)

  const [humanColor, setHumanColor] = useState('w')
  const [presetId, setPresetId] = useState('rapid-10-0')
  const [customTime, setCustomTime] = useState(DEFAULT_CUSTOM_TIME)
  const [odds, setOdds] = useState({ oddsType: 'none', oddsGiver: 'engine', side: 'queen' })
  const [removedPieces, setRemovedPieces] = useState([])
  const [game, setGame] = useState(gameRef.current)
  const [positionFen, setPositionFen] = useState(gameRef.current.fen())
  const [moveHistory, setMoveHistory] = useState([])
  const [boardRevision, setBoardRevision] = useState(0)
  const [clock, setClock] = useState(() => createClockState(createClockConfig({ presetId })))
  const [gameStarted, setGameStarted] = useState(false)
  const [engineStatus, setEngineStatus] = useState('Idle')
  const [engineThinking, setEngineThinking] = useState(false)
  const [engineError, setEngineError] = useState('')
  const [lastMove, setLastMove] = useState(null)
  const [thinkingMove, setThinkingMove] = useState(null)
  const [premoveQueue, setPremoveQueue] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [legalMoveSquares, setLegalMoveSquares] = useState([])
  const [evalState, setEvalState] = useState({ cpWhite: null, mateWhite: null })
  const [showEvalBar, setShowEvalBar] = useState(true)
  const [uciLines, setUciLines] = useState([])
  const [flaggedColor, setFlaggedColor] = useState(null)
  const [resignedColor, setResignedColor] = useState(null)
  const [perf, setPerf] = useState(EMPTY_PERF)

  const engineColor = humanColor === 'w' ? 'b' : 'w'
  humanColorRef.current = humanColor
  engineColorRef.current = engineColor
  resignedColorRef.current = resignedColor
  flaggedColorRef.current = flaggedColor

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
  const terminalGame = gameStarted && (Boolean(flaggedColor) || Boolean(resignedColor) || game.isGameOver())
  const gameActive = gameStarted && !terminalGame
  const displayFen = gameStarted ? positionFen : setupFen

  function syncClock(nextClock) {
    clockRef.current = nextClock
    setClock(nextClock)
    return nextClock
  }

  function syncGame(nextGame) {
    gameRef.current = nextGame
    setGame(nextGame)
    setPositionFen(nextGame.fen())
    setMoveHistory(nextGame.history())
  }

  function restoreBoardPosition() {
    setPositionFen(gameRef.current.fen())
    setBoardRevision((value) => value + 1)
  }

  function clearPremoveQueue() {
    premoveQueueRef.current = []
    setPremoveQueue([])
  }

  function clearTransientBoard({ keepLastMove = true } = {}) {
    setSelectedSquare(null)
    setLegalMoveSquares([])
    setThinkingMove(null)
    if (!keepLastMove) setLastMove(null)
  }

  function recordLine(line) {
    setUciLines((lines) => [...lines.slice(-120), line])
    if (line.startsWith('> ')) {
      setPerf((current) => ({ ...current, latestCommand: line.slice(2) }))
    }
  }

  function finishGame(statusText) {
    adapterRef.current?.stop()
    setEngineThinking(false)
    clearTransientBoard()
    clearPremoveQueue()
    syncClock({ ...clockRef.current, running: false, lastTickAt: null })
    if (statusText) setEngineStatus(statusText)
  }

  function startHumanClock(baseClock = clockRef.current) {
    return syncClock(startClock({ ...baseClock, activeColor: humanColorRef.current }))
  }

  useEffect(() => {
    const adapter = new LacrimaAdapter()
    adapterRef.current = adapter

    const disposers = [
      adapter.onLine((line) => {
        if (!line.startsWith('info ')) recordLine(line)
      }),
      adapter.onInfo((message) => {
        const now = performance.now()
        if (now - lastInfoUiAtRef.current < 150) return
        lastInfoUiAtRef.current = now

        const nps = deriveNps({
          nodes: message.info.nodes,
          timeMs: message.info.timeMs,
          searchStartedAt: now - (message.info.timeMs || 0),
        })
        setPerf((current) => ({
          ...current,
          depth: message.info.depth ?? current.depth,
          nodes: message.info.nodes ?? current.nodes,
          elapsedMs: message.info.timeMs ?? current.elapsedMs,
          nps: nps ?? current.nps,
        }))
        setEngineStatus(message.info.depth ? `Thinking depth ${message.info.depth}` : 'Thinking')
      }),
      adapter.onThinkingMove((move) => setThinkingMove(moveLayerFromUci(move))),
      adapter.onEval((message) => setEvalState({ cpWhite: message.cpWhite, mateWhite: message.mateWhite })),
      adapter.onNps((message) => setPerf((current) => ({ ...current, nps: message.nps }))),
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
    syncClock(createClockState({ ...clockConfig, activeColor: 'w' }))
  }, [clockConfig, gameStarted])

  useEffect(() => {
    clearPremoveQueue()
    setSelectedSquare(null)
    setLegalMoveSquares([])
  }, [humanColor, presetId, odds, removedPieces])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!clockRef.current?.running || flaggedColorRef.current || resignedColorRef.current) return
      const nextClock = syncClock(tickClock(clockRef.current))
      const flag = flagStatus(nextClock)
      if (flag.flagged) {
        setFlaggedColor(flag.color)
        flaggedColorRef.current = flag.color
        finishGame(`${flag.color === 'w' ? 'White' : 'Black'} flagged`)
      }
    }, 200)

    return () => window.clearInterval(id)
  }, [])

  async function prepareEngine() {
    setEngineError('')
    setEngineStatus('Loading Lacrima')
    await adapterRef.current.load()
    adapterRef.current.initUci()
    setEngineStatus('Ready')
  }

  function requestEngineMove(nextGame = gameRef.current, baseClock = clockRef.current) {
    if (nextGame.isGameOver() || flaggedColorRef.current || resignedColorRef.current) return

    const startedClock = syncClock(startClock({ ...baseClock, activeColor: engineColorRef.current }))
    setEngineThinking(true)
    setThinkingMove(null)
    lastInfoUiAtRef.current = 0
    setPerf((current) => ({
      ...current,
      depth: null,
      nodes: null,
      elapsedMs: null,
      nps: null,
    }))
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
    flaggedColorRef.current = null
    setResignedColor(null)
    resignedColorRef.current = null
    setLastMove(null)
    setThinkingMove(null)
    clearPremoveQueue()
    setSelectedSquare(null)
    setLegalMoveSquares([])
    setEvalState({ cpWhite: null, mateWhite: null })
    setUciLines([])
    setPerf(EMPTY_PERF)

    try {
      await prepareEngine()
      adapterRef.current.newGame()
      adapterRef.current.setPositionFen(startingFen)
      if (nextGame.turn() === engineColor) {
        requestEngineMove(nextGame, nextClock)
      } else {
        startHumanClock(nextClock)
      }
    } catch (error) {
      setEngineError(error.message || String(error))
      setEngineStatus('Engine error')
    }
  }

  function resetGame() {
    adapterRef.current?.stop()
    const nextGame = createGame(STARTING_FEN)
    syncGame(nextGame)
    syncClock(createClockState({ ...clockConfig, activeColor: 'w' }))
    setGameStarted(false)
    setFlaggedColor(null)
    flaggedColorRef.current = null
    setResignedColor(null)
    resignedColorRef.current = null
    setEngineThinking(false)
    clearTransientBoard({ keepLastMove: false })
    clearPremoveQueue()
    setEngineStatus('Idle')
    setPerf(EMPTY_PERF)
    setBoardRevision((value) => value + 1)
  }

  function queuePremove(from, to) {
    const nextPremove = { from, to }
    if (!isObviouslyPossiblePremove(gameRef.current, nextPremove, humanColorRef.current)) return false
    const lastQueued = premoveQueueRef.current[premoveQueueRef.current.length - 1]
    if (lastQueued?.from === from && lastQueued?.to === to) return true

    const nextQueue = [...premoveQueueRef.current, nextPremove]
    premoveQueueRef.current = nextQueue
    setPremoveQueue(nextQueue)
    recordLine(`premove ${from}${to}`)
    setSelectedSquare(null)
    setLegalMoveSquares([])
    return true
  }

  function applyHumanMove(from, to) {
    const currentGame = gameRef.current
    if (!gameActive || engineThinking || currentGame.turn() !== humanColorRef.current) return false
    if (!isMoveLegal(currentGame, from, to)) {
      setSelectedSquare(null)
      setLegalMoveSquares([])
      restoreBoardPosition()
      return false
    }

    const move = currentGame.move({ from, to, promotion: 'q' })
    if (!move) {
      restoreBoardPosition()
      return false
    }

    syncGame(currentGame)
    setLastMove({ from: move.from, to: move.to })
    clearPremoveQueue()
    setSelectedSquare(null)
    setLegalMoveSquares([])

    const stoppedClock = syncClock(stopClockForMove(clockRef.current, humanColorRef.current))
    if (currentGame.isGameOver()) {
      finishGame('Game over')
      return true
    }

    requestEngineMove(currentGame, stoppedClock)
    return true
  }

  function applyEngineMove(move) {
    if (resignedColorRef.current || flaggedColorRef.current) return
    const currentGame = gameRef.current
    let played = null

    try {
      played = applyUciMove(currentGame, move)
    } catch {
      played = null
    }

    setEngineThinking(false)
    setThinkingMove(null)
    setEngineStatus('Ready')

    if (!played) {
      restoreBoardPosition()
      return
    }

    syncGame(currentGame)
    setLastMove({ from: played.from, to: played.to })
    const stoppedClock = stopClockForMove(clockRef.current, engineColorRef.current)

    if (currentGame.isGameOver()) {
      syncClock(stoppedClock)
      finishGame('Game over')
      return
    }

    if (tryApplyPremove(stoppedClock)) return
    startHumanClock(stoppedClock)
  }

  function tryApplyPremove(baseClock) {
    if (premoveQueueRef.current.length === 0) return false

    const result = playNextPremove(gameRef.current, premoveQueueRef.current, humanColorRef.current)
    premoveQueueRef.current = result.remaining
    setPremoveQueue(result.remaining)

    if (!result.move) {
      startHumanClock(baseClock)
      return true
    }

    syncGame(result.game)
    setLastMove({ from: result.move.from, to: result.move.to })
    setSelectedSquare(null)
    setLegalMoveSquares([])

    const now = performance.now()
    const premoveClock = stopClockForMove(
      startClock({ ...baseClock, activeColor: humanColorRef.current }, now),
      humanColorRef.current,
      now,
    )

    if (result.game.isGameOver()) {
      syncClock(premoveClock)
      finishGame('Game over')
      return true
    }

    requestEngineMove(result.game, premoveClock)
    return true
  }

  function resignGame() {
    setResignedColor(humanColorRef.current)
    resignedColorRef.current = humanColorRef.current
    finishGame(`${humanColorRef.current === 'w' ? 'White' : 'Black'} resigned`)
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
    if (!gameActive) return
    const currentGame = gameRef.current

    if (engineThinking) {
      if (selectedSquare && selectedSquare !== square) {
        queuePremove(selectedSquare, square)
        return
      }

      const piece = currentGame.get(square)
      if (piece?.color === humanColorRef.current) {
        setSelectedSquare(square)
        setLegalMoveSquares([])
      } else {
        setSelectedSquare(null)
      }
      return
    }

    if (currentGame.turn() !== humanColorRef.current) return

    if (selectedSquare && legalMoveSquares.includes(square)) {
      applyHumanMove(selectedSquare, square)
      return
    }

    const piece = currentGame.get(square)
    if (piece?.color === humanColorRef.current) {
      setSelectedSquare(square)
      setLegalMoveSquares(legalTargets(currentGame, square))
    } else {
      setSelectedSquare(null)
      setLegalMoveSquares([])
    }
  }

  function onBoardRightClick() {
    clearPremoveQueue()
    setSelectedSquare(null)
    setLegalMoveSquares([])
    restoreBoardPosition()
  }

  async function copyFen() {
    await navigator.clipboard?.writeText(displayFen)
  }

  async function copyPgn() {
    await navigator.clipboard?.writeText(gameRef.current.pgn())
  }

  function downloadPgn() {
    const blob = new Blob([gameRef.current.pgn()], { type: 'application/x-chess-pgn' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'lacrima-game.pgn'
    link.click()
    URL.revokeObjectURL(url)
  }

  const checkSquare = gameStarted && game.isCheck() ? locateKing(game, game.turn()) : null
  const status = resignedColor
    ? `${resignedColor === 'w' ? 'White' : 'Black'} resigned`
    : gameStatus(game, flaggedColor)

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <h1>LacrimaWeb</h1>
          <p>{status}</p>
        </div>
        <div className="actions">
          <span>{gameActive ? 'Game active' : terminalGame ? 'Game complete' : 'Setup'}</span>
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
            disabled={gameActive}
          />
          <OddsPanel
            odds={odds}
            setOdds={setOdds}
            setupFen={setupFen}
            humanColor={humanColor}
            removedPieces={removedPieces}
            onToggleRemovedPiece={toggleRemovedPiece}
            validation={setupValidation}
            disabled={gameActive}
          />
          {gameActive && (
            <section className="panel resign-panel">
              <h2>Game</h2>
              <button className="resign-button" type="button" onClick={resignGame}>
                Resign
              </button>
            </section>
          )}
        </aside>

        <section className="board-area">
          <div className={`board-with-eval ${showEvalBar ? '' : 'no-eval'}`}>
            <BoardView
              key={boardRevision}
              allowDragging={gameActive && (engineThinking || game.turn() === humanColor)}
              fen={displayFen}
              orientation={humanColor === 'w' ? 'white' : 'black'}
              lastMove={lastMove}
              selectedSquare={selectedSquare}
              thinkingMove={thinkingMove}
              premoves={premoveQueue}
              premoveMode={engineThinking}
              legalTargets={legalMoveSquares}
              checkSquare={checkSquare}
              onDrop={(from, to) => (engineThinking ? queuePremove(from, to) : applyHumanMove(from, to))}
              onSquareClick={onSquareClick}
              onRightClick={onBoardRightClick}
            />
            <EvalBar
              show={showEvalBar}
              cpWhite={evalState.cpWhite}
              mateWhite={evalState.mateWhite}
            />
          </div>
          <section className="fen-panel">
            <code>{displayFen}</code>
            <button type="button" onClick={copyFen}>Copy FEN</button>
          </section>
        </section>

        <aside className="sidebar right">
          {!gameStarted ? (
            <>
              <ClockPanel clock={clock} humanColor={humanColor} engineThinking={engineThinking} />
              <section className="panel launch-panel">
                <h2>Ready</h2>
                <button className="launch-button" type="button" onClick={startGame} disabled={!setupValidation.valid}>
                  Begin Game
                </button>
                {!setupValidation.valid && <p className="warning">{setupValidation.reason}</p>}
              </section>
              <section className="panel">
                <h2>Display</h2>
                <label className="inline-toggle eval-toggle">
                  <input checked={showEvalBar} type="checkbox" onChange={(event) => setShowEvalBar(event.target.checked)} />
                  Show eval bar
                </label>
              </section>
            </>
          ) : (
            <>
              <ClockPanel clock={clock} humanColor={humanColor} engineThinking={engineThinking} />
              {terminalGame && (
                <section className="panel endgame-panel">
                  <h2>{status}</h2>
                  <button className="launch-button" type="button" onClick={resetGame}>
                    New Game
                  </button>
                  <div className="pgn-actions">
                    <button type="button" onClick={copyPgn}>Copy PGN</button>
                    <button type="button" onClick={downloadPgn}>Download PGN</button>
                  </div>
                </section>
              )}
              <section className="panel">
                <h2>Display</h2>
                <label className="inline-toggle eval-toggle">
                  <input checked={showEvalBar} type="checkbox" onChange={(event) => setShowEvalBar(event.target.checked)} />
                  Show eval bar
                </label>
              </section>
              <EngineStatus status={engineStatus} perf={perf} error={engineError} />
              <MoveList moves={moveHistory} latestPly={moveHistory.length} />
              <UciConsole lines={uciLines} />
            </>
          )}
        </aside>
      </section>
    </main>
  )
}

export default App
