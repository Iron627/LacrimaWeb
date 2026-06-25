import { describe, expect, it } from 'vitest'
import { LacrimaAdapter } from './lacrimaAdapter'

class FakeWorker {
  constructor() {
    this.messages = []
    this.listeners = new Map()
  }

  postMessage(message) {
    this.messages.push(message)
  }

  addEventListener(type, callback) {
    this.listeners.set(type, callback)
  }

  emit(data) {
    this.listeners.get('message')?.({ data })
  }

  terminate() {
    this.terminated = true
  }
}

describe('LacrimaAdapter', () => {
  it('loads and initializes UCI through worker messages', async () => {
    const worker = new FakeWorker()
    const adapter = new LacrimaAdapter({ createWorker: () => worker })

    const loadPromise = adapter.load()
    worker.emit({ type: 'loaded' })
    await expect(loadPromise).resolves.toBeUndefined()

    adapter.initUci()
    adapter.newGame()

    expect(worker.messages).toEqual([
      { type: 'load' },
      { type: 'command', command: 'uci' },
      { type: 'command', command: 'isready' },
      { type: 'command', command: 'ucinewgame' },
    ])
  })

  it('formats position and clock-based go commands without depth', () => {
    const worker = new FakeWorker()
    const adapter = new LacrimaAdapter({ createWorker: () => worker })
    adapter.worker = worker

    adapter.setPositionFen('8/8/8/8/8/8/8/8 w - - 0 1')
    adapter.goClock({
      whiteMs: 600000,
      blackMs: 60000,
      whiteIncrementMs: 0,
      blackIncrementMs: 2000,
    })

    expect(worker.messages).toEqual([
      {
        type: 'command',
        command: 'position fen 8/8/8/8/8/8/8/8 w - - 0 1',
        sideToMove: 'w',
      },
      {
        type: 'command',
        command: 'go wtime 600000 btime 60000 winc 0 binc 2000',
        sideToMove: 'w',
      },
    ])
    expect(worker.messages.at(-1).command).not.toContain('depth')
  })

  it('dispatches worker events to registered callbacks', () => {
    const worker = new FakeWorker()
    const adapter = new LacrimaAdapter({ createWorker: () => worker })
    adapter.worker = worker
    adapter.attachWorkerListeners()

    const seen = []
    adapter.onLine((line) => seen.push(['line', line]))
    adapter.onBestMove((move) => seen.push(['bestmove', move]))
    adapter.onEval((evaluation) => seen.push(['eval', evaluation.display]))

    worker.emit({ type: 'line', line: 'uciok' })
    worker.emit({ type: 'bestmove', move: 'e2e4' })
    worker.emit({ type: 'eval', display: '+0.32', cpWhite: 32 })

    expect(seen).toEqual([
      ['line', 'uciok'],
      ['bestmove', 'e2e4'],
      ['eval', '+0.32'],
    ])
  })
})
