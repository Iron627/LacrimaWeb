# Lacrima WASM Assets

This directory is the static runtime location used by `src/engines/lacrima.worker.js`.

Expected files:

- `wasm_exec.js` from the Go toolchain version used to build Lacrima.
- `lacrima.wasm`, built from the Lacrima browser adapter.
- `manifest.json`, used by the UI to describe the runtime assets.

The app is Lacrima-only. It does not include Stockfish assets, examples, fallbacks, or dependencies.

Lacrima source: https://github.com/iron627/lacrima
