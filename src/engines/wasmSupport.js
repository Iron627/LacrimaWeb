export function getMissingGoWasmFeatures(scope = globalThis) {
  const missing = []

  if (typeof scope.WebAssembly?.instantiate !== 'function') missing.push('WebAssembly.instantiate')
  if (typeof scope.crypto?.getRandomValues !== 'function') missing.push('crypto.getRandomValues')
  if (typeof scope.performance?.now !== 'function') missing.push('performance.now')
  if (typeof scope.TextEncoder !== 'function') missing.push('TextEncoder')
  if (typeof scope.TextDecoder !== 'function') missing.push('TextDecoder')

  return missing
}

export function assertGoWasmSupport(scope = globalThis) {
  const missing = getMissingGoWasmFeatures(scope)

  if (missing.length > 0) {
    throw new Error(`This browser cannot run Lacrima's Go WASM worker. Missing: ${missing.join(', ')}.`)
  }
}
