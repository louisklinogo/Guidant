/**
 * Interface definitions for Enhanced Context Injection System
 * Following Interface Segregation Principle (ISP) - focused, specific interfaces
 */

/**
 * Interface for context source providers
 * Single responsibility: Retrieve context data from specific sources
 */
export class IContextSource {
  /**
   * Get context data from this source
   * @param {string} projectRoot - Project root directory
   * @param {string} phase - Current phase
   * @param {string} deliverable - Target deliverable
   * @param {object} options - Additional options
   * @returns {Promise<object>} Context data from this source
   */
  async getContext(projectRoot, phase, deliverable, options = {}) {
    throw new Error('IContextSource.getContext() must be implemented');
  }

  /**
   * Get the priority/weight of this context source
   * @returns {number} Priority (higher = more important)
   */
  getPriority() {
    throw new Error('IContextSource.getPriority() must be implemented');
  }

  /**
   * Check if this source is available/enabled
   * @returns {boolean} True if source is available
   */
  isAvailable() {
    throw new Error('IContextSource.isAvailable() must be implemented');
  }

  /**
   * Get the name/identifier of this context source
   * @returns {string} Source identifier
   */
  getSourceName() {
    throw new Error('IContextSource.getSourceName() must be implemented');
  }
}

/**
 * Interface for context optimization strategies
 * Single responsibility: Optimize context size and relevance for AI consumption
 */
export class IContextOptimizer {
  /**
   * Optimize aggregated context for AI consumption
   * @param {object} aggregatedContext - Raw aggregated context
   * @param {object} constraints - Optimization constraints (token limits, etc.)
   * @returns {Promise<object>} Optimized context
   */
  async optimizeContext(aggregatedContext, constraints = {}) {
    throw new Error('IContextOptimizer.optimizeContext() must be implemented');
  }

  /**
   * Estimate token count for context
   * @param {object} context - Context to estimate
   * @returns {number} Estimated token count
   */
  estimateTokenCount(context) {
    throw new Error('IContextOptimizer.estimateTokenCount() must be implemented');
  }

  /**
   * Get optimization strategy name
   * @returns {string} Strategy identifier
   */
  getStrategyName() {
    throw new Error('IContextOptimizer.getStrategyName() must be implemented');
  }
}

/**
 * Interface for context injection into templates
 * Single responsibility: Inject optimized context into AI prompts/templates
 */
export class IContextInjector {
  /**
   * Inject context into task generation template
   * @param {object} optimizedContext - Optimized context data
   * @param {string} templateType - Type of template (task, analysis, etc.)
   * @param {object} templateOptions - Template-specific options
   * @returns {Promise<string>} Enhanced prompt/template with injected context
   */
  async injectContext(optimizedContext, templateType, templateOptions = {}) {
    throw new Error('IContextInjector.injectContext() must be implemented');
  }

  /**
   * Get available template types
   * @returns {string[]} Array of supported template types
   */
  getSupportedTemplateTypes() {
    throw new Error('IContextInjector.getSupportedTemplateTypes() must be implemented');
  }

  /**
   * Validate template options
   * @param {string} templateType - Template type
   * @param {object} options - Options to validate
   * @returns {boolean} True if options are valid
   */
  validateTemplateOptions(templateType, options) {
    throw new Error('IContextInjector.validateTemplateOptions() must be implemented');
  }
}

/**
 * Interface for context aggregation strategies
 * Single responsibility: Combine context from multiple sources
 */
export class IContextAggregator {
  /**
   * Aggregate context from multiple sources
   * @param {IContextSource[]} sources - Array of context sources
   * @param {string} projectRoot - Project root directory
   * @param {string} phase - Current phase
   * @param {string} deliverable - Target deliverable
   * @param {object} options - Aggregation options
   * @returns {Promise<object>} Aggregated context
   */
  async aggregateContext(sources, projectRoot, phase, deliverable, options = {}) {
    throw new Error('IContextAggregator.aggregateContext() must be implemented');
  }

  /**
   * Merge context data from different sources
   * @param {object[]} contextData - Array of context objects from sources
   * @returns {object} Merged context
   */
  mergeContextData(contextData) {
    throw new Error('IContextAggregator.mergeContextData() must be implemented');
  }

  /**
   * Resolve conflicts between context sources
   * @param {object} conflicts - Detected conflicts
   * @returns {object} Resolved context
   */
  resolveConflicts(conflicts) {
    throw new Error('IContextAggregator.resolveConflicts() must be implemented');
  }
}

/**
 * Interface for caching context data
 * Single responsibility: Cache and retrieve context for performance
 */
export class IContextCache {
  /**
   * Get cached context if available
   * @param {string} cacheKey - Cache key
   * @returns {Promise<object|null>} Cached context or null
   */
  async get(cacheKey) {
    throw new Error('IContextCache.get() must be implemented');
  }

  /**
   * Store context in cache
   * @param {string} cacheKey - Cache key
   * @param {object} context - Context to cache
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<void>}
   */
  async set(cacheKey, context, ttl) {
    throw new Error('IContextCache.set() must be implemented');
  }

  /**
   * Clear cache entry
   * @param {string} cacheKey - Cache key to clear
   * @returns {Promise<void>}
   */
  async clear(cacheKey) {
    throw new Error('IContextCache.clear() must be implemented');
  }

  /**
   * Clear all cache entries
   * @returns {Promise<void>}
   */
  async clearAll() {
    throw new Error('IContextCache.clearAll() must be implemented');
  }

  /**
   * Generate cache key for context request
   * @param {string} projectRoot - Project root
   * @param {string} phase - Phase
   * @param {string} deliverable - Deliverable
   * @param {object} options - Additional options
   * @returns {string} Cache key
   */
  generateCacheKey(projectRoot, phase, deliverable, options = {}) {
    throw new Error('IContextCache.generateCacheKey() must be implemented');
  }
}

/**
 * Configuration interface for context injection system
 */
export const ContextInjectionConfig = {
  // Default token limits for different AI providers
  tokenLimits: {
    openrouter: 4000,
    perplexity: 8000,
    anthropic: 4000,
    openai: 4000,
    fallback: 2000
  },

  // Cache settings
  cache: {
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    maxEntries: 100,
    enabled: true
  },

  // Context source priorities
  sourcePriorities: {
    phaseTransition: 10,
    deliverableAnalysis: 9,
    projectState: 8,
    fileSystem: 7,
    legacy: 5
  },

  // Optimization settings
  optimization: {
    maxContextSize: 0.7, // Use 70% of token limit for context
    prioritizeRecent: true,
    includeMetadata: true,
    compressLongContent: true
  }
};
