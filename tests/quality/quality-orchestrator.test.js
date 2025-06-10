/**
 * Quality Orchestrator Tests
 * Comprehensive tests for BACKEND-005 implementation
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { QualityOrchestrator } from '../../src/quality/quality-orchestrator.js';
import { ContentLengthRule } from '../../src/quality/rules/content-length-rule.js';
import { StructureCompletenessRule } from '../../src/quality/rules/structure-completeness-rule.js';
import { WeightedQualityScorer } from '../../src/quality/scorers/weighted-quality-scorer.js';
import { ContextualFeedbackGenerator } from '../../src/quality/feedback/contextual-feedback-generator.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

describe('QualityOrchestrator', () => {
  let orchestrator;
  let testProjectRoot;
  let testDeliverablePath;

  beforeEach(async () => {
    // Create temporary test directory
    testProjectRoot = await fs.mkdtemp(path.join(tmpdir(), 'guidant-quality-test-'));

    // Create test deliverable
    testDeliverablePath = path.join(testProjectRoot, 'test-deliverable.md');
    const testContent = `# Test Market Analysis

## Executive Summary
This is a comprehensive market analysis for our new product.

## Market Overview
The market is growing rapidly with significant opportunities.

## Target Audience
Our primary target audience consists of:
- Small business owners
- Entrepreneurs
- Technology enthusiasts

## Competitive Analysis
We have identified several key competitors in the market.

## Opportunities
There are several growth opportunities we should pursue.`;

    await fs.writeFile(testDeliverablePath, testContent);

    // Create orchestrator with test configuration
    orchestrator = new QualityOrchestrator(testProjectRoot, {
      enabledRules: ['content-length', 'structure-completeness'],
      scoringAlgorithm: 'weighted_average',
      feedbackLevel: 'detailed',
      cacheEnabled: true,
      timeout: 30000 // Increased timeout for AI calls
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error.message);
    }
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultOrchestrator = new QualityOrchestrator();
      
      expect(defaultOrchestrator.projectRoot).toBe(process.cwd());
      expect(defaultOrchestrator.options.enabledRules).toContain('content-length');
      expect(defaultOrchestrator.options.enabledRules).toContain('structure-completeness');
      expect(defaultOrchestrator.qualityRules.size).toBeGreaterThan(0);
    });

    it('should initialize with custom configuration', () => {
      const customOrchestrator = new QualityOrchestrator(testProjectRoot, {
        enabledRules: ['content-length'],
        scoringAlgorithm: 'simple_average',
        feedbackLevel: 'basic',
        cacheEnabled: false
      });

      expect(customOrchestrator.options.enabledRules).toEqual(['content-length']);
      expect(customOrchestrator.options.scoringAlgorithm).toBe('simple_average');
      expect(customOrchestrator.options.feedbackLevel).toBe('basic');
      expect(customOrchestrator.options.cacheEnabled).toBe(false);
    });

    it('should initialize quality rules correctly', () => {
      expect(orchestrator.qualityRules.has('content-length')).toBe(true);
      expect(orchestrator.qualityRules.has('structure-completeness')).toBe(true);
      expect(orchestrator.qualityRules.get('content-length')).toBeInstanceOf(ContentLengthRule);
      expect(orchestrator.qualityRules.get('structure-completeness')).toBeInstanceOf(StructureCompletenessRule);
    });
  });

  describe('Quality Validation', () => {
    const validContext = {
      projectType: 'standard',
      phase: 'concept',
      deliverableType: 'market_analysis',
      deliverablePath: '',
      projectRoot: '',
      configuration: { projectType: 'standard' },
      metadata: {}
    };

    it('should validate deliverable quality successfully', async () => {
      const context = {
        ...validContext,
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      const result = await orchestrator.validateQuality(testDeliverablePath, context);

      expect(result.success).toBe(true);
      expect(result.deliverableId).toBeDefined();
      expect(result.deliverablePath).toBe(testDeliverablePath);
      expect(result.qualityScore).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.blockers).toBeInstanceOf(Array);
      expect(typeof result.readyForTransition).toBe('boolean');
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should return quality score with proper structure', async () => {
      const context = {
        ...validContext,
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      const result = await orchestrator.validateQuality(testDeliverablePath, context);

      expect(result.qualityScore.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.overallScore).toBeLessThanOrEqual(100);
      expect(result.qualityScore.weightedScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore.weightedScore).toBeLessThanOrEqual(100);
      expect(result.qualityScore.passThreshold).toBeGreaterThan(0);
      expect(typeof result.qualityScore.passed).toBe('boolean');
      expect(result.qualityScore.ruleResults).toBeInstanceOf(Array);
      expect(result.qualityScore.ruleResults.length).toBeGreaterThan(0);
    });

    it('should return feedback with proper structure', async () => {
      const context = {
        ...validContext,
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      const result = await orchestrator.validateQuality(testDeliverablePath, context);

      expect(result.feedback.summary).toBeDefined();
      expect(result.feedback.strengths).toBeInstanceOf(Array);
      expect(result.feedback.improvements).toBeInstanceOf(Array);
      expect(result.feedback.criticalIssues).toBeInstanceOf(Array);
      expect(result.feedback.suggestions).toBeInstanceOf(Array);
      expect(result.feedback.nextSteps).toBeInstanceOf(Array);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.feedback.priority);
      expect(result.feedback.estimatedEffort).toBeDefined();
    });

    it('should handle invalid context gracefully', async () => {
      const invalidContext = {
        projectType: '', // Invalid empty string
        phase: 'invalid-phase',
        deliverableType: '',
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      const result = await orchestrator.validateQuality(testDeliverablePath, invalidContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid context');
    });

    it('should handle non-existent file gracefully', async () => {
      const context = {
        ...validContext,
        deliverablePath: path.join(testProjectRoot, 'non-existent.md'),
        projectRoot: testProjectRoot
      };

      const result = await orchestrator.validateQuality(
        path.join(testProjectRoot, 'non-existent.md'), 
        context
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Caching', () => {
    const validContext = {
      projectType: 'standard',
      phase: 'concept',
      deliverableType: 'market_analysis',
      deliverablePath: '',
      projectRoot: '',
      configuration: { projectType: 'standard' },
      metadata: {}
    };

    it('should cache validation results', async () => {
      const context = {
        ...validContext,
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      // First validation
      const result1 = await orchestrator.validateQuality(testDeliverablePath, context);
      expect(result1.cacheHit).toBe(false);

      // Second validation should hit cache
      const result2 = await orchestrator.validateQuality(testDeliverablePath, context);
      expect(result2.cacheHit).toBe(true);
      expect(result2.qualityScore.overallScore).toBe(result1.qualityScore.overallScore);
    });

    it('should respect cache TTL', async () => {
      // Create orchestrator with very short cache TTL
      const shortCacheOrchestrator = new QualityOrchestrator(testProjectRoot, {
        cacheTTL: 100 // 100ms
      });

      const context = {
        ...validContext,
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot
      };

      // First validation
      const result1 = await shortCacheOrchestrator.validateQuality(testDeliverablePath, context);
      expect(result1.cacheHit).toBe(false);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second validation should not hit cache
      const result2 = await shortCacheOrchestrator.validateQuality(testDeliverablePath, context);
      expect(result2.cacheHit).toBe(false);
    });

    it('should clear cache correctly', () => {
      orchestrator.cache.set('test-key', 'test-value');
      orchestrator.cacheTimestamps.set('test-key', Date.now());

      expect(orchestrator.cache.size).toBeGreaterThan(0);
      
      orchestrator.clearCache();
      
      expect(orchestrator.cache.size).toBe(0);
      expect(orchestrator.cacheTimestamps.size).toBe(0);
    });
  });

  describe('Rule Management', () => {
    it('should add custom quality rule', () => {
      const customRule = new ContentLengthRule({ minWords: 50 });
      const success = orchestrator.addQualityRule('custom-content-length', customRule);

      expect(success).toBe(true);
      expect(orchestrator.qualityRules.has('custom-content-length')).toBe(true);
    });

    it('should reject invalid quality rule', () => {
      const invalidRule = { notARule: true };
      const success = orchestrator.addQualityRule('invalid-rule', invalidRule);

      expect(success).toBe(false);
      expect(orchestrator.qualityRules.has('invalid-rule')).toBe(false);
    });

    it('should remove quality rule', () => {
      const success = orchestrator.removeQualityRule('content-length');

      expect(success).toBe(true);
      expect(orchestrator.qualityRules.has('content-length')).toBe(false);
    });

    it('should get available rules', () => {
      const rules = orchestrator.getAvailableRules();

      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('ruleId');
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('description');
    });
  });

  describe('Configuration', () => {
    it('should configure orchestrator successfully', () => {
      const config = {
        timeout: 15000,
        cacheTTL: 300000,
        scoringAlgorithm: 'simple_average',
        feedbackLevel: 'comprehensive'
      };

      const success = orchestrator.configure(config);

      expect(success).toBe(true);
      expect(orchestrator.options.timeout).toBe(15000);
      expect(orchestrator.options.cacheTTL).toBe(300000);
      expect(orchestrator.options.scoringAlgorithm).toBe('simple_average');
      expect(orchestrator.options.feedbackLevel).toBe('comprehensive');
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        timeout: 500, // Too low
        cacheTTL: 30000 // Too low
      };

      const success = orchestrator.configure(invalidConfig);

      expect(success).toBe(false);
    });
  });

  describe('Metrics and Metadata', () => {
    it('should track performance metrics', async () => {
      const context = {
        projectType: 'standard',
        phase: 'concept',
        deliverableType: 'market_analysis',
        deliverablePath: testDeliverablePath,
        projectRoot: testProjectRoot,
        configuration: { projectType: 'standard' },
        metadata: {}
      };

      await orchestrator.validateQuality(testDeliverablePath, context);

      const metrics = orchestrator.getMetrics();

      expect(metrics.totalValidations).toBe(1);
      expect(metrics.averageExecutionTime).toBeGreaterThan(0);
      expect(metrics.lastValidation).toBeDefined();
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    it('should provide comprehensive metadata', () => {
      const metadata = orchestrator.getMetadata();

      expect(metadata.orchestratorId).toBe('quality-orchestrator');
      expect(metadata.name).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.version).toBeDefined();
      expect(metadata.availableRules).toBeGreaterThan(0);
      expect(metadata.configuration).toBeDefined();
      expect(metadata.performance).toBeDefined();
    });
  });

  describe('Transition Readiness Assessment', () => {
    it('should assess transition readiness correctly for passing quality', () => {
      const passingQualityScore = {
        overallScore: 85,
        passed: true,
        ruleResults: [
          { passed: true, score: 90 },
          { passed: true, score: 80 }
        ]
      };

      const context = { projectType: 'standard', phase: 'concept' };
      const ready = orchestrator.assessTransitionReadiness(passingQualityScore, context);

      expect(ready).toBe(true);
    });

    it('should assess transition readiness correctly for failing quality', () => {
      const failingQualityScore = {
        overallScore: 60,
        passed: false,
        ruleResults: [
          { passed: false, score: 25 }, // Critical failure
          { passed: true, score: 95 }
        ]
      };

      const context = { projectType: 'standard', phase: 'concept' };
      const ready = orchestrator.assessTransitionReadiness(failingQualityScore, context);

      expect(ready).toBe(false);
    });

    it('should apply higher standards for enterprise projects', () => {
      const qualityScore = {
        overallScore: 80, // Good but not excellent
        passed: true,
        ruleResults: [
          { passed: true, score: 80 },
          { passed: true, score: 80 }
        ]
      };

      const enterpriseContext = { projectType: 'enterprise', phase: 'concept' };
      const ready = orchestrator.assessTransitionReadiness(qualityScore, enterpriseContext);

      expect(ready).toBe(false); // Should require higher score for enterprise
    });
  });
});
