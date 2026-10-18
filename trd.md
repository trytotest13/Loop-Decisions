# TRD: Jev Loop Decisions

## Stack and why
- Node 18+ stdlib only, plain JavaScript CommonJS with JSDoc, vanilla browser
  JS. Zero install, pure scoring, one screen, same as the other four apps.

## Packages
None.

## API
| Method | Path | Body | Response |
|---|---|---|---|
| POST | /api/evaluate | `{ steps: Step[], budget: number }` | `{ decision, confidence, signals, reasons }` |
| POST | /api/simulate | `{ budget: number }` | `{ steps: EvaluatedStep[], summary }` |
| GET | /api/health | - | `{ ok: true }` |

Step: `{ action: string, output: string, tokensUsed: number }`.

## Auth
None. Localhost demo.

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| PORT | no | server port, default 3914 |
| CONTROLLER_MODEL_ENDPOINT | no | reserved for a learned controller, unused |

Placeholders only in `.env.example`.
