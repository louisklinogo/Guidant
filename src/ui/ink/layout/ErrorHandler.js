/**
 * Enhanced Error Handler
 * Comprehensive error handling and recovery mechanisms for Dynamic Terminal Layout System
 * 
 * Provides graceful error recovery, user-friendly error messages, automatic fallback
 * mechanisms, and error reporting and logging.
 */

import { EventEmitter } from 'events';
import { performanceMonitor } from './PerformanceMonitor.js';

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error categories
 */
export const ERROR_CATEGORIES = {
  RENDER: 'render',
  STATE: 'state',
  KEYBOARD: 'keyboard',
  MCP: 'mcp',
  LAYOUT: 'layout',
  PERFORMANCE: 'performance',
  NETWORK: 'network',
  VALIDATION: 'validation'
};

/**
 * Recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  RESET: 'reset',
  IGNORE: 'ignore',
  ESCALATE: 'escalate'
};

/**
 * Enhanced Error Handler Class
 */
export class ErrorHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      enableFallback: options.enableFallback !== false,
      enableLogging: options.enableLogging !== false,
      enableRecovery: options.enableRecovery !== false,
      logLevel: options.logLevel || 'error'
    };
    
    // Error tracking
    this.errorHistory = [];
    this.retryAttempts = new Map();
    this.fallbackStates = new Map();
    this.recoveryCallbacks = new Map();
    
    // Error patterns for classification
    this.errorPatterns = this.initializeErrorPatterns();
    
    // Setup global error handlers
    this.setupGlobalHandlers();
  }

  /**
   * Initialize error patterns for classification
   */
  initializeErrorPatterns() {
    return {
      [ERROR_CATEGORIES.RENDER]: [
        /render/i,
        /component/i,
        /jsx/i,
        /react/i
      ],
      [ERROR_CATEGORIES.STATE]: [
        /state/i,
        /setstate/i,
        /mounted/i,
        /unmounted/i
      ],
      [ERROR_CATEGORIES.KEYBOARD]: [
        /keyboard/i,
        /key/i,
        /input/i,
        /shortcut/i
      ],
      [ERROR_CATEGORIES.MCP]: [
        /mcp/i,
        /tool/i,
        /guidant_/i,
        /execution/i
      ],
      [ERROR_CATEGORIES.LAYOUT]: [
        /layout/i,
        /pane/i,
        /resize/i,
        /dimension/i
      ],
      [ERROR_CATEGORIES.PERFORMANCE]: [
        /performance/i,
        /memory/i,
        /timeout/i,
        /slow/i
      ],
      [ERROR_CATEGORIES.NETWORK]: [
        /network/i,
        /fetch/i,
        /connection/i,
        /timeout/i
      ],
      [ERROR_CATEGORIES.VALIDATION]: [
        /validation/i,
        /invalid/i,
        /required/i,
        /missing/i
      ]
    };
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        this.handleError(error, {
          type: 'uncaughtException',
          severity: ERROR_SEVERITY.CRITICAL
        });
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        this.handleError(reason, {
          type: 'unhandledRejection',
          severity: ERROR_SEVERITY.HIGH,
          promise
        });
      });
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.handleError(event.error, {
          type: 'windowError',
          severity: ERROR_SEVERITY.MEDIUM,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(event.reason, {
          type: 'unhandledRejection',
          severity: ERROR_SEVERITY.HIGH
        });
      });
    }
  }

  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    try {
      // Normalize error
      const normalizedError = this.normalizeError(error);
      
      // Classify error
      const classification = this.classifyError(normalizedError, context);
      
      // Create error record
      const errorRecord = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        error: normalizedError,
        context,
        classification,
        handled: false,
        recovered: false
      };
      
      // Add to history
      this.errorHistory.push(errorRecord);
      
      // Trim history if too long
      if (this.errorHistory.length > 100) {
        this.errorHistory = this.errorHistory.slice(-100);
      }
      
      // Record in performance monitor
      if (performanceMonitor) {
        performanceMonitor.recordError(normalizedError, context);
      }
      
      // Log error
      if (this.options.enableLogging) {
        this.logError(errorRecord);
      }
      
      // Emit error event
      this.emit('error', errorRecord);
      
      // Attempt recovery
      if (this.options.enableRecovery) {
        const recovered = await this.attemptRecovery(errorRecord);
        errorRecord.recovered = recovered;
        
        if (recovered) {
          this.emit('errorRecovered', errorRecord);
        }
      }
      
      errorRecord.handled = true;
      
      return errorRecord;
      
    } catch (handlerError) {
      // Error in error handler - log and emit critical event
      console.error('Error in error handler:', handlerError);
      this.emit('criticalError', { originalError: error, handlerError });
    }
  }

  /**
   * Normalize error to standard format
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error,
        stack: null
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      return {
        name: error.name || 'Error',
        message: error.message || JSON.stringify(error),
        stack: error.stack || null
      };
    }
    
    return {
      name: 'UnknownError',
      message: String(error),
      stack: null
    };
  }

  /**
   * Classify error by category and severity
   */
  classifyError(error, context = {}) {
    const category = this.determineCategory(error, context);
    const severity = this.determineSeverity(error, context, category);
    const strategy = this.determineRecoveryStrategy(category, severity, context);
    
    return {
      category,
      severity,
      strategy,
      userFriendly: this.generateUserFriendlyMessage(error, category, severity)
    };
  }

  /**
   * Determine error category
   */
  determineCategory(error, context) {
    const message = (error.message || '').toLowerCase();
    const stack = (error.stack || '').toLowerCase();
    const contextType = (context.type || '').toLowerCase();
    
    // Check context first
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      if (patterns.some(pattern => pattern.test(contextType))) {
        return category;
      }
    }
    
    // Check error message and stack
    for (const [category, patterns] of Object.entries(this.errorPatterns)) {
      if (patterns.some(pattern => pattern.test(message) || pattern.test(stack))) {
        return category;
      }
    }
    
    return 'unknown';
  }

  /**
   * Determine error severity
   */
  determineSeverity(error, context, category) {
    // Critical errors
    if (context.type === 'uncaughtException' || 
        context.severity === ERROR_SEVERITY.CRITICAL ||
        error.name === 'ReferenceError') {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    // High severity errors
    if (context.type === 'unhandledRejection' ||
        category === ERROR_CATEGORIES.LAYOUT ||
        category === ERROR_CATEGORIES.PERFORMANCE) {
      return ERROR_SEVERITY.HIGH;
    }
    
    // Medium severity errors
    if (category === ERROR_CATEGORIES.RENDER ||
        category === ERROR_CATEGORIES.MCP ||
        category === ERROR_CATEGORIES.NETWORK) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    // Low severity errors
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Determine recovery strategy
   */
  determineRecoveryStrategy(category, severity, context) {
    if (severity === ERROR_SEVERITY.CRITICAL) {
      return RECOVERY_STRATEGIES.ESCALATE;
    }
    
    if (category === ERROR_CATEGORIES.NETWORK || category === ERROR_CATEGORIES.MCP) {
      return RECOVERY_STRATEGIES.RETRY;
    }
    
    if (category === ERROR_CATEGORIES.RENDER || category === ERROR_CATEGORIES.LAYOUT) {
      return RECOVERY_STRATEGIES.FALLBACK;
    }
    
    if (category === ERROR_CATEGORIES.STATE) {
      return RECOVERY_STRATEGIES.RESET;
    }
    
    return RECOVERY_STRATEGIES.IGNORE;
  }

  /**
   * Generate user-friendly error message
   */
  generateUserFriendlyMessage(error, category, severity) {
    const baseMessages = {
      [ERROR_CATEGORIES.RENDER]: 'Display issue detected. Attempting to refresh the interface.',
      [ERROR_CATEGORIES.STATE]: 'Component state issue. Resetting to stable state.',
      [ERROR_CATEGORIES.KEYBOARD]: 'Keyboard input issue. Please try the action again.',
      [ERROR_CATEGORIES.MCP]: 'Tool execution failed. Retrying operation.',
      [ERROR_CATEGORIES.LAYOUT]: 'Layout issue detected. Switching to fallback layout.',
      [ERROR_CATEGORIES.PERFORMANCE]: 'Performance issue detected. Optimizing system.',
      [ERROR_CATEGORIES.NETWORK]: 'Network connectivity issue. Retrying connection.',
      [ERROR_CATEGORIES.VALIDATION]: 'Input validation failed. Please check your input.'
    };
    
    const severityPrefixes = {
      [ERROR_SEVERITY.LOW]: 'Minor issue: ',
      [ERROR_SEVERITY.MEDIUM]: 'Issue detected: ',
      [ERROR_SEVERITY.HIGH]: 'Important: ',
      [ERROR_SEVERITY.CRITICAL]: 'Critical error: '
    };
    
    const baseMessage = baseMessages[category] || 'An unexpected issue occurred.';
    const prefix = severityPrefixes[severity] || '';
    
    return prefix + baseMessage;
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(errorRecord) {
    const { classification, context } = errorRecord;
    const strategy = classification.strategy;
    
    try {
      switch (strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          return await this.retryOperation(errorRecord);
          
        case RECOVERY_STRATEGIES.FALLBACK:
          return await this.fallbackOperation(errorRecord);
          
        case RECOVERY_STRATEGIES.RESET:
          return await this.resetOperation(errorRecord);
          
        case RECOVERY_STRATEGIES.IGNORE:
          return true; // Consider ignored errors as recovered
          
        case RECOVERY_STRATEGIES.ESCALATE:
          this.escalateError(errorRecord);
          return false;
          
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Retry operation
   */
  async retryOperation(errorRecord) {
    const operationId = this.getOperationId(errorRecord);
    const attempts = this.retryAttempts.get(operationId) || 0;
    
    if (attempts >= this.options.maxRetries) {
      this.retryAttempts.delete(operationId);
      return false;
    }
    
    this.retryAttempts.set(operationId, attempts + 1);
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
    
    // Emit retry event for listeners to handle
    this.emit('retryOperation', {
      errorRecord,
      attempt: attempts + 1,
      maxRetries: this.options.maxRetries
    });
    
    return true;
  }

  /**
   * Fallback operation
   */
  async fallbackOperation(errorRecord) {
    const operationId = this.getOperationId(errorRecord);
    
    // Store current state for potential restoration
    this.fallbackStates.set(operationId, {
      timestamp: Date.now(),
      context: errorRecord.context
    });
    
    // Emit fallback event
    this.emit('fallbackOperation', {
      errorRecord,
      operationId
    });
    
    return true;
  }

  /**
   * Reset operation
   */
  async resetOperation(errorRecord) {
    const operationId = this.getOperationId(errorRecord);
    
    // Emit reset event
    this.emit('resetOperation', {
      errorRecord,
      operationId
    });
    
    return true;
  }

  /**
   * Escalate error
   */
  escalateError(errorRecord) {
    this.emit('escalateError', errorRecord);
    
    // Log critical error
    console.error('CRITICAL ERROR ESCALATED:', errorRecord);
  }

  /**
   * Get operation ID for tracking
   */
  getOperationId(errorRecord) {
    const { context } = errorRecord;
    return context.operationId || 
           context.paneId || 
           context.component || 
           context.type || 
           'unknown';
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error
   */
  logError(errorRecord) {
    const { error, classification, context } = errorRecord;
    
    const logLevel = this.getLogLevel(classification.severity);
    const message = `[${classification.category.toUpperCase()}] ${error.message}`;
    
    if (logLevel === 'error') {
      console.error(message, { error, context, classification });
    } else if (logLevel === 'warn') {
      console.warn(message, { error, context, classification });
    } else {
      console.log(message, { error, context, classification });
    }
  }

  /**
   * Get log level for severity
   */
  getLogLevel(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      default:
        return 'log';
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(e => now - e.timestamp.getTime() < oneHour);
    
    const byCategory = {};
    const bySeverity = {};
    
    recentErrors.forEach(error => {
      const category = error.classification.category;
      const severity = error.classification.severity;
      
      byCategory[category] = (byCategory[category] || 0) + 1;
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    });
    
    return {
      total: this.errorHistory.length,
      recent: recentErrors.length,
      byCategory,
      bySeverity,
      recoveryRate: this.calculateRecoveryRate()
    };
  }

  /**
   * Calculate recovery rate
   */
  calculateRecoveryRate() {
    if (this.errorHistory.length === 0) return 100;
    
    const recovered = this.errorHistory.filter(e => e.recovered).length;
    return (recovered / this.errorHistory.length) * 100;
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.retryAttempts.clear();
    this.fallbackStates.clear();
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

export default ErrorHandler;
