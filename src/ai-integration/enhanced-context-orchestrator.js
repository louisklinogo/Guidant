/**
 * Enhanced Context Orchestrator
 * Main coordinator for the Enhanced Context Injection System
 * Implements Dependency Inversion Principle with configurable components
 * Follows SOLID principles throughout
 */

import { ContextAggregator } from './context-aggregation/context-aggregator.js';
import { ContextOptimizer } from './context-optimization/context-optimizer.js';
import { ContextInjector } from './context-injection/context-injector.js';

// Context Sources
import { PhaseTransitionContextSource } from './context-sources/phase-transition-source.js';
import { DeliverableAnalysisContextSource } from './context-sources/deliverable-analysis-source.js';
import { ProjectStateContextSource } from './context-sources/project-state-source.js';

// Cache implementation
import { ContextCache } from './caching/context-cache.js';

export class EnhancedContextOrchestrator {
  constructor(options = {}) {
    // Dependency injection - all components are configurable
    this.aggregator = options.aggregator || new ContextAggregator(options.aggregatorOptions);
    this.optimizer = options.optimizer || new ContextOptimizer(options.optimizerOptions);
    this.injector = options.injector || new ContextInjector(options.injectorOptions);
    this.cache = options.cache || new ContextCache(options.cacheOptions);

    // Context sources - configurable and extensible
    this.contextSources = options.contextSources || this.createDefaultContextSources(options);
    
    // Configuration
    this.enableCaching = options.enableCaching !== false;
    this.enableParallelProcessing = options.enableParallelProcessing !== false;
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retryAttempts = options.retryAttempts || 2;
  }

  /**
   * Generate enhanced context for AI task generation
   * Main orchestration method that coordinates all components
   */
  async generateEnhancedContext(projectRoot, phase, deliverable, options = {}) {
    const startTime = Date.now();
    
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(projectRoot, phase, deliverable, options);
      
      // Try to get from cache first
      if (this.enableCaching) {
        const cachedResult = await this.cache.get(cacheKey);
        if (cachedResult) {
          console.log('✅ Enhanced context retrieved from cache');
          return {
            ...cachedResult,
            metadata: {
              ...cachedResult.metadata,
              fromCache: true,
              retrievedAt: new Date().toISOString()
            }
          };
        }
      }

      // Step 1: Aggregate context from all sources
      console.log('🔄 Aggregating context from multiple sources...');
      const aggregationResult = await this.aggregateContextWithRetry(
        projectRoot, phase, deliverable, options
      );

      if (!aggregationResult.success) {
        console.warn('Context aggregation failed, using fallback');
        return {
          success: false,
          projectRoot,
          phase,
          deliverable,
          error: `Context aggregation failed: ${aggregationResult.error}`,
          fallbackContext: this.generateFallbackContext(projectRoot, phase, deliverable),
          metadata: {
            generatedAt: new Date().toISOString(),
            processingTimeMs: Date.now() - startTime,
            fromCache: false,
            failed: true,
            errorType: 'aggregation_failure'
          }
        };
      }

      // Step 2: Optimize context for AI consumption
      console.log('🔄 Optimizing context for AI consumption...');
      const optimizationResult = await this.optimizeContextWithRetry(
        aggregationResult.aggregatedContext, options
      );

      if (!optimizationResult.success) {
        throw new Error(`Context optimization failed: ${optimizationResult.error}`);
      }

      // Step 3: Inject context into template
      console.log('🔄 Injecting context into AI template...');
      const injectionResult = await this.injectContextWithRetry(
        optimizationResult.optimizedContext, options
      );

      if (!injectionResult.success) {
        throw new Error(`Context injection failed: ${injectionResult.error}`);
      }

      // Compile final result
      const enhancedContext = {
        success: true,
        projectRoot,
        phase,
        deliverable,
        
        // Main outputs
        aggregatedContext: aggregationResult.aggregatedContext,
        optimizedContext: optimizationResult.optimizedContext,
        injectedTemplate: injectionResult.injectedTemplate,
        
        // Metadata from each step
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          fromCache: false,
          
          // Aggregation metadata
          aggregation: aggregationResult.metadata,
          
          // Optimization metadata
          optimization: optimizationResult.metadata,
          
          // Injection metadata
          injection: injectionResult.metadata,
          
          // Overall quality metrics
          overallConfidence: this.calculateOverallConfidence(aggregationResult, optimizationResult),
          contextQuality: this.assessContextQuality(aggregationResult, optimizationResult),
          
          // Performance metrics
          performance: {
            aggregationTime: aggregationResult.metadata?.processingTime || 0,
            optimizationTime: optimizationResult.metadata?.processingTime || 0,
            injectionTime: injectionResult.metadata?.processingTime || 0,
            totalTime: Date.now() - startTime
          }
        }
      };

      // Cache the result
      if (this.enableCaching) {
        await this.cache.set(cacheKey, enhancedContext, 15 * 60 * 1000); // 15 minutes TTL
      }

      console.log('✅ Enhanced context generation completed successfully');
      return enhancedContext;

    } catch (error) {
      console.error('❌ Enhanced context generation failed:', error);
      
      return {
        success: false,
        projectRoot,
        phase,
        deliverable,
        error: error.message,
        fallbackContext: this.generateFallbackContext(projectRoot, phase, deliverable),
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
          fromCache: false,
          failed: true,
          errorType: error.constructor.name
        }
      };
    }
  }

  /**
   * Aggregate context with retry logic
   */
  async aggregateContextWithRetry(projectRoot, phase, deliverable, options) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.aggregator.aggregateContext(
          this.contextSources, 
          projectRoot, 
          phase, 
          deliverable, 
          options
        );
      } catch (error) {
        console.warn(`Context aggregation attempt ${attempt} failed:`, error.message);
        if (attempt === this.retryAttempts) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  /**
   * Optimize context with retry logic
   */
  async optimizeContextWithRetry(aggregatedContext, options) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.optimizer.optimizeContext(aggregatedContext, {
          provider: options.provider,
          maxTokens: options.maxTokens,
          ...options.optimizationConstraints
        });
      } catch (error) {
        console.warn(`Context optimization attempt ${attempt} failed:`, error.message);
        if (attempt === this.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }

  /**
   * Inject context with retry logic
   */
  async injectContextWithRetry(optimizedContext, options) {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.injector.injectContext(
          optimizedContext,
          options.templateType || 'task_generation',
          {
            role: options.role,
            phase: optimizedContext.phase,
            deliverable: optimizedContext.deliverable,
            ...options.templateOptions
          }
        );
      } catch (error) {
        console.warn(`Context injection attempt ${attempt} failed:`, error.message);
        if (attempt === this.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
      }
    }
  }

  /**
   * Create default context sources
   */
  createDefaultContextSources(options) {
    return [
      new PhaseTransitionContextSource(options.phaseTransitionOptions),
      new DeliverableAnalysisContextSource(options.deliverableAnalysisOptions),
      new ProjectStateContextSource(options.projectStateOptions)
    ];
  }

  /**
   * Generate cache key for context request
   */
  generateCacheKey(projectRoot, phase, deliverable, options) {
    const keyComponents = [
      projectRoot.replace(/[^a-zA-Z0-9]/g, '_'),
      phase,
      deliverable,
      options.provider || 'default',
      options.role || 'default'
    ];
    
    return `enhanced_context_${keyComponents.join('_')}`;
  }

  /**
   * Calculate overall confidence score
   */
  calculateOverallConfidence(aggregationResult, optimizationResult) {
    const aggregationConfidence = aggregationResult.metadata?.confidence || 0.5;
    const optimizationSuccess = optimizationResult.success ? 1.0 : 0.3;
    
    // Weighted average
    return (aggregationConfidence * 0.7) + (optimizationSuccess * 0.3);
  }

  /**
   * Assess overall context quality
   */
  assessContextQuality(aggregationResult, optimizationResult) {
    const sourcesUsed = aggregationResult.metadata?.successfulSources || 0;
    const compressionRatio = optimizationResult.metadata?.compressionRatio || 1.0;
    const confidence = aggregationResult.metadata?.confidence || 0.5;

    if (sourcesUsed >= 2 && compressionRatio > 0.5 && confidence > 0.7) {
      return 'high';
    } else if (sourcesUsed >= 1 && compressionRatio > 0.3 && confidence > 0.5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate fallback context when main process fails
   */
  generateFallbackContext(projectRoot, phase, deliverable) {
    return {
      phase,
      deliverable,
      unified: {
        project: { name: 'Unknown Project', type: 'web_app' },
        workflow: { currentPhase: phase },
        insights: { 
          key: ['Enhanced context generation failed - using fallback'],
          technical: [],
          decisions: [],
          recommendations: ['Retry context generation or check system configuration']
        },
        technical: { techStack: {}, requirements: [] },
        quality: { gates: [], risks: [] },
        tasks: { 
          prioritized: [{
            task: `Complete ${deliverable} for ${phase} phase`,
            priority: 'high',
            rationale: 'Fallback task due to context generation failure'
          }],
          focus: [phase],
          dependencies: []
        }
      },
      metadata: {
        confidence: 0.1,
        freshness: 0.5,
        coverage: 0.1,
        isFallback: true
      }
    };
  }

  /**
   * Add new context source (Open/Closed Principle)
   */
  addContextSource(contextSource) {
    if (!contextSource.isAvailable()) {
      console.warn(`Context source ${contextSource.getSourceName()} is not available`);
      return;
    }
    
    this.contextSources.push(contextSource);
    console.log(`Added context source: ${contextSource.getSourceName()}`);
  }

  /**
   * Remove context source
   */
  removeContextSource(sourceName) {
    const initialLength = this.contextSources.length;
    this.contextSources = this.contextSources.filter(source => 
      source.getSourceName() !== sourceName
    );
    
    if (this.contextSources.length < initialLength) {
      console.log(`Removed context source: ${sourceName}`);
    }
  }

  /**
   * Get system status and health
   */
  async getSystemStatus() {
    const availableSources = this.contextSources.filter(source => source.isAvailable());
    
    return {
      status: 'operational',
      components: {
        aggregator: this.aggregator.constructor.name,
        optimizer: this.optimizer.getStrategyName(),
        injector: this.injector.constructor.name,
        cache: this.cache.constructor.name
      },
      contextSources: {
        total: this.contextSources.length,
        available: availableSources.length,
        sources: availableSources.map(source => ({
          name: source.getSourceName(),
          priority: source.getPriority()
        }))
      },
      configuration: {
        cachingEnabled: this.enableCaching,
        parallelProcessing: this.enableParallelProcessing,
        timeout: this.timeout,
        retryAttempts: this.retryAttempts
      }
    };
  }
}
