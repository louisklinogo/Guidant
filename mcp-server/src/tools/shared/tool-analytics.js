/**
 * Tool Analytics System
 * Comprehensive analytics and monitoring for MCP tool usage
 * 
 * MCP-010: Tool Analytics and Monitoring Implementation
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

/**
 * Tool Analytics Manager
 * Tracks usage patterns, performance metrics, and optimization opportunities
 */
export class ToolAnalytics extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enablePersistence: true,
      persistenceInterval: 30000, // 30 seconds
      dataRetentionDays: 30,
      enableRealTimeMetrics: true,
      enableUsagePatterns: true,
      enablePerformanceTracking: true,
      maxMemoryEntries: 10000,
      ...options
    };

    // Analytics data storage
    this.metrics = {
      // Tool usage metrics
      toolUsage: new Map(),
      categoryUsage: new Map(),
      
      // Performance metrics
      performance: new Map(),
      
      // Error tracking
      errors: new Map(),
      
      // Usage patterns
      patterns: {
        hourlyUsage: new Array(24).fill(0),
        dailyUsage: new Map(),
        toolSequences: new Map(),
        userSessions: new Map()
      },
      
      // System metrics
      system: {
        totalExecutions: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        peakConcurrency: 0,
        currentConcurrency: 0,
        uptime: Date.now()
      }
    };

    // Real-time tracking
    this.activeExecutions = new Map();
    this.sessionData = new Map();
    
    // Persistence
    this.persistenceTimer = null;
    this.dataFile = path.join(process.cwd(), '.guidant', 'analytics', 'tool-metrics.json');
    this.cleanupTimer = null;
    
    // Initialize
    this.initialize();
  }

  /**
   * Initialize analytics system
   */
  async initialize() {
    // Load persisted data
    if (this.options.enablePersistence) {
      await this.loadPersistedData();
      this.startPersistenceTimer();
    }

    // Start cleanup timer
    this.startCleanupTimer();
    
    this.emit('analyticsInitialized');
  }

  /**
   * Record tool execution start
   */
  recordExecutionStart(toolName, parameters = {}, sessionId = null) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();
    
    // Track active execution
    this.activeExecutions.set(executionId, {
      toolName,
      parameters,
      sessionId,
      startTime,
      status: 'running'
    });

    // Update concurrency metrics
    this.metrics.system.currentConcurrency = this.activeExecutions.size;
    if (this.metrics.system.currentConcurrency > this.metrics.system.peakConcurrency) {
      this.metrics.system.peakConcurrency = this.metrics.system.currentConcurrency;
    }

    // Update usage patterns
    this.updateUsagePatterns(toolName, startTime, sessionId);
    
    this.emit('executionStarted', { executionId, toolName, startTime });
    
    return executionId;
  }

  /**
   * Record tool execution completion
   */
  recordExecutionEnd(executionId, result = {}, error = null) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      console.warn(`Execution ${executionId} not found in active executions`);
      return;
    }

    const endTime = Date.now();
    const executionTime = endTime - execution.startTime;
    const success = !error;

    // Update execution record
    execution.endTime = endTime;
    execution.executionTime = executionTime;
    execution.success = success;
    execution.result = result;
    execution.error = error;
    execution.status = success ? 'completed' : 'failed';

    // Update metrics
    this.updateToolMetrics(execution.toolName, executionTime, success, result, error);
    this.updatePerformanceMetrics(execution.toolName, executionTime, success);
    this.updateSystemMetrics(executionTime, success);
    
    if (error) {
      this.updateErrorMetrics(execution.toolName, error);
    }

    // Update session data
    if (execution.sessionId) {
      this.updateSessionData(execution.sessionId, execution);
    }

    // Remove from active executions
    this.activeExecutions.delete(executionId);
    this.metrics.system.currentConcurrency = this.activeExecutions.size;

    this.emit('executionCompleted', { 
      executionId, 
      toolName: execution.toolName, 
      executionTime, 
      success 
    });
  }

  /**
   * Update tool-specific metrics
   */
  updateToolMetrics(toolName, executionTime, success, result, error) {
    if (!this.metrics.toolUsage.has(toolName)) {
      this.metrics.toolUsage.set(toolName, {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
        lastUsed: null,
        firstUsed: null,
        errorRate: 0,
        throughput: 0, // executions per minute
        recentExecutions: [] // Last 100 executions for trend analysis
      });
    }

    const metrics = this.metrics.toolUsage.get(toolName);
    
    // Update basic counters
    metrics.totalExecutions++;
    if (success) {
      metrics.successfulExecutions++;
    } else {
      metrics.failedExecutions++;
    }

    // Update timing metrics
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.totalExecutions;
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);

    // Update timestamps
    const now = new Date().toISOString();
    metrics.lastUsed = now;
    if (!metrics.firstUsed) {
      metrics.firstUsed = now;
    }

    // Update error rate
    metrics.errorRate = (metrics.failedExecutions / metrics.totalExecutions) * 100;

    // Update recent executions for trend analysis
    metrics.recentExecutions.push({
      timestamp: now,
      executionTime,
      success,
      result: success ? 'success' : error?.message || 'unknown error'
    });

    // Keep only last 100 executions
    if (metrics.recentExecutions.length > 100) {
      metrics.recentExecutions = metrics.recentExecutions.slice(-100);
    }

    // Calculate throughput (executions per minute over last hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentExecutions = metrics.recentExecutions.filter(
      exec => new Date(exec.timestamp).getTime() > oneHourAgo
    );
    metrics.throughput = recentExecutions.length / 60; // per minute
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(toolName, executionTime, success) {
    if (!this.metrics.performance.has(toolName)) {
      this.metrics.performance.set(toolName, {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        executionTimes: [],
        performanceTrend: 'stable', // improving, degrading, stable
        lastCalculated: null
      });
    }

    const perfMetrics = this.metrics.performance.get(toolName);
    perfMetrics.executionTimes.push(executionTime);

    // Keep only last 1000 execution times for percentile calculation
    if (perfMetrics.executionTimes.length > 1000) {
      perfMetrics.executionTimes = perfMetrics.executionTimes.slice(-1000);
    }

    // Recalculate percentiles every 10 executions
    if (perfMetrics.executionTimes.length % 10 === 0) {
      this.calculatePercentiles(toolName);
    }
  }

  /**
   * Calculate performance percentiles
   */
  calculatePercentiles(toolName) {
    const perfMetrics = this.metrics.performance.get(toolName);
    const times = [...perfMetrics.executionTimes].sort((a, b) => a - b);
    
    const getPercentile = (arr, percentile) => {
      const index = Math.ceil((percentile / 100) * arr.length) - 1;
      return arr[Math.max(0, index)] || 0;
    };

    const oldP90 = perfMetrics.p90;
    
    perfMetrics.p50 = getPercentile(times, 50);
    perfMetrics.p90 = getPercentile(times, 90);
    perfMetrics.p95 = getPercentile(times, 95);
    perfMetrics.p99 = getPercentile(times, 99);
    perfMetrics.lastCalculated = new Date().toISOString();

    // Determine performance trend
    if (oldP90 > 0) {
      const change = ((perfMetrics.p90 - oldP90) / oldP90) * 100;
      if (change > 10) {
        perfMetrics.performanceTrend = 'degrading';
      } else if (change < -10) {
        perfMetrics.performanceTrend = 'improving';
      } else {
        perfMetrics.performanceTrend = 'stable';
      }
    }
  }

  /**
   * Update system-wide metrics
   */
  updateSystemMetrics(executionTime, success) {
    this.metrics.system.totalExecutions++;
    if (!success) {
      this.metrics.system.totalErrors++;
    }

    // Update average response time
    const totalTime = this.metrics.system.averageResponseTime * (this.metrics.system.totalExecutions - 1);
    this.metrics.system.averageResponseTime = (totalTime + executionTime) / this.metrics.system.totalExecutions;
  }

  /**
   * Update error metrics
   */
  updateErrorMetrics(toolName, error) {
    const errorType = this.classifyError(error);
    const errorKey = `${toolName}:${errorType}`;
    
    if (!this.metrics.errors.has(errorKey)) {
      this.metrics.errors.set(errorKey, {
        toolName,
        errorType,
        count: 0,
        firstOccurrence: null,
        lastOccurrence: null,
        recentOccurrences: []
      });
    }

    const errorMetrics = this.metrics.errors.get(errorKey);
    errorMetrics.count++;
    
    const now = new Date().toISOString();
    errorMetrics.lastOccurrence = now;
    if (!errorMetrics.firstOccurrence) {
      errorMetrics.firstOccurrence = now;
    }

    errorMetrics.recentOccurrences.push({
      timestamp: now,
      message: error?.message || 'Unknown error',
      stack: error?.stack
    });

    // Keep only last 50 occurrences
    if (errorMetrics.recentOccurrences.length > 50) {
      errorMetrics.recentOccurrences = errorMetrics.recentOccurrences.slice(-50);
    }
  }

  /**
   * Update usage patterns
   */
  updateUsagePatterns(toolName, timestamp, sessionId) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const dayKey = date.toISOString().split('T')[0];

    // Update hourly usage
    this.metrics.patterns.hourlyUsage[hour]++;

    // Update daily usage
    if (!this.metrics.patterns.dailyUsage.has(dayKey)) {
      this.metrics.patterns.dailyUsage.set(dayKey, new Map());
    }
    const dayUsage = this.metrics.patterns.dailyUsage.get(dayKey);
    dayUsage.set(toolName, (dayUsage.get(toolName) || 0) + 1);

    // Update session data
    if (sessionId) {
      if (!this.sessionData.has(sessionId)) {
        this.sessionData.set(sessionId, {
          startTime: timestamp,
          toolSequence: [],
          totalExecutions: 0,
          uniqueTools: new Set()
        });
      }
      
      const session = this.sessionData.get(sessionId);
      session.toolSequence.push({ toolName, timestamp });
      session.totalExecutions++;
      session.uniqueTools.add(toolName);
      session.lastActivity = timestamp;
    }
  }

  /**
   * Classify error type
   */
  classifyError(error) {
    if (!error) return 'unknown';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network') || message.includes('connection')) return 'network';
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    if (message.includes('permission') || message.includes('unauthorized')) return 'permission';
    if (message.includes('not found') || message.includes('missing')) return 'not_found';
    if (message.includes('circuit breaker')) return 'circuit_breaker';
    
    return 'application';
  }

  /**
   * Generate execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(options = {}) {
    const {
      includeRawData = false,
      timeRange = '24h',
      toolFilter = null,
      categoryFilter = null
    } = options;

    const report = {
      summary: this.getSummaryMetrics(),
      toolMetrics: this.getToolMetrics(toolFilter),
      performanceMetrics: this.getPerformanceMetrics(toolFilter),
      errorAnalysis: this.getErrorAnalysis(toolFilter),
      usagePatterns: this.getUsagePatterns(timeRange),
      recommendations: this.generateRecommendations(),
      timestamp: new Date().toISOString()
    };

    if (includeRawData) {
      report.rawData = {
        toolUsage: Object.fromEntries(this.metrics.toolUsage),
        performance: Object.fromEntries(this.metrics.performance),
        errors: Object.fromEntries(this.metrics.errors)
      };
    }

    return report;
  }

  /**
   * Get summary metrics
   */
  getSummaryMetrics() {
    const uptime = Date.now() - this.metrics.system.uptime;
    
    return {
      totalExecutions: this.metrics.system.totalExecutions,
      totalErrors: this.metrics.system.totalErrors,
      errorRate: this.metrics.system.totalExecutions > 0 
        ? (this.metrics.system.totalErrors / this.metrics.system.totalExecutions) * 100 
        : 0,
      averageResponseTime: Math.round(this.metrics.system.averageResponseTime),
      currentConcurrency: this.metrics.system.currentConcurrency,
      peakConcurrency: this.metrics.system.peakConcurrency,
      uptime: Math.round(uptime / 1000), // seconds
      uniqueTools: this.metrics.toolUsage.size,
      activeExecutions: this.activeExecutions.size
    };
  }

  /**
   * Get tool-specific metrics
   */
  getToolMetrics(toolFilter = null) {
    const metrics = {};
    
    for (const [toolName, data] of this.metrics.toolUsage) {
      if (toolFilter && !toolName.includes(toolFilter)) continue;
      
      metrics[toolName] = {
        totalExecutions: data.totalExecutions,
        successRate: data.totalExecutions > 0 
          ? ((data.successfulExecutions / data.totalExecutions) * 100).toFixed(2)
          : 0,
        averageExecutionTime: Math.round(data.averageExecutionTime),
        minExecutionTime: data.minExecutionTime === Infinity ? 0 : data.minExecutionTime,
        maxExecutionTime: data.maxExecutionTime,
        throughput: data.throughput.toFixed(2),
        lastUsed: data.lastUsed,
        errorRate: data.errorRate.toFixed(2)
      };
    }
    
    return metrics;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(toolFilter = null) {
    const metrics = {};
    
    for (const [toolName, data] of this.metrics.performance) {
      if (toolFilter && !toolName.includes(toolFilter)) continue;
      
      metrics[toolName] = {
        p50: Math.round(data.p50),
        p90: Math.round(data.p90),
        p95: Math.round(data.p95),
        p99: Math.round(data.p99),
        trend: data.performanceTrend,
        lastCalculated: data.lastCalculated
      };
    }
    
    return metrics;
  }

  /**
   * Get error analysis
   */
  getErrorAnalysis(toolFilter = null) {
    const analysis = {
      totalErrors: 0,
      errorsByType: {},
      errorsByTool: {},
      recentErrors: []
    };

    for (const [errorKey, data] of this.metrics.errors) {
      if (toolFilter && !data.toolName.includes(toolFilter)) continue;
      
      analysis.totalErrors += data.count;
      
      // Group by error type
      if (!analysis.errorsByType[data.errorType]) {
        analysis.errorsByType[data.errorType] = 0;
      }
      analysis.errorsByType[data.errorType] += data.count;
      
      // Group by tool
      if (!analysis.errorsByTool[data.toolName]) {
        analysis.errorsByTool[data.toolName] = 0;
      }
      analysis.errorsByTool[data.toolName] += data.count;
      
      // Add recent errors
      data.recentOccurrences.slice(-5).forEach(occurrence => {
        analysis.recentErrors.push({
          toolName: data.toolName,
          errorType: data.errorType,
          timestamp: occurrence.timestamp,
          message: occurrence.message
        });
      });
    }

    // Sort recent errors by timestamp
    analysis.recentErrors.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    analysis.recentErrors = analysis.recentErrors.slice(0, 20); // Top 20 recent errors

    return analysis;
  }

  /**
   * Get usage patterns
   */
  getUsagePatterns(timeRange = '24h') {
    return {
      hourlyDistribution: this.metrics.patterns.hourlyUsage,
      peakHours: this.getPeakUsageHours(),
      toolSequences: this.getCommonToolSequences(),
      sessionStats: this.getSessionStatistics()
    };
  }

  /**
   * Get peak usage hours
   */
  getPeakUsageHours() {
    const hourlyUsage = this.metrics.patterns.hourlyUsage;
    const maxUsage = Math.max(...hourlyUsage);
    
    return hourlyUsage
      .map((usage, hour) => ({ hour, usage }))
      .filter(item => item.usage >= maxUsage * 0.8) // Within 80% of peak
      .sort((a, b) => b.usage - a.usage);
  }

  /**
   * Get common tool sequences
   */
  getCommonToolSequences() {
    const sequences = new Map();
    
    for (const [sessionId, session] of this.sessionData) {
      if (session.toolSequence.length < 2) continue;
      
      for (let i = 0; i < session.toolSequence.length - 1; i++) {
        const sequence = `${session.toolSequence[i].toolName} → ${session.toolSequence[i + 1].toolName}`;
        sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
      }
    }
    
    return Array.from(sequences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sequence, count]) => ({ sequence, count }));
  }

  /**
   * Get session statistics
   */
  getSessionStatistics() {
    if (this.sessionData.size === 0) {
      return { totalSessions: 0, averageToolsPerSession: 0, averageSessionDuration: 0 };
    }

    let totalTools = 0;
    let totalDuration = 0;
    let completedSessions = 0;

    for (const [sessionId, session] of this.sessionData) {
      totalTools += session.totalExecutions;
      
      if (session.lastActivity) {
        totalDuration += session.lastActivity - session.startTime;
        completedSessions++;
      }
    }

    return {
      totalSessions: this.sessionData.size,
      averageToolsPerSession: Math.round(totalTools / this.sessionData.size),
      averageSessionDuration: completedSessions > 0 
        ? Math.round(totalDuration / completedSessions / 1000) // seconds
        : 0
    };
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Performance recommendations
    for (const [toolName, perfData] of this.metrics.performance) {
      if (perfData.performanceTrend === 'degrading') {
        recommendations.push({
          type: 'performance',
          priority: 'high',
          tool: toolName,
          issue: 'Performance degradation detected',
          suggestion: `Tool ${toolName} showing performance degradation. Consider optimizing or adding caching.`,
          metric: `P90: ${perfData.p90}ms`
        });
      }
    }

    // Error rate recommendations
    for (const [toolName, toolData] of this.metrics.toolUsage) {
      if (toolData.errorRate > 10) {
        recommendations.push({
          type: 'reliability',
          priority: 'high',
          tool: toolName,
          issue: 'High error rate',
          suggestion: `Tool ${toolName} has high error rate (${toolData.errorRate.toFixed(1)}%). Review error patterns and add circuit breaker protection.`,
          metric: `Error rate: ${toolData.errorRate.toFixed(1)}%`
        });
      }
    }

    // Usage pattern recommendations
    const leastUsedTools = Array.from(this.metrics.toolUsage.entries())
      .sort((a, b) => a[1].totalExecutions - b[1].totalExecutions)
      .slice(0, 3);

    if (leastUsedTools.length > 0 && leastUsedTools[0][1].totalExecutions < 5) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        tool: 'system',
        issue: 'Underutilized tools detected',
        suggestion: `Consider removing or consolidating rarely used tools: ${leastUsedTools.map(([name]) => name).join(', ')}`,
        metric: `Usage: ${leastUsedTools[0][1].totalExecutions} executions`
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Update session data after a tool execution completes
   * @param {string} sessionId - Unique session identifier
   * @param {Object} execution - Execution record captured in recordExecutionEnd
   */
  updateSessionData(sessionId, execution) {
    if (!sessionId) return;

    // Ensure session record exists
    if (!this.sessionData.has(sessionId)) {
      this.sessionData.set(sessionId, {
        startTime: execution.startTime || Date.now(),
        lastActivity: execution.endTime || Date.now(),
        toolSequence: [],
        totalExecutions: 0,
        uniqueTools: new Set()
      });
    }

    const session = this.sessionData.get(sessionId);

    // Update timestamps
    session.lastActivity = execution.endTime || Date.now();

    // Record tool usage sequence
    session.toolSequence.push({
      toolName: execution.toolName,
      timestamp: execution.endTime || Date.now(),
      success: execution.success
    });

    // Update counters
    session.totalExecutions++;
    session.uniqueTools.add(execution.toolName);
  }

  /**
   * Load persisted analytics data
   */
  async loadPersistedData() {
    try {
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
      const data = await fs.readFile(this.dataFile, 'utf8');
      const parsed = JSON.parse(data);
      
      // Restore Maps from serialized data
      if (parsed.toolUsage) {
        this.metrics.toolUsage = new Map(Object.entries(parsed.toolUsage));
      }
      if (parsed.performance) {
        this.metrics.performance = new Map(Object.entries(parsed.performance));
      }
      if (parsed.errors) {
        this.metrics.errors = new Map(Object.entries(parsed.errors));
      }
      if (parsed.system) {
        this.metrics.system = { ...this.metrics.system, ...parsed.system };
      }
      
      console.log('📊 Analytics data loaded from persistence');
    } catch (error) {
      console.log('📊 No existing analytics data found, starting fresh');
    }
  }

  /**
   * Persist analytics data
   */
  async persistData() {
    try {
      const data = {
        toolUsage: Object.fromEntries(this.metrics.toolUsage),
        performance: Object.fromEntries(this.metrics.performance),
        errors: Object.fromEntries(this.metrics.errors),
        system: this.metrics.system,
        timestamp: new Date().toISOString()
      };
      
      await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2));
      
      this.emit('dataPersisted');
    } catch (error) {
      console.error('Failed to persist analytics data:', error);
    }
  }

  /**
   * Start persistence timer
   */
  startPersistenceTimer() {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }
    
    this.persistenceTimer = setInterval(() => {
      this.persistData();
    }, this.options.persistenceInterval);
  }

  /**
   * Start cleanup timer
   */
  startCleanupTimer() {
    // Clean up old data every hour, but use unref() so the timer doesn't
    // hold the Node.js event loop open when the app intends to exit.
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    // Allow process to exit naturally if this is the only pending handle
    if (typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Shutdown analytics system
   */
  async shutdown() {
    // Clear persistence timer
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }

    // Clear cleanup timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.options.enablePersistence) {
      await this.persistData();
    }

    this.emit('analyticsShutdown');
  }

  /**
   * Clean up old data based on retention policy
   */
  cleanupOldData() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.dataRetentionDays);
    const cutoffTime = cutoffDate.getTime();

    // Clean up daily usage data
    for (const [dayKey] of this.metrics.patterns.dailyUsage) {
      const dayTime = new Date(dayKey).getTime();
      if (dayTime < cutoffTime) {
        this.metrics.patterns.dailyUsage.delete(dayKey);
      }
    }

    // Clean up old session data
    for (const [sessionId, session] of this.sessionData) {
      if (session.startTime < cutoffTime) {
        this.sessionData.delete(sessionId);
      }
    }

    this.emit('dataCleanupCompleted');
  }
}

// Export singleton instance
export const toolAnalytics = new ToolAnalytics();
