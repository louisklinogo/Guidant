/**
 * Unit Tests for Cross-Phase Relationship Tracking System
 * Tests SOLID architecture compliance and functionality
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import fs from 'fs/promises';
import path from 'path';
import { RelationshipOrchestrator } from '../../src/data-processing/relationship-orchestrator.js';
import { StructuralRelationshipDetector } from '../../src/data-processing/detectors/structural-relationship-detector.js';
import { JSONRelationshipStorage } from '../../src/data-processing/storage/json-relationship-storage.js';
import { ImpactAnalyzer } from '../../src/data-processing/analyzers/impact-analyzer.js';
import { RELATIONSHIP_TYPES, RELATIONSHIP_STRENGTH } from '../../src/data-processing/interfaces/relationship-interfaces.js';

describe('RelationshipOrchestrator', () => {
  let orchestrator;
  let testProjectRoot;
  let mockDeliverables;

  beforeEach(async () => {
    // Create test project directory
    testProjectRoot = path.join(process.cwd(), 'test-temp', `relationship-test-${Date.now()}`);
    await fs.mkdir(testProjectRoot, { recursive: true });
    
    // Initialize orchestrator
    orchestrator = new RelationshipOrchestrator({
      enableCaching: false, // Disable caching for tests
      enableParallelDetection: false // Sequential for predictable tests
    });

    // Mock deliverables for testing
    mockDeliverables = [
      {
        phase: 'concept',
        name: 'market_analysis',
        type: 'market_analysis',
        path: path.join(testProjectRoot, '.guidant/deliverables/concept/market_analysis.md'),
        content: 'Market analysis shows 73% of users struggle with project management complexity. User research indicates need for simplified workflows.',
        analysis: {
          opportunities: ['simplified workflows', 'user-friendly interface'],
          pain_points: ['complexity', 'poor user experience']
        }
      },
      {
        phase: 'concept',
        name: 'user_personas',
        type: 'user_personas',
        path: path.join(testProjectRoot, '.guidant/deliverables/concept/user_personas.json'),
        content: JSON.stringify({
          personas: [
            { name: 'Project Manager', needs: ['simplified workflows', 'clear visibility'] }
          ]
        }),
        analysis: {
          needs: ['simplified workflows', 'clear visibility'],
          goals: ['efficient project management']
        }
      },
      {
        phase: 'requirements',
        name: 'prd_complete',
        type: 'prd_complete',
        path: path.join(testProjectRoot, '.guidant/deliverables/requirements/prd_complete.md'),
        content: 'Based on market analysis and user personas, the system must provide simplified workflow management. See market_analysis.md for details.',
        analysis: {
          requirements: ['workflow management', 'user interface'],
          references: ['market_analysis', 'user_personas']
        }
      }
    ];

    // Create test deliverable files
    for (const deliverable of mockDeliverables) {
      await fs.mkdir(path.dirname(deliverable.path), { recursive: true });
      await fs.writeFile(deliverable.path, deliverable.content);
    }
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error.message);
    }
  });

  describe('SOLID Principles Compliance', () => {
    it('should follow Single Responsibility Principle (SRP)', () => {
      // Each component should have one clear responsibility
      expect(orchestrator.detectors).toBeDefined();
      expect(orchestrator.storage).toBeDefined();
      expect(orchestrator.impactAnalyzer).toBeDefined();
      expect(orchestrator.deliverableAnalyzer).toBeDefined();
    });

    it('should follow Dependency Inversion Principle (DIP)', () => {
      // Should accept injected dependencies
      const customDetector = new StructuralRelationshipDetector();
      const customStorage = new JSONRelationshipStorage();
      const customAnalyzer = new ImpactAnalyzer();

      const customOrchestrator = new RelationshipOrchestrator({
        detectors: [customDetector],
        storage: customStorage,
        impactAnalyzer: customAnalyzer
      });

      expect(customOrchestrator.detectors).toContain(customDetector);
      expect(customOrchestrator.storage).toBe(customStorage);
      expect(customOrchestrator.impactAnalyzer).toBe(customAnalyzer);
    });

    it('should follow Interface Segregation Principle (ISP)', () => {
      // Detectors should implement focused interfaces
      const detector = orchestrator.detectors[0];
      expect(typeof detector.detectRelationships).toBe('function');
      expect(typeof detector.getDetectorInfo).toBe('function');
      expect(typeof detector.isAvailable).toBe('function');
      expect(typeof detector.getPriority).toBe('function');
    });
  });

  describe('Relationship Detection', () => {
    it('should detect structural relationships between deliverables', async () => {
      const relationships = await orchestrator.detectAllRelationships(mockDeliverables, {
        minConfidence: 0.3
      });

      expect(relationships.length).toBeGreaterThan(0);
      
      // Should find reference from PRD to market analysis
      const prdToMarketRef = relationships.find(rel =>
        rel.source.name === 'prd_complete' &&
        rel.target.name === 'market_analysis' &&
        rel.type === RELATIONSHIP_TYPES.REFERENCES
      );
      
      expect(prdToMarketRef).toBeDefined();
      expect(prdToMarketRef.confidence).toBeGreaterThan(0.3);
    });

    it('should handle empty deliverable list gracefully', async () => {
      const relationships = await orchestrator.detectAllRelationships([], {});
      expect(relationships).toEqual([]);
    });

    it('should deduplicate similar relationships', async () => {
      // Create duplicate relationships
      const duplicateRelationships = [
        {
          id: 'test_1',
          source: { phase: 'concept', name: 'market_analysis' },
          target: { phase: 'requirements', name: 'prd_complete' },
          type: RELATIONSHIP_TYPES.INFLUENCES,
          strength: 0.7,
          confidence: 0.8
        },
        {
          id: 'test_2',
          source: { phase: 'concept', name: 'market_analysis' },
          target: { phase: 'requirements', name: 'prd_complete' },
          type: RELATIONSHIP_TYPES.INFLUENCES,
          strength: 0.6,
          confidence: 0.9 // Higher confidence
        }
      ];

      const deduplicated = orchestrator.deduplicateRelationships(duplicateRelationships);
      
      expect(deduplicated.length).toBe(1);
      expect(deduplicated[0].confidence).toBe(0.9); // Should keep higher confidence
    });
  });

  describe('Relationship Graph Creation', () => {
    it('should create valid relationship graph structure', async () => {
      const relationships = [
        {
          id: 'test_rel_1',
          source: { phase: 'concept', name: 'market_analysis' },
          target: { phase: 'requirements', name: 'prd_complete' },
          type: RELATIONSHIP_TYPES.INFLUENCES,
          strength: 0.8,
          confidence: 0.9,
          evidence: [],
          metadata: {
            detectedBy: 'test',
            detectedAt: new Date().toISOString()
          }
        }
      ];

      const graph = orchestrator.createRelationshipGraph(
        testProjectRoot,
        mockDeliverables,
        relationships
      );

      expect(graph.projectId).toBeDefined();
      expect(graph.version).toBe('1.0');
      expect(graph.relationships).toEqual(relationships);
      expect(graph.deliverables.length).toBe(mockDeliverables.length);
      expect(graph.statistics.totalRelationships).toBe(1);
      expect(graph.metadata.generatedBy).toBe('RelationshipOrchestrator');
    });

    it('should calculate accurate statistics', () => {
      const relationships = [
        {
          type: RELATIONSHIP_TYPES.REFERENCES,
          source: { phase: 'concept', name: 'a' },
          target: { phase: 'requirements', name: 'b' },
          strength: 0.8,
          confidence: 0.9
        },
        {
          type: RELATIONSHIP_TYPES.INFLUENCES,
          source: { phase: 'concept', name: 'a' },
          target: { phase: 'design', name: 'c' },
          strength: 0.6,
          confidence: 0.7
        }
      ];

      const stats = orchestrator.calculateStatistics(relationships);

      expect(stats.totalRelationships).toBe(2);
      expect(stats.relationshipsByType[RELATIONSHIP_TYPES.REFERENCES]).toBe(1);
      expect(stats.relationshipsByType[RELATIONSHIP_TYPES.INFLUENCES]).toBe(1);
      expect(stats.averageStrength).toBe(0.7);
      expect(stats.averageConfidence).toBe(0.8);
    });
  });

  describe('Performance and Caching', () => {
    it('should track performance metrics', async () => {
      const startMetrics = orchestrator.getMetrics();
      
      await orchestrator.detectAllRelationships(mockDeliverables, {});
      
      const endMetrics = orchestrator.getMetrics();
      
      expect(endMetrics.detectionsPerformed).toBeGreaterThan(startMetrics.detectionsPerformed);
      expect(endMetrics.lastAnalysisTime).toBeDefined();
    });

    it('should handle timeout gracefully', async () => {
      // Create orchestrator with very short timeout
      const timeoutOrchestrator = new RelationshipOrchestrator({
        timeoutMs: 1 // 1ms timeout
      });

      // This should not throw but may return fewer results due to timeouts
      const relationships = await timeoutOrchestrator.detectAllRelationships(mockDeliverables, {});
      expect(Array.isArray(relationships)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle detector failures gracefully', async () => {
      // Create mock detector that always fails
      const failingDetector = {
        detectRelationships: async () => {
          throw new Error('Detector failure');
        },
        isAvailable: () => true,
        getPriority: () => 50,
        getDetectorInfo: () => ({ name: 'FailingDetector' })
      };

      const faultyOrchestrator = new RelationshipOrchestrator({
        detectors: [failingDetector]
      });

      // Should not throw, should return empty array
      const relationships = await faultyOrchestrator.detectAllRelationships(mockDeliverables, {});
      expect(relationships).toEqual([]);
    });

    it('should validate input options', async () => {
      // Invalid options should be handled gracefully
      const relationships = await orchestrator.detectAllRelationships(mockDeliverables, {
        minConfidence: 1.5, // Invalid value > 1
        maxRelationships: -1 // Invalid negative value
      });

      // Should still work with default values
      expect(Array.isArray(relationships)).toBe(true);
    });
  });

  describe('Integration with Storage', () => {
    it('should store and retrieve relationship graph', async () => {
      const relationshipGraph = await orchestrator.analyzeProjectRelationships(testProjectRoot, {
        minConfidence: 0.3
      });

      expect(relationshipGraph).toBeDefined();
      expect(relationshipGraph.relationships).toBeDefined();
      
      // Should be able to retrieve stored relationships
      const retrieved = await orchestrator.storage.getAllRelationships(testProjectRoot);
      expect(retrieved.projectId).toBe(relationshipGraph.projectId);
      expect(retrieved.relationships.length).toBe(relationshipGraph.relationships.length);
    });
  });

  describe('Deliverable Type Detection', () => {
    it('should correctly identify deliverable types', () => {
      expect(orchestrator.getDeliverableType('market_analysis.md')).toBe('market_analysis');
      expect(orchestrator.getDeliverableType('user_personas.json')).toBe('user_personas');
      expect(orchestrator.getDeliverableType('prd_complete.md')).toBe('prd_complete');
      expect(orchestrator.getDeliverableType('wireframes.md')).toBe('wireframes');
      expect(orchestrator.getDeliverableType('system_design.json')).toBe('system_design');
      expect(orchestrator.getDeliverableType('unknown_file.txt')).toBe('unknown');
    });
  });

  describe('Quality Score Calculation', () => {
    it('should calculate quality scores correctly', () => {
      const highQualityRelationships = [
        {
          confidence: 0.9,
          evidence: [{ type: 'test' }, { type: 'test' }, { type: 'test' }]
        },
        {
          confidence: 0.8,
          evidence: [{ type: 'test' }, { type: 'test' }]
        }
      ];

      const score = orchestrator.calculateQualityScore(highQualityRelationships);
      expect(score).toBeGreaterThan(0.7); // Should be high quality
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle empty relationships for quality calculation', () => {
      const score = orchestrator.calculateQualityScore([]);
      expect(score).toBe(0);
    });
  });
});
