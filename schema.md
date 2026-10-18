# Schema: Jev Loop Decisions

No database. The scripted scenario is code-defined; state is browser memory.

## Step (input)
| Field | Type | Notes |
|---|---|---|
| action | string | what the agent did |
| output | string | what came back |
| tokensUsed | number | token cost of this step (per-step, summed by the controller) |

## Controller decision (per step, server response)
| Field | Type | Notes |
|---|---|---|
| decision | "CONTINUE" \| "STOP" | evaluated after the latest step |
| confidence | number 0.5..1 | strength of the leading signal |
| signals | object | repetition, novelty, errorStreak, budgetLeft, goalSignal |
| reasons | string[] | the rules that fired, in plain language |

## Simulation response
`{ steps: [{ action, output, tokensUsed, decision, confidence, reasons }],
   summary: { stepsTaken, stepsAvailable, tokensUsed, savedTokens, stoppedEarly } }`

## Ledger (browser only)
`{ at, stepsTaken, savedTokens, budget }`, cap 8, lost on reload.
