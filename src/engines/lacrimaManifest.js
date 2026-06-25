const assetBase = import.meta.env.BASE_URL

export const LACRIMA_ASSETS = {
  wasm: `${assetBase}engines/lacrima/lacrima.wasm`,
  wasmExec: `${assetBase}engines/lacrima/wasm_exec.js`,
}
