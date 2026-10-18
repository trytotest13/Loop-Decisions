'use strict';

const assert = require('node:assert');
const { evaluateStep, simulate } = require('./lib/score.js');

const step = (action, output, tokensUsed) => ({ action, output, tokensUsed });

// 1. A fresh single step continues.
const fresh = evaluateStep([step('Read logs', 'request id 8841 shows a 500 from gateway', 200)], 5000);
assert.strictEqual(fresh.decision, 'CONTINUE');
assert.ok(fresh.confidence >= 0.5, 'confidence floor');

// 2. A goal marker stops the loop.
const goal = evaluateStep([
  step('Read failing test', 'charge_test fails with 500', 300),
  step('Patch retry timeout', 'patch applied, tests pass: 14 of 14 passing', 900),
], 5000);
assert.strictEqual(goal.decision, 'STOP');
assert.ok(goal.reasons.some((r) => /goal marker/i.test(r)), 'goal reason present');

// 3. Pure repetition stops the loop.
const rep = evaluateStep([
  step('Read file', 'the config lists three retries and a 30s timeout', 300),
  step('Read file again', 'the config lists three retries and a 30s timeout', 600),
  step('Read file again', 'the config lists three retries and a 30s timeout', 900),
], 5000);
assert.strictEqual(rep.decision, 'STOP');
assert.ok(rep.reasons.some((r) => /repetition/i.test(r)), 'repetition reason present');

// 4. An exhausted budget stops the loop.
const broke = evaluateStep([
  step('A', 'some new output here', 4800),
  step('B', 'a different new output', 4990),
], 5000);
assert.strictEqual(broke.decision, 'STOP');
assert.ok(broke.reasons.some((r) => /budget/i.test(r)), 'budget reason present');

// 5. Three failing repetitive steps stop the loop (streak with no progress).
const stuck = evaluateStep([
  step('Connect', 'error: connection to database refused', 200),
  step('Retry', 'error: connection to database refused again', 500),
  step('Retry', 'error: connection to database refused after retry', 800),
], 5000);
assert.strictEqual(stuck.decision, 'STOP');
assert.ok(stuck.reasons.some((r) => /error streak/i.test(r)), 'streak reason present');

// 6. Failing outputs that still add facts do NOT trip the streak rule.
const learning = evaluateStep([
  step('Read test', 'test charge_test fails with error 500 on gateway', 200),
  step('Read handler', 'handler calls gateway without timeout handling', 500),
  step('Read logs', 'gateway timeout retried 3 times, request always timed out, new trace id 8841', 900),
], 5000);
assert.strictEqual(learning.decision, 'CONTINUE', 'novel facts override the error words');

// 5. The simulation stops early on the scripted goal and saves tokens.
const sim = simulate(5000);
assert.strictEqual(sim.summary.stoppedEarly, true, 'controller stopped the script');
assert.ok(sim.summary.stepsTaken < sim.summary.stepsAvailable, 'stopped before step 8');
assert.ok(sim.summary.savedTokens > 0, 'tokens saved');
assert.strictEqual(sim.steps[sim.steps.length - 1].decision, 'STOP', 'last walked step is the stop');

// 6. A tight budget stops the same script earlier.
const tight = simulate(700);
assert.ok(tight.summary.stepsTaken < sim.summary.stepsTaken, 'tighter budget stops sooner');

// 7. Determinism.
assert.deepStrictEqual(simulate(5000), sim, 'same budget, same walk');
assert.deepStrictEqual(evaluateStep([
  step('Read logs', 'request id 8841 shows a 500 from gateway', 200),
], 5000), fresh, 'same input, same decision');

console.log('04-loop-decisions: 9 test groups passed');
