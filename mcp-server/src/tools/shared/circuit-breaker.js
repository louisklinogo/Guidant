/**
 * Circuit Breaker Pattern Implementation for MCP Tools
 * Provides resilience and failure handling for tool operations
 * 
 * MCP-007: Circuit Breaker Pattern Implementation
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Circuit is open, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */

/**
 * Circuit Breaker States
 */
export const CircuitBreakerState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Circuit Breaker Error Types
 */
export class CircuitBreakerError extends Error {
  constructor(message, state, lastError = null) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.state = state;
    this.lastError = lastError;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Circuit Breaker Implementation
 * Monitors operation failures and prevents cascade failures
 */
export class CircuitBreaker {
  constructor(options = {}) {
    // Configuration with sensible defaults
    this.name = options.name || 'default';
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.halfOpenMaxCalls = options.halfOpenMaxCalls || 3;
    this.successThreshold = options.successThreshold || 2;
    
    // State management
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastError = null;
    this.halfOpenCalls = 0;
    
    // Metrics
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateTransitions: 0,
      lastStateChange: new Date().toISOString(),
      averageResponseTime: 0,
      totalResponseTime: 0
    };
    
    // Event handlers
    this.onStateChange = options.onStateChange || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
  }

  /**
   * Execute an operation with circuit breaker protection
   * @param {Function} operation - Async operation to execute
   * @param {...any} args - Arguments to pass to the operation
   * @returns {Promise} Operation result or circuit breaker error
   */
  async execute(operation, ...args) {
    const startTime = Date.now();
    this.metrics.totalCalls++;

    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.name}. Last error: ${this.lastError?.message || 'Unknown'}`,
          this.state,
          this.lastError
        );
      }
    }

    // Check half-open call limit
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        throw new CircuitBreakerError(
          `Circuit breaker is HALF_OPEN and max calls (${this.halfOpenMaxCalls}) exceeded`,
          this.state
        );
      }
      this.halfOpenCalls++;
    }

    try {
      // Execute the operation
      const result = await operation(...args);
      
      // Record success
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
      return result;
    } catch (error) {
      // Record failure
      const responseTime = Date.now() - startTime;
      this.recordFailure(error, responseTime);
      
      throw error;
    }
  }

  /**
   * Record a successful operation
   * @param {number} responseTime - Operation response time in ms
   */
  recordSuccess(responseTime) {
    this.metrics.totalSuccesses++;
    this.updateResponseTime(responseTime);
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo(CircuitBreakerState.CLOSED);
      }
    } else if (this.state === CircuitBreakerState.CLOSED) {
      // Reset failure count on success in closed state
      this.failureCount = 0;
    }
    
    this.onSuccess({
      name: this.name,
      state: this.state,
      responseTime,
      metrics: this.getMetrics()
    });
  }

  /**
   * Record a failed operation
   * @param {Error} error - The error that occurred
   * @param {number} responseTime - Operation response time in ms
   */
  recordFailure(error, responseTime) {
    this.metrics.totalFailures++;
    this.updateResponseTime(responseTime);
    this.lastError = error;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitBreakerState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.transitionTo(CircuitBreakerState.OPEN);
    }
    
    this.onFailure({
      name: this.name,
      state: this.state,
      error,
      responseTime,
      failureCount: this.failureCount,
      metrics: this.getMetrics()
    });
  }

  /**
   * Check if circuit breaker should attempt to reset from OPEN to HALF_OPEN
   * @returns {boolean} True if should attempt reset
   */
  shouldAttemptReset() {
    return this.lastFailureTime && 
           (Date.now() - this.lastFailureTime) >= this.recoveryTimeout;
  }

  /**
   * Transition circuit breaker to a new state
   * @param {string} newState - New state to transition to
   */
  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.metrics.stateTransitions++;
    this.metrics.lastStateChange = new Date().toISOString();
    
    // Reset counters based on new state
    if (newState === CircuitBreakerState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.halfOpenCalls = 0;
    } else if (newState === CircuitBreakerState.HALF_OPEN) {
      this.halfOpenCalls = 0;
      this.successCount = 0;
    }
    
    this.onStateChange({
      name: this.name,
      oldState,
      newState,
      timestamp: this.metrics.lastStateChange,
      metrics: this.getMetrics()
    });
  }

  /**
   * Update response time metrics
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTime(responseTime) {
    this.metrics.totalResponseTime += responseTime;
    this.metrics.averageResponseTime = Math.round(
      this.metrics.totalResponseTime / this.metrics.totalCalls
    );
  }

  /**
   * Get current circuit breaker metrics
   * @returns {object} Current metrics
   */
  getMetrics() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      halfOpenCalls: this.halfOpenCalls,
      lastFailureTime: this.lastFailureTime,
      lastError: this.lastError?.message || null,
      ...this.metrics,
      healthScore: this.calculateHealthScore()
    };
  }

  /**
   * Calculate health score (0-100) based on recent performance
   * @returns {number} Health score from 0 (unhealthy) to 100 (healthy)
   */
  calculateHealthScore() {
    if (this.metrics.totalCalls === 0) return 100;
    
    const successRate = (this.metrics.totalSuccesses / this.metrics.totalCalls) * 100;
    const stateBonus = this.state === CircuitBreakerState.CLOSED ? 10 : 
                      this.state === CircuitBreakerState.HALF_OPEN ? 5 : 0;
    
    return Math.min(100, Math.round(successRate + stateBonus));
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset() {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = null;
    this.lastError = null;
    
    // Reset metrics
    this.metrics = {
      totalCalls: 0,
      totalFailures: 0,
      totalSuccesses: 0,
      stateTransitions: 0,
      lastStateChange: new Date().toISOString(),
      averageResponseTime: 0,
      totalResponseTime: 0
    };
  }

  /**
   * Force circuit breaker to specific state (for testing)
   * @param {string} state - State to force
   */
  forceState(state) {
    if (Object.values(CircuitBreakerState).includes(state)) {
      this.transitionTo(state);
    } else {
      throw new Error(`Invalid circuit breaker state: ${state}`);
    }
  }
}
