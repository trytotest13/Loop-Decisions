'use strict';

// Static file server + POST /api/evaluate + POST /api/simulate. Node stdlib only.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { evaluateStep, simulate } = require('./lib/score.js');

const PORT = Number(process.env.PORT) || 3914;
const ROOT = __dirname;
const BODY_CAP = 1024 * 1024;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

const json = (res, code, obj) => send(res, code, JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > BODY_CAP) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function clampBudget(b) {
  const n = Number(b);
  if (!Number.isFinite(n)) return 5000;
  return Math.max(200, Math.min(100000, Math.round(n)));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (url.pathname === '/api/health' && req.method === 'GET') {
      return json(res, 200, { ok: true });
    }

    if (url.pathname === '/api/evaluate' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse((await readBody(req)) || '{}');
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      if (!Array.isArray(body.steps) || body.steps.length === 0) {
        return json(res, 400, { error: 'steps must be a non-empty array' });
      }
      const steps = body.steps.slice(0, 100).map((s) => ({
        action: String((s && s.action) || ''),
        output: String((s && s.output) || ''),
        tokensUsed: Number((s && s.tokensUsed) || 0),
      }));
      return json(res, 200, evaluateStep(steps, clampBudget(body.budget)));
    }

    if (url.pathname === '/api/simulate' && req.method === 'POST') {
      let body;
      try {
        body = JSON.parse((await readBody(req)) || '{}');
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      return json(res, 200, simulate(clampBudget(body.budget)));
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return json(res, 405, { error: 'method not allowed' });
    }

    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.normalize(path.join(ROOT, rel));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      return json(res, 403, { error: 'forbidden' });
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      return json(res, 404, { error: 'not found' });
    }
    send(res, 200, fs.readFileSync(file), MIME[path.extname(file)] || 'application/octet-stream');
  } catch (err) {
    json(res, 500, { error: String((err && err.message) || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Jev Loop Decisions on http://localhost:${PORT}`);
});
