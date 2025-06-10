/**
 * Performance Monitor
 * Tracks and reports performance metrics for the Dynamic Terminal Layout System
 * 
 * Monitors memory usage, render times, update latency, and keyboard response times
 * to ensure the system meets Phase 4 performance targets.
 */

import { EventEmitter } from 'events';

/**
 * Performance targets from Phase 4 requirements
 */
export const PERFORMANCE_TARGETS = {
  updateLatency: 100,        // 100ms max update latency
  memoryUsage: 100 * 1024 * 1024, // 100MB max memory
  keyboardResponse: 50,      // 50ms max keyboard response
  startupTime: 2000,         // 2s max startup time
  renderTime: 16,            // 16ms max render time (60fps)
  mcpToolSuccess: 95         // 95% MCP tool success rate
};

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableMemoryTracking: options.enableMemoryTracking !== false,
      enableRenderTracking: options.enableRenderTracking !== false,
      enableKeyboardTracking: options.enableKeyboardTracking !== false,
      alertThreshold: options.alertThreshold || 0.8, // Alert at 80% of target
      sampleInterval: options.sampleInterval || 1000, // 1 second
      maxSamples: options.maxSamples || 100
    };
    
    // Metrics storage
    this.metrics = {
      memory: [],
      renders: [],
      keyboard: [],
      updates: [],
      mcpTools: [],
      errors: []
    };
    
    // Current session tracking
    this.session = {
      startTime: Date.now(),
      renderCount: 0,
      keyboardEvents: 0,
      updateEvents: 0,
      errorCount: 0,
      mcpToolCalls: 0,
      mcpToolSuccesses: 0
    };
    
    // Performance timers
    this.timers = new Map();
    this.intervals = new Map();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.options.enableMemoryTracking) {
      this.startMemoryMonitoring();
    }
    
    // Start periodic health checks
    this.intervals.set('healthCheck', setInterval(() => {
      this.performHealthCheck();
    }, this.options.sampleInterval));
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    // Clear all intervals
    this.intervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.intervals.clear();
    
    // Clear all timers
    this.timers.clear();
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.intervals.set('memory', setInterval(() => {
        const memUsage = process.memoryUsage();
        this.recordMemoryUsage(memUsage.heapUsed);
      }, this.options.sampleInterval));
    }
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage(heapUsed) {
    const sample = {
      timestamp: Date.now(),
      heapUsed,
      target: PERFORMANCE_TARGETS.memoryUsage,
      percentage: (heapUsed / PERFORMANCE_TARGETS.memoryUsage) * 100
    };
    
    this.addSample('memory', sample);
    
    // Check for memory alerts
    if (sample.percentage > this.options.alertThreshold * 100) {
      this.emit('performanceAlert', {
        type: 'memory',
        message: `Memory usage at ${sample.percentage.toFixed(1)}% of target`,
        sample
      });
    }
  }

  /**
   * Start timing an operation
   */
  startTimer(operation, metadata = {}) {
    const timer = {
      operation,
      startTime: performance.now(),
      metadata
    };
    
    this.timers.set(operation, timer);
    return timer;
  }

  /**
   * End timing an operation
   */
  endTimer(operation) {
    const timer = this.timers.get(operation);
    if (!timer) {
      console.warn(`Timer not found for operation: ${operation}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    this.timers.delete(operation);
    
    // Record the timing based on operation type
    this.recordTiming(timer.operation, duration, timer.metadata);
    
    return { duration, ...timer };
  }

  /**
   * Record timing for different operation types
   */
  recordTiming(operation, duration, metadata = {}) {
    const sample = {
      timestamp: Date.now(),
      operation,
      duration,
      metadata
    };
    
    // Categorize by operation type
    if (operation.startsWith('render')) {
      this.recordRenderTime(duration, metadata);
    } else if (operation.startsWith('keyboard')) {
      this.recordKeyboardResponse(duration, metadata);
    } else if (operation.startsWith('update')) {
      this.recordUpdateLatency(duration, metadata);
    } else if (operation.startsWith('mcp')) {
      this.recordMCPToolExecution(duration, metadata);
    }
  }

  /**
   * Record render time
   */
  recordRenderTime(duration, metadata = {}) {
    const sample = {
      timestamp: Date.now(),
      duration,
      target: PERFORMANCE_TARGETS.renderTime,
      percentage: (duration / PERFORMANCE_TARGETS.renderTime) * 100,
      metadata
    };
    
    this.addSample('renders', sample);
    this.session.renderCount++;
    
    // Check for render alerts
    if (duration > PERFORMANCE_TARGETS.renderTime * this.options.alertThreshold) {
      this.emit('performanceAlert', {
        type: 'render',
        message: `Slow render: ${duration.toFixed(1)}ms (target: ${PERFORMANCE_TARGETS.renderTime}ms)`,
        sample
      });
    }
  }

  /**
   * Record keyboard response time
   */
  recordKeyboardResponse(duration, metadata = {}) {
    const sample = {
      timestamp: Date.now(),
      duration,
      target: PERFORMANCE_TARGETS.keyboardResponse,
      percentage: (duration / PERFORMANCE_TARGETS.keyboardResponse) * 100,
      metadata
    };
    
    this.addSample('keyboard', sample);
    this.session.keyboardEvents++;
    
    // Check for keyboard response alerts
    if (duration > PERFORMANCE_TARGETS.keyboardResponse * this.options.alertThreshold) {
      this.emit('performanceAlert', {
        type: 'keyboard',
        message: `Slow keyboard response: ${duration.toFixed(1)}ms (target: ${PERFORMANCE_TARGETS.keyboardResponse}ms)`,
        sample
      });
    }
  }

  /**
   * Record update latency
   */
  recordUpdateLatency(duration, metadata = {}) {
    const sample = {
      timestamp: Date.now(),
      duration,
      target: PERFORMANCE_TARGETS.updateLatency,
      percentage: (duration / PERFORMANCE_TARGETS.updateLatency) * 100,
      metadata
    };
    
    this.addSample('updates', sample);
    this.session.updateEvents++;
    
    // Check for update latency alerts
    if (duration > PERFORMANCE_TARGETS.updateLatency * this.options.alertThreshold) {
      this.emit('performanceAlert', {
        type: 'update',
        message: `Slow update: ${duration.toFixed(1)}ms (target: ${PERFORMANCE_TARGETS.updateLatency}ms)`,
        sample
      });
    }
  }

  /**
   * Record MCP tool execution
   */
  recordMCPToolExecution(duration, metadata = {}) {
    const sample = {
      timestamp: Date.now(),
      duration,
      success: metadata.success !== false,
      toolName: metadata.toolName,
      error: metadata.error
    };
    
    this.addSample('mcpTools', sample);
    this.session.mcpToolCalls++;
    
    if (sample.success) {
      this.session.mcpToolSuccesses++;
    }
    
    // Check MCP tool success rate
    const successRate = (this.session.mcpToolSuccesses / this.session.mcpToolCalls) * 100;
    if (successRate < PERFORMANCE_TARGETS.mcpToolSuccess) {
      this.emit('performanceAlert', {
        type: 'mcpTool',
        message: `MCP tool success rate: ${successRate.toFixed(1)}% (target: ${PERFORMANCE_TARGETS.mcpToolSuccess}%)`,
        sample: { successRate, totalCalls: this.session.mcpToolCalls }
      });
    }
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    const sample = {
      timestamp: Date.now(),
      error: error.message || error,
      stack: error.stack,
      context
    };
    
    this.addSample('errors', sample);
    this.session.errorCount++;
    
    this.emit('error', { error, context, sample });
  }

  /**
   * Add sample to metrics with size limit
   */
  addSample(category, sample) {
    if (!this.metrics[category]) {
      this.metrics[category] = [];
    }
    
    this.metrics[category].push(sample);
    
    // Trim to max samples
    if (this.metrics[category].length > this.options.maxSamples) {
      this.metrics[category] = this.metrics[category].slice(-this.options.maxSamples);
    }
  }

  /**
   * Perform health check
   */
  performHealthCheck() {
    const health = this.getHealthStatus();
    
    this.emit('healthCheck', health);
    
    // Check for critical issues
    if (health.overall < 0.7) {
      this.emit('performanceAlert', {
        type: 'health',
        message: `System health degraded: ${(health.overall * 100).toFixed(1)}%`,
        health
      });
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus() {
    const now = Date.now();
    const sessionDuration = now - this.session.startTime;
    
    return {
      overall: this.calculateOverallHealth(),
      memory: this.getMemoryHealth(),
      performance: this.getPerformanceHealth(),
      errors: this.getErrorHealth(),
      mcpTools: this.getMCPToolHealth(),
      session: {
        duration: sessionDuration,
        renderCount: this.session.renderCount,
        keyboardEvents: this.session.keyboardEvents,
        updateEvents: this.session.updateEvents,
        errorCount: this.session.errorCount,
        mcpToolCalls: this.session.mcpToolCalls,
        mcpToolSuccesses: this.session.mcpToolSuccesses
      }
    };
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth() {
    const weights = {
      memory: 0.3,
      performance: 0.4,
      errors: 0.2,
      mcpTools: 0.1
    };
    
    const scores = {
      memory: this.getMemoryHealth(),
      performance: this.getPerformanceHealth(),
      errors: this.getErrorHealth(),
      mcpTools: this.getMCPToolHealth()
    };
    
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key] * weight);
    }, 0);
  }

  /**
   * Get memory health score (0-1)
   */
  getMemoryHealth() {
    const recent = this.getRecentSamples('memory', 10);
    if (recent.length === 0) return 1;
    
    const avgPercentage = recent.reduce((sum, sample) => sum + sample.percentage, 0) / recent.length;
    return Math.max(0, 1 - (avgPercentage / 100));
  }

  /**
   * Get performance health score (0-1)
   */
  getPerformanceHealth() {
    const renderHealth = this.getMetricHealth('renders', PERFORMANCE_TARGETS.renderTime);
    const keyboardHealth = this.getMetricHealth('keyboard', PERFORMANCE_TARGETS.keyboardResponse);
    const updateHealth = this.getMetricHealth('updates', PERFORMANCE_TARGETS.updateLatency);
    
    return (renderHealth + keyboardHealth + updateHealth) / 3;
  }

  /**
   * Get error health score (0-1)
   */
  getErrorHealth() {
    const recentErrors = this.getRecentSamples('errors', 10);
    if (recentErrors.length === 0) return 1;
    
    // Penalize based on error frequency
    const errorRate = recentErrors.length / 10;
    return Math.max(0, 1 - errorRate);
  }

  /**
   * Get MCP tool health score (0-1)
   */
  getMCPToolHealth() {
    if (this.session.mcpToolCalls === 0) return 1;
    
    const successRate = this.session.mcpToolSuccesses / this.session.mcpToolCalls;
    return successRate;
  }

  /**
   * Get metric health score
   */
  getMetricHealth(category, target) {
    const recent = this.getRecentSamples(category, 10);
    if (recent.length === 0) return 1;
    
    const avgDuration = recent.reduce((sum, sample) => sum + sample.duration, 0) / recent.length;
    const percentage = avgDuration / target;
    
    return Math.max(0, 1 - Math.max(0, percentage - 1));
  }

  /**
   * Get recent samples
   */
  getRecentSamples(category, count = 10) {
    if (!this.metrics[category]) return [];
    return this.metrics[category].slice(-count);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      targets: PERFORMANCE_TARGETS,
      health: this.getHealthStatus(),
      metrics: {
        memory: this.getMetricSummary('memory'),
        renders: this.getMetricSummary('renders'),
        keyboard: this.getMetricSummary('keyboard'),
        updates: this.getMetricSummary('updates'),
        mcpTools: this.getMetricSummary('mcpTools'),
        errors: this.getMetricSummary('errors')
      }
    };
  }

  /**
   * Get metric summary
   */
  getMetricSummary(category) {
    const samples = this.metrics[category] || [];
    if (samples.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, recent: [] };
    }
    
    const durations = samples.map(s => s.duration || s.heapUsed || 0);
    
    return {
      count: samples.length,
      avg: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      recent: this.getRecentSamples(category, 5)
    };
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

export default PerformanceMonitor;
