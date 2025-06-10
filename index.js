#!/usr/bin/env node

/**
 * Guidant
 * AI Agent Workflow Orchestrator for systematic software development
 *
 * Clean entry point that delegates to the modular CLI structure
 */

import { runCLI } from './src/cli/app.js';
import { readFileSync } from 'fs';

// Export version information for programmatic access
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
export const version = packageJson.version;

// Run CLI if this file is executed directly
if (import.meta.main || (process.argv[1] && process.argv[1].endsWith('index.js'))) {
  runCLI();
}
