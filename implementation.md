# Implementation: Jev Loop Decisions

## Phase 1: setup and tooling
- T1.1 Folder + package.json + .gitignore + .env.example.
  AC: `node server.js` starts, no install.

## Phase 2: controller core
- T2.1 lib/score.js: word-set novelty and repetition, error streak, budget,
  goal markers, stop rules; 8-step scripted bug-hunt scenario; simulate walk.
  AC: deterministic.
- T2.2 test.js: goal stop, repetition stop, budget stop, fresh continue,
  simulation stops early and saves tokens, determinism.
  AC: `node test.js` exits 0.

## Phase 3: API and UI
- T3.1 server.js: /api/evaluate, /api/simulate with budget validation
  (200 to 100000), static serving with traversal guard.
- T3.2 UI: budget input, run/reset, staggered step log, summary strip, ledger.
  AC: smaller budget visibly stops the same script earlier.

## Phase 4: polish and verification
- T4.1 Contrast and keyboard pass; reveal respects prefers-reduced-motion.
- T4.2 R-35 click-through recorded in README.
