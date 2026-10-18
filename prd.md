# PRD: Jev Loop Decisions

## Problem
Agent loops either run forever burning tokens on diminishing returns, or stop
too early on hard tasks. A cheap controller that judges the trajectory after
every step ("is another step likely to help?") fixes both, without asking a
frontier model each time.

## Target users
Agent developers building step loops, and reviewers evaluating the
"evaluate after every step" pattern.

## Functional requirements
- FR-1: Given a trajectory of steps (action, output, tokens) and a token
  budget, return CONTINUE or STOP with a confidence and the signals behind it.
- FR-2: Signals: information novelty, output repetition, error streak, budget
  remaining, goal-completion markers.
- FR-3: Ship a deterministic scripted bug-hunt simulation (8 steps available)
  and walk it under the controller, stopping when it says stop.
- FR-4: Adjustable budget: the same script stops earlier with a smaller budget.
- FR-5: Offline, deterministic, zero keys.

## Non-functional requirements
- NFR-1: In-process scoring under 50 ms per step evaluation.
- NFR-2: Zero npm dependencies, Node 18+.
- NFR-3: Sequential step reveal in the UI serves the trajectory content only
  (declared MOTION exception in DESIGN.md).

## Out of scope
Real agent execution, tool calls, memory systems, reinforcement learning. The
simulation is a scripted trajectory; the controller is the product.
