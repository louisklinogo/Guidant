/**
 * Dashboard Error Handler
 * Centralized error handling with proper classification
 */

import chalk from 'chalk';

/**
 * Dashboard Error Types
 */
export class DashboardError extends Error {
  constructor(message, type, cause) {
    super(message);
    this.type = type;
    this.cause = cause;
    this.name = 'DashboardError';
  }
}

/**
 * Error Types
 */
export const ERROR_TYPES = {
  RENDERER_LOAD_FAILED: 'RENDERER_LOAD_FAILED',
  RENDERER_EXECUTION_FAILED: 'RENDERER_EXECUTION_FAILED',
  STATE_INVALID: 'STATE_INVALID',
  STATE_FETCH_FAILED: 'STATE_FETCH_FAILED',
  WORKFLOW_FETCH_FAILED: 'WORKFLOW_FETCH_FAILED',
  INVALID_MODE: 'INVALID_MODE',
  PROJECT_NOT_INITIALIZED: 'PROJECT_NOT_INITIALIZED'
};

/**
 * Error Handler - Centralized error handling with proper classification
 */
export function handleDashboardError(error, context) {
  console.log(chalk.red(`❌ Dashboard error in ${context}:`));
  
  if (error instanceof DashboardError) {
    switch (error.type) {
      case ERROR_TYPES.RENDERER_LOAD_FAILED:
        console.log(chalk.yellow('⚠️ Ink renderer failed to load, using legacy fallback...'));
        console.log(chalk.gray(`Cause: ${error.cause?.message}`));
        return { shouldFallback: true };
        
      case ERROR_TYPES.RENDERER_EXECUTION_FAILED:
        console.log(chalk.yellow('⚠️ Renderer execution failed, using legacy fallback...'));
        console.log(chalk.gray(`Cause: ${error.cause?.message}`));
        return { shouldFallback: true };
        
      case ERROR_TYPES.STATE_INVALID:
      case ERROR_TYPES.STATE_FETCH_FAILED:
        console.log(chalk.red('Invalid project state. Run `guidant init` to set up a project.'));
        return { shouldExit: true };
        
      case ERROR_TYPES.PROJECT_NOT_INITIALIZED:
        console.log(chalk.red('Project not initialized. Run `guidant init` first.'));
        return { shouldExit: true };
        
      case ERROR_TYPES.WORKFLOW_FETCH_FAILED:
        console.log(chalk.yellow('Workflow state unavailable, showing basic dashboard...'));
        return { shouldContinue: true, useDefaults: true };
        
      case ERROR_TYPES.INVALID_MODE:
        console.log(chalk.red(`Invalid render mode: ${error.message}`));
        return { shouldFallback: true };
        
      default:
        console.log(chalk.red(`Unknown dashboard error: ${error.message}`));
        return { shouldFallback: true };
    }
  }
  
  // Unknown error - don't mask it, but provide fallback
  console.log(chalk.red(`Unexpected error: ${error.message}`));
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  return { shouldFallback: true };
}

/**
 * Create typed dashboard errors
 */
export function createDashboardError(type, message, cause) {
  return new DashboardError(message, type, cause);
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling(operation, context, errorType) {
  try {
    return await operation();
  } catch (error) {
    throw createDashboardError(errorType, `${context} failed`, error);
  }
}
