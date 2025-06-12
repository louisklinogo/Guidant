/**
 * Metrics Collector
 * Lightweight metrics collection wrapper for MCP tools
 * 
 * MCP-010: Tool Analytics and Monitoring Implementation
 */

import { toolAnalytics } from './tool-analytics.js';
import { toolCategoryManager } from './tool-categories.js';

/**
 * Metrics Collection Wrapper
 * Wraps MCP tool execution with automatic metrics collection
 */
export class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      enableDetailedMetrics: true,
      enableSessionTracking: true,
      enablePerformanceMetrics: true,
      enableErrorTracking: true,
      sampleRate: 1.0, // Collect metrics for 100% of executions
      ...options
    };

    this.sessionId = this.generateSessionId();
    this.wrappedTools = new Map();

    // Expose wrapTool via bind so original context remains intact when used as standalone
    this.wrapTool = this.wrapTool.bind(this);
  }

  /**
   * Wrap a tool with metrics collection
   */
  wrapTool(toolName, toolHandler, category = 'unknown') {
    if (this.wrappedTools.has(toolName)) {
      return this.wrappedTools.get(toolName);
    }

    const wrappedHandler = async (parameters = {}, context = {}) => {
      // Check sampling rate
      if (Math.random() > this.options.sampleRate) {
        return await toolHandler(parameters, context);
      }

      const executionId = toolAnalytics.recordExecutionStart(
        toolName, 
        this.sanitizeParameters(parameters),
        this.sessionId
      );

      const startTime = Date.now();
      let result = null;
      let error = null;

      try {
        // Execute the original tool
        result = await toolHandler(parameters, context);
        
        // Record successful execution
        toolAnalytics.recordExecutionEnd(executionId, result, null);
        
        // Update category manager metrics
        if (this.options.enableDetailedMetrics) {
          const executionTime = Date.now() - startTime;
          toolCategoryManager.recordToolUsage(toolName, executionTime, true);
        }

        return result;

      } catch (err) {
        error = err;
        
        // Record failed execution
        toolAnalytics.recordExecutionEnd(executionId, null, error);
        
        // Update category manager metrics
        if (this.options.enableDetailedMetrics) {
          const executionTime = Date.now() - startTime;
          toolCategoryManager.recordToolUsage(toolName, executionTime, false);
        }

        throw error;
      }
    };

    this.wrappedTools.set(toolName, wrappedHandler);
    return wrappedHandler;
  }

  /**
   * Wrap multiple tools at once
   */
  wrapTools(toolMap) {
    const wrappedTools = {};
    
    for (const [toolName, toolHandler] of Object.entries(toolMap)) {
      const category = toolCategoryManager.getCategoryForTool(toolName)?.id || 'unknown';
      wrappedTools[toolName] = this.wrapTool(toolName, toolHandler, category);
    }
    
    return wrappedTools;
  }

  /**
   * Create a metrics-aware tool registration function
   */
  createMetricsAwareRegistration(originalRegisterFn) {
    return (server) => {
      // Store original addTool method
      const originalAddTool = server.addTool.bind(server);
      
      // Override addTool to wrap with metrics
      server.addTool = (toolConfig) => {
        const originalExecute = toolConfig.execute;
        
        toolConfig.execute = this.wrapTool(
          toolConfig.name,
          originalExecute,
          this.getToolCategory(toolConfig.name)
        );
        
        return originalAddTool(toolConfig);
      };
      
      // Call original registration function
      const result = originalRegisterFn(server);
      
      // Restore original addTool method
      server.addTool = originalAddTool;
      
      return result;
    };
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(metricName, value, tags = {}) {
    if (!this.options.enableDetailedMetrics) return;

    const executionId = toolAnalytics.recordExecutionStart(
      `custom:${metricName}`,
      { value, tags },
      this.sessionId
    );

    toolAnalytics.recordExecutionEnd(executionId, { value, tags }, null);
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(eventName, data = {}) {
    if (!this.options.enableDetailedMetrics) return;

    this.recordCustomMetric(`business:${eventName}`, data, {
      type: 'business_event',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record workflow milestone
   */
  recordWorkflowMilestone(milestone, workflowId, data = {}) {
    this.recordCustomMetric(`workflow:${milestone}`, data, {
      type: 'workflow_milestone',
      workflowId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get tool category
   */
  getToolCategory(toolName) {
    const category = toolCategoryManager.getCategoryForTool(toolName);
    return category?.id || 'unknown';
  }

  /**
   * Sanitize parameters for logging
   */
  sanitizeParameters(parameters) {
    if (!this.options.enableDetailedMetrics) {
      return { parameterCount: Object.keys(parameters || {}).length };
    }

    const sanitized = {};
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    
    for (const [key, value] of Object.entries(parameters || {})) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = `[TRUNCATED:${value.length}chars]`;
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics() {
    return {
      sessionId: this.sessionId,
      wrappedTools: Array.from(this.wrappedTools.keys()),
      options: this.options
    };
  }

  /**
   * Reset session (start new session)
   */
  resetSession() {
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }
}

/**
 * Performance Monitor
 * Monitors system performance and resource usage
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      monitorInterval: 30000, // 30 seconds
      enableMemoryMonitoring: true,
      enableCPUMonitoring: false, // CPU monitoring requires additional dependencies
      memoryThreshold: 100 * 1024 * 1024, // 100MB
      ...options
    };

    this.monitoring = false;
    this.monitorTimer = null;
    this.metrics = {
      memory: [],
      performance: [],
      alerts: []
    };
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.monitoring) return;

    this.monitoring = true;
    this.monitorTimer = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.options.monitorInterval);

    console.log('📊 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.monitoring) return;

    this.monitoring = false;
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
    }

    console.log('📊 Performance monitoring stopped');
  }

  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const timestamp = new Date().toISOString();
    
    // Memory metrics
    if (this.options.enableMemoryMonitoring) {
      const memoryUsage = process.memoryUsage();
      
      this.metrics.memory.push({
        timestamp,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      });

      // Check memory threshold
      if (memoryUsage.heapUsed > this.options.memoryThreshold) {
        this.recordAlert('memory', 'High memory usage detected', {
          heapUsed: memoryUsage.heapUsed,
          threshold: this.options.memoryThreshold
        });
      }

      // Keep only last 100 memory readings
      if (this.metrics.memory.length > 100) {
        this.metrics.memory = this.metrics.memory.slice(-100);
      }
    }

    // Performance metrics
    const performanceMetrics = {
      timestamp,
      eventLoopDelay: this.measureEventLoopDelay(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };

    this.metrics.performance.push(performanceMetrics);

    // Keep only last 100 performance readings
    if (this.metrics.performance.length > 100) {
      this.metrics.performance = this.metrics.performance.slice(-100);
    }

    // Record metrics in analytics
    toolAnalytics.recordCustomMetric('system:memory', memoryUsage, {
      type: 'system_metric'
    });

    toolAnalytics.recordCustomMetric('system:performance', performanceMetrics, {
      type: 'system_metric'
    });
  }

  /**
   * Measure event loop delay (simplified)
   */
  measureEventLoopDelay() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      return delay;
    });
    return 0; // Simplified implementation
  }

  /**
   * Record performance alert
   */
  recordAlert(type, message, data = {}) {
    const alert = {
      type,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    this.metrics.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }

    // Record in analytics
    toolAnalytics.recordCustomMetric(`alert:${type}`, data, {
      type: 'performance_alert',
      message
    });

    console.warn(`⚠️ Performance Alert [${type}]: ${message}`, data);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recentMemory = this.metrics.memory.slice(-10);
    const recentPerformance = this.metrics.performance.slice(-10);
    const recentAlerts = this.metrics.alerts.slice(-5);

    return {
      memory: {
        current: recentMemory.length > 0 ? recentMemory[recentMemory.length - 1] : null,
        average: this.calculateAverageMemory(recentMemory),
        trend: this.calculateMemoryTrend(recentMemory)
      },
      performance: {
        current: recentPerformance.length > 0 ? recentPerformance[recentPerformance.length - 1] : null,
        activeHandles: recentPerformance.length > 0 ? recentPerformance[recentPerformance.length - 1].activeHandles : 0,
        activeRequests: recentPerformance.length > 0 ? recentPerformance[recentPerformance.length - 1].activeRequests : 0
      },
      alerts: recentAlerts,
      monitoring: this.monitoring
    };
  }

  /**
   * Calculate average memory usage
   */
  calculateAverageMemory(memoryReadings) {
    if (memoryReadings.length === 0) return null;

    const sum = memoryReadings.reduce((acc, reading) => acc + reading.heapUsed, 0);
    return Math.round(sum / memoryReadings.length);
  }

  /**
   * Calculate memory trend
   */
  calculateMemoryTrend(memoryReadings) {
    if (memoryReadings.length < 2) return 'stable';

    const first = memoryReadings[0].heapUsed;
    const last = memoryReadings[memoryReadings.length - 1].heapUsed;
    const change = ((last - first) / first) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }
}

// Export singleton instances
export const metricsCollector = new MetricsCollector();
export const performanceMonitor = new PerformanceMonitor();

/**
 * Utility function to wrap tool registration with metrics
 */
export function withMetrics(registerToolsFn) {
  return metricsCollector.createMetricsAwareRegistration(registerToolsFn);
}

/**
 * Utility function to record workflow events
 */
export function recordWorkflowEvent(eventName, workflowId, data = {}) {
  metricsCollector.recordWorkflowMilestone(eventName, workflowId, data);
}

/**
 * Utility function to record business events
 */
export function recordBusinessEvent(eventName, data = {}) {
  metricsCollector.recordBusinessMetric(eventName, data);
}
