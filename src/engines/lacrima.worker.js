import {
  deriveNps,
  extractFirstPvMove,
  formatEval,
  normalizeScoreToWhite,
  parseBestMove,
  parseInfo,
} from '../chess/uciParser'
import { LACRIMA_ASSETS } from './lacrimaManifest'

let loaded = false
let loading = null
let searchStartedAt = null
let currentSearchSideToMove = 'w'

function post(message) {
  self.postMessage(message)
}

function handleLine(line) {
  post({ type: 'line', line })

  if (line === 'uciok') post({ type: 'uciok' })
  if (line === 'readyok') post({ type: 'readyok' })

  if (line.startsWith('info ')) {
    const info = parseInfo(line)
    post({ type: 'info', info })

    const move = extractFirstPvMove(line)
    if (move) post({ type: 'thinkingMove', move })

    const normalized = normalizeScoreToWhite({
      scoreCp: info.scoreCp,
      mate: info.mate,
      sideToMove: currentSearchSideToMove,
    })

    if (normalized.cpWhite != null || normalized.mateWhite != null) {
      post({
        type: 'eval',
        ...normalized,
        display: formatEval(normalized),
      })
    }

    const nps = deriveNps({
      nodes: info.nodes,
      timeMs: info.timeMs,
      searchStartedAt,
    })
    if (nps != null) post({ type: 'nps', nps })
  }

  const move = parseBestMove(line)
  if (move) {
    searchStartedAt = null
    post({ type: 'bestmove', move, raw: line })
  }
}

async function loadLacrima() {
  if (loaded) return
  if (loading) return loading

  loading = (async () => {
    self.lacrimaOnLine = handleLine

    await import(/* @vite-ignore */ LACRIMA_ASSETS.wasmExec)

    if (typeof self.Go !== 'function') {
      throw new Error('wasm_exec.js did not expose Go runtime.')
    }

    const go = new self.Go()
    const result = await WebAssembly.instantiateStreaming(fetch(LACRIMA_ASSETS.wasm), go.importObject)
    go.run(result.instance)

    loaded = true
    post({ type: 'loaded' })
  })().catch((error) => {
    loading = null
    post({ type: 'error', message: error.message || String(error) })
    throw error
  })

  return loading
}

self.addEventListener('message', async (event) => {
  const message = event.data

  try {
    if (message.type === 'load') {
      await loadLacrima()
      return
    }

    if (message.type === 'quit') {
      self.lacrimaQuit?.()
      return
    }

    if (message.type === 'command') {
      if (message.command.startsWith('go ')) {
        searchStartedAt = performance.now()
        currentSearchSideToMove = message.sideToMove || currentSearchSideToMove
      }

      self.lacrimaCommand?.(message.command)
    }
  } catch (error) {
    post({ type: 'error', message: error.message || String(error) })
  }
})
