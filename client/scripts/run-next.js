#!/usr/bin/env node
/**
 * Production wrapper for Next.js CLI.
 * Used by systemd: node scripts/run-next.js start -H 0.0.0.0 -p 4070
 *
 * Resolves the local `next` binary so we don't depend on npx/global installs.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const nextBuildDir = path.join(root, '.next');

function fail(message, code = 1) {
  console.error(`[run-next] ${message}`);
  process.exit(code);
}

if (!fs.existsSync(nextBin)) {
  fail(
    `Next.js binary not found at ${nextBin}. Run: npm ci && npm run build`
  );
}

if (!fs.existsSync(nextBuildDir)) {
  fail(
    `Missing production build (.next). Run: npm run build`
  );
}

const args = process.argv.slice(2);
if (args.length === 0) {
  fail('Usage: node scripts/run-next.js <next-args...>  e.g. start -H 0.0.0.0 -p 4070');
}

console.log(`[run-next] cwd=${root}`);
console.log(`[run-next] next ${args.join(' ')}`);
console.log(`[run-next] NODE_ENV=${process.env.NODE_ENV || '(unset)'}`);

const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
  stdio: 'inherit',
});

child.on('error', (err) => {
  fail(`Failed to start Next.js: ${err.message}`);
});

const forward = (signal) => {
  if (child.pid) {
    try {
      process.kill(child.pid, signal);
    } catch (_) {
      /* ignore */
    }
  }
};

process.on('SIGTERM', () => forward('SIGTERM'));
process.on('SIGINT', () => forward('SIGINT'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
