# Design: Jev Loop Decisions

Inherits [../DESIGN.md](../DESIGN.md): dark instrument panel, two-panel layout,
ENERGY 1 / RHYTHM 2 / MOTION 1 with one declared exception.

## Tokens for this app
| Token | Value | Use |
|---|---|---|
| accent | #FB7185 coral | STOP verdicts, focus outline, summary numbers |
| continue | muted ink | CONTINUE verdicts (quiet, they are the baseline) |

## Component styles
- Step log: numbered rows, action in ink, output excerpt in muted, controller
  verdict in mono on the right. STOP rows get the accent color and a 2px left
  border marking real state (a stop is an event, not decoration).
- Summary strip: steps used of available, tokens used, tokens saved by the
  early stop. Mono numbers.
- Staggered reveal: rows fade in 120 ms apart, once, on run. This motion is
  the trajectory content arriving in order; nothing loops.
- Ledger rows: timestamp, steps used, saved tokens.

## Reasons
- Coral marks the stop moment, which is the product's whole job.
- CONTINUE rows stay muted so the eye lands on the stop, the focal moment.
