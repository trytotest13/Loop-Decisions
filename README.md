# 04: Jev Loop Decisions

After every agent step, Jev judges the trajectory and predicts whether another
step is likely to help: CONTINUE or STOP. Signals are information novelty,
output repetition, error streak, remaining token budget, and goal-completion
markers. A deterministic scripted bug-hunt (8 steps available) is walked under
the controller so you can watch it stop early and see the tokens saved.

## Run
```bash
node server.js
# http://localhost:3914
```

## Verify
```bash
node test.js
```

## R-35 click-through (recorded 2026-10-09)
- empty page: step log reads "No trajectory yet", summary hidden
- Run with budget 5000: 6 steps appear staggered, step 6 verdicts STOP with
  the goal reason and the coral stop highlight, summary shows 6 of 8 used,
  4800 tokens spent, 4100 tokens of scripted work avoided
- Reset: log and summary clear to empty state
- Run with budget 700: same script stops at step 3 on the budget rule,
  7700 tokens avoided
- Run button during fetch: disabled, reads "Simulating..."
- empty-input guard: budget below 200 shows the inline error message
- keyboard: Tab reaches budget, Run, Reset; Enter in the budget field runs
- reduced motion: rows appear without the stagger transition
- no console errors in any state
(Verified twice: once before and once after fixing the stop-row highlight and
the per-step token accounting found by this pass.)
