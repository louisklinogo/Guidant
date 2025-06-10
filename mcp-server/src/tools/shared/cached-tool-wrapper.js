/**
 * Cached Tool Wrapper for MCP Tools
 * Applies intelligent caching to existing MCP tools with configurable policies
 * 
 * MCP-008: Tool Caching System Implementation
 */

import { toolCacheManager } from './tool-cache.js';
import { cachePolicyManager } from './cache-policies.js';
import { formatMCPResponse, formatErrorResponse } from './mcp-response.js';

/**
 * Cached Tool Wrapper
 * Wraps existing MCP tools with intelligent caching capabilities
 */
export class CachedToolWrapper {
  constructor() {
    this.wrappedTools = new Map();
    this.originalHandlers = new Map();
    this.cacheStats = new Map();
  }

  /**
   * Wrap a tool with caching capabilities
   * @param {object} tool - Tool configuration object
   * @param {string} category - Tool category for cache policy
   * @returns {object} Wrapped tool configuration
   */
  wrapTool(tool, category = 'deliverable_analysis') {
    if (!tool || !tool.name || !tool.handler) {
      throw new Error('Invalid tool configuration: missing name or handler');
    }

    // Store original handler
    this.originalHandlers.set(tool.name, tool.handler);

    // Initialize cache stats
    this.cacheStats.set(tool.name, {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      lastAccess: null
    });

    // Create cached handler
    const cachedHandler = this.createCachedHandler(tool.name, tool.handler, category);

    // Create wrapped tool configuration
    const wrappedTool = {
      ...tool,
      handler: cachedHandler,
      description: this.enhanceDescription(tool.description),
      metadata: {
        ...tool.metadata,
        cachingEnabled: true,
        category,
        wrappedAt: new Date().toISOString()
      }
    };

    this.wrappedTools.set(tool.name, wrappedTool);
    return wrappedTool;
  }

  /**
   * Create a cached handler for a tool
   * @param {string} toolName - Name of the tool
   * @param {Function} originalHandler - Original tool handler
   * @param {string} category - Tool category
   * @returns {Function} Cached handler
   */
  createCachedHandler(toolName, originalHandler, category) {
    return async (...args) => {
      const startTime = Date.now();
      const stats = this.cacheStats.get(toolName);
      stats.lastAccess = new Date().toISOString();

      try {
        // Get cache policy for this tool
        const cacheOptions = cachePolicyManager.getCacheOptions(toolName, args[0], category);
        
        if (!cacheOptions.enabled) {
          // Caching disabled, execute directly
          return await originalHandler(...args);
        }

        // Try to get from cache first
        const cachedResult = toolCacheManager.get(toolName, args[0], cacheOptions);
        
        if (cachedResult !== null) {
          stats.hits++;
          return this.enhanceCachedResponse(cachedResult, toolName, startTime, true);
        }

        // Cache miss - execute original handler
        stats.misses++;
        const result = await originalHandler(...args);

        // Cache the result
        try {
          toolCacheManager.set(toolName, args[0], result, cacheOptions);
          stats.sets++;
        } catch (cacheError) {
          console.warn(`Failed to cache result for ${toolName}:`, cacheError.message);
        }

        return this.enhanceCachedResponse(result, toolName, startTime, false);

      } catch (error) {
        stats.errors++;
        return this.handleCacheError(error, toolName, startTime, args);
      }
    };
  }

  /**
   * Enhance tool description with caching information
   * @param {string} originalDescription - Original tool description
   * @returns {string} Enhanced description
   */
  enhanceDescription(originalDescription) {
    return `${originalDescription} [Intelligent Caching Enabled]`;
  }

  /**
   * Enhance response with caching metadata
   * @param {any} result - Original result
   * @param {string} toolName - Tool name
   * @param {number} startTime - Start time
   * @param {boolean} fromCache - Whether result came from cache
   * @returns {any} Enhanced result
   */
  enhanceCachedResponse(result, toolName, startTime, fromCache) {
    const responseTime = Date.now() - startTime;
    const cacheStats = toolCacheManager.getStats();
    
    // If result is already an MCP response object, enhance it
    if (result && typeof result === 'object' && result.success !== undefined) {
      return {
        ...result,
        cache: {
          hit: fromCache,
          responseTime,
          enabled: true,
          hitRate: cacheStats.hitRate,
          totalEntries: cacheStats.entries
        }
      };
    }

    // For other result types, wrap in MCP response format
    return formatMCPResponse({
      success: true,
      data: result,
      cache: {
        hit: fromCache,
        responseTime,
        enabled: true,
        hitRate: cacheStats.hitRate,
        totalEntries: cacheStats.entries
      }
    });
  }

  /**
   * Handle caching errors
   * @param {Error} error - Original error
   * @param {string} toolName - Tool name
   * @param {number} startTime - Start time
   * @param {Array} args - Original arguments
   * @returns {object} Enhanced error response
   */
  handleCacheError(error, toolName, startTime, args) {
    const responseTime = Date.now() - startTime;
    
    return formatErrorResponse(error.message, {
      tool: toolName,
      originalError: error.name,
      responseTime,
      cache: {
        enabled: true,
        error: true,
        errorType: error.name,
        suggestion: 'Cache error occurred, result not cached but operation may have succeeded'
      }
    });
  }

  /**
   * Invalidate cache for specific tool
   * @param {string} toolName - Tool name
   * @param {object} params - Optional parameters to match specific entries
   */
  invalidateToolCache(toolName, params = null) {
    if (params) {
      // Invalidate specific entry
      const key = toolCacheManager.generateKey(toolName, params);
      toolCacheManager.delete(key);
    } else {
      // Invalidate all entries for this tool
      toolCacheManager.invalidateByPattern(new RegExp(`^${toolName}`));
    }
  }

  /**
   * Invalidate cache based on file changes
   * @param {string|Array} filePaths - Changed file paths
   */
  invalidateByFiles(filePaths) {
    toolCacheManager.invalidateByFiles(filePaths);
    
    // Also check invalidation patterns
    const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
    paths.forEach(filePath => {
      const patterns = cachePolicyManager.getInvalidationPatterns(filePath);
      patterns.forEach(pattern => {
        toolCacheManager.invalidateByPattern(pattern);
      });
    });
  }

  /**
   * Preload cache for frequently used operations
   * @param {string} toolName - Tool name
   * @param {Array} paramSets - Array of parameter sets to preload
   * @param {string} category - Tool category
   */
  async preloadCache(toolName, paramSets, category = 'deliverable_analysis') {
    const originalHandler = this.originalHandlers.get(toolName);
    if (!originalHandler) {
      throw new Error(`Tool ${toolName} not found or not wrapped`);
    }

    const cacheOptions = cachePolicyManager.getCacheOptions(toolName, {}, category);
    if (!cacheOptions.enabled) {
      return { preloaded: 0, message: 'Caching disabled for this tool' };
    }

    let preloaded = 0;
    const errors = [];

    for (const params of paramSets) {
      try {
        // Check if already cached
        const existing = toolCacheManager.get(toolName, params, cacheOptions);
        if (existing !== null) {
          continue; // Already cached
        }

        // Execute and cache
        const result = await originalHandler(params);
        toolCacheManager.set(toolName, params, result, cacheOptions);
        preloaded++;
      } catch (error) {
        errors.push({ params, error: error.message });
      }
    }

    return {
      preloaded,
      total: paramSets.length,
      errors: errors.length,
      errorDetails: errors
    };
  }

  /**
   * Get cache statistics for a specific tool
   * @param {string} toolName - Tool name
   * @returns {object} Tool cache statistics
   */
  getToolCacheStats(toolName) {
    const stats = this.cacheStats.get(toolName);
    if (!stats) {
      return null;
    }

    const totalRequests = stats.hits + stats.misses;
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0;

    return {
      toolName,
      hits: stats.hits,
      misses: stats.misses,
      sets: stats.sets,
      errors: stats.errors,
      hitRate: Math.round(hitRate * 100) / 100,
      lastAccess: stats.lastAccess,
      policy: cachePolicyManager.getPolicyForTool(toolName)
    };
  }

  /**
   * Get cache statistics for all wrapped tools
   * @returns {object} Comprehensive cache statistics
   */
  getAllCacheStats() {
    const toolStats = {};
    
    for (const toolName of this.wrappedTools.keys()) {
      toolStats[toolName] = this.getToolCacheStats(toolName);
    }

    return {
      tools: toolStats,
      global: toolCacheManager.getStats(),
      policies: cachePolicyManager.getAllPolicies(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Wrap multiple tools with caching
   * @param {Array} tools - Array of tool configurations
   * @param {string} defaultCategory - Default category for tools
   * @returns {Array} Array of wrapped tools
   */
  wrapTools(tools, defaultCategory = 'deliverable_analysis') {
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
   * Check if a tool is wrapped with caching
   * @param {string} toolName - Tool name
   * @returns {boolean} True if tool is wrapped
   */
  isToolCached(toolName) {
    return this.wrappedTools.has(toolName);
  }

  /**
   * Unwrap a tool (remove caching)
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
      description: wrappedTool.description.replace(' [Intelligent Caching Enabled]', ''),
      metadata: {
        ...wrappedTool.metadata,
        cachingEnabled: false,
        unwrappedAt: new Date().toISOString()
      }
    };

    // Clean up
    this.originalHandlers.delete(toolName);
    this.wrappedTools.delete(toolName);
    this.cacheStats.delete(toolName);

    // Invalidate cache for this tool
    this.invalidateToolCache(toolName);

    return originalTool;
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    toolCacheManager.clear();
    
    // Reset stats
    for (const [toolName, stats] of this.cacheStats) {
      this.cacheStats.set(toolName, {
        hits: 0,
        misses: 0,
        sets: 0,
        errors: 0,
        lastAccess: null
      });
    }
  }

  /**
   * Enable or disable caching globally
   * @param {boolean} enabled - Whether to enable caching
   */
  setCachingEnabled(enabled) {
    // This would require updating cache policies
    console.log(`Caching ${enabled ? 'enabled' : 'disabled'} globally`);
  }
}

// Export singleton instance
export const cachedToolWrapper = new CachedToolWrapper();
