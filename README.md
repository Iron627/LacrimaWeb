# LacrimaWeb

# Disclaimer -> this project is 100% gpt authored because i am not a web dev.

LacrimaWeb is a static Vite + React chess GUI for playing against [Lacrima](https://github.com/iron627/lacrima) in the browser. The app is Lacrima-only: there are no Stockfish dependencies, examples, fallbacks, or assumptions.

## Features

- Clock-based UCI play with `go wtime ... btime ... winc ... binc ...`.
- 10 minute, 3+2, bullet, and custom imbalanced time odds.
- Rook odds, knight odds, and custom click-to-remove material odds before game start.
- Legal move validation, FEN, and move history through `chess.js`.
- Lacrima Go WASM runtime in a Web Worker.
- Thinking move highlights from the first move after `pv`.
- Toggleable eval bar with White-perspective normalization.
- Derived NPS from UCI `nodes` and `time`, with wall-clock fallback.
- UCI console and stop/new-game controls.

## Development

```powershell
bun install
bun run dev
```

The local app runs as a Vite site. The current implementation expects Lacrima assets at:

```txt
public/engines/lacrima/lacrima.wasm
public/engines/lacrima/wasm_exec.js
public/engines/lacrima/manifest.json
```

## Build Lacrima WASM

The repository includes a browser adapter entrypoint in `tools/lacrima-wasm/main.go`. It imports Lacrima and connects the existing `RunUCIWithIO` loop to JavaScript functions:

- `lacrimaCommand(command)`
- `lacrimaQuit()`
- `lacrimaOnLine(line)`

To rebuild the Lacrima assets:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-lacrima-wasm.ps1
```

The script clones `https://github.com/iron627/lacrima`, copies the adapter entrypoint into that checkout, builds with `GOOS=js GOARCH=wasm`, and copies the matching Go `wasm_exec.js`.

## Verification

```powershell
bun run test
bun run build
```

The production build works as a static site after the files under `public/engines/lacrima` are present.
