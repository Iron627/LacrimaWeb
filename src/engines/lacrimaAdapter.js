const CALLBACK_TYPES = ['line', 'info', 'thinkingMove', 'eval', 'nps', 'bestmove', 'error']

function fenSideToMove(fen) {
  return fen.split(/\s+/)[1] || 'w'
}

export class LacrimaAdapter {
  constructor({ createWorker } = {}) {
    this.createWorker = createWorker || (() => new Worker(new URL('./lacrima.worker.js', import.meta.url), { type: 'module' }))
    this.worker = null
    this.callbacks = Object.fromEntries(CALLBACK_TYPES.map((type) => [type, new Set()]))
    this.loaded = false
    this.currentFen = null
    this.currentSideToMove = 'w'
  }

  load() {
    if (!this.worker) {
      this.worker = this.createWorker()
      this.attachWorkerListeners()
    }

    if (this.loaded) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const removeLoaded = this.onLoaded(() => {
        removeLoaded()
        removeError()
        this.loaded = true
        resolve()
      })
      const removeError = this.onError((error) => {
        removeLoaded()
        removeError()
        reject(error)
      })

      this.worker.postMessage({ type: 'load' })
    })
  }

  attachWorkerListeners() {
    this.worker?.addEventListener('message', (event) => {
      const message = event.data
      if (message.type === 'loaded') {
        this.emit('loaded', message)
        return
      }

      if (this.callbacks[message.type]) {
        const payload = message.type === 'line'
          ? message.line
          : message.type === 'bestmove' || message.type === 'thinkingMove'
            ? message.move
            : message
        this.emit(message.type, payload)
      }
    })
  }

  postCommand(command, extra = {}) {
    if (!this.worker) throw new Error('Lacrima worker is not loaded.')
    this.emit('line', `> ${command}`)
    this.worker.postMessage({ type: 'command', command, ...extra })
  }

  initUci() {
    this.postCommand('uci')
    this.postCommand('isready')
  }

  newGame() {
    this.postCommand('ucinewgame')
  }

  setPositionFen(fen) {
    this.currentFen = fen
    this.currentSideToMove = fenSideToMove(fen)
    this.postCommand(`position fen ${fen}`, { sideToMove: this.currentSideToMove })
  }

  goClock({ whiteMs, blackMs, whiteIncrementMs, blackIncrementMs }) {
    this.postCommand(
      `go wtime ${Math.max(0, Math.round(whiteMs))} btime ${Math.max(0, Math.round(blackMs))} winc ${Math.max(0, Math.round(whiteIncrementMs))} binc ${Math.max(0, Math.round(blackIncrementMs))}`,
      { sideToMove: this.currentSideToMove },
    )
  }

  stop() {
    this.postCommand('stop')
  }

  quit() {
    if (!this.worker) return
    this.worker.postMessage({ type: 'quit' })
    this.worker.terminate?.()
    this.worker = null
    this.loaded = false
  }

  onLoaded(callback) {
    return this.on('loaded', callback)
  }

  onLine(callback) {
    return this.on('line', callback)
  }

  onInfo(callback) {
    return this.on('info', callback)
  }

  onThinkingMove(callback) {
    return this.on('thinkingMove', callback)
  }

  onEval(callback) {
    return this.on('eval', callback)
  }

  onNps(callback) {
    return this.on('nps', callback)
  }

  onBestMove(callback) {
    return this.on('bestmove', callback)
  }

  onError(callback) {
    return this.on('error', callback)
  }

  on(type, callback) {
    if (!this.callbacks[type]) this.callbacks[type] = new Set()
    this.callbacks[type].add(callback)
    return () => this.callbacks[type]?.delete(callback)
  }

  emit(type, payload) {
    for (const callback of this.callbacks[type] || []) {
      callback(payload)
    }
  }
}
