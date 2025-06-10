/**
 * Resilience Configuration for MCP Tools
 * Centralized configuration for circuit breakers and resilience patterns
 * 
 * MCP-007: Circuit Breaker Pattern Implementation
 */

/**
 * Default circuit breaker configurations for different tool categories
 */
export const DEFAULT_CIRCUIT_BREAKER_CONFIGS = {
  // Essential tools - more lenient (critical for basic operation)
  essential: {
    failureThreshold: 8,
    recoveryTimeout: 30000, // 30 seconds
    monitoringPeriod: 15000, // 15 seconds
    halfOpenMaxCalls: 5,
    successThreshold: 3
  },
  
  // Analysis tools - moderate resilience
  analysis: {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 10000, // 10 seconds
    halfOpenMaxCalls: 3,
    successThreshold: 2
  },
  
  // Intelligence tools - strict (can be expensive)
  intelligence: {
    failureThreshold: 3,
    recoveryTimeout: 120000, // 2 minutes
    monitoringPeriod: 5000, // 5 seconds
    halfOpenMaxCalls: 2,
    successThreshold: 2
  },
  
  // Admin tools - moderate (important but not critical)
  admin: {
    failureThreshold: 5,
    recoveryTimeout: 90000, // 1.5 minutes
    monitoringPeriod: 10000, // 10 seconds
    halfOpenMaxCalls: 3,
    successThreshold: 2
  },
  
  // External dependencies - very strict
  external: {
    failureThreshold: 2,
    recoveryTimeout: 300000, // 5 minutes
    monitoringPeriod: 5000, // 5 seconds
    halfOpenMaxCalls: 1,
    successThreshold: 1
  }
};

/**
 * Tool-specific circuit breaker configurations
 * Override category defaults for specific tools that need custom settings
 */
export const TOOL_SPECIFIC_CONFIGS = {
  // Quality validation tools - critical for deliverable assessment
  'guidant_validate_content': {
    failureThreshold: 6,
    recoveryTimeout: 45000,
    monitoringPeriod: 8000,
    halfOpenMaxCalls: 4,
    successThreshold: 2
  },
  
  // Project classification - expensive AI operations
  'guidant_classify_project': {
    failureThreshold: 2,
    recoveryTimeout: 180000, // 3 minutes
    monitoringPeriod: 5000,
    halfOpenMaxCalls: 1,
    successThreshold: 1
  },
  
  // Agent discovery - external API calls
  'guidant_discover_agent': {
    failureThreshold: 3,
    recoveryTimeout: 240000, // 4 minutes
    monitoringPeriod: 5000,
    halfOpenMaxCalls: 2,
    successThreshold: 1
  },
  
  // File operations - should be very reliable
  'guidant_save_deliverable': {
    failureThreshold: 10,
    recoveryTimeout: 15000,
    monitoringPeriod: 20000,
    halfOpenMaxCalls: 8,
    successThreshold: 3
  }
};

/**
 * Global resilience settings
 */
export const RESILIENCE_SETTINGS = {
  // Enable/disable circuit breakers globally
  enabled: true,
  
  // Global timeout for all operations (milliseconds)
  globalTimeout: 300000, // 5 minutes
  
  // Metrics collection settings
  metricsRetentionPeriod: 3600000, // 1 hour
  metricsCollectionInterval: 30000, // 30 seconds
  
  // Logging settings
  logLevel: 'info', // 'debug', 'info', 'warn', 'error'
  logStateTransitions: true,
  logFailures: true,
  logMetrics: false,
  
  // Health check settings
  healthCheckInterval: 60000, // 1 minute
  healthThreshold: 70, // Health score threshold for alerts
  
  // Recovery settings
  autoRecoveryEnabled: true,
  gracefulDegradationEnabled: true,
  
  // Rate limiting (future enhancement)
  rateLimitEnabled: false,
  maxRequestsPerMinute: 100
};

/**
 * Error classification for circuit breaker decisions
 * Determines which errors should trigger circuit breaker vs. which should be ignored
 */
export const ERROR_CLASSIFICATION = {
  // Errors that should trigger circuit breaker
  circuitBreakerErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'NetworkError',
    'TimeoutError',
    'ServiceUnavailableError',
    'InternalServerError'
  ],
  
  // Errors that should NOT trigger circuit breaker (client errors)
  ignoredErrors: [
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'BadRequestError',
    'NotFoundError',
    'ConflictError',
    'UnprocessableEntityError'
  ],
  
  // HTTP status codes that should trigger circuit breaker
  circuitBreakerStatusCodes: [500, 502, 503, 504, 507, 508, 509, 510, 511],
  
  // HTTP status codes that should NOT trigger circuit breaker
  ignoredStatusCodes: [400, 401, 403, 404, 409, 422, 429]
};

/**
 * Resilience Configuration Manager
 * Manages circuit breaker configurations and provides configuration resolution
 */
export class ResilienceConfigManager {
  constructor() {
    this.configs = new Map();
    this.settings = { ...RESILIENCE_SETTINGS };
    this.loadDefaultConfigs();
  }

  /**
   * Load default configurations for all tool categories
   */
  loadDefaultConfigs() {
    // Load category defaults
    Object.entries(DEFAULT_CIRCUIT_BREAKER_CONFIGS).forEach(([category, config]) => {
      this.configs.set(`category:${category}`, config);
    });
    
    // Load tool-specific overrides
    Object.entries(TOOL_SPECIFIC_CONFIGS).forEach(([toolName, config]) => {
      this.configs.set(`tool:${toolName}`, config);
    });
  }

  /**
   * Get circuit breaker configuration for a specific tool
   * @param {string} toolName - Name of the tool
   * @param {string} category - Tool category (essential, analysis, intelligence, admin)
   * @returns {object} Circuit breaker configuration
   */
  getConfigForTool(toolName, category = 'analysis') {
    // Check for tool-specific configuration first
    const toolConfig = this.configs.get(`tool:${toolName}`);
    if (toolConfig) {
      return { ...toolConfig, name: toolName };
    }
    
    // Fall back to category configuration
    const categoryConfig = this.configs.get(`category:${category}`);
    if (categoryConfig) {
      return { ...categoryConfig, name: toolName };
    }
    
    // Ultimate fallback to analysis category
    return { 
      ...DEFAULT_CIRCUIT_BREAKER_CONFIGS.analysis, 
      name: toolName 
    };
  }

  /**
   * Set custom configuration for a tool
   * @param {string} toolName - Name of the tool
   * @param {object} config - Circuit breaker configuration
   */
  setToolConfig(toolName, config) {
    this.configs.set(`tool:${toolName}`, config);
  }

  /**
   * Set custom configuration for a category
   * @param {string} category - Category name
   * @param {object} config - Circuit breaker configuration
   */
  setCategoryConfig(category, config) {
    this.configs.set(`category:${category}`, config);
  }

  /**
   * Update global resilience settings
   * @param {object} newSettings - New settings to merge
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current resilience settings
   * @returns {object} Current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Check if an error should trigger circuit breaker
   * @param {Error} error - Error to classify
   * @returns {boolean} True if error should trigger circuit breaker
   */
  shouldTriggerCircuitBreaker(error) {
    if (!error) return false;
    
    // Check error type/name
    if (ERROR_CLASSIFICATION.circuitBreakerErrors.includes(error.name) ||
        ERROR_CLASSIFICATION.circuitBreakerErrors.includes(error.code)) {
      return true;
    }
    
    // Check if it's explicitly ignored
    if (ERROR_CLASSIFICATION.ignoredErrors.includes(error.name) ||
        ERROR_CLASSIFICATION.ignoredErrors.includes(error.code)) {
      return false;
    }
    
    // Check HTTP status codes if available
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      if (ERROR_CLASSIFICATION.ignoredStatusCodes.includes(status)) {
        return false;
      }
      if (ERROR_CLASSIFICATION.circuitBreakerStatusCodes.includes(status)) {
        return true;
      }
    }
    
    // Default: trigger circuit breaker for unknown errors
    return true;
  }

  /**
   * Get all configurations (for debugging/monitoring)
   * @returns {object} All configurations and settings
   */
  getAllConfigs() {
    return {
      settings: this.settings,
      categoryConfigs: Object.fromEntries(
        Array.from(this.configs.entries()).filter(([key]) => key.startsWith('category:'))
      ),
      toolConfigs: Object.fromEntries(
        Array.from(this.configs.entries()).filter(([key]) => key.startsWith('tool:'))
      ),
      errorClassification: ERROR_CLASSIFICATION
    };
  }

  /**
   * Reset all configurations to defaults
   */
  reset() {
    this.configs.clear();
    this.settings = { ...RESILIENCE_SETTINGS };
    this.loadDefaultConfigs();
  }
}

// Export singleton instance
export const resilienceConfigManager = new ResilienceConfigManager();
