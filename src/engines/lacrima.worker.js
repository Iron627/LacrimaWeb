import {
  deriveNps,
  extractFirstPvMove,
  formatEval,
  normalizeScoreToWhite,
  parseBestMove,
  parseInfo,
} from '../chess/uciParser'
import { LACRIMA_ASSETS } from './lacrimaManifest'
import { assertGoWasmSupport } from './wasmSupport'

let loaded = false
let loading = null
let searchStartedAt = null
let currentSearchSideToMove = 'w'
let lastInfoPostAt = 0

function post(message) {
  self.postMessage(message)
}

function postInfo(line, force = false) {
  const now = performance.now()
  if (!force && now - lastInfoPostAt < 150) return
  lastInfoPostAt = now

  const info = parseInfo(line)
  post({ type: 'line', line })
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

function handleLine(line) {
  if (line.startsWith('info ')) {
    postInfo(line)
    return
  }

  post({ type: 'line', line })

  if (line === 'uciok') post({ type: 'uciok' })
  if (line === 'readyok') post({ type: 'readyok' })

  const move = parseBestMove(line)
  if (move) {
    searchStartedAt = null
    lastInfoPostAt = 0
    post({ type: 'bestmove', move, raw: line })
  }
}

async function instantiateLacrimaWasm(go) {
  const response = await fetch(LACRIMA_ASSETS.wasm)
  if (!response.ok) {
    throw new Error(`Unable to load ${LACRIMA_ASSETS.wasm}`)
  }

  if (typeof WebAssembly.instantiateStreaming === 'function') {
    try {
      return await WebAssembly.instantiateStreaming(response.clone(), go.importObject)
    } catch {
      // Some mobile browsers and webviews fail streaming WASM even when the file is valid.
      // Byte instantiation keeps Lacrima in the worker while avoiding that browser edge.
    }
  }

  const bytes = await response.arrayBuffer()
  return WebAssembly.instantiate(bytes, go.importObject)
}

async function loadLacrima() {
  if (loaded) return
  if (loading) return loading

  loading = (async () => {
    self.lacrimaOnLine = handleLine
    assertGoWasmSupport(self)

    const wasmExecResponse = await fetch(LACRIMA_ASSETS.wasmExec)
    if (!wasmExecResponse.ok) {
      throw new Error(`Unable to load ${LACRIMA_ASSETS.wasmExec}`)
    }
    const wasmExecSource = await wasmExecResponse.text()
    ;(0, eval)(wasmExecSource)

    if (typeof self.Go !== 'function') {
      throw new Error('wasm_exec.js did not expose Go runtime.')
    }

    const go = new self.Go()
    const result = await instantiateLacrimaWasm(go)
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
        // Lacrima stays in a Go WASM Web Worker. Browser WASM can be slower than native,
        // and the perf panel intentionally measures worker/message overhead too.
        searchStartedAt = performance.now()
        currentSearchSideToMove = message.sideToMove || currentSearchSideToMove
      }

      self.lacrimaCommand?.(message.command)
    }
  } catch (error) {
    post({ type: 'error', message: error.message || String(error) })
  }
})
