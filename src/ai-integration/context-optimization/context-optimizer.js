/**
 * Context Optimizer
 * Optimizes aggregated context for AI consumption within token limits
 * Implements IContextOptimizer interface following Single Responsibility Principle
 */

import { IContextOptimizer, ContextInjectionConfig } from '../interfaces/context-interfaces.js';

export class ContextOptimizer extends IContextOptimizer {
  constructor(options = {}) {
    super();
    this.strategy = options.strategy || 'priority_based';
    this.tokenLimits = { ...ContextInjectionConfig.tokenLimits, ...options.tokenLimits };
    this.maxContextRatio = options.maxContextRatio || 0.7; // Use 70% of tokens for context
    this.compressionEnabled = options.compressionEnabled !== false;
    this.prioritizeRecent = options.prioritizeRecent !== false;
  }

  /**
   * Optimize aggregated context for AI consumption
   */
  async optimizeContext(aggregatedContext, constraints = {}) {
    try {
      const targetTokenLimit = this.calculateTargetTokenLimit(constraints);
      const currentTokenCount = this.estimateTokenCount(aggregatedContext);

      // Always apply the requested strategy, even if within limits (for testing)
      const shouldOptimize = currentTokenCount > targetTokenLimit || constraints.forceOptimization;

      if (!shouldOptimize) {
        return {
          success: true,
          optimizedContext: this.cleanupContext(aggregatedContext),
          metadata: {
            optimizedAt: new Date().toISOString(),
            strategy: 'no_optimization_needed',
            originalTokens: currentTokenCount,
            optimizedTokens: currentTokenCount,
            compressionRatio: 1.0,
            targetLimit: targetTokenLimit
          }
        };
      }

      // Apply optimization strategy
      const optimized = await this.applyOptimizationStrategy(
        aggregatedContext, 
        targetTokenLimit, 
        currentTokenCount
      );

      return {
        success: true,
        optimizedContext: optimized.context,
        metadata: {
          optimizedAt: new Date().toISOString(),
          strategy: this.strategy,
          originalTokens: currentTokenCount,
          optimizedTokens: optimized.tokenCount,
          compressionRatio: optimized.tokenCount / currentTokenCount,
          targetLimit: targetTokenLimit,
          optimizationSteps: optimized.steps
        }
      };
    } catch (error) {
      console.error('Failed to optimize context:', error);
      return {
        success: false,
        error: error.message,
        optimizedContext: this.getFallbackContext(aggregatedContext)
      };
    }
  }

  /**
   * Estimate token count for context
   */
  estimateTokenCount(context) {
    if (!context) return 0;

    // Simple token estimation: ~4 characters per token
    const contextString = JSON.stringify(context);
    return Math.ceil(contextString.length / 4);
  }

  /**
   * Calculate target token limit based on constraints
   */
  calculateTargetTokenLimit(constraints) {
    const provider = constraints.provider || 'openrouter';
    const baseLimit = this.tokenLimits[provider] || this.tokenLimits.fallback;
    
    // Reserve space for prompt template and response
    const contextLimit = Math.floor(baseLimit * this.maxContextRatio);
    
    // Apply any additional constraints
    if (constraints.maxTokens && constraints.maxTokens < contextLimit) {
      return Math.floor(constraints.maxTokens * this.maxContextRatio);
    }

    return contextLimit;
  }

  /**
   * Apply optimization strategy
   */
  async applyOptimizationStrategy(context, targetLimit, currentTokens) {
    let steps = [];
    let optimizedContext = { ...context };
    let currentSize = currentTokens;

    switch (this.strategy) {
      case 'priority_based':
        ({ context: optimizedContext, tokenCount: currentSize, steps } =
          await this.optimizePriorityBased(optimizedContext, targetLimit, steps));
        break;

      case 'compression':
        ({ context: optimizedContext, tokenCount: currentSize, steps } =
          await this.optimizeCompression(optimizedContext, targetLimit, steps));
        break;

      case 'selective':
        ({ context: optimizedContext, tokenCount: currentSize, steps } =
          await this.optimizeSelective(optimizedContext, targetLimit, steps));
        break;

      default:
        ({ context: optimizedContext, tokenCount: currentSize, steps } =
          await this.optimizePriorityBased(optimizedContext, targetLimit, steps));
    }

    return {
      context: optimizedContext,
      tokenCount: currentSize,
      steps
    };
  }

  /**
   * Priority-based optimization
   */
  async optimizePriorityBased(context, targetLimit, steps = []) {
    let optimized = { ...context };
    let currentSize = this.estimateTokenCount(optimized);

    // Step 1: Remove low-priority metadata
    if (currentSize > targetLimit) {
      optimized = this.removeLowPriorityMetadata(optimized);
      const newSize = this.estimateTokenCount(optimized);
      steps.push({
        step: 'remove_low_priority_metadata',
        tokensSaved: currentSize - newSize,
        newSize
      });
      currentSize = newSize;
    }

    // Step 2: Compress verbose content
    if (currentSize > targetLimit && this.compressionEnabled) {
      optimized = this.compressVerboseContent(optimized);
      const newSize = this.estimateTokenCount(optimized);
      steps.push({
        step: 'compress_verbose_content',
        tokensSaved: currentSize - newSize,
        newSize
      });
      currentSize = newSize;
    }

    // Step 3: Prioritize recent and high-confidence data
    if (currentSize > targetLimit) {
      optimized = this.prioritizeHighValueContent(optimized);
      const newSize = this.estimateTokenCount(optimized);
      steps.push({
        step: 'prioritize_high_value_content',
        tokensSaved: currentSize - newSize,
        newSize
      });
      currentSize = newSize;
    }

    // Step 4: Remove redundant information
    if (currentSize > targetLimit) {
      optimized = this.removeRedundantInformation(optimized);
      const newSize = this.estimateTokenCount(optimized);
      steps.push({
        step: 'remove_redundant_information',
        tokensSaved: currentSize - newSize,
        newSize
      });
      currentSize = newSize;
    }

    return { context: optimized, tokenCount: currentSize, steps };
  }

  /**
   * Compression-based optimization
   */
  async optimizeCompression(context, targetLimit, steps = []) {
    let optimized = { ...context };
    let currentSize = this.estimateTokenCount(optimized);

    // Aggressive compression of all content
    optimized = this.compressVerboseContent(optimized);
    const newSize = this.estimateTokenCount(optimized);
    steps.push({
      step: 'aggressive_compression',
      tokensSaved: currentSize - newSize,
      newSize
    });

    return { context: optimized, tokenCount: newSize, steps };
  }

  /**
   * Selective optimization
   */
  async optimizeSelective(context, targetLimit, steps = []) {
    let optimized = { ...context };
    let currentSize = this.estimateTokenCount(optimized);

    // Select only the most relevant sections
    optimized = this.selectMostRelevantSections(optimized, targetLimit);
    const newSize = this.estimateTokenCount(optimized);
    steps.push({
      step: 'selective_content',
      tokensSaved: currentSize - newSize,
      newSize
    });

    return { context: optimized, tokenCount: newSize, steps };
  }

  /**
   * Select most relevant sections for selective optimization
   */
  selectMostRelevantSections(context, targetLimit) {
    const optimized = { ...context };

    if (optimized.unified) {
      // Keep only high-priority sections
      if (optimized.unified.insights) {
        optimized.unified.insights.key = optimized.unified.insights.key?.slice(0, 3) || [];
        optimized.unified.insights.technical = optimized.unified.insights.technical?.slice(0, 2) || [];
        optimized.unified.insights.decisions = optimized.unified.insights.decisions?.slice(0, 2) || [];
        optimized.unified.insights.recommendations = optimized.unified.insights.recommendations?.slice(0, 2) || [];
      }

      if (optimized.unified.tasks) {
        optimized.unified.tasks.prioritized = optimized.unified.tasks.prioritized?.slice(0, 3) || [];
        optimized.unified.tasks.focus = optimized.unified.tasks.focus?.slice(0, 2) || [];
      }
    }

    return optimized;
  }

  /**
   * Remove low-priority metadata
   */
  removeLowPriorityMetadata(context) {
    const optimized = { ...context };

    // Remove detailed metadata from sources
    if (optimized.sources) {
      optimized.sources = optimized.sources.map(source => ({
        name: source.name,
        priority: source.priority
      }));
    }

    // Remove verbose metadata from data sections
    if (optimized.data) {
      for (const [sourceKey, sourceData] of Object.entries(optimized.data)) {
        if (sourceData && typeof sourceData === 'object') {
          // Remove metadata fields that are less critical
          const { metadata, ...essentialData } = sourceData;
          optimized.data[sourceKey] = essentialData;
        }
      }
    }

    return optimized;
  }

  /**
   * Compress verbose content
   */
  compressVerboseContent(context) {
    const optimized = { ...context };

    if (optimized.unified) {
      // Compress insights arrays
      if (optimized.unified.insights) {
        optimized.unified.insights.key = this.compressArray(optimized.unified.insights.key, 5);
        optimized.unified.insights.technical = this.compressArray(optimized.unified.insights.technical, 3);
        optimized.unified.insights.decisions = this.compressArray(optimized.unified.insights.decisions, 3);
        optimized.unified.insights.recommendations = this.compressArray(optimized.unified.insights.recommendations, 3);
      }

      // Compress task arrays
      if (optimized.unified.tasks) {
        optimized.unified.tasks.prioritized = this.compressArray(optimized.unified.tasks.prioritized, 5);
        optimized.unified.tasks.focus = this.compressArray(optimized.unified.tasks.focus, 3);
      }

      // Compress quality information
      if (optimized.unified.quality) {
        optimized.unified.quality.gates = this.compressArray(optimized.unified.quality.gates, 3);
        optimized.unified.quality.risks = this.compressArray(optimized.unified.quality.risks, 3);
      }
    }

    return optimized;
  }

  /**
   * Prioritize high-value content
   */
  prioritizeHighValueContent(context) {
    const optimized = { ...context };

    // Keep only high-confidence sources
    if (optimized.sources) {
      optimized.sources = optimized.sources.filter(source => 
        source.confidence > 0.6 || source.priority > 8
      );
    }

    // Filter data to keep only high-priority sources
    if (optimized.data) {
      const highPrioritySources = optimized.sources.map(s => s.name);
      const filteredData = {};
      
      for (const sourceKey of highPrioritySources) {
        if (optimized.data[sourceKey]) {
          filteredData[sourceKey] = optimized.data[sourceKey];
        }
      }
      
      optimized.data = filteredData;
    }

    return optimized;
  }

  /**
   * Remove redundant information
   */
  removeRedundantInformation(context) {
    const optimized = { ...context };

    if (optimized.unified) {
      // Remove duplicate insights
      if (optimized.unified.insights) {
        optimized.unified.insights.key = this.removeDuplicates(optimized.unified.insights.key);
        optimized.unified.insights.technical = this.removeDuplicates(optimized.unified.insights.technical);
        optimized.unified.insights.decisions = this.removeDuplicates(optimized.unified.insights.decisions);
      }

      // Remove duplicate tasks
      if (optimized.unified.tasks) {
        optimized.unified.tasks.prioritized = this.removeDuplicateTasks(optimized.unified.tasks.prioritized);
        optimized.unified.tasks.focus = this.removeDuplicates(optimized.unified.tasks.focus);
      }
    }

    return optimized;
  }

  /**
   * Compress array to maximum length
   */
  compressArray(array, maxLength) {
    if (!Array.isArray(array) || array.length <= maxLength) {
      return array;
    }

    // Keep most important items (first items are usually higher priority)
    return array.slice(0, maxLength);
  }

  /**
   * Remove duplicate items from array
   */
  removeDuplicates(array) {
    if (!Array.isArray(array)) return array;
    
    const seen = new Set();
    return array.filter(item => {
      const key = typeof item === 'string' ? item : JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Remove duplicate tasks (more sophisticated deduplication)
   */
  removeDuplicateTasks(tasks) {
    if (!Array.isArray(tasks)) return tasks;
    
    const seen = new Set();
    return tasks.filter(task => {
      const key = task.task || JSON.stringify(task);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Cleanup context (remove empty objects, null values, etc.)
   */
  cleanupContext(context) {
    return this.removeEmptyValues(context);
  }

  /**
   * Remove empty values recursively
   */
  removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
      return obj.filter(item => item != null).map(item => this.removeEmptyValues(item));
    }
    
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value != null) {
          const cleanedValue = this.removeEmptyValues(value);
          if (cleanedValue != null && 
              !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
              !(typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0)) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * Get fallback context when optimization fails
   */
  getFallbackContext(originalContext) {
    return {
      phase: originalContext.phase,
      deliverable: originalContext.deliverable,
      unified: {
        project: originalContext.unified?.project || {},
        workflow: { currentPhase: originalContext.phase },
        insights: { key: ['Context optimization failed - using minimal context'] },
        technical: { techStack: {} },
        quality: { gates: [], risks: [] },
        tasks: { prioritized: [], focus: [] }
      },
      metadata: {
        confidence: 0.1,
        freshness: 0.5,
        coverage: 0.1,
        optimizationFailed: true
      }
    };
  }

  getStrategyName() {
    return this.strategy;
  }
}
