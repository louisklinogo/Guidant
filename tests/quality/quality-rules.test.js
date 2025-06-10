/**
 * Quality Rules Tests
 * Tests for individual quality rule implementations
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { ContentLengthRule } from '../../src/quality/rules/content-length-rule.js';
import { StructureCompletenessRule } from '../../src/quality/rules/structure-completeness-rule.js';

describe('ContentLengthRule', () => {
  let rule;
  let context;

  beforeEach(() => {
    rule = new ContentLengthRule({
      minWords: 100,
      maxWords: 1000,
      minCharacters: 500,
      maxCharacters: 5000
    });

    context = {
      projectType: 'standard',
      phase: 'concept',
      deliverableType: 'market_analysis',
      deliverablePath: '/test/path.md',
      projectRoot: '/test',
      configuration: { projectType: 'standard' }
    };
  });

  describe('Rule Evaluation', () => {
    it('should pass for content meeting length requirements', async () => {
      const content = {
        type: 'markdown',
        wordCount: 500,
        rawContent: 'A'.repeat(2500), // 2500 characters
        lineCount: 50,
        sections: []
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.ruleId).toBe('content-length');
      expect(result.suggestions).toBeInstanceOf(Array);
    });

    it('should fail for content too short', async () => {
      const content = {
        type: 'markdown',
        wordCount: 50, // Below minimum
        rawContent: 'A'.repeat(250), // Below minimum characters
        lineCount: 10,
        sections: []
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(75);
      expect(result.message).toContain('too short');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should fail for content too long', async () => {
      const content = {
        type: 'markdown',
        wordCount: 1500, // Above maximum
        rawContent: 'A'.repeat(7500), // Above maximum characters
        lineCount: 200,
        sections: []
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.message).toContain('too verbose');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle JSON content correctly', async () => {
      const content = {
        type: 'json',
        data: {
          title: 'Test Analysis',
          content: 'A'.repeat(1000),
          sections: ['intro', 'analysis', 'conclusion']
        },
        rawContent: JSON.stringify({
          title: 'Test Analysis',
          content: 'A'.repeat(1000)
        })
      };

      const result = await rule.evaluate(content, context);

      expect(result.ruleId).toBe('content-length');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should adjust thresholds based on deliverable type', async () => {
      const prdContext = {
        ...context,
        deliverableType: 'prd_complete'
      };

      const content = {
        type: 'markdown',
        wordCount: 1500, // Well above PRD minimum
        rawContent: 'A'.repeat(4000), // Within PRD character limits
        lineCount: 100,
        sections: []
      };

      const result = await rule.evaluate(content, prdContext);
      const thresholds = rule.getThresholds(prdContext);

      expect(thresholds.minWords).toBeGreaterThan(rule.config.minWords);
      expect(result.passed).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        minWords: 50,
        maxWords: 2000,
        minCharacters: 250,
        maxCharacters: 10000
      };

      const isValid = rule.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        minWords: 1000,
        maxWords: 500, // Max less than min
        minCharacters: 5000,
        maxCharacters: 2500 // Max less than min
      };

      const isValid = rule.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should provide complete metadata', () => {
      const metadata = rule.getMetadata();

      expect(metadata.ruleId).toBe('content-length');
      expect(metadata.name).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.category).toBeDefined();
      expect(metadata.applicablePhases).toBeInstanceOf(Array);
      expect(metadata.applicableTypes).toBeInstanceOf(Array);
      expect(metadata.performance).toBeDefined();
    });
  });
});

describe('StructureCompletenessRule', () => {
  let rule;
  let context;

  beforeEach(() => {
    rule = new StructureCompletenessRule({
      requireTitle: true,
      requireSections: true,
      minSections: 3,
      minHeadings: 2
    });

    context = {
      projectType: 'standard',
      phase: 'concept',
      deliverableType: 'market_analysis',
      deliverablePath: '/test/path.md',
      projectRoot: '/test',
      configuration: { projectType: 'standard' }
    };
  });

  describe('Rule Evaluation', () => {
    it('should pass for well-structured content', async () => {
      const content = {
        type: 'markdown',
        title: 'Market Analysis Report',
        headings: [
          { text: 'Executive Summary', level: 2 },
          { text: 'Market Overview', level: 2 },
          { text: 'Target Audience', level: 2 },
          { text: 'Competitive Analysis', level: 2 }
        ],
        sections: [
          { heading: 'Executive Summary', content: ['Summary content'] },
          { heading: 'Market Overview', content: ['Market content'] },
          { heading: 'Target Audience', content: ['Audience content'] },
          { heading: 'Competitive Analysis', content: ['Competition content'] },
          { heading: 'Opportunities', content: ['Opportunities content'] }
        ]
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(75);
      expect(result.ruleId).toBe('structure-completeness');
    });

    it('should fail for content missing title', async () => {
      const content = {
        type: 'markdown',
        title: '', // Missing title
        headings: [
          { text: 'Section 1', level: 2 },
          { text: 'Section 2', level: 2 }
        ],
        sections: [
          { heading: 'Section 1', content: ['Content 1'] },
          { heading: 'Section 2', content: ['Content 2'] }
        ]
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Missing title');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should fail for insufficient sections', async () => {
      const content = {
        type: 'markdown',
        title: 'Test Document',
        headings: [
          { text: 'Section 1', level: 2 }
        ],
        sections: [
          { heading: 'Section 1', content: ['Content 1'] }
        ]
      };

      const result = await rule.evaluate(content, context);

      expect(result.passed).toBe(false);
      expect(result.message).toContain('Insufficient sections');
      expect(result.details.missing).toContain('2 additional sections');
    });

    it('should check for required sections by deliverable type', async () => {
      const content = {
        type: 'markdown',
        title: 'Market Analysis',
        headings: [
          { text: 'Introduction', level: 2 },
          { text: 'Conclusion', level: 2 }
        ],
        sections: [
          { heading: 'Introduction', content: ['Intro content'] },
          { heading: 'Conclusion', content: ['Conclusion content'] }
        ]
      };

      const result = await rule.evaluate(content, context);

      // Should fail because market_analysis requires specific sections
      expect(result.passed).toBe(false);
      expect(result.details.missing).toContain('executive summary');
    });

    it('should handle JSON content structure', async () => {
      const content = {
        type: 'json',
        data: {
          title: 'Test Analysis',
          'executive summary': 'Summary content',
          'market overview': 'Market content',
          'target audience': 'Audience content'
        }
      };

      const result = await rule.evaluate(content, context);

      expect(result.ruleId).toBe('structure-completeness');
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should adjust requirements based on project complexity', async () => {
      const enterpriseContext = {
        ...context,
        configuration: { projectType: 'enterprise' }
      };

      const content = {
        type: 'markdown',
        title: 'Test Document',
        headings: [
          { text: 'Section 1', level: 2 },
          { text: 'Section 2', level: 2 },
          { text: 'Section 3', level: 2 }
        ],
        sections: [
          { heading: 'Section 1', content: ['Content 1'] },
          { heading: 'Section 2', content: ['Content 2'] },
          { heading: 'Section 3', content: ['Content 3'] }
        ]
      };

      const requirements = rule.getRequirements(enterpriseContext);
      
      // Enterprise should require more sections
      expect(requirements.minSections).toBeGreaterThan(rule.config.minSections);
    });
  });

  describe('Section Matching', () => {
    it('should find missing required sections correctly', () => {
      const actualSections = ['introduction', 'market data', 'conclusion'];
      const requiredSections = ['executive summary', 'market overview', 'competitive analysis'];

      const missing = rule.findMissingSections(actualSections, requiredSections);

      expect(missing).toContain('executive summary');
      expect(missing).toContain('competitive analysis');
      expect(missing).not.toContain('market overview'); // Should match 'market data'
    });

    it('should handle partial section name matches', () => {
      const actualSections = ['exec summary', 'market info', 'competition'];
      const requiredSections = ['executive summary', 'market overview', 'competitive analysis'];

      const missing = rule.findMissingSections(actualSections, requiredSections);

      // Should find matches for partial names
      expect(missing.length).toBeLessThan(requiredSections.length);
    });
  });

  describe('Configuration', () => {
    it('should validate correct configuration', () => {
      const validConfig = {
        minSections: 3,
        minHeadings: 2,
        requireTitle: true
      };

      const isValid = rule.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        minSections: -1, // Negative value
        minHeadings: -5  // Negative value
      };

      const isValid = rule.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('Metadata', () => {
    it('should provide complete metadata', () => {
      const metadata = rule.getMetadata();

      expect(metadata.ruleId).toBe('structure-completeness');
      expect(metadata.name).toBeDefined();
      expect(metadata.description).toBeDefined();
      expect(metadata.category).toBeDefined();
      expect(metadata.applicablePhases).toBeInstanceOf(Array);
      expect(metadata.applicableTypes).toBeInstanceOf(Array);
      expect(metadata.performance).toBeDefined();
    });
  });
});
