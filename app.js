'use strict';

const $ = (id) => document.getElementById(id);
const budgetEl = $('budget');
const runBtn = $('runBtn');
const resetBtn = $('resetBtn');
const errorEl = $('error');
const summaryEl = $('summary');
const stepsEl = $('steps');
const ledgerEl = $('ledger');

const ledger = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
}

function setEmpty() {
  summaryEl.className = 'summary empty';
  summaryEl.innerHTML = '<span class="word">No trajectory yet. Run the simulation.</span>';
  stepsEl.innerHTML = '<li class="muted">Each step appears here with the controller verdict.</li>';
}

function renderSummary(s) {
  summaryEl.className = 'summary';
  summaryEl.innerHTML =
    `<strong>${s.stepsTaken}</strong> of ${s.stepsAvailable} steps used, ` +
    `<strong>${s.tokensUsed}</strong> tokens spent` +
    (s.stoppedEarly
      ? `<span class="save">controller stopped early: <strong>${s.savedTokens}</strong> tokens of scripted work avoided</span>`
      : '<span class="save">script ran to completion, nothing saved</span>');
}

function stepRow(s, i, pending) {
  const cls = `${pending ? "pending " : ""}${s.decision === "STOP" ? "stop" : ""}`.trim();
  return (
    `<li class="${cls}" data-i="${i}">` +
    `<span class="n">${i + 1}</span>` +
    `<span class="body"><span class="action">${s.action}</span>` +
    `<span class="out">${s.output}</span>` +
    `<span class="why">${s.reasons.join(' ')}</span></span>` +
    `<span class="verdict">${s.decision}</span></li>`
  );
}

function renderSteps(data) {
  if (reducedMotion) {
    stepsEl.innerHTML = data.steps.map((s, i) => stepRow(s, i, false)).join('');
    return;
  }
  stepsEl.innerHTML = data.steps.map((s, i) => stepRow(s, i, true)).join('');
  data.steps.forEach((_, i) => {
    setTimeout(() => {
      const li = stepsEl.querySelector(`li[data-i="${i}"]`);
      if (li) li.classList.remove('pending');
    }, i * 120);
  });
}

function renderLedger() {
  if (ledger.length === 0) {
    ledgerEl.innerHTML = '<li class="muted">No simulations run yet this session.</li>';
    return;
  }
  ledgerEl.innerHTML = ledger
    .map((e) =>
      `<li><span class="at">${e.at}</span>` +
      `<span class="ex">budget <strong>${e.budget}</strong></span>` +
      `<span class="sc"><strong>${e.stepsTaken}</strong> steps, saved <strong>${e.savedTokens}</strong> tokens</span></li>`)
    .join('');
}

async function run() {
  clearError();
  const budget = Number(budgetEl.value);
  if (!Number.isFinite(budget) || budget < 200) {
    showError('Budget must be a number of at least 200.');
    return;
  }
  runBtn.disabled = true;
  runBtn.textContent = 'Simulating...';
  try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget: Math.round(budget) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `server returned ${res.status}`);
    renderSteps(data);
    renderSummary(data.summary);
    const now = new Date();
    ledger.unshift({
      at: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      budget: Math.round(budget),
      stepsTaken: data.summary.stepsTaken,
      savedTokens: data.summary.savedTokens,
    });
    if (ledger.length > 8) ledger.pop();
    renderLedger();
  } catch (err) {
    setEmpty();
    showError(`Simulation failed: ${err.message}. Is server.js still running?`);
  } finally {
    runBtn.disabled = false;
    runBtn.textContent = 'Run the bug-hunt simulation';
  }
}

function reset() {
  clearError();
  setEmpty();
}

runBtn.addEventListener('click', run);
resetBtn.addEventListener('click', reset);
budgetEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') run();
});
setEmpty();
