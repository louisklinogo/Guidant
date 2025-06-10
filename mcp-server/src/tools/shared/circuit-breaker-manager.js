/**
 * Circuit Breaker Manager for MCP Tools
 * Manages circuit breakers for all tools and provides integration layer
 * 
 * MCP-007: Circuit Breaker Pattern Implementation
 */

import { CircuitBreaker, CircuitBreakerError } from './circuit-breaker.js';
import { resilienceConfigManager } from './resilience-config.js';
import { toolCategoryManager } from './tool-categories.js';

/**
 * Circuit Breaker Manager
 * Centralized management of circuit breakers for all MCP tools
 */
export class CircuitBreakerManager {
  constructor() {
    this.circuitBreakers = new Map();
    this.metrics = new Map();
    this.eventHandlers = new Map();
    this.isEnabled = true;
    
    // Initialize event handlers
    this.setupEventHandlers();
    
    // Start metrics collection
    this.startMetricsCollection();
  }

  /**
   * Setup default event handlers for circuit breaker events
   */
  setupEventHandlers() {
    this.eventHandlers.set('stateChange', (event) => {
      if (resilienceConfigManager.getSettings().logStateTransitions) {
        console.log(`🔄 Circuit Breaker [${event.name}]: ${event.oldState} → ${event.newState}`);
      }
    });
    
    this.eventHandlers.set('failure', (event) => {
      if (resilienceConfigManager.getSettings().logFailures) {
        console.warn(`❌ Circuit Breaker [${event.name}]: Failure recorded - ${event.error.message}`);
      }
    });
    
    this.eventHandlers.set('success', (event) => {
      if (resilienceConfigManager.getSettings().logMetrics) {
        console.log(`✅ Circuit Breaker [${event.name}]: Success - ${event.responseTime}ms`);
      }
    });
  }

  /**
   * Get or create circuit breaker for a tool
   * @param {string} toolName - Name of the tool
   * @param {string} category - Tool category
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(toolName, category = null) {
    if (!this.isEnabled) {
      return null;
    }
    
    if (this.circuitBreakers.has(toolName)) {
      return this.circuitBreakers.get(toolName);
    }
    
    // Determine category if not provided
    if (!category) {
      const toolCategory = toolCategoryManager.getCategoryForTool(toolName);
      category = toolCategory ? toolCategory.id : 'analysis';
    }
    
    // Get configuration for this tool
    const config = resilienceConfigManager.getConfigForTool(toolName, category);
    
    // Create circuit breaker with event handlers
    const circuitBreaker = new CircuitBreaker({
      ...config,
      onStateChange: (event) => this.handleEvent('stateChange', event),
      onFailure: (event) => this.handleEvent('failure', event),
      onSuccess: (event) => this.handleEvent('success', event)
    });
    
    this.circuitBreakers.set(toolName, circuitBreaker);
    return circuitBreaker;
  }

  /**
   * Execute a tool operation with circuit breaker protection
   * @param {string} toolName - Name of the tool
   * @param {Function} operation - Tool operation to execute
   * @param {object} options - Execution options
   * @returns {Promise} Operation result
   */
  async executeWithProtection(toolName, operation, options = {}) {
    if (!this.isEnabled) {
      return await operation();
    }
    
    const circuitBreaker = this.getCircuitBreaker(toolName, options.category);
    
    try {
      return await circuitBreaker.execute(async () => {
        // Add global timeout if configured
        const globalTimeout = resilienceConfigManager.getSettings().globalTimeout;
        if (globalTimeout && globalTimeout > 0) {
          return await this.withTimeout(operation(), globalTimeout);
        }
        return await operation();
      });
    } catch (error) {
      // Check if error should trigger circuit breaker
      if (!resilienceConfigManager.shouldTriggerCircuitBreaker(error)) {
        // Re-throw without affecting circuit breaker
        throw error;
      }
      
      // Error will be handled by circuit breaker
      throw error;
    }
  }

  /**
   * Wrap a tool handler with circuit breaker protection
   * @param {string} toolName - Name of the tool
   * @param {Function} handler - Original tool handler
   * @param {object} options - Wrapping options
   * @returns {Function} Protected handler
   */
  wrapToolHandler(toolName, handler, options = {}) {
    return async (...args) => {
      return await this.executeWithProtection(
        toolName,
        () => handler(...args),
        options
      );
    };
  }

  /**
   * Add timeout to a promise
   * @param {Promise} promise - Promise to add timeout to
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise with timeout
   */
  async withTimeout(promise, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Handle circuit breaker events
   * @param {string} eventType - Type of event
   * @param {object} event - Event data
   */
  handleEvent(eventType, event) {
    const handler = this.eventHandlers.get(eventType);
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in circuit breaker event handler [${eventType}]:`, error);
      }
    }
    
    // Update metrics
    this.updateMetrics(eventType, event);
  }

  /**
   * Update metrics for circuit breaker events
   * @param {string} eventType - Type of event
   * @param {object} event - Event data
   */
  updateMetrics(eventType, event) {
    const toolName = event.name;
    if (!this.metrics.has(toolName)) {
      this.metrics.set(toolName, {
        stateChanges: 0,
        failures: 0,
        successes: 0,
        lastEvent: null,
        lastStateChange: null
      });
    }
    
    const metrics = this.metrics.get(toolName);
    metrics.lastEvent = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: event
    };
    
    switch (eventType) {
      case 'stateChange':
        metrics.stateChanges++;
        metrics.lastStateChange = event.newState;
        break;
      case 'failure':
        metrics.failures++;
        break;
      case 'success':
        metrics.successes++;
        break;
    }
  }

  /**
   * Get metrics for all circuit breakers
   * @returns {object} Comprehensive metrics
   */
  getAllMetrics() {
    const circuitBreakerMetrics = {};
    
    for (const [toolName, circuitBreaker] of this.circuitBreakers) {
      circuitBreakerMetrics[toolName] = {
        ...circuitBreaker.getMetrics(),
        managerMetrics: this.metrics.get(toolName) || {}
      };
    }
    
    return {
      enabled: this.isEnabled,
      totalCircuitBreakers: this.circuitBreakers.size,
      circuitBreakers: circuitBreakerMetrics,
      settings: resilienceConfigManager.getSettings(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get health status of all circuit breakers
   * @returns {object} Health status summary
   */
  getHealthStatus() {
    const healthData = {
      overall: 'healthy',
      totalBreakers: this.circuitBreakers.size,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      details: {}
    };
    
    const healthThreshold = resilienceConfigManager.getSettings().healthThreshold;
    
    for (const [toolName, circuitBreaker] of this.circuitBreakers) {
      const metrics = circuitBreaker.getMetrics();
      const healthScore = metrics.healthScore;
      
      let status = 'healthy';
      if (healthScore < healthThreshold) {
        status = healthScore < (healthThreshold / 2) ? 'unhealthy' : 'degraded';
      }
      
      healthData.details[toolName] = {
        status,
        healthScore,
        state: metrics.state,
        lastError: metrics.lastError
      };
      
      healthData[status]++;
    }
    
    // Determine overall health
    if (healthData.unhealthy > 0) {
      healthData.overall = 'unhealthy';
    } else if (healthData.degraded > 0) {
      healthData.overall = 'degraded';
    }
    
    return healthData;
  }

  /**
   * Reset circuit breaker for a specific tool
   * @param {string} toolName - Name of the tool
   */
  resetCircuitBreaker(toolName) {
    const circuitBreaker = this.circuitBreakers.get(toolName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      this.metrics.delete(toolName);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers() {
    for (const [toolName, circuitBreaker] of this.circuitBreakers) {
      circuitBreaker.reset();
    }
    this.metrics.clear();
  }

  /**
   * Enable or disable circuit breaker protection
   * @param {boolean} enabled - Whether to enable protection
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`Circuit Breaker Manager: ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  /**
   * Start metrics collection interval
   */
  startMetricsCollection() {
    const interval = resilienceConfigManager.getSettings().metricsCollectionInterval;
    
    setInterval(() => {
      if (resilienceConfigManager.getSettings().logMetrics) {
        const health = this.getHealthStatus();
        console.log(`📊 Circuit Breaker Health: ${health.overall} (${health.healthy}/${health.totalBreakers} healthy)`);
      }
    }, interval);
  }

  /**
   * Add custom event handler
   * @param {string} eventType - Type of event to handle
   * @param {Function} handler - Event handler function
   */
  addEventHandler(eventType, handler) {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Get circuit breaker by name (for testing/debugging)
   * @param {string} toolName - Name of the tool
   * @returns {CircuitBreaker|null} Circuit breaker instance
   */
  getCircuitBreakerByName(toolName) {
    return this.circuitBreakers.get(toolName) || null;
  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
