/**
 * Resilient Tool Wrapper for MCP Tools
 * Applies circuit breaker protection to existing MCP tools
 * 
 * MCP-007: Circuit Breaker Pattern Implementation
 */

import { circuitBreakerManager } from './circuit-breaker-manager.js';
import { resilienceConfigManager } from './resilience-config.js';
import { formatMCPResponse, formatErrorResponse } from './mcp-response.js';

/**
 * Resilient Tool Wrapper
 * Wraps existing MCP tools with circuit breaker protection and enhanced error handling
 */
export class ResilientToolWrapper {
  constructor() {
    this.wrappedTools = new Map();
    this.originalHandlers = new Map();
  }

  /**
   * Wrap a tool with circuit breaker protection
   * @param {object} tool - Tool configuration object
   * @param {string} category - Tool category for configuration
   * @returns {object} Wrapped tool configuration
   */
  wrapTool(tool, category = 'analysis') {
    if (!tool || !tool.name || !tool.handler) {
      throw new Error('Invalid tool configuration: missing name or handler');
    }

    // Store original handler
    this.originalHandlers.set(tool.name, tool.handler);

    // Create wrapped handler
    const wrappedHandler = this.createWrappedHandler(tool.name, tool.handler, category);

    // Create wrapped tool configuration
    const wrappedTool = {
      ...tool,
      handler: wrappedHandler,
      description: this.enhanceDescription(tool.description),
      metadata: {
        ...tool.metadata,
        circuitBreakerEnabled: true,
        category,
        wrappedAt: new Date().toISOString()
      }
    };

    this.wrappedTools.set(tool.name, wrappedTool);
    return wrappedTool;
  }

  /**
   * Create a wrapped handler with circuit breaker protection
   * @param {string} toolName - Name of the tool
   * @param {Function} originalHandler - Original tool handler
   * @param {string} category - Tool category
   * @returns {Function} Wrapped handler
   */
  createWrappedHandler(toolName, originalHandler, category) {
    return async (...args) => {
      const startTime = Date.now();
      
      try {
        // Execute with circuit breaker protection
        const result = await circuitBreakerManager.executeWithProtection(
          toolName,
          () => originalHandler(...args),
          { category }
        );

        // Enhance successful response with resilience metadata
        return this.enhanceSuccessResponse(result, toolName, startTime);

      } catch (error) {
        // Handle and enhance error response
        return this.handleError(error, toolName, startTime, args);
      }
    };
  }

  /**
   * Enhance tool description with circuit breaker information
   * @param {string} originalDescription - Original tool description
   * @returns {string} Enhanced description
   */
  enhanceDescription(originalDescription) {
    return `${originalDescription} [Protected by Circuit Breaker]`;
  }

  /**
   * Enhance successful response with resilience metadata
   * @param {any} result - Original result
   * @param {string} toolName - Tool name
   * @param {number} startTime - Start time
   * @returns {any} Enhanced result
   */
  enhanceSuccessResponse(result, toolName, startTime) {
    const responseTime = Date.now() - startTime;
    const circuitBreaker = circuitBreakerManager.getCircuitBreakerByName(toolName);
    
    // If result is already an MCP response object, enhance it
    if (result && typeof result === 'object' && result.success !== undefined) {
      return {
        ...result,
        resilience: {
          circuitBreakerState: circuitBreaker?.state || 'unknown',
          responseTime,
          protected: true,
          healthScore: circuitBreaker?.getMetrics().healthScore || 100
        }
      };
    }

    // For other result types, wrap in MCP response format
    return formatMCPResponse({
      success: true,
      data: result,
      resilience: {
        circuitBreakerState: circuitBreaker?.state || 'unknown',
        responseTime,
        protected: true,
        healthScore: circuitBreaker?.getMetrics().healthScore || 100
      }
    });
  }

  /**
   * Handle errors with enhanced error information
   * @param {Error} error - Original error
   * @param {string} toolName - Tool name
   * @param {number} startTime - Start time
   * @param {Array} args - Original arguments
   * @returns {object} Enhanced error response
   */
  handleError(error, toolName, startTime, args) {
    const responseTime = Date.now() - startTime;
    const circuitBreaker = circuitBreakerManager.getCircuitBreakerByName(toolName);
    
    // Determine error type and appropriate response
    const isCircuitBreakerError = error.name === 'CircuitBreakerError';
    const shouldTriggerBreaker = resilienceConfigManager.shouldTriggerCircuitBreaker(error);
    
    return formatErrorResponse(error.message, {
      tool: toolName,
      originalError: error.name,
      responseTime,
      resilience: {
        circuitBreakerState: circuitBreaker?.state || 'unknown',
        isCircuitBreakerError,
        shouldTriggerBreaker,
        protected: true,
        healthScore: circuitBreaker?.getMetrics().healthScore || 0,
        lastFailureTime: circuitBreaker?.lastFailureTime || null
      },
      recovery: isCircuitBreakerError ? {
        suggestion: 'Circuit breaker is protecting against failures. Wait for recovery or check service health.',
        estimatedRecoveryTime: this.estimateRecoveryTime(circuitBreaker),
        alternativeActions: this.suggestAlternativeActions(toolName)
      } : null
    });
  }

  /**
   * Estimate recovery time for circuit breaker
   * @param {CircuitBreaker} circuitBreaker - Circuit breaker instance
   * @returns {string} Estimated recovery time
   */
  estimateRecoveryTime(circuitBreaker) {
    if (!circuitBreaker || !circuitBreaker.lastFailureTime) {
      return 'Unknown';
    }

    const timeSinceFailure = Date.now() - circuitBreaker.lastFailureTime;
    const recoveryTimeout = circuitBreaker.recoveryTimeout;
    const remainingTime = Math.max(0, recoveryTimeout - timeSinceFailure);

    if (remainingTime === 0) {
      return 'Ready for retry';
    }

    const seconds = Math.ceil(remainingTime / 1000);
    return `${seconds} seconds`;
  }

  /**
   * Suggest alternative actions when circuit breaker is open
   * @param {string} toolName - Tool name
   * @returns {Array} Array of alternative action suggestions
   */
  suggestAlternativeActions(toolName) {
    const alternatives = [];

    // Tool-specific alternatives
    if (toolName.includes('validate')) {
      alternatives.push('Use cached validation results if available');
      alternatives.push('Perform manual validation review');
    }

    if (toolName.includes('classify')) {
      alternatives.push('Use default project classification');
      alternatives.push('Manually specify project type');
    }

    if (toolName.includes('discover')) {
      alternatives.push('Use known agent configurations');
      alternatives.push('Check local agent registry');
    }

    // Generic alternatives
    alternatives.push('Check tool health status');
    alternatives.push('Try again after recovery timeout');
    alternatives.push('Contact system administrator if issues persist');

    return alternatives;
  }

  /**
   * Wrap multiple tools with circuit breaker protection
   * @param {Array} tools - Array of tool configurations
   * @param {string} defaultCategory - Default category for tools
   * @returns {Array} Array of wrapped tools
   */
  wrapTools(tools, defaultCategory = 'analysis') {
    return tools.map(tool => {
      const category = tool.category || defaultCategory;
      return this.wrapTool(tool, category);
    });
  }

  /**
   * Get original handler for a tool (for testing/debugging)
   * @param {string} toolName - Tool name
   * @returns {Function|null} Original handler
   */
  getOriginalHandler(toolName) {
    return this.originalHandlers.get(toolName) || null;
  }

  /**
   * Get wrapped tool configuration
   * @param {string} toolName - Tool name
   * @returns {object|null} Wrapped tool configuration
   */
  getWrappedTool(toolName) {
    return this.wrappedTools.get(toolName) || null;
  }

  /**
   * Check if a tool is wrapped
   * @param {string} toolName - Tool name
   * @returns {boolean} True if tool is wrapped
   */
  isToolWrapped(toolName) {
    return this.wrappedTools.has(toolName);
  }

  /**
   * Unwrap a tool (remove circuit breaker protection)
   * @param {string} toolName - Tool name
   * @returns {object|null} Original tool configuration
   */
  unwrapTool(toolName) {
    const originalHandler = this.originalHandlers.get(toolName);
    const wrappedTool = this.wrappedTools.get(toolName);

    if (!originalHandler || !wrappedTool) {
      return null;
    }

    // Restore original handler
    const originalTool = {
      ...wrappedTool,
      handler: originalHandler,
      description: wrappedTool.description.replace(' [Protected by Circuit Breaker]', ''),
      metadata: {
        ...wrappedTool.metadata,
        circuitBreakerEnabled: false,
        unwrappedAt: new Date().toISOString()
      }
    };

    // Clean up
    this.originalHandlers.delete(toolName);
    this.wrappedTools.delete(toolName);

    return originalTool;
  }

  /**
   * Get statistics for all wrapped tools
   * @returns {object} Wrapper statistics
   */
  getStatistics() {
    return {
      totalWrappedTools: this.wrappedTools.size,
      wrappedToolNames: Array.from(this.wrappedTools.keys()),
      circuitBreakerMetrics: circuitBreakerManager.getAllMetrics(),
      healthStatus: circuitBreakerManager.getHealthStatus(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all circuit breakers for wrapped tools
   */
  resetAllCircuitBreakers() {
    circuitBreakerManager.resetAllCircuitBreakers();
  }

  /**
   * Enable or disable circuit breaker protection globally
   * @param {boolean} enabled - Whether to enable protection
   */
  setProtectionEnabled(enabled) {
    circuitBreakerManager.setEnabled(enabled);
  }
}

// Export singleton instance
export const resilientToolWrapper = new ResilientToolWrapper();
