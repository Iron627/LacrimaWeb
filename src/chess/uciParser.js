export function parseInfo(line) {
  const tokens = line.trim().split(/\s+/)
  const info = {
    depth: null,
    scoreCp: null,
    mate: null,
    nodes: null,
    timeMs: null,
    pv: [],
    currentBestMove: null,
  }

  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] === 'depth') info.depth = Number(tokens[i + 1])
    if (tokens[i] === 'nodes') info.nodes = Number(tokens[i + 1])
    if (tokens[i] === 'time') info.timeMs = Number(tokens[i + 1])

    if (tokens[i] === 'score' && tokens[i + 1] === 'cp') {
      info.scoreCp = Number(tokens[i + 2])
    }

    if (tokens[i] === 'score' && tokens[i + 1] === 'mate') {
      info.mate = Number(tokens[i + 2])
    }

    if (tokens[i] === 'pv') {
      info.pv = tokens.slice(i + 1)
      info.currentBestMove = info.pv[0] || null
      break
    }
  }

  return info
}

export function parseBestMove(line) {
  const tokens = line.trim().split(/\s+/)
  return tokens[0] === 'bestmove' ? tokens[1] || null : null
}

export function extractFirstPvMove(line) {
  return parseInfo(line).currentBestMove
}

export function normalizeScoreToWhite({ scoreCp, mate, sideToMove }) {
  const multiplier = sideToMove === 'w' ? 1 : -1
  return {
    cpWhite: scoreCp == null ? null : scoreCp * multiplier,
    mateWhite: mate == null ? null : mate * multiplier,
  }
}

export function cpToEvalPercent(cp) {
  if (cp == null) return 50
  const clamped = Math.max(-800, Math.min(800, cp))
  return 50 + (clamped / 800) * 50
}

function cpMateLikeDistance(cp) {
  const absolute = Math.abs(cp)
  if (absolute < 998) return null
  return Math.max(1, 1000 - absolute)
}

export function formatEval({ cpWhite, mateWhite }) {
  if (mateWhite != null) {
    return mateWhite < 0 ? `-M${Math.abs(mateWhite)}` : `M${mateWhite}`
  }

  if (cpWhite == null) return '-'

  const mateLikeDistance = cpMateLikeDistance(cpWhite)
  if (mateLikeDistance != null) {
    return cpWhite < 0 ? `-M${mateLikeDistance}` : `M${mateLikeDistance}`
  }

  const pawns = cpWhite / 100
  return `${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)}`
}

export function deriveNps({ nodes, timeMs, searchStartedAt }) {
  if (!nodes || nodes <= 0) return null

  const elapsedMs =
    timeMs && timeMs > 0
      ? timeMs
      : performance.now() - searchStartedAt

  if (!elapsedMs || elapsedMs <= 0) return null
  return Math.round(nodes / (elapsedMs / 1000))
}

export function formatNps(nps) {
  if (!nps) return '-'
  if (nps >= 1_000_000) return `${(nps / 1_000_000).toFixed(nps >= 10_000_000 ? 0 : 1)}M nps`
  if (nps >= 1000) return `${Math.round(nps / 1000)}k nps`
  return `${nps} nps`
}
