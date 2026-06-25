# LacrimaWeb Design

## Goal

Build a Lacrima-first browser chess GUI that supports clock-based play, time odds, material odds, thinking move highlights, a toggleable eval bar, and derived NPS.

## Architecture

The app is a static Vite + React site. React owns the UI, `chess.js` owns legal chess state and FEN/PGN generation, and Lacrima is reached only through a UCI adapter running in a Web Worker. Normal game searches use `go wtime ... btime ... winc ... binc ...`; the app does not use Stockfish or depth-based play.

```txt
React App
  -> GameController using chess.js
  -> ClockController
  -> OddsController
  -> LacrimaAdapter
  -> Web Worker
  -> wasm_exec.js
  -> lacrima.wasm
  -> Lacrima UCI loop
```

## Components

- `src/App.jsx` coordinates setup, game state, clocks, engine turns, and UI state.
- `src/components/*` contains focused UI panels for the board, clocks, time controls, odds, eval, engine status, move list, and UCI console.
- `src/chess/*` contains tested helpers for UCI parsing, odds FEN generation, and chess controller operations.
- `src/clocks/*` contains tested time presets and clock transitions.
- `src/engines/*` contains the Lacrima Web Worker wrapper, adapter class, and static engine manifest.
- `public/engines/lacrima/*` contains the browser WASM runtime files and manifest.

## Data Flow

Before a game starts, setup controls choose human color, time controls, and odds. `createOddsFen` produces a validated starting FEN. On engine turns, the app starts the engine clock, sends `position fen <fen>`, then sends `go wtime ... btime ... winc ... binc ...`. Worker `info` lines update thinking highlights, eval, NPS, and console output. `bestmove` stops the engine clock, applies the move through `chess.js`, clears thinking highlights, adds increment, and returns control to the next side.

## Error Handling

If the worker fails to load Lacrima files, the UI shows an engine error and disables engine search controls. Illegal odds positions are rejected before game start. Flag fall ends the game locally. `stop` sends UCI `stop`, clears thinking state, and keeps the current board position.

## Testing

Unit tests cover UCI parsing, eval normalization, NPS derivation, odds FEN generation and castling rights, and clock transitions. Production verification runs tests and a static Vite build.
