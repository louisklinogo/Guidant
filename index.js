#!/usr/bin/env bun

/**
 * Guidant
 * AI Agent Workflow Orchestrator for systematic software development
 *
 * Clean entry point that delegates to the modular CLI structure
 * Optimized for Bun runtime with native TypeScript/JSX support
 */

import { runCLI } from './src/cli/app.js';
import { validateStartup } from './src/config/startup-validator.js';
import { isProjectInitialized } from './src/file-management/project-structure.js';
import { readFileSync } from 'fs';
import chalk from 'chalk';

// Export version information for programmatic access
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
export const version = packageJson.version;

// Export runCLI for bin/guidant.js
export { runCLI };

// Run CLI if this file is executed directly
// Bun-compatible main detection
if (import.meta.main || (process.argv[1] && process.argv[1].endsWith('index.js'))) {
  const isInitCommand = process.argv.includes('init');
  const isHelpCommand = process.argv.includes('help') || process.argv.includes('--help');

  // Check for initialization before doing anything else
  if (!await isProjectInitialized() && !isInitCommand && !isHelpCommand) {
    console.log(chalk.bold.cyan('👋 Welcome to Guidant!'));
    console.log(chalk.gray('It looks like this is a new project.'));
    console.log('\nTo get started, run the initialization command:');
    console.log(chalk.yellow.bold('\n  guidant init\n'));
    process.exit(0);
  }

  // Run startup validation before CLI, skipping for init and help
  const skipValidation = process.argv.includes('--skip-validation') || isInitCommand || isHelpCommand;

  if (!skipValidation) {
    try {
      await validateStartup({
        exitOnError: true,
        skipAIValidation: process.argv.includes('--skip-ai'),
        skipMCPValidation: true // FIXED: Always skip MCP validation to prevent hanging
      });
    } catch (error) {
      console.error('Startup validation failed. Use --skip-validation to bypass.');
      process.exit(1);
    }
  }

  runCLI();
}
