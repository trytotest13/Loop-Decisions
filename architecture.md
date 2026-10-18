# Architecture: Jev Loop Decisions

## Directory tree
```
04-loop-decisions/
  server.js        static + POST /api/evaluate + POST /api/simulate
  lib/score.js     signal extraction, stop rules, scripted scenario (no I/O)
  test.js          assertions over lib/score.js
  index.html       budget control, run/reset, step log, summary, ledger
  styles.css       shared tokens, coral accent (see DESIGN.md at repo root)
  app.js           fetch, staggered step render, summary, ledger
```

## Data flow
```
Run button
  -> POST /api/simulate {budget}
  -> lib/score.js walks the scripted trajectory:
     after each step evaluateStep(prefix) -> CONTINUE | STOP + signals
     stops the walk at the first STOP
  -> JSON {steps: [per-step decisions], summary: {used, available, tokens, savedTokens}}
  -> app.js renders steps sequentially (staggered reveal, the one declared
     motion exception), then the summary strip
Reset
  -> client-side state clear, no server call
```

## Components
- Control panel: budget input, Run button, Reset button, hint, error.
- Decision panel: step log (focal: the controller verdicts), summary strip,
  ledger of past runs.

## Rendering strategy
Static files, client-side fetch rendering, stateless server.

## Third-party services
None. CONTROLLER_MODEL_ENDPOINT is a documented extension point.
