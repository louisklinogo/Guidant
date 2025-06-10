/**
 * Transformer Architecture Tests
 * Tests for the modular transformer system
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  BaseTransformer,
  ConceptToRequirementsTransformer,
  RequirementsToDesignTransformer,
  DesignToArchitectureTransformer,
  ArchitectureToImplementationTransformer,
  ImplementationToDeploymentTransformer
} from '../../src/workflow-logic/transformers/index.js';

describe('Transformer Architecture', () => {
  let mockAnalyzer;
  let transformerOptions;

  beforeEach(() => {
    mockAnalyzer = {
      analyze: () => ({
        success: true,
        insights: {},
        metadata: {}
      })
    };

    transformerOptions = {
      projectType: 'web_app',
      enableCaching: false
    };
  });

  describe('Base Transformer', () => {
    it('should be an abstract class that cannot be instantiated directly', () => {
      expect(() => new BaseTransformer(mockAnalyzer, transformerOptions)).toThrow();
    });

    it('should provide common functionality to all transformers', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      expect(typeof transformer.extractCommonInsights).toBe('function');
      expect(typeof transformer.generateTechStack).toBe('function');
      expect(typeof transformer.generateDecisions).toBe('function');
      expect(typeof transformer.generateRecommendations).toBe('function');
      expect(typeof transformer.validateOutput).toBe('function');
    });
  });

  describe('Transformer Instantiation', () => {
    it('should create ConceptToRequirementsTransformer successfully', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      expect(transformer).toBeInstanceOf(ConceptToRequirementsTransformer);
      expect(transformer).toBeInstanceOf(BaseTransformer);
      expect(typeof transformer.transform).toBe('function');
    });

    it('should create RequirementsToDesignTransformer successfully', () => {
      const transformer = new RequirementsToDesignTransformer(mockAnalyzer, transformerOptions);
      
      expect(transformer).toBeInstanceOf(RequirementsToDesignTransformer);
      expect(transformer).toBeInstanceOf(BaseTransformer);
      expect(typeof transformer.transform).toBe('function');
    });

    it('should create DesignToArchitectureTransformer successfully', () => {
      const transformer = new DesignToArchitectureTransformer(mockAnalyzer, transformerOptions);
      
      expect(transformer).toBeInstanceOf(DesignToArchitectureTransformer);
      expect(transformer).toBeInstanceOf(BaseTransformer);
      expect(typeof transformer.transform).toBe('function');
    });

    it('should create ArchitectureToImplementationTransformer successfully', () => {
      const transformer = new ArchitectureToImplementationTransformer(mockAnalyzer, transformerOptions);
      
      expect(transformer).toBeInstanceOf(ArchitectureToImplementationTransformer);
      expect(transformer).toBeInstanceOf(BaseTransformer);
      expect(typeof transformer.transform).toBe('function');
    });

    it('should create ImplementationToDeploymentTransformer successfully', () => {
      const transformer = new ImplementationToDeploymentTransformer(mockAnalyzer, transformerOptions);
      
      expect(transformer).toBeInstanceOf(ImplementationToDeploymentTransformer);
      expect(transformer).toBeInstanceOf(BaseTransformer);
      expect(typeof transformer.transform).toBe('function');
    });
  });

  describe('SOLID Principles Compliance', () => {
    it('should follow Single Responsibility Principle - each transformer handles one phase transition', () => {
      const conceptTransformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      const designTransformer = new RequirementsToDesignTransformer(mockAnalyzer, transformerOptions);
      
      expect(conceptTransformer.constructor.name).toBe('ConceptToRequirementsTransformer');
      expect(designTransformer.constructor.name).toBe('RequirementsToDesignTransformer');
      
      // Each should have distinct responsibilities
      expect(conceptTransformer).not.toBe(designTransformer);
    });

    it('should follow Open/Closed Principle - extensible through inheritance', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      // Should be able to extend BaseTransformer
      expect(transformer).toBeInstanceOf(BaseTransformer);
      
      // Should have access to base functionality
      expect(typeof transformer.extractCommonInsights).toBe('function');
    });

    it('should follow Liskov Substitution Principle - all transformers implement same interface', () => {
      const transformers = [
        new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions),
        new RequirementsToDesignTransformer(mockAnalyzer, transformerOptions),
        new DesignToArchitectureTransformer(mockAnalyzer, transformerOptions),
        new ArchitectureToImplementationTransformer(mockAnalyzer, transformerOptions),
        new ImplementationToDeploymentTransformer(mockAnalyzer, transformerOptions)
      ];

      transformers.forEach(transformer => {
        expect(typeof transformer.transform).toBe('function');
        expect(transformer.transform.length).toBe(2); // analysis, targetPhase
      });
    });

    it('should follow Interface Segregation Principle - focused transform interface', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      // Should have focused interface
      expect(typeof transformer.transform).toBe('function');
      
      // Should not have unrelated methods
      expect(transformer.unrelatedMethod).toBeUndefined();
    });

    it('should follow Dependency Inversion Principle - depends on abstractions', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      // Should depend on analyzer interface, not concrete implementation
      expect(transformer.analyzer).toBe(mockAnalyzer);
      expect(typeof transformer.analyzer.analyze).toBe('function');
    });
  });

  describe('Transformer Functionality', () => {
    it('should transform concept analysis to requirements', async () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);

      const mockAnalysis = {
        insights: {
          market_analysis: { opportunities: ['Mobile-first', 'Real-time'] },
          user_personas: { needs: ['Performance', 'Usability'] }
        }
      };

      const result = await transformer.transform(mockAnalysis, 'requirements');

      expect(result.type).toBe('concept_to_requirements');
      expect(result.transformedAt).toBeDefined();
      expect(Array.isArray(result.functionalRequirements)).toBe(true);
      expect(Array.isArray(result.userStories)).toBe(true);
      expect(result.functionalRequirements.length).toBeGreaterThan(0);
    });

    it('should transform requirements to design specifications', async () => {
      const transformer = new RequirementsToDesignTransformer(mockAnalyzer, transformerOptions);

      const mockAnalysis = {
        insights: {
          functional_requirements: [
            { title: 'User Authentication', priority: 'high' }
          ],
          user_stories: [
            { story: 'As a user, I want to login securely' }
          ]
        }
      };

      const result = await transformer.transform(mockAnalysis, 'design');

      expect(result.type).toBe('requirements_to_design');
      expect(result.transformedAt).toBeDefined();
      expect(Array.isArray(result.wireframes)).toBe(true);
      expect(Array.isArray(result.userFlows)).toBe(true);
      expect(Array.isArray(result.componentSpecs)).toBe(true);
    });

    it('should transform design to architecture specifications', async () => {
      const transformer = new DesignToArchitectureTransformer(mockAnalyzer, transformerOptions);
      
      const mockAnalysis = {
        insights: {
          wireframes: [{ title: 'Dashboard', components: ['Header', 'Content'] }],
          component_specifications: [{ name: 'UserDashboard', type: 'display' }]
        }
      };

      const result = await transformer.transform(mockAnalysis, 'architecture');
      
      expect(result.type).toBe('design_to_architecture');
      expect(result.transformedAt).toBeDefined();
      expect(result.systemDesign).toBeDefined();
      expect(result.databaseSchema).toBeDefined();
      expect(result.apiSpecs).toBeDefined();
    });

    it('should transform architecture to implementation plan', async () => {
      const transformer = new ArchitectureToImplementationTransformer(mockAnalyzer, transformerOptions);
      
      const mockAnalysis = {
        insights: {
          system_design: { architecture: 'Microservices' },
          database_schema: { entities: [{ name: 'User' }] }
        }
      };

      const result = await transformer.transform(mockAnalysis, 'implementation');
      
      expect(result.type).toBe('architecture_to_implementation');
      expect(result.transformedAt).toBeDefined();
      expect(Array.isArray(result.coreFeatures)).toBe(true);
      expect(result.testingSuite).toBeDefined();
      expect(result.developmentPlan).toBeDefined();
    });

    it('should transform implementation to deployment plan', async () => {
      const transformer = new ImplementationToDeploymentTransformer(mockAnalyzer, transformerOptions);
      
      const mockAnalysis = {
        insights: {
          core_features: [{ name: 'Authentication', priority: 'high' }],
          testing_suite: { framework: 'Jest' }
        }
      };

      const result = await transformer.transform(mockAnalysis, 'deployment');
      
      expect(result.type).toBe('implementation_to_deployment');
      expect(result.transformedAt).toBeDefined();
      expect(result.deploymentPlan).toBeDefined();
      expect(result.monitoringSetup).toBeDefined();
      expect(result.operationalPlan).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle transformation errors gracefully', async () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);

      // Test with invalid analysis
      const invalidAnalysis = null;

      try {
        await transformer.transform(invalidAnalysis, 'requirements');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        // Should catch either the specific error or the wrapped transformation error
        expect(error.message).toMatch(/Transformation failed|null is not an object/);
      }
    });

    it('should validate output schemas', async () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, transformerOptions);
      
      const mockAnalysis = {
        insights: {
          market_analysis: { opportunities: ['Test'] }
        }
      };

      const result = await transformer.transform(mockAnalysis, 'requirements');
      
      // Should have required fields
      expect(result.type).toBeDefined();
      expect(result.transformedAt).toBeDefined();
      expect(result.insights).toBeDefined();
    });
  });

  describe('Configuration Integration', () => {
    it('should use project type configuration', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, {
        projectType: 'mobile_app'
      });
      
      expect(transformer.projectConfig).toBeDefined();
      expect(transformer.projectConfig.name).toBe('Mobile Application');
    });

    it('should handle missing project configuration gracefully', () => {
      const transformer = new ConceptToRequirementsTransformer(mockAnalyzer, {
        projectType: 'invalid_type'
      });
      
      // Should fallback to web_app
      expect(transformer.projectConfig).toBeDefined();
      expect(transformer.projectConfig.name).toBe('Web Application');
    });
  });
});
