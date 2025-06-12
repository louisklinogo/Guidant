#!/usr/bin/env bun

/**
 * Guidant CLI Entry Point
 * AI Agent Workflow Orchestrator with native Bun TypeScript/JSX support
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runCLI } from '../src/cli/app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Run the main CLI directly with Bun
  // Bun handles TypeScript/JSX natively, no transpilation needed
  if (typeof runCLI === 'function') {
    runCLI();
  } else {
    console.error('❌ Failed to load CLI function');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Failed to start Guidant with Bun:', error.message);
  console.error('💡 Make sure you have Bun installed: https://bun.sh');
  console.error('💡 Current working directory:', process.cwd());
  console.error('💡 Guidant binary location:', __dirname);

  if (process.env.DEBUG) {
    console.error('🐛 Full error stack:', error.stack);
  }

  process.exit(1);
}
