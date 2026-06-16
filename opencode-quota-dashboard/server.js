#!/usr/bin/env node
/**
 * OpenCode Quota Dashboard - Local Server
 *
 * Serves a pixel-art style web dashboard that reads quota data from
 * `npx @slkiser/opencode-quota show`.
 *
 * Usage:
 *   node server.js [--port 3334] [--mock]
 *
 * Endpoints:
 *   GET /api/quota       -> JSON quota data (real or mock)
 *   GET /api/health      -> health check
 *   GET /                -> static dashboard
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { URL } = require('url');

const ROOT = __dirname;
const STATIC_DIR = path.join(ROOT, 'static');
const DEFAULT_PORT = 3334;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const MOCK_DATA = {
  updatedAt: new Date().toISOString(),
  source: 'mock',
  entries: [
    {
      provider: 'OpenCode Go',
      window: 'rolling (5h)',
      percentUsed: 34,
      percentRemaining: 66,
      used: '1.7h',
      limit: '5.0h',
      resetIn: '3h 12m',
      status: 'ok',
    },
    {
      provider: 'OpenCode Go',
      window: 'weekly',
      percentUsed: 62,
      percentRemaining: 38,
      used: '$18.60',
      limit: '$30.00',
      resetIn: '2d 9h',
      status: 'warning',
    },
    {
      provider: 'OpenCode Go',
      window: 'monthly',
      percentUsed: 12,
      percentRemaining: 88,
      used: '$7.20',
      limit: '$60.00',
      resetIn: '22d',
      status: 'ok',
    },
    {
      provider: 'GitHub Copilot',
      window: 'monthly',
      percentUsed: 76,
      percentRemaining: 24,
      used: '229',
      limit: '300',
      resetIn: '19d',
      status: 'warning',
    },
  ],
  errors: [],
};

function parseArgs(argv) {
  const args = { port: DEFAULT_PORT, mock: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--port' || arg === '-p') {
      args.port = parseInt(argv[++i], 10) || DEFAULT_PORT;
    } else if (arg === '--mock' || arg === '-m') {
      args.mock = true;
    }
  }
  return args;
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=3600',
    });
    res.end(data);
  });
}

function runQuotaCli(providerFilter) {
  return new Promise((resolve) => {
    const args = ['@slkiser/opencode-quota', 'show'];
    if (providerFilter) {
      args.push('--provider', providerFilter);
    }

    const child = spawn('npx', args, {
      cwd: ROOT,
      shell: true,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf-8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf-8');
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on('error', (err) => {
      resolve({ stdout, stderr: err.message, code: -1 });
    });

    // Hard timeout to avoid hanging forever
    setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch {}
    }, 20000);
  });
}

function parseQuotaText(text) {
  const entries = [];
  const errors = [];
  const rawLines = text.split('\n').map((l) => l.replace(/\r/g, '').trimEnd());

  // opencode-quota CLI output shape (as of v3.9.0):
  //   [OpenCode Go]
  //   5h window                                       3h
  //   ████████████████████░░░░░░░░░░░░░░░░░░░   51% left
  //   Weekly window                                   6d
  //   ████████████████████░░░░░░░░░░░░░░░░░░░   71% left
  //   Monthly window                                 28d
  //   ████████████████████░░░░░░░░░░░░░░░░░░░   80% left
  //
  // The provider is announced on its own line; each window is a header + progress pair.
  let currentProvider = 'Unknown';

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;

    // Provider announcement line: [OpenCode Go]
    const providerMatch = line.match(/^\[(.+?)\]$/);
    if (providerMatch) {
      currentProvider = providerMatch[1].trim();
      continue;
    }

    // Error lines
    if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail')) {
      errors.push(line);
      continue;
    }

    // Window header line: "5h window                              3h"
    // or "5h window" with no trailing value (value on progress line)
    let headerMatch = line.match(/^(.+?)\s+(?:window|plan|tier)\s+(?:\s{2,}|\t)+(\S.*)$/i);
    if (!headerMatch) headerMatch = line.match(/^(.+?)\s+(?:window|plan|tier)$/i);
    if (!headerMatch) continue;

    const window = headerMatch[1].trim();
    let value = headerMatch[2] ? headerMatch[2].trim() : '';

    // Look ahead for the percentage / progress line.
    const pctLine = rawLines[i + 1] || '';
    const pctMatch = pctLine.match(/(\d{1,3})\s*%(?:\s*(left|remaining|used|free))?/i);
    if (!pctMatch) continue;

    const pct = parseInt(pctMatch[1], 10);
    const qualifier = (pctMatch[2] || '').toLowerCase();
    let percentUsed = 0;
    let percentRemaining = 0;
    if (qualifier === 'left' || qualifier === 'remaining' || qualifier === 'free') {
      percentRemaining = pct;
      percentUsed = Math.max(0, 100 - pct);
    } else {
      percentUsed = pct;
      percentRemaining = Math.max(0, 100 - pct);
    }
    i++; // consume the percentage line

    let status = 'ok';
    if (percentUsed >= 90) status = 'danger';
    else if (percentUsed >= 60) status = 'warning';

    entries.push({
      provider: currentProvider,
      window: window.replace(/^(\d+h)$/, 'rolling ($1)'),
      percentUsed,
      percentRemaining,
      used: value,
      limit: '',
      resetIn: '',
      status,
      raw: `${line}\n${pctLine}`,
    });
  }

  return { entries, errors };
}

async function fetchQuota({ mock }) {
  if (mock) {
    return { ...MOCK_DATA, updatedAt: new Date().toISOString() };
  }

  const { stdout, stderr, code } = await runQuotaCli();

  if (code !== 0 || !stdout.trim() || stdout.includes('No quota data available')) {
    return {
      updatedAt: new Date().toISOString(),
      source: 'cli-fallback-mock',
      cliOutput: stdout || stderr,
      entries: MOCK_DATA.entries,
      errors: stderr ? [stderr.trim()] : [],
      note: 'Real quota not configured. Showing mock data. Set OPENCODE_GO_WORKSPACE_ID and OPENCODE_GO_AUTH_COOKIE, or configure another provider.',
    };
  }

  const parsed = parseQuotaText(stdout);
  return {
    updatedAt: new Date().toISOString(),
    source: 'cli',
    cliOutput: stdout,
    entries: parsed.entries,
    errors: parsed.errors,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/health') {
      sendJson(res, 200, { ok: true, port: args.port });
      return;
    }

    if (pathname === '/api/quota') {
      const forceMock = parsedUrl.searchParams.has('mock') || args.mock;
      try {
        const data = await fetchQuota({ mock: forceMock });
        sendJson(res, 200, data);
      } catch (err) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // Static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(STATIC_DIR, filePath);

    // Prevent directory traversal
    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    sendFile(res, filePath);
  });

  server.listen(args.port, () => {
    console.log(`OpenCode Quota Dashboard running at http://localhost:${args.port}`);
    console.log(`Press Ctrl+C to stop.`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
