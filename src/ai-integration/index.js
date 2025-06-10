/**
 * Enhanced Context Injection System - Main Export
 * BACKEND-003: SOLID-Compliant Enhanced Context Injection System
 * 
 * This module provides a complete enhanced context injection system that:
 * - Aggregates context from multiple sources (phase transitions, deliverable analysis, project state)
 * - Optimizes context size for AI token limits
 * - Injects enhanced context into AI task generation templates
 * - Follows SOLID principles with dependency injection and extensible architecture
 */

// Main orchestrator
import { EnhancedContextOrchestrator } from './enhanced-context-orchestrator.js';
export { EnhancedContextOrchestrator };

// Core interfaces (for extensibility)
export {
  IContextSource,
  IContextOptimizer,
  IContextInjector,
  IContextAggregator,
  IContextCache,
  ContextInjectionConfig
} from './interfaces/context-interfaces.js';

// Context sources
export { PhaseTransitionContextSource } from './context-sources/phase-transition-source.js';
export { DeliverableAnalysisContextSource } from './context-sources/deliverable-analysis-source.js';
export { ProjectStateContextSource } from './context-sources/project-state-source.js';

// Core components
export { ContextAggregator } from './context-aggregation/context-aggregator.js';
export { ContextOptimizer } from './context-optimization/context-optimizer.js';
export { ContextInjector } from './context-injection/context-injector.js';
export { ContextCache } from './caching/context-cache.js';

// Legacy exports for backward compatibility
export { gatherProjectContext, generateAITask } from './task-generator.js';

/**
 * Factory function to create a configured Enhanced Context Orchestrator
 * Provides sensible defaults while allowing full customization
 */
export function createEnhancedContextOrchestrator(options = {}) {

  const defaultOptions = {
    // Aggregator options
    aggregatorOptions: {
      conflictResolutionStrategy: 'priority',
      enableParallelFetching: true,
      timeout: 10000,
      maxConcurrency: 5
    },

    // Optimizer options
    optimizerOptions: {
      strategy: 'priority_based',
      maxContextRatio: 0.7,
      compressionEnabled: true,
      prioritizeRecent: true
    },

    // Injector options
    injectorOptions: {
      templateEngine: 'simple',
      includeMetadata: true,
      formatStyle: 'structured'
    },

    // Cache options
    cacheOptions: {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxEntries: 100,
      cleanupInterval: 5 * 60 * 1000 // 5 minutes
    },

    // Context source options
    phaseTransitionOptions: {
      priority: 10,
      enabled: true,
      cacheTTL: 15 * 60 * 1000
    },

    deliverableAnalysisOptions: {
      priority: 9,
      enabled: true,
      includeAIInsights: true
    },

    projectStateOptions: {
      priority: 8,
      enabled: true,
      includeFileStructure: true,
      maxFiles: 20
    },

    // General options
    enableCaching: true,
    enableParallelProcessing: true,
    timeout: 30000,
    retryAttempts: 2
  };

  // Deep merge options
  const mergedOptions = deepMerge(defaultOptions, options);

  return new EnhancedContextOrchestrator(mergedOptions);
}

/**
 * Convenience function for enhanced task generation
 * Integrates with existing task generation workflow
 */
export async function generateEnhancedAITask(phase, role, deliverable, projectRoot, options = {}) {
  try {
    // Create orchestrator with options
    const orchestrator = createEnhancedContextOrchestrator(options.orchestratorOptions);
    
    // Generate enhanced context
    const contextResult = await orchestrator.generateEnhancedContext(
      projectRoot, 
      phase, 
      deliverable, 
      {
        role,
        provider: options.provider || 'openrouter',
        templateType: 'task_generation',
        ...options
      }
    );

    if (!contextResult.success) {
      console.warn('Enhanced context generation failed, falling back to legacy method');
      // Fallback to legacy task generation
      const { generateAITask } = await import('./task-generator.js');
      return await generateAITask(phase, role, deliverable, projectRoot);
    }

    // Use the enhanced context with AI task generation
    const { AITaskGenerator } = await import('./task-generator.js');
    const generator = new AITaskGenerator(role);

    // Create enhanced context for the AI generator
    const enhancedPrompt = contextResult.injectedTemplate;
    
    // Generate task using enhanced context
    const taskResult = await generator.generateTaskWithEnhancedContext(
      enhancedPrompt,
      {
        phase,
        role,
        deliverable,
        projectRoot,
        enhancedContext: contextResult.optimizedContext
      }
    );

    return {
      ...taskResult,
      metadata: {
        ...taskResult.metadata,
        enhancedContext: true,
        contextQuality: contextResult.metadata?.contextQuality,
        contextConfidence: contextResult.metadata?.overallConfidence,
        processingTime: contextResult.metadata?.performance?.totalTime
      }
    };

  } catch (error) {
    console.error('Enhanced AI task generation failed:', error);
    
    // Fallback to legacy method
    const { generateAITask } = await import('./task-generator.js');
    return await generateAITask(phase, role, deliverable, projectRoot);
  }
}

/**
 * Utility function to validate enhanced context system
 */
export async function validateEnhancedContextSystem(projectRoot, options = {}) {
  const orchestrator = createEnhancedContextOrchestrator(options);
  
  try {
    // Test system status
    const status = await orchestrator.getSystemStatus();
    
    // Test context generation with a simple request
    const testResult = await orchestrator.generateEnhancedContext(
      projectRoot,
      'requirements',
      'prd_complete',
      { provider: 'test', skipAI: true }
    );

    return {
      valid: true,
      status,
      testResult: {
        success: testResult.success,
        sourcesUsed: testResult.metadata?.aggregation?.successfulSources || 0,
        contextQuality: testResult.metadata?.contextQuality || 'unknown'
      },
      validatedAt: new Date().toISOString()
    };

  } catch (error) {
    return {
      valid: false,
      error: error.message,
      validatedAt: new Date().toISOString()
    };
  }
}

/**
 * Deep merge utility function
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Configuration presets for different use cases
 */
export const ContextPresets = {
  // High performance, minimal context
  minimal: {
    optimizerOptions: {
      strategy: 'selective',
      maxContextRatio: 0.5,
      compressionEnabled: true
    },
    cacheOptions: {
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      maxEntries: 50
    }
  },

  // Balanced performance and context richness
  balanced: {
    optimizerOptions: {
      strategy: 'priority_based',
      maxContextRatio: 0.7,
      compressionEnabled: true
    },
    cacheOptions: {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxEntries: 100
    }
  },

  // Maximum context richness
  comprehensive: {
    optimizerOptions: {
      strategy: 'compression',
      maxContextRatio: 0.8,
      compressionEnabled: false
    },
    deliverableAnalysisOptions: {
      includeAIInsights: true
    },
    cacheOptions: {
      defaultTTL: 10 * 60 * 1000, // 10 minutes
      maxEntries: 200
    }
  },

  // Development/testing preset
  development: {
    enableCaching: false,
    timeout: 60000,
    retryAttempts: 1,
    optimizerOptions: {
      strategy: 'priority_based',
      maxContextRatio: 0.9
    }
  }
};

/**
 * Apply preset configuration
 */
export function applyContextPreset(presetName, additionalOptions = {}) {
  const preset = ContextPresets[presetName];
  if (!preset) {
    throw new Error(`Unknown context preset: ${presetName}`);
  }
  
  return deepMerge(preset, additionalOptions);
}
