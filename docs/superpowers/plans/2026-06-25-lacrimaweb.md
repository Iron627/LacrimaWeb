# LacrimaWeb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Vite + React browser chess GUI that plays against Lacrima through Go WASM UCI with clock/time odds, material odds, thinking highlights, eval, and NPS.

**Architecture:** React coordinates the game flow while small helper modules own UCI parsing, odds FEN generation, clocks, and engine messaging. Lacrima runs only through a Web Worker loading `public/engines/lacrima/lacrima.wasm` and `wasm_exec.js`.

**Tech Stack:** Vite, React, react-chessboard, chess.js, Vitest, Go WASM worker assets, GitHub CLI.

---

### Task 1: Baseline Repository

**Files:**
- Create: `docs/superpowers/specs/2026-06-25-lacrimaweb-design.md`
- Create: `docs/superpowers/plans/2026-06-25-lacrimaweb.md`
- Modify: scaffolded Vite files

- [ ] Initialize the `LacrimaWeb` repository with Vite React.
- [ ] Add design and plan docs.
- [ ] Run `bun run build` to verify the scaffold.
- [ ] Commit with `chore: scaffold LacrimaWeb`.

### Task 2: Tested Chess, UCI, Odds, and Clock Helpers

**Files:**
- Create: `src/chess/uciParser.js`
- Create: `src/chess/odds.js`
- Create: `src/chess/fenUtils.js`
- Create: `src/chess/gameController.js`
- Create: `src/clocks/timeControls.js`
- Create: `src/clocks/clockController.js`
- Create: `src/**/*.test.js`

- [ ] Write failing Vitest tests for `parseInfo`, `parseBestMove`, `extractFirstPvMove`, score normalization, eval formatting, and NPS derivation.
- [ ] Implement `src/chess/uciParser.js` until tests pass.
- [ ] Write failing tests for odds FEN generation, rook/knight square mapping, custom removals, king validation, pawn-rank validation, and castling updates.
- [ ] Implement `src/chess/odds.js` and `src/chess/fenUtils.js` until tests pass.
- [ ] Write failing tests for clock start/stop/increment/flag behavior and UCI time-control presets.
- [ ] Implement `src/clocks/timeControls.js` and `src/clocks/clockController.js` until tests pass.
- [ ] Commit with `feat: add chess odds and clock helpers`.

### Task 3: Lacrima Worker and Adapter

**Files:**
- Create: `src/engines/lacrima.worker.js`
- Create: `src/engines/lacrimaAdapter.js`
- Create: `src/engines/lacrimaManifest.js`
- Create: `public/engines/lacrima/manifest.json`
- Create: `public/engines/lacrima/README.md`

- [ ] Write tests for adapter command formatting and event dispatch.
- [ ] Implement `LacrimaAdapter` with `load`, `initUci`, `newGame`, `setPositionFen`, `goClock`, `stop`, `quit`, and callback registration.
- [ ] Implement the worker message protocol, UCI parsing, eval/NPS forwarding, `bestmove` forwarding, and Lacrima runtime loading.
- [ ] Add a manifest and README describing how to place or build Lacrima WASM assets.
- [ ] Commit with `feat: add Lacrima engine adapter`.

### Task 4: Browser UI and Game Flow

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/App.css`
- Create: `src/components/BoardView.jsx`
- Create: `src/components/ClockPanel.jsx`
- Create: `src/components/TimeControlPicker.jsx`
- Create: `src/components/OddsPanel.jsx`
- Create: `src/components/EvalBar.jsx`
- Create: `src/components/EngineStatus.jsx`
- Create: `src/components/MoveList.jsx`
- Create: `src/components/UciConsole.jsx`
- Modify: `src/main.jsx`

- [ ] Build setup controls for time presets, custom imbalanced time odds, human/engine color, and material odds.
- [ ] Build the board view with last move, legal hints, thinking move, and check highlights.
- [ ] Build clock, engine status, eval bar, move list, and UCI console panels.
- [ ] Wire game start, human moves, engine turns, `stop`, `ucinewgame`, local flag fall, and game over states.
- [ ] Commit with `feat: build Lacrima chess UI`.

### Task 5: Verification and Publish

**Files:**
- Modify: `README.md`

- [ ] Update README with setup, Lacrima WASM asset expectations, and verification commands.
- [ ] Run `bun test`.
- [ ] Run `bun run build`.
- [ ] Check `git status -sb` and commit remaining docs if needed.
- [ ] Create GitHub repo `LacrimaWeb`, add remote, push commits.
