import { describe, expect, it } from 'vitest'
import { assertGoWasmSupport, getMissingGoWasmFeatures } from './wasmSupport'

function supportedScope(overrides = {}) {
  return {
    WebAssembly: { instantiate() {} },
    crypto: { getRandomValues() {} },
    performance: { now() {} },
    TextEncoder() {},
    TextDecoder() {},
    ...overrides,
  }
}

describe('wasmSupport', () => {
  it('accepts worker globals needed by Go WASM', () => {
    expect(getMissingGoWasmFeatures(supportedScope())).toEqual([])
    expect(() => assertGoWasmSupport(supportedScope())).not.toThrow()
  })

  it('reports missing mobile worker APIs before wasm_exec.js throws', () => {
    const scope = supportedScope({
      crypto: undefined,
      TextDecoder: undefined,
    })

    expect(getMissingGoWasmFeatures(scope)).toEqual(['crypto.getRandomValues', 'TextDecoder'])
    expect(() => assertGoWasmSupport(scope)).toThrow(
      "This browser cannot run Lacrima's Go WASM worker. Missing: crypto.getRandomValues, TextDecoder.",
    )
  })
})
