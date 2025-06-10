/**
 * Enhanced Context Injection System Tests
 * BACKEND-003: Comprehensive testing of SOLID-compliant context system
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { 
  EnhancedContextOrchestrator,
  createEnhancedContextOrchestrator,
  generateEnhancedAITask,
  validateEnhancedContextSystem,
  ContextPresets,
  applyContextPreset
} from '../../src/ai-integration/index.js';

import { 
  PhaseTransitionContextSource,
  DeliverableAnalysisContextSource,
  ProjectStateContextSource
} from '../../src/ai-integration/index.js';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testProjectRoot = path.join(__dirname, '..', 'fixtures', 'test-project');

describe('Enhanced Context Injection System', () => {
  let orchestrator;
  let testContext;

  beforeEach(async () => {
    // Set up test environment
    process.env.GUIDANT_TEST_MODE = 'true';
    
    // Create test project structure
    await setupTestProject();
    
    // Create orchestrator with test configuration
    orchestrator = createEnhancedContextOrchestrator({
      enableCaching: false, // Disable caching for tests
      timeout: 5000,
      retryAttempts: 1,
      deliverableAnalysisOptions: {
        includeAIInsights: false // Disable AI for tests
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
    // Clean up test environment
    await cleanupTestProject();
    delete process.env.GUIDANT_TEST_MODE;
  });

  describe('Context Sources', () => {
    it('should create phase transition context source', () => {
      const source = new PhaseTransitionContextSource();
      expect(source.getSourceName()).toBe('phase_transition');
      expect(source.getPriority()).toBe(10);
      expect(source.isAvailable()).toBe(true);
    });

    it('should create deliverable analysis context source', () => {
      const source = new DeliverableAnalysisContextSource();
      expect(source.getSourceName()).toBe('deliverable_analysis');
      expect(source.getPriority()).toBe(9);
      expect(source.isAvailable()).toBe(true);
    });

    it('should create project state context source', () => {
      const source = new ProjectStateContextSource();
      expect(source.getSourceName()).toBe('project_state');
      expect(source.getPriority()).toBe(8);
      expect(source.isAvailable()).toBe(true);
    });

    it('should get context from project state source', async () => {
      const source = new ProjectStateContextSource();
      const context = await source.getContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable
      );

      expect(context.success).toBe(true);
      expect(context.source).toBe('project_state');
      expect(context.phase).toBe(testContext.phase);
      expect(context.deliverable).toBe(testContext.deliverable);
      expect(context.data).toBeDefined();
      expect(context.metadata).toBeDefined();
    });
  });

  describe('Enhanced Context Orchestrator', () => {
    it('should create orchestrator with default configuration', () => {
      const defaultOrchestrator = createEnhancedContextOrchestrator();
      expect(defaultOrchestrator).toBeInstanceOf(EnhancedContextOrchestrator);
    });

    it('should generate enhanced context successfully', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable,
        { provider: 'test', skipAI: true }
      );

      expect(result.success).toBe(true);
      expect(result.phase).toBe(testContext.phase);
      expect(result.deliverable).toBe(testContext.deliverable);
      expect(result.aggregatedContext).toBeDefined();
      expect(result.optimizedContext).toBeDefined();
      expect(result.injectedTemplate).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should handle context generation failure gracefully', async () => {
      // Create orchestrator with invalid configuration to force failure
      const failingOrchestrator = new EnhancedContextOrchestrator({
        contextSources: [], // No sources
        timeout: 1 // Very short timeout
      });

      const result = await failingOrchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.fallbackContext).toBeDefined();
    });

    it('should provide system status', async () => {
      const status = await orchestrator.getSystemStatus();
      
      expect(status.status).toBe('operational');
      expect(status.components).toBeDefined();
      expect(status.contextSources).toBeDefined();
      expect(status.configuration).toBeDefined();
      expect(status.contextSources.total).toBeGreaterThan(0);
    });
  });

  describe('Context Aggregation', () => {
    it('should aggregate context from multiple sources', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable
      );

      expect(result.success).toBe(true);
      expect(result.metadata.aggregation.sourcesUsed.length).toBeGreaterThan(0);
      expect(result.aggregatedContext.unified).toBeDefined();
      expect(result.aggregatedContext.unified.project).toBeDefined();
      expect(result.aggregatedContext.unified.workflow).toBeDefined();
    });

    it('should handle source conflicts', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable
      );

      expect(result.success).toBe(true);
      expect(result.metadata.aggregation.conflictsDetected).toBeGreaterThanOrEqual(0);
      expect(result.metadata.aggregation.conflictsResolved).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Context Optimization', () => {
    it('should optimize context for token limits', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable,
        { provider: 'openrouter', maxTokens: 2000 }
      );

      expect(result.success).toBe(true);
      expect(result.metadata.optimization).toBeDefined();
      expect(result.metadata.optimization.optimizedTokens).toBeDefined();
      expect(result.metadata.optimization.compressionRatio).toBeDefined();
    });

    it('should apply different optimization strategies', async () => {
      const strategies = ['priority_based', 'compression', 'selective'];
      
      for (const strategy of strategies) {
        const testOrchestrator = createEnhancedContextOrchestrator({
          optimizerOptions: { strategy },
          enableCaching: false
        });

        const result = await testOrchestrator.generateEnhancedContext(
          testContext.projectRoot,
          testContext.phase,
          testContext.deliverable
        );

        expect(result.success).toBe(true);
        expect(result.metadata.optimization.strategy).toBe(strategy);
      }
    });
  });

  describe('Context Injection', () => {
    it('should inject context into task generation template', async () => {
      const result = await orchestrator.generateEnhancedContext(
        testContext.projectRoot,
        testContext.phase,
        testContext.deliverable,
        { templateType: 'task_generation', role: testContext.role }
      );

      expect(result.success).toBe(true);
      expect(result.injectedTemplate).toBeDefined();
      expect(result.injectedTemplate).toContain('PROJECT CONTEXT');
      expect(result.injectedTemplate).toContain('WORKFLOW CONTEXT');
      expect(result.injectedTemplate).toContain(testContext.phase);
      expect(result.injectedTemplate).toContain(testContext.deliverable);
    });

    it('should support different template types', async () => {
      const templateTypes = ['task_generation', 'analysis', 'implementation', 'review'];
      
      for (const templateType of templateTypes) {
        const result = await orchestrator.generateEnhancedContext(
          testContext.projectRoot,
          testContext.phase,
          testContext.deliverable,
          { templateType }
        );

        expect(result.success).toBe(true);
        expect(result.metadata.injection.templateType).toBe(templateType);
      }
    });
  });

  describe('Enhanced AI Task Generation', () => {
    it('should generate enhanced AI task', async () => {
      const result = await generateEnhancedAITask(
        testContext.phase,
        testContext.role,
        testContext.deliverable,
        testContext.projectRoot,
        { provider: 'test', skipAI: true }
      );

      expect(result).toBeDefined();
      expect(result.metadata?.enhancedContext).toBe(true);
    });
  });

  describe('System Validation', () => {
    it('should validate enhanced context system', async () => {
      const validation = await validateEnhancedContextSystem(testContext.projectRoot);
      
      expect(validation.valid).toBe(true);
      expect(validation.status).toBeDefined();
      expect(validation.testResult).toBeDefined();
    });
  });

  describe('Configuration Presets', () => {
    it('should apply context presets', () => {
      const presets = ['minimal', 'balanced', 'comprehensive', 'development'];
      
      for (const presetName of presets) {
        const config = applyContextPreset(presetName);
        expect(config).toBeDefined();
        expect(config.optimizerOptions).toBeDefined();
      }
    });

    it('should create orchestrator with preset', () => {
      const config = applyContextPreset('balanced');
      const presetOrchestrator = createEnhancedContextOrchestrator(config);
      expect(presetOrchestrator).toBeInstanceOf(EnhancedContextOrchestrator);
    });
  });

  describe('SOLID Principles Compliance', () => {
    it('should support adding new context sources (Open/Closed Principle)', () => {
      const initialSourceCount = orchestrator.contextSources.length;
      
      // Create a mock context source
      const mockSource = new ProjectStateContextSource({ priority: 5 });
      orchestrator.addContextSource(mockSource);
      
      expect(orchestrator.contextSources.length).toBe(initialSourceCount + 1);
    });

    it('should support removing context sources', () => {
      const initialSourceCount = orchestrator.contextSources.length;
      
      orchestrator.removeContextSource('project_state');
      
      expect(orchestrator.contextSources.length).toBe(initialSourceCount - 1);
    });

    it('should use dependency injection for all components', () => {
      expect(orchestrator.aggregator).toBeDefined();
      expect(orchestrator.optimizer).toBeDefined();
      expect(orchestrator.injector).toBeDefined();
      expect(orchestrator.cache).toBeDefined();
    });
  });
});

// Test utilities
async function setupTestProject() {
  try {
    await fs.mkdir(testProjectRoot, { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'deliverables'), { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements'), { recursive: true });
    
    // Create test project configuration
    const projectConfig = {
      name: 'Test Project',
      description: 'Test project for enhanced context system',
      type: 'web_app',
      version: '1.0.0'
    };
    
    await fs.writeFile(
      path.join(testProjectRoot, '.guidant', 'config.json'),
      JSON.stringify(projectConfig, null, 2)
    );

    // Create test deliverable
    const testDeliverable = `# Product Requirements Document

## Overview
This is a test PRD for the enhanced context system.

## Requirements
- Test requirement 1
- Test requirement 2
- Test requirement 3
`;

    await fs.writeFile(
      path.join(testProjectRoot, '.guidant', 'deliverables', 'requirements', 'prd_complete.md'),
      testDeliverable
    );

  } catch (error) {
    console.warn('Failed to setup test project:', error.message);
  }
}

async function cleanupTestProject() {
  try {
    await fs.rm(testProjectRoot, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to cleanup test project:', error.message);
  }
}
