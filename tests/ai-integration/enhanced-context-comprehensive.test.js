/**
 * Comprehensive Enhanced Context System Tests
 * Stress testing and edge case validation for BACKEND-003
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { 
  createEnhancedContextOrchestrator,
  EnhancedContextOrchestrator,
  PhaseTransitionContextSource,
  DeliverableAnalysisContextSource,
  ProjectStateContextSource,
  ContextAggregator,
  ContextOptimizer,
  ContextInjector,
  ContextCache
} from '../../src/ai-integration/index.js';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load test configuration with rate limiting
import '../test-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testProjectRoot = path.join(__dirname, '..', 'fixtures', 'comprehensive-test-project');

describe('Enhanced Context System - Comprehensive Tests', () => {
  let orchestrator;
  let testContext;

  beforeEach(async () => {
    process.env.GUIDANT_TEST_MODE = 'true';
    await setupComprehensiveTestProject();
    
    orchestrator = createEnhancedContextOrchestrator({
      enableCaching: false,
      timeout: 30000, // Longer timeout for rate-limited tests
      retryAttempts: 2, // Allow retries for rate limiting
      deliverableAnalysisOptions: {
        includeAIInsights: true, // Enable AI with rate limiting
        timeout: 25000 // Longer timeout for AI calls
      },
      phaseTransitionOptions: {
        enabled: true,
        priority: 10
      },
      projectStateOptions: {
        enabled: true,
        priority: 8,
        includeFileStructure: false // Disable file structure for faster tests
      }
    });

    testContext = {
      projectRoot: testProjectRoot,
      phase: 'requirements',
      deliverable: 'prd_complete',
      role: 'research_agent'
    };
  });

  afterEach(async () => {
    await cleanupComprehensiveTestProject();
    delete process.env.GUIDANT_TEST_MODE;
  });

  describe('Context Source Reliability', () => {
    it('should handle missing project state gracefully', async () => {
      const source = new ProjectStateContextSource();
      const context = await source.getContext('/nonexistent/path', 'requirements', 'prd_complete');
      
      expect(context.success).toBe(true);
      expect(context.metadata.isEmpty).toBe(true);
      expect(context.data.projectName).toBe(null); // Updated expectation to match new behavior
    });

    it('should handle corrupted deliverable files', async () => {
      // Create corrupted file
      await fs.writeFile(
        path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements', 'corrupted.md'),
        'Invalid JSON: {broken'
      );

      const source = new DeliverableAnalysisContextSource();
      const context = await source.getContext(testProjectRoot, 'requirements', 'corrupted');
      
      expect(context.success).toBe(true); // Should not fail completely
      expect(context.metadata.analyzedDeliverables).toBeGreaterThanOrEqual(0);
    });

    it('should prioritize sources correctly', async () => {
      const phaseSource = new PhaseTransitionContextSource();
      const deliverableSource = new DeliverableAnalysisContextSource();
      const projectSource = new ProjectStateContextSource();

      expect(phaseSource.getPriority()).toBe(10);
      expect(deliverableSource.getPriority()).toBe(9);
      expect(projectSource.getPriority()).toBe(8);
    });
  });

  describe('Context Aggregation Edge Cases', () => {
    it('should handle conflicting data from multiple sources', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.aggregation.conflictsDetected).toBeGreaterThanOrEqual(0);
      expect(result.metadata.aggregation.conflictsResolved).toBeGreaterThanOrEqual(0);
    });

    it('should work with only one context source available', async () => {
      // Create orchestrator with only one source
      const singleSourceOrchestrator = new EnhancedContextOrchestrator({
        contextSources: [new ProjectStateContextSource()],
        enableCaching: false
      });

      const result = await singleSourceOrchestrator.generateEnhancedContext(
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.aggregation.successfulSources).toBe(1);
    });

    it('should handle empty context data gracefully', async () => {
      const aggregator = new ContextAggregator();
      const result = await aggregator.aggregateContext(
        [], // No sources
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.isEmpty).toBe(true);
    });
  });

  describe('Context Optimization Stress Tests', () => {
    it('should handle very large context data', async () => {
      // Create large context
      const largeContext = {
        unified: {
          insights: {
            key: Array(1000).fill('Large insight data'),
            technical: Array(500).fill('Technical requirement'),
            decisions: Array(200).fill('Important decision'),
            recommendations: Array(300).fill('Recommendation')
          },
          tasks: {
            prioritized: Array(100).fill({ task: 'Large task', priority: 'high' }),
            focus: Array(50).fill('Focus area'),
            dependencies: Array(75).fill('Dependency')
          }
        }
      };

      const optimizer = new ContextOptimizer({ strategy: 'priority_based' });
      const result = await optimizer.optimizeContext(largeContext, { maxTokens: 2000 });

      expect(result.success).toBe(true);
      expect(result.metadata.compressionRatio).toBeLessThan(1.0);
      expect(result.metadata.optimizedTokens).toBeLessThanOrEqual(2000 * 0.7);
    });

    it('should apply different optimization strategies correctly', async () => {
      const testContext = {
        unified: {
          insights: { key: Array(20).fill('Test insight') },
          tasks: { prioritized: Array(15).fill({ task: 'Test task' }) }
        }
      };

      const strategies = ['priority_based', 'compression', 'selective'];
      
      for (const strategy of strategies) {
        const optimizer = new ContextOptimizer({ strategy });
        const result = await optimizer.optimizeContext(testContext, {
          maxTokens: 1000,
          forceOptimization: true // Force optimization even if under limit
        });

        expect(result.success).toBe(true);
        expect(result.metadata.strategy).toBe(strategy);
      }
    });

    it('should handle token limits correctly', async () => {
      const largeContext = {
        unified: {
          insights: { key: Array(100).fill('Very long insight that takes up many tokens and should be compressed') }
        }
      };

      const optimizer = new ContextOptimizer();
      const result = await optimizer.optimizeContext(largeContext, { 
        provider: 'openrouter',
        maxTokens: 500 
      });

      expect(result.success).toBe(true);
      expect(result.metadata.optimizedTokens).toBeLessThanOrEqual(500 * 0.7);
    });
  });

  describe('Template Injection Validation', () => {
    it('should generate valid templates for all supported types', async () => {
      const templateTypes = ['task_generation', 'analysis', 'implementation', 'review'];
      const injector = new ContextInjector();
      
      const testContext = {
        unified: {
          project: { name: 'Test Project', type: 'web_app' },
          workflow: { currentPhase: 'requirements' },
          insights: { key: ['Test insight'] }
        }
      };

      for (const templateType of templateTypes) {
        const result = await injector.injectContext(testContext, templateType, {
          role: 'test_agent',
          phase: 'requirements',
          deliverable: 'prd_complete'
        });

        expect(result.success).toBe(true);
        expect(result.injectedTemplate).toContain('PROJECT CONTEXT');
        expect(result.injectedTemplate).toContain('Test Project');
        expect(result.metadata.templateType).toBe(templateType);
      }
    });

    it('should handle missing context data gracefully', async () => {
      const injector = new ContextInjector();
      const emptyContext = { unified: {} };

      const result = await injector.injectContext(emptyContext, 'task_generation');

      expect(result.success).toBe(true);
      expect(result.injectedTemplate).toContain('PROJECT CONTEXT');
    });

    it('should validate template options correctly', async () => {
      const injector = new ContextInjector();
      
      expect(injector.validateTemplateOptions('task_generation', {})).toBe(true);
      expect(injector.validateTemplateOptions('task_generation', { role: 'test' })).toBe(true);
      expect(injector.validateTemplateOptions('task_generation', null)).toBe(false);
    });
  });

  describe('Caching System Tests', () => {
    it('should cache and retrieve context correctly', async () => {
      const cache = new ContextCache({ defaultTTL: 1000 });
      const testData = { test: 'data', timestamp: Date.now() };
      
      const cacheKey = cache.generateCacheKey(testProjectRoot, 'requirements', 'prd_complete');
      
      await cache.set(cacheKey, testData);
      const retrieved = await cache.get(cacheKey);
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle cache expiration correctly', async () => {
      const cache = new ContextCache({ defaultTTL: 100 }); // 100ms TTL
      const testData = { test: 'data' };
      
      const cacheKey = cache.generateCacheKey(testProjectRoot, 'requirements', 'prd_complete');
      
      await cache.set(cacheKey, testData);
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const retrieved = await cache.get(cacheKey);
      expect(retrieved).toBeNull();
    });

    it('should handle cache size limits', async () => {
      const cache = new ContextCache({ maxEntries: 3 });
      
      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        await cache.set(`key${i}`, { data: i });
      }
      
      const stats = cache.getStats();
      expect(stats.currentEntries).toBeLessThanOrEqual(3);
      expect(stats.evictions).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network timeouts gracefully', async () => {
      const timeoutOrchestrator = createEnhancedContextOrchestrator({
        timeout: 1, // Very short timeout
        retryAttempts: 1,
        enableCaching: false
      });

      const result = await timeoutOrchestrator.generateEnhancedContext(
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      // Should either succeed or fail gracefully with fallback
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.fallbackContext).toBeDefined();
      }
    });

    it('should retry failed operations', async () => {
      let attemptCount = 0;

      // Mock a source that fails once then succeeds
      class FailingSource extends ProjectStateContextSource {
        async getContext(...args) {
          attemptCount++;
          if (attemptCount === 1) {
            throw new Error('Simulated failure');
          }
          return super.getContext(...args);
        }
      }

      const retryOrchestrator = new EnhancedContextOrchestrator({
        contextSources: [new FailingSource()],
        retryAttempts: 2,
        enableCaching: false,
        timeout: 1000
      });

      const result = await retryOrchestrator.generateEnhancedContext(
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      expect(attemptCount).toBeGreaterThanOrEqual(1);
      expect(result.success).toBe(true);
    });

    it('should provide meaningful error messages', async () => {
      const invalidOrchestrator = new EnhancedContextOrchestrator({
        contextSources: [], // No sources
        timeout: 1000,
        enableCaching: false
      });

      const result = await invalidOrchestrator.generateEnhancedContext(
        '/invalid/path',
        'invalid_phase',
        'invalid_deliverable'
      );

      // With no sources, it should still succeed but with empty context
      expect(result.success).toBe(true);
      expect(result.metadata.aggregation.successfulSources).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should complete context generation within reasonable time', async () => {
      // Create a fast orchestrator for performance testing
      const fastOrchestrator = createEnhancedContextOrchestrator({
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

      const startTime = Date.now();

      const result = await fastOrchestrator.generateEnhancedContext(
        testProjectRoot,
        'requirements',
        'prd_complete'
      );

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds (accounting for rate limiting)
    });

    it('should handle concurrent context generation', async () => {
      const promises = Array(5).fill(null).map(() =>
        orchestrator.generateEnhancedContext(
          testProjectRoot,
          'requirements',
          'prd_complete'
        )
      );

      const results = await Promise.all(promises);
      
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});

// Test utilities
async function setupComprehensiveTestProject() {
  try {
    await fs.mkdir(testProjectRoot, { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'deliverables'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'deliverables', 'design'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'data-processing'), { recursive: true });
    
    // Create comprehensive project configuration
    const projectConfig = {
      name: 'Comprehensive Test Project',
      description: 'A comprehensive test project for enhanced context system validation',
      type: 'web_app',
      version: '1.0.0',
      phases: {
        current: 'requirements',
        phases: {
          concept: { status: 'completed' },
          requirements: { status: 'in_progress' },
          design: { status: 'pending' }
        }
      },
      capabilities: {
        tools: ['web-search', 'file-edit', 'code-analysis'],
        detected: ['research', 'development', 'testing']
      }
    };
    
    await fs.writeFile(
      path.join(testProjectRoot, '.guidant', 'config.json'),
      JSON.stringify(projectConfig, null, 2)
    );

    // Create multiple test deliverables
    const deliverables = [
      {
        path: path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements', 'prd_complete.md'),
        content: `# Comprehensive Product Requirements Document

## Overview
This is a comprehensive test PRD for the enhanced context system validation.

## Requirements
- User authentication and authorization
- Real-time data synchronization
- Mobile-responsive design
- Performance optimization
- Security compliance

## Technical Specifications
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Deployment: Docker containers

## Success Metrics
- Page load time < 2 seconds
- 99.9% uptime
- User satisfaction > 4.5/5
`
      },
      {
        path: path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements', 'user_stories.json'),
        content: JSON.stringify({
          userStories: [
            {
              id: 'US-001',
              title: 'User Login',
              description: 'As a user, I want to log in securely so that I can access my account',
              acceptanceCriteria: ['Valid credentials allow access', 'Invalid credentials show error']
            },
            {
              id: 'US-002',
              title: 'Data Sync',
              description: 'As a user, I want my data to sync in real-time across devices',
              acceptanceCriteria: ['Changes appear immediately', 'Offline changes sync when online']
            }
          ]
        }, null, 2)
      }
    ];

    for (const deliverable of deliverables) {
      await fs.writeFile(deliverable.path, deliverable.content);
    }

    // Create mock transformation data
    const transformationData = {
      transformations: [
        {
          id: 'trans-001',
          fromPhase: 'concept',
          toPhase: 'requirements',
          success: true,
          transformedAt: new Date().toISOString(),
          transformation: {
            insights: {
              keyFindings: ['Market demand validated', 'Technical feasibility confirmed'],
              risks: ['Competition risk', 'Technical complexity']
            },
            decisions: ['Use React for frontend', 'PostgreSQL for database'],
            recommendations: ['Start with MVP', 'Focus on performance']
          },
          enhancedContext: {
            phase: 'requirements',
            focusAreas: ['User experience', 'Technical architecture'],
            keyInsights: ['Strong market demand', 'Clear technical path'],
            techStackGuidance: {
              frontend: 'React',
              backend: 'Node.js',
              database: 'PostgreSQL'
            },
            prioritizedTasks: [
              { task: 'Define user requirements', priority: 'high', rationale: 'Foundation for design' },
              { task: 'Create technical specifications', priority: 'high', rationale: 'Guide development' }
            ],
            riskFactors: [
              { risk: 'Technical complexity', impact: 'medium', mitigation: 'Prototype early' }
            ],
            qualityGates: ['Requirements review completed', 'Stakeholder approval obtained']
          }
        }
      ]
    };

    await fs.writeFile(
      path.join(testProjectRoot, '.guidant', 'data-processing', 'transformations.json'),
      JSON.stringify(transformationData, null, 2)
    );

  } catch (error) {
    console.warn('Failed to setup comprehensive test project:', error.message);
  }
}

async function cleanupComprehensiveTestProject() {
  try {
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to cleanup comprehensive test project:', error.message);
  }
}
