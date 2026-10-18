'use strict';

// Jev loop controller. Pure functions, no I/O, deterministic.

const GOAL_RE = /\b(tests? (pass|passing)|all tests pass|fixed|resolved|patch applied|task complete|done and verified)\b/i;
const ERROR_RE = /\b(error|failed|exception|timeout|timed out|refused)\b/i;

/**
 * Distinct word set, lowercased, len 2+.
 * @param {string} text
 * @returns {Set<string>}
 */
function words(text) {
  const set = new Set();
  for (const w of String(text).toLowerCase().match(/[a-z][a-z0-9_-]{1,}/g) || []) {
    set.add(w);
  }
  return set;
}

/**
 * Share of the latest output's words that already appeared earlier.
 * @param {{action:string, output:string, tokensUsed:number}[]} steps
 * @returns {number} 0 (all new) to 1 (pure repetition)
 */
function repetition(steps) {
  if (steps.length < 2) return 0;
  const latest = words(steps[steps.length - 1].output);
  if (latest.size === 0) return 1;
  const earlier = new Set();
  for (const s of steps.slice(0, -1)) for (const w of words(s.output)) earlier.add(w);
  let seen = 0;
  for (const w of latest) if (earlier.has(w)) seen += 1;
  return seen / latest.size;
}

function errorStreak(steps) {
  let streak = 0;
  for (let i = steps.length - 1; i >= 0; i -= 1) {
    if (ERROR_RE.test(steps[i].output)) streak += 1;
    else break;
  }
  return streak;
}

const clamp01 = (n) => Math.max(0, Math.min(1, n));
const r3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Judge whether another step is likely to help.
 * @param {{action:string, output:string, tokensUsed:number}[]} steps full prefix
 * @param {number} budget total token budget
 */
function evaluateStep(steps, budget) {
  const rep = repetition(steps);
  const streak = errorStreak(steps);
  const tokensUsed = steps.reduce((a, s) => a + (Number(s.tokensUsed) || 0), 0);
  const budgetLeft = clamp01(1 - tokensUsed / Math.max(budget, 1));
  const lastOut = steps[steps.length - 1].output;
  const goal = GOAL_RE.test(lastOut);
  const fresh = steps.length <= 1;

  const reasons = [];
  let decision = 'CONTINUE';
  let strength = 0;

  if (goal) {
    reasons.push('goal marker in latest output: work reports as complete');
    decision = 'STOP';
    strength = 0.9;
  }
  if (rep >= 0.6) {
    reasons.push(`repetition ${rep.toFixed(2)}: the last output is mostly known information`);
    if (strength < 0.8) { decision = 'STOP'; strength = 0.8; }
  }
  // The streak rule needs both halves of its claim: failing outputs AND no
  // progress. Bug-hunt outputs legitimately mention "timeout" while the agent
  // is still learning new facts, and that must not read as a stuck loop.
  if (streak >= 3 && rep >= 0.5) {
    reasons.push(`error streak ${streak} with repetition ${rep.toFixed(2)}: three consecutive failing steps without progress`);
    if (strength < 0.75) { decision = 'STOP'; strength = 0.75; }
  }
  if (budgetLeft <= 0.05) {
    reasons.push('budget exhausted: less than 5 percent of tokens remain');
    if (strength < 0.7) { decision = 'STOP'; strength = 0.7; }
  }

  if (decision === 'CONTINUE') {
    if (fresh) reasons.push('first step: almost the whole budget and no repetition yet');
    if (!fresh) reasons.push(`new information in the latest output (repetition only ${rep.toFixed(2)})`);
    if (budgetLeft < 0.25) reasons.push(`budget running low: ${Math.round(budgetLeft * 100)} percent remains`);
    strength = Math.max(0.4, Math.min(rep, 0.5)) * 0.6;
  }

  const confidence = Math.round((0.5 + strength * 0.5) * 100) / 100;
  return {
    decision,
    confidence,
    signals: {
      repetition: r3(rep),
      novelty: r3(1 - rep),
      errorStreak: streak,
      budgetLeft: r3(budgetLeft),
      goalSignal: goal,
    },
    reasons,
  };
}

/** Scripted bug-hunt trajectory: 8 steps available, the fix lands at step 6. */
const SCENARIO = [
  { action: 'Read failing test file', output: 'test/payments.test.js expects status 200 but got 500 on charge_test', tokensUsed: 200 },
  { action: 'Run test suite', output: '1 of 14 tests failing: payments.test.js charge_test, 13 passing', tokensUsed: 400 },
  { action: 'Read payment handler', output: 'handler calls gateway.charge with no try catch and no timeout', tokensUsed: 600 },
  { action: 'Search gateway logs', output: 'gateway returns error 500 on timeout, client retries 3 times then failed', tokensUsed: 900 },
  { action: 'Inspect retry config', output: 'retry timeout is 30s but the test harness timeout is 5s, request always timed out', tokensUsed: 1200 },
  { action: 'Patch retry timeout to 2s', output: 'patch applied, tests pass: 14 of 14 passing, charge_test fixed', tokensUsed: 1500 },
  { action: 'Refactor the whole payments module', output: 'large refactor touching 9 files, review needed', tokensUsed: 1900 },
  { action: 'Add a monitoring dashboard', output: 'dashboard draft for gateway latency and retries', tokensUsed: 2200 },
];

/**
 * Walk the scripted scenario under the controller until it stops.
 * Token values in the script are per-step costs, matching evaluateStep.
 * @param {number} budget
 */
function simulate(budget) {
  const out = [];
  let stoppedEarly = false;
  for (let i = 0; i < SCENARIO.length; i += 1) {
    const prefix = SCENARIO.slice(0, i + 1);
    const verdict = evaluateStep(prefix, budget);
    out.push({ ...SCENARIO[i], decision: verdict.decision, confidence: verdict.confidence, reasons: verdict.reasons });
    if (verdict.decision === 'STOP') {
      stoppedEarly = true;
      break;
    }
  }
  const tokensUsed = out.reduce((a, s) => a + s.tokensUsed, 0);
  const availableTokens = SCENARIO.reduce((a, s) => a + s.tokensUsed, 0);
  const savedTokens = stoppedEarly ? availableTokens - tokensUsed : 0;
  return {
    steps: out,
    summary: {
      stepsTaken: out.length,
      stepsAvailable: SCENARIO.length,
      tokensUsed,
      savedTokens,
      stoppedEarly,
    },
  };
}

module.exports = { evaluateStep, simulate, SCENARIO };
