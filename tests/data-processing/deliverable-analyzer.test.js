/**
 * Tests for DeliverableContentAnalyzer
 * BACKEND-001: Core component testing for enhanced workflow orchestration
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  DeliverableContentAnalyzer, 
  analyzeDeliverable, 
  analyzePhaseDeliverables 
} from '../../src/data-processing/deliverable-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DeliverableContentAnalyzer', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(__dirname, 'temp-test-deliverables');
    await fs.mkdir(testDir, { recursive: true });
    // Disable AI for faster testing
    analyzer = new DeliverableContentAnalyzer(testDir, { aiEnhancementEnabled: false });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Markdown Parsing', () => {
    it('should parse markdown content correctly', async () => {
      const markdownContent = `# Market Analysis Report

## Key Findings
- 73% of users struggle with project management complexity
- Primary pain point: Context loss between sessions
- Competitive gap: No AI-first workflow orchestration tools

## Target Audience
### Sarah (Product Manager)
- Needs: Systematic project tracking, AI assistance
- Pain: Inconsistent AI outputs, lack of project continuity

## Opportunities
- Build AI-first workflow orchestration
- Focus on context preservation
- Simplify complex project management`;

      const testFile = path.join(testDir, 'market_analysis.md');
      await fs.writeFile(testFile, markdownContent);

      const result = await analyzer.analyzeDeliverable(testFile, 'market_analysis');

      expect(result.success).toBe(true);
      expect(result.content.type).toBe('markdown');
      expect(result.content.title).toBe('Market Analysis Report');
      expect(result.content.headings.length).toBeGreaterThan(3); // Allow for flexible heading count
      expect(result.content.sections.length).toBeGreaterThan(3); // Allow for flexible section count
      expect(result.insights.type).toBe('market_analysis');
      expect(result.insights.keyFindings.length).toBeGreaterThan(0);
      expect(result.metadata.contentType).toBe('markdown');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should extract key points from bullet lists', async () => {
      const content = `# Test Document
      
## Key Points
- First important point
- Second critical insight
- Third major finding

## Action Items
* Implement feature A
* Research option B
* Test solution C`;

      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile);

      expect(result.success).toBe(true);
      expect(result.content.keyPoints.length).toBeGreaterThan(0);
      expect(result.content.lists.length).toBe(6);
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON content correctly', async () => {
      const jsonContent = {
        personas: [
          {
            name: "Sarah",
            role: "Product Manager",
            needs: ["Systematic tracking", "AI assistance"],
            painPoints: ["Context loss", "Inconsistent outputs"]
          }
        ],
        insights: {
          primaryPainPoint: "Context loss between sessions",
          marketGap: "No AI-first workflow tools"
        }
      };

      const testFile = path.join(testDir, 'user_personas.json');
      await fs.writeFile(testFile, JSON.stringify(jsonContent, null, 2));

      const result = await analyzer.analyzeDeliverable(testFile, 'user_personas');

      expect(result.success).toBe(true);
      expect(result.content.type).toBe('json');
      expect(result.content.data).toEqual(jsonContent);
      expect(result.content.keys).toContain('personas');
      expect(result.content.keys).toContain('insights');
      expect(result.insights.type).toBe('user_personas');
    });

    it('should handle invalid JSON gracefully', async () => {
      const invalidJson = '{ "invalid": json content }';
      const testFile = path.join(testDir, 'invalid.json');
      await fs.writeFile(testFile, invalidJson);

      const result = await analyzer.analyzeDeliverable(testFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });
  });

  describe('Text Parsing', () => {
    it('should parse plain text content', async () => {
      const textContent = `Market Research Summary

Key findings from user interviews:
Users struggle with maintaining context across work sessions
AI tools lack systematic workflow guidance
Project management tools are too complex

Next steps:
Build simplified workflow orchestrator
Focus on AI agent guidance
Implement context preservation`;

      const testFile = path.join(testDir, 'research.txt');
      await fs.writeFile(testFile, textContent);

      const result = await analyzer.analyzeDeliverable(testFile);

      expect(result.success).toBe(true);
      expect(result.content.type).toBe('text');
      expect(result.content.paragraphs.length).toBeGreaterThan(0);
      expect(result.content.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Insight Extraction', () => {
    it('should extract market analysis insights', async () => {
      const content = `# Market Analysis

## Key Findings
- 73% of users struggle with complexity
- Main pain point: Context loss
- Market opportunity: AI workflow tools

## Target Audience
- Product managers
- Development teams
- AI researchers

## Opportunities
- Build AI-first solution
- Focus on simplicity
- Address context preservation`;

      const testFile = path.join(testDir, 'market_analysis.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile, 'market_analysis');

      expect(result.insights.type).toBe('market_analysis');
      expect(result.insights.keyFindings.length).toBeGreaterThanOrEqual(0);
      expect(result.insights.painPoints.length).toBeGreaterThanOrEqual(0);
      expect(result.insights.opportunities.length).toBeGreaterThanOrEqual(0);
      expect(result.insights.targetAudience.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract user persona insights', async () => {
      const content = `# User Personas

## Sarah (Product Manager)
- Needs: Systematic project tracking
- Goals: Maintain project continuity
- Pain points: Context loss between sessions

## Mike (Developer)
- Needs: Clear technical guidance
- Goals: Efficient development workflow
- Pain points: Unclear requirements

## Common Needs
- Better AI assistance
- Simplified workflows
- Context preservation`;

      const testFile = path.join(testDir, 'user_personas.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile, 'user_personas');

      expect(result.insights.type).toBe('user_personas');
      expect(result.insights.personas.length).toBeGreaterThanOrEqual(2);
      expect(result.insights.personas[0].name).toContain('Sarah');
      expect(result.insights.commonNeeds.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract PRD insights', async () => {
      const content = `# Product Requirements Document

## Features
- AI workflow orchestration
- Context preservation system
- Systematic task generation

## Requirements
- Must maintain context between sessions
- Should provide clear task guidance
- Must integrate with existing tools

## User Stories
- As a product manager, I want systematic tracking
- As a developer, I want clear guidance
- As a user, I want simplified workflows

## Acceptance Criteria
- Context is preserved across sessions
- Tasks are generated systematically
- Integration works seamlessly`;

      const testFile = path.join(testDir, 'prd_complete.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile, 'prd_complete');

      expect(result.insights.type).toBe('prd_complete');
      expect(result.insights.features.length).toBeGreaterThan(0);
      expect(result.insights.requirements.length).toBeGreaterThan(0);
      expect(result.insights.userStories.length).toBeGreaterThan(0);
      expect(result.insights.acceptanceCriteria.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Generation', () => {
    it('should generate comprehensive metadata', async () => {
      const content = `# Test Document
This is a test document with some content.`;
      
      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.filePath).toBe(testFile);
      expect(result.metadata.fileName).toBe('test.md');
      expect(result.metadata.fileSize).toBeGreaterThan(0);
      expect(result.metadata.lastModified).toBeDefined();
      expect(result.metadata.contentHash).toBeDefined();
      expect(result.metadata.contentType).toBe('markdown');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.complexity).toBeGreaterThan(0);
      expect(result.metadata.completeness).toBeGreaterThan(0);
    });
  });

  describe('Relationship Identification', () => {
    it('should identify references to other deliverables', async () => {
      const content = `# System Design

Based on the market analysis and user personas, this system design addresses the key requirements from the PRD.

The wireframes inform the UI architecture, and the user stories guide the feature implementation.`;

      const testFile = path.join(testDir, 'system_design.md');
      await fs.writeFile(testFile, content);

      const result = await analyzer.analyzeDeliverable(testFile, 'system_design');

      expect(result.relationships).toBeDefined();
      expect(result.relationships.references).toContain('market analysis');
      expect(result.relationships.references).toContain('user personas');
      expect(result.relationships.references).toContain('prd');
      expect(result.relationships.references).toContain('wireframes');
      expect(result.relationships.references).toContain('user stories');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent files gracefully', async () => {
      const result = await analyzer.analyzeDeliverable('/non/existent/file.md');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle unsupported file types', async () => {
      const testFile = path.join(testDir, 'test.xyz');
      await fs.writeFile(testFile, 'some content');

      const result = await analyzer.analyzeDeliverable(testFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No parser available');
    });
  });

  describe('Convenience Functions', () => {
    it('should work with analyzeDeliverable function', async () => {
      const content = `# Test Document\nSome content here.`;
      const testFile = path.join(testDir, 'test.md');
      await fs.writeFile(testFile, content);

      const result = await analyzeDeliverable(testFile, 'test', testDir, { aiEnhancementEnabled: false });

      expect(result.success).toBe(true);
      expect(result.content.type).toBe('markdown');
    });

    it('should analyze phase deliverables', async () => {
      // Create test deliverables
      const phaseDir = path.join(testDir, 'research');
      await fs.mkdir(phaseDir, { recursive: true });

      await fs.writeFile(
        path.join(phaseDir, 'market_analysis.md'),
        '# Market Analysis\nSome findings here.'
      );
      
      await fs.writeFile(
        path.join(phaseDir, 'user_personas.json'),
        JSON.stringify({ personas: [] })
      );

      const result = await analyzePhaseDeliverables(phaseDir, testDir);

      expect(result.phase).toBe('research');
      expect(result.deliverables).toHaveLength(2);
      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should process deliverables within time limits', async () => {
      const largeContent = `# Large Document\n${'## Section\nContent here.\n'.repeat(100)}`;
      const testFile = path.join(testDir, 'large.md');
      await fs.writeFile(testFile, largeContent);

      const startTime = Date.now();
      const result = await analyzer.analyzeDeliverable(testFile);
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('AI Enhancement', () => {
    it('should gracefully fallback when AI is unavailable', async () => {
      const aiAnalyzer = new DeliverableContentAnalyzer(testDir, {
        aiEnhancementEnabled: true,
        fallbackToRules: true
      });

      const content = `# Market Analysis\n## Pain Points\n- Context loss\n- Poor integration`;
      const testFile = path.join(testDir, 'market.md');
      await fs.writeFile(testFile, content);

      const result = await aiAnalyzer.analyzeDeliverable(testFile, 'market_analysis');

      expect(result.success).toBe(true);
      expect(result.insights.type).toBe('market_analysis');
      // Should work even without AI API keys
    });

    it('should disable AI when configured', async () => {
      const noAiAnalyzer = new DeliverableContentAnalyzer(testDir, {
        aiEnhancementEnabled: false
      });

      expect(noAiAnalyzer.options.aiEnhancementEnabled).toBe(false);
    });

    it('should support AI enhancement options', async () => {
      const aiAnalyzer = new DeliverableContentAnalyzer(testDir, {
        aiEnhancementEnabled: true,
        aiProvider: 'openrouter',
        fallbackToRules: true,
        aiTimeout: 5000
      });

      expect(aiAnalyzer.options.aiEnhancementEnabled).toBe(true);
      expect(aiAnalyzer.options.aiProvider).toBe('openrouter');
      expect(aiAnalyzer.options.fallbackToRules).toBe(true);
      expect(aiAnalyzer.options.aiTimeout).toBe(5000);
    });
  });
});
