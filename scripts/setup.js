#!/usr/bin/env node
/**
 * One-command setup script for astrology-chart-gene.
 *
 * Run via:  npm run setup
 *
 * What it does:
 *  1. Verifies Node.js and npm version requirements.
 *  2. Installs all npm dependencies.
 *  3. Creates a local .env file from .env.example (if one doesn't exist yet).
 *  4. Pre-bundles dependencies with Vite for faster first-launch.
 *
 * Data layer note:
 *  This app uses GitHub Spark's built-in cloud KV store (see spark.meta.json).
 *  No separate database server needs to be installed or started.
 *  When running locally via `npm run dev`, the @github/spark package provides
 *  an in-memory KV mock so all features work without extra configuration.
 *  Persisted data is only available when the app is deployed to GitHub Spark.
 */

import { execSync } from 'child_process'
import { existsSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const BOLD  = '\x1b[1m'
const GREEN = '\x1b[32m'
const CYAN  = '\x1b[36m'
const YELLOW = '\x1b[33m'
const RED   = '\x1b[31m'
const RESET = '\x1b[0m'

function log(msg)    { console.log(`  ${msg}`) }
function ok(msg)     { console.log(`  ${GREEN}✔${RESET}  ${msg}`) }
function info(msg)   { console.log(`  ${CYAN}ℹ${RESET}  ${msg}`) }
function warn(msg)   { console.log(`  ${YELLOW}⚠${RESET}  ${msg}`) }
function fail(msg)   { console.error(`  ${RED}✖${RESET}  ${msg}`) }
function header(msg) { console.log(`\n${BOLD}${msg}${RESET}`) }

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
}

// ---------------------------------------------------------------------------
// 1. Check Node.js version
// ---------------------------------------------------------------------------
header('🔍 Checking environment…')

const nodeMajor = parseInt(process.versions.node.split('.')[0], 10)
const MIN_NODE  = 18

if (nodeMajor < MIN_NODE) {
  fail(`Node.js ${MIN_NODE}+ is required (found ${process.versions.node}).`)
  fail('Please upgrade Node.js: https://nodejs.org/en/download')
  process.exit(1)
}
ok(`Node.js ${process.versions.node}`)

// npm version check (informational only)
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim()
  ok(`npm ${npmVersion}`)
} catch {
  warn('Could not determine npm version.')
}

// ---------------------------------------------------------------------------
// 2. Install dependencies
// ---------------------------------------------------------------------------
header('📦 Installing dependencies…')
run('npm install')
ok('Dependencies installed.')

// ---------------------------------------------------------------------------
// 3. Set up .env file
// ---------------------------------------------------------------------------
header('⚙️  Setting up environment…')

const envFile    = join(ROOT, '.env')
const envExample = join(ROOT, '.env.example')

if (!existsSync(envFile)) {
  if (existsSync(envExample)) {
    copyFileSync(envExample, envFile)
    ok('.env created from .env.example')
    info('Open .env and fill in any values marked with <YOUR_VALUE>.')
  } else {
    info('No .env.example found — skipping .env creation.')
  }
} else {
  ok('.env already exists — skipping.')
}

// ---------------------------------------------------------------------------
// 4. Data layer information
// ---------------------------------------------------------------------------
header('🗄️  Data layer…')
info('This app uses GitHub Spark\'s cloud KV store for persistence.')
info('No local database server is required.')
info('When running locally, an in-memory KV mock is used automatically.')
info('Data is persisted only when the app is deployed to GitHub Spark.')

// ---------------------------------------------------------------------------
// 5. Pre-bundle dependencies (optional, speeds up first dev launch)
// ---------------------------------------------------------------------------
header('⚡ Pre-bundling dependencies…')
try {
  run('npm run optimize', { stdio: 'pipe' })
  ok('Dependencies pre-bundled.')
} catch (err) {
  warn(`Pre-bundling skipped: ${err.message ?? err}`)
  warn('This is non-critical — the dev server will still work.')
}

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------
console.log(`
${BOLD}${GREEN}✅ Setup complete!${RESET}

  Start the development server:

    ${BOLD}npm run dev${RESET}

  Then open http://localhost:5173 in your browser.
`)
