/**
 * CLI Utilities
 * Common utilities for CLI commands
 */

import chalk from 'chalk';
import { isProjectInitialized } from '../file-management/project-structure.js';

/**
 * Check if project is initialized and show error if not
 */
export async function requireProject() {
  if (!(await isProjectInitialized())) {
    console.log(chalk.yellow('⚠️  No Guidant project found. Run "guidant init" first.'));
    process.exit(1);
  }
}

/**
 * Handle command errors consistently
 */
export function handleError(error, commandName) {
  console.error(chalk.red(`❌ ${commandName} failed:`), error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}

/**
 * Show success message
 */
export function showSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

/**
 * Show warning message
 */
export function showWarning(message) {
  console.log(chalk.yellow('⚠️  ' + message));
}

/**
 * Show info message
 */
export function showInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}
