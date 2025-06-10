/**
 * Enhanced Context System - Unit Tests (No AI Dependencies)
 * Fast, reliable unit tests for BACKEND-003 components
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  ContextAggregator,
  ContextOptimizer,
  ContextInjector,
  ContextCache,
  ProjectStateContextSource,
  PhaseTransitionContextSource
} from '../../src/ai-integration/index.js';

describe('Enhanced Context System - Unit Tests', () => {
  describe('Context Optimizer', () => {
    let optimizer;

    beforeEach(() => {
      optimizer = new ContextOptimizer({ strategy: 'priority_based' });
    });

    it('should estimate token count correctly', () => {
      const testContext = { test: 'data', more: 'content' };
      const tokenCount = optimizer.estimateTokenCount(testContext);
      expect(tokenCount).toBeGreaterThan(0);
      expect(typeof tokenCount).toBe('number');
    });

    it('should calculate target token limit', () => {
      const limit = optimizer.calculateTargetTokenLimit({ provider: 'openrouter' });
      expect(limit).toBe(2800); // 4000 * 0.7
    });

    it('should handle empty context', async () => {
      const result = await optimizer.optimizeContext({}, { maxTokens: 1000 });
      expect(result.success).toBe(true);
      expect(result.optimizedContext).toBeDefined();
    });

    it('should apply priority-based optimization', async () => {
      const largeContext = {
        unified: {
          insights: {
            key: Array(50).fill('test insight'),
            technical: Array(30).fill('technical detail')
          }
        }
      };

      const result = await optimizer.optimizeContext(largeContext, { 
        maxTokens: 500,
        forceOptimization: true 
      });

      expect(result.success).toBe(true);
      expect(result.metadata.strategy).toBe('priority_based');
      expect(result.metadata.compressionRatio).toBeLessThanOrEqual(1.0);
    });

    it('should handle different optimization strategies', async () => {
      const strategies = ['priority_based', 'compression', 'selective'];
      const testContext = {
        unified: {
          insights: { key: ['test'] },
          tasks: { prioritized: [{ task: 'test' }] }
        }
      };

      for (const strategy of strategies) {
        const strategyOptimizer = new ContextOptimizer({ strategy });
        const result = await strategyOptimizer.optimizeContext(testContext, {
          maxTokens: 100,
          forceOptimization: true
        });

        expect(result.success).toBe(true);
        expect(result.metadata.strategy).toBe(strategy);
      }
    });
  });

  describe('Context Injector', () => {
    let injector;

    beforeEach(() => {
      injector = new ContextInjector();
    });

    it('should support all template types', () => {
      const supportedTypes = injector.getSupportedTemplateTypes();
      expect(supportedTypes).toContain('task_generation');
      expect(supportedTypes).toContain('analysis');
      expect(supportedTypes).toContain('implementation');
      expect(supportedTypes).toContain('review');
    });

    it('should validate template options', () => {
      expect(injector.validateTemplateOptions('task_generation', {})).toBe(true);
      expect(injector.validateTemplateOptions('task_generation', { role: 'test' })).toBe(true);
      expect(injector.validateTemplateOptions('task_generation', null)).toBe(false);
    });

    it('should inject context into templates', async () => {
      const testContext = {
        unified: {
          project: { name: 'Test Project', type: 'web_app' },
          workflow: { currentPhase: 'requirements' },
          insights: { key: ['Important insight'] }
        }
      };

      const result = await injector.injectContext(testContext, 'task_generation', {
        role: 'test_agent',
        phase: 'requirements',
        deliverable: 'prd_complete'
      });

      expect(result.success).toBe(true);
      expect(result.injectedTemplate).toContain('PROJECT CONTEXT');
      expect(result.injectedTemplate).toContain('Test Project');
      expect(result.injectedTemplate).toContain('requirements');
      expect(result.metadata.templateType).toBe('task_generation');
    });

    it('should handle empty context gracefully', async () => {
      const emptyContext = { unified: {} };
      const result = await injector.injectContext(emptyContext, 'task_generation');

      expect(result.success).toBe(true);
      expect(result.injectedTemplate).toContain('PROJECT CONTEXT');
    });

    it('should estimate template tokens', () => {
      const template = 'This is a test template with some content';
      const tokens = injector.estimateTemplateTokens(template);
      expect(tokens).toBeGreaterThan(0);
      expect(typeof tokens).toBe('number');
    });
  });

  describe('Context Cache', () => {
    let cache;

    beforeEach(() => {
      cache = new ContextCache({ defaultTTL: 1000, maxEntries: 5 });
    });

    it('should generate consistent cache keys', () => {
      const key1 = cache.generateCacheKey('/test/path', 'requirements', 'prd_complete');
      const key2 = cache.generateCacheKey('/test/path', 'requirements', 'prd_complete');
      expect(key1).toBe(key2);
    });

    it('should store and retrieve data', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      const key = 'test_key';

      await cache.set(key, testData);
      const retrieved = await cache.get(key);

      expect(retrieved).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const shortCache = new ContextCache({ defaultTTL: 50 });
      const testData = { test: 'data' };
      const key = 'expire_test';

      await shortCache.set(key, testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const retrieved = await shortCache.get(key);
      expect(retrieved).toBeNull();
    });

    it('should handle cache size limits', async () => {
      const smallCache = new ContextCache({ maxEntries: 2 });

      // Add more entries than the limit
      await smallCache.set('key1', { data: 1 });
      await smallCache.set('key2', { data: 2 });
      await smallCache.set('key3', { data: 3 });

      const stats = smallCache.getStats();
      expect(stats.currentEntries).toBeLessThanOrEqual(2);
    });

    it('should provide cache statistics', () => {
      const stats = cache.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('currentEntries');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should clear cache entries', async () => {
      await cache.set('test1', { data: 1 });
      await cache.set('test2', { data: 2 });

      await cache.clear('test1');
      const retrieved = await cache.get('test1');
      expect(retrieved).toBeNull();

      await cache.clearAll();
      const stats = cache.getStats();
      expect(stats.currentEntries).toBe(0);
    });
  });

  describe('Context Aggregator', () => {
    let aggregator;

    beforeEach(() => {
      aggregator = new ContextAggregator();
    });

    it('should handle empty source list', async () => {
      const result = await aggregator.aggregateContext(
        [], // No sources
        '/test/path',
        'requirements',
        'prd_complete'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.isEmpty).toBe(true);
    });

    it('should merge context data correctly', () => {
      const contextData = [
        {
          source: 'test1',
          priority: 10,
          data: { insights: ['insight1'] },
          metadata: { confidence: 0.8 }
        },
        {
          source: 'test2',
          priority: 8,
          data: { insights: ['insight2'] },
          metadata: { confidence: 0.6 }
        }
      ];

      const merged = aggregator.mergeContextData(contextData);
      expect(merged.sources).toHaveLength(2);
      expect(merged.data.test1).toBeDefined();
      expect(merged.data.test2).toBeDefined();
      expect(merged.unified).toBeDefined();
    });

    it('should detect conflicts', () => {
      const contextData = [
        { source: 'source1', data: { projectType: 'web_app' } },
        { source: 'source2', data: { projectType: 'mobile_app' } }
      ];

      const conflicts = aggregator.detectConflicts(contextData);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe('project_type');
    });

    it('should calculate aggregate metadata', () => {
      const contextData = [
        { priority: 10, metadata: { confidence: 0.8, freshness: 0.9 } },
        { priority: 8, metadata: { confidence: 0.6, freshness: 0.7 } }
      ];

      const metadata = aggregator.calculateAggregateMetadata(contextData);
      expect(metadata.confidence).toBeGreaterThan(0);
      expect(metadata.freshness).toBeGreaterThan(0);
      expect(metadata.coverage).toBeGreaterThan(0);
    });
  });

  describe('Context Sources', () => {
    it('should create project state source with correct properties', () => {
      const source = new ProjectStateContextSource({ priority: 5 });
      expect(source.getSourceName()).toBe('project_state');
      expect(source.getPriority()).toBe(5);
      expect(source.isAvailable()).toBe(true);
    });

    it('should create phase transition source with correct properties', () => {
      const source = new PhaseTransitionContextSource({ priority: 10 });
      expect(source.getSourceName()).toBe('phase_transition');
      expect(source.getPriority()).toBe(10);
      expect(source.isAvailable()).toBe(true);
    });

    it('should handle missing project gracefully', async () => {
      const source = new ProjectStateContextSource();
      const context = await source.getContext('/nonexistent/path', 'requirements', 'prd_complete');
      
      expect(context.success).toBe(true);
      expect(context.metadata.isEmpty).toBe(true);
      expect(context.data.projectName).toBe('Unknown Project');
    });
  });

  describe('Integration Tests', () => {
    it('should work with minimal orchestrator setup', async () => {
      // Create a minimal orchestrator without AI dependencies
      const { createEnhancedContextOrchestrator } = await import('../../src/ai-integration/index.js');
      
      const orchestrator = createEnhancedContextOrchestrator({
        enableCaching: false,
        timeout: 1000,
        retryAttempts: 1,
        deliverableAnalysisOptions: {
          includeAIInsights: false
        },
        projectStateOptions: {
          includeFileStructure: false
        }
      });

      const status = await orchestrator.getSystemStatus();
      expect(status.status).toBe('operational');
      expect(status.contextSources.total).toBeGreaterThan(0);
    });

    it('should handle context generation with fallbacks', async () => {
      const { createEnhancedContextOrchestrator } = await import('../../src/ai-integration/index.js');
      
      const orchestrator = createEnhancedContextOrchestrator({
        enableCaching: false,
        timeout: 500,
        retryAttempts: 1,
        deliverableAnalysisOptions: {
          includeAIInsights: false
        }
      });

      const result = await orchestrator.generateEnhancedContext(
        process.cwd(),
        'requirements',
        'prd_complete',
        { provider: 'test', skipAI: true }
      );

      // Should succeed or fail gracefully
      expect(typeof result.success).toBe('boolean');
      if (result.success) {
        expect(result.injectedTemplate).toBeDefined();
      } else {
        expect(result.fallbackContext).toBeDefined();
      }
    });
  });
});
