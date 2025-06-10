/**
 * CLI Middleware System
 * Validation, context injection, and error handling for commands
 */

import chalk from 'chalk';
import { isProjectInitialized, getProjectState } from '../../file-management/project-structure.js';

/**
 * Command middleware for project validation and context injection
 */
export class CommandMiddleware {
  /**
   * Require project to be initialized
   */
  static async requireProject() {
    if (!(await isProjectInitialized())) {
      console.log(chalk.yellow('⚠️  No Guidant project found. Run "guidant init" first.'));
      process.exit(1);
    }
  }

  /**
   * Inject project context into command
   */
  static async injectContext() {
    try {
      const projectState = await getProjectState();
      // Store in process env for access by commands
      process.env.GUIDANT_PROJECT_STATE = JSON.stringify(projectState);
      return projectState;
    } catch (error) {
      // Continue without context if loading fails
      return null;
    }
  }

  /**
   * Enhanced error handler with helpful suggestions
   */
  static errorHandler(error, commandName) {
    console.error(chalk.red(`❌ ${commandName} failed:`));
    console.error(chalk.red(error.message));
    
    // Provide helpful suggestions based on error type
    if (error.code === 'ENOENT') {
      console.log(chalk.yellow('\n💡 Suggestion: Check if the file path exists'));
      console.log(chalk.gray('   • Verify the project is initialized with "guidant init"'));
      console.log(chalk.gray('   • Check file permissions'));
    } else if (error.code === 'EACCES') {
      console.log(chalk.yellow('\n💡 Suggestion: Check file permissions'));
      console.log(chalk.gray('   • Run with appropriate permissions'));
      console.log(chalk.gray('   • Check if files are locked by another process'));
    } else if (error.message.includes('not initialized')) {
      console.log(chalk.yellow('\n💡 Suggestion: Initialize the project first'));
      console.log(chalk.gray('   • Run "guidant init" to set up the project'));
      console.log(chalk.gray('   • Make sure you\'re in the correct directory'));
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.log(chalk.yellow('\n💡 Suggestion: Check network connectivity'));
      console.log(chalk.gray('   • Verify internet connection'));
      console.log(chalk.gray('   • Check if API endpoints are accessible'));
    }
    
    if (process.env.DEBUG) {
      console.error(chalk.gray('\nStack trace:'));
      console.error(chalk.gray(error.stack));
    } else {
      console.log(chalk.gray('\nRun with DEBUG=1 for detailed error information'));
    }
    
    process.exit(1);
  }

  /**
   * Validate command arguments with Zod schema
   */
  static validateArgs(schema) {
    return (args) => {
      try {
        return schema.parse(args);
      } catch (error) {
        console.error(chalk.red('❌ Invalid arguments:'));
        error.errors.forEach(err => {
          console.error(chalk.red(`  • ${err.path.join('.')}: ${err.message}`));
        });
        process.exit(1);
      }
    };
  }

  /**
   * Timing middleware to track command performance
   */
  static timing(commandName) {
    const startTime = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        if (process.env.DEBUG) {
          console.log(chalk.gray(`\n⏱️  ${commandName} completed in ${duration}ms`));
        }
      }
    };
  }

  /**
   * Create a middleware wrapper for commands
   */
  static wrap(commandFn, options = {}) {
    const {
      requireProject = false,
      injectContext = false,
      timing = false,
      validation = null
    } = options;

    return async (...args) => {
      const timer = timing ? CommandMiddleware.timing(commandFn.name) : null;
      
      try {
        // Validation
        if (validation && args.length > 0) {
          args[0] = CommandMiddleware.validateArgs(validation)(args[0]);
        }

        // Project requirement check
        if (requireProject) {
          await CommandMiddleware.requireProject();
        }

        // Context injection
        if (injectContext) {
          const context = await CommandMiddleware.injectContext();
          // Add context as last argument
          args.push(context);
        }

        // Execute command
        const result = await commandFn(...args);
        
        if (timer) timer.end();
        return result;
        
      } catch (error) {
        CommandMiddleware.errorHandler(error, commandFn.name || 'Command');
      }
    };
  }
}

/**
 * Convenience decorators for common middleware patterns
 */
export const withProject = (commandFn) => 
  CommandMiddleware.wrap(commandFn, { requireProject: true });

export const withContext = (commandFn) => 
  CommandMiddleware.wrap(commandFn, { requireProject: true, injectContext: true });

export const withTiming = (commandFn) => 
  CommandMiddleware.wrap(commandFn, { timing: true });

export const withValidation = (schema) => (commandFn) => 
  CommandMiddleware.wrap(commandFn, { validation: schema });

/**
 * Combine multiple middleware decorators
 */
export const withMiddleware = (options) => (commandFn) => 
  CommandMiddleware.wrap(commandFn, options);
