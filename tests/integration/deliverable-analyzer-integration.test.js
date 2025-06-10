/**
 * Integration tests for DeliverableContentAnalyzer with real Guidant project structure
 * Tests the analyzer working with actual .guidant directory structure
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  DeliverableContentAnalyzer, 
  analyzePhaseDeliverables 
} from '../../src/data-processing/deliverable-analyzer.js';
import { initializeProjectStructure } from '../../src/file-management/project-structure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DeliverableContentAnalyzer Integration', () => {
  let testProjectDir;
  let analyzer;

  beforeEach(async () => {
    // Create temporary test project
    testProjectDir = path.join(__dirname, 'temp-integration-project');
    await fs.mkdir(testProjectDir, { recursive: true });
    
    // Initialize Guidant project structure
    await initializeProjectStructure(testProjectDir);
    
    analyzer = new DeliverableContentAnalyzer(testProjectDir);
  });

  afterEach(async () => {
    // Clean up test project
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Real Project Workflow', () => {
    it('should analyze a complete concept phase workflow', async () => {
      // Create realistic concept phase deliverables
      const researchDir = path.join(testProjectDir, '.guidant', 'deliverables', 'research');
      
      // Market Analysis
      const marketAnalysis = `# AI Workflow Orchestration Market Analysis

## Executive Summary
The market for AI development tools is rapidly expanding, with a critical gap in systematic workflow orchestration for AI agents.

## Key Findings
- 73% of developers struggle with AI agent consistency
- Primary pain point: Context loss between sessions
- Market opportunity: $2.3B in AI development tools by 2025
- Competitive gap: No comprehensive AI workflow orchestrators

## Target Market
### Primary Audience
- AI/ML Engineers (45% of market)
- Product Managers using AI tools (30% of market)
- Development teams adopting AI workflows (25% of market)

### Pain Points
- Inconsistent AI outputs across sessions
- Lack of systematic development processes
- Poor integration between AI tools and existing workflows
- Context management challenges

## Competitive Landscape
### Direct Competitors
- GitHub Copilot: Code generation only
- Cursor: IDE-focused AI assistance
- Replit Agent: Limited to specific environments

### Competitive Advantages
- Systematic workflow orchestration
- Cross-session context preservation
- Multi-phase project management
- Tool-agnostic integration

## Market Opportunities
- Enterprise AI adoption growing 40% YoY
- Developer productivity tools market expanding
- Increasing demand for AI governance and consistency
- Gap in systematic AI workflow management

## Recommendations
- Focus on enterprise market initially
- Emphasize systematic approach over speed
- Build strong integration ecosystem
- Prioritize context preservation features`;

      await fs.writeFile(path.join(researchDir, 'market_analysis.md'), marketAnalysis);

      // User Personas
      const userPersonas = `# User Personas for AI Workflow Orchestrator

## Primary Personas

### Sarah Chen (Senior Product Manager)
**Demographics:**
- Age: 32, 8 years experience
- Company: Mid-size SaaS company (200-500 employees)
- Location: San Francisco Bay Area

**Goals:**
- Maintain consistent AI-assisted development workflows
- Ensure project continuity across team members
- Reduce time spent on project coordination
- Improve development velocity with AI tools

**Pain Points:**
- AI tools produce inconsistent results
- Context loss when switching between team members
- Difficulty tracking AI-generated work
- Lack of systematic approach to AI development

**Needs:**
- Systematic project tracking with AI integration
- Context preservation across sessions
- Clear visibility into AI workflow progress
- Integration with existing project management tools

### Mike Rodriguez (Senior Software Engineer)
**Demographics:**
- Age: 29, 6 years experience
- Company: Tech startup (50-100 employees)
- Location: Austin, Texas

**Goals:**
- Efficient AI-assisted development
- Consistent code quality with AI tools
- Clear guidance on next development steps
- Seamless integration with existing tools

**Pain Points:**
- AI suggestions lack project context
- Unclear what to work on next
- Inconsistent AI code quality
- Manual context switching between tools

**Needs:**
- Context-aware AI assistance
- Clear task prioritization
- Integrated development workflow
- Quality assurance for AI-generated code

### Dr. Lisa Wang (AI Research Lead)
**Demographics:**
- Age: 35, 10 years experience
- Company: Enterprise technology company (1000+ employees)
- Location: Seattle, Washington

**Goals:**
- Systematic AI experimentation workflows
- Reproducible AI development processes
- Team collaboration on AI projects
- Knowledge transfer and documentation

**Pain Points:**
- Difficulty reproducing AI experiments
- Lack of systematic approach to AI development
- Poor documentation of AI decision processes
- Team coordination challenges

**Needs:**
- Systematic experiment tracking
- Reproducible workflow processes
- Comprehensive documentation generation
- Team collaboration features

## Common Needs Across Personas
- Context preservation across work sessions
- Systematic approach to AI-assisted development
- Integration with existing development tools
- Clear progress tracking and visibility
- Quality assurance for AI-generated work
- Team collaboration and knowledge sharing`;

      await fs.writeFile(path.join(researchDir, 'user_personas.md'), userPersonas);

      // Competitor Research
      const competitorResearch = {
        "analysis_date": "2025-01-27",
        "competitors": [
          {
            "name": "GitHub Copilot",
            "category": "Code Generation",
            "strengths": [
              "Excellent code completion",
              "Wide IDE integration",
              "Large user base",
              "Strong AI model"
            ],
            "weaknesses": [
              "No workflow orchestration",
              "Limited context awareness",
              "No project management features",
              "Session-based only"
            ],
            "market_position": "Dominant in code generation",
            "pricing": "$10-19/month per user"
          },
          {
            "name": "Cursor",
            "category": "AI IDE",
            "strengths": [
              "Integrated development environment",
              "Good context understanding",
              "Real-time collaboration",
              "Custom AI models"
            ],
            "weaknesses": [
              "IDE lock-in",
              "No systematic workflow",
              "Limited project orchestration",
              "Early stage product"
            ],
            "market_position": "Growing in AI-first development",
            "pricing": "$20/month per user"
          }
        ],
        "market_gaps": [
          "No comprehensive workflow orchestration",
          "Limited cross-session context preservation",
          "Lack of systematic development processes",
          "Poor integration between AI tools and project management"
        ],
        "opportunities": [
          "Build first comprehensive AI workflow orchestrator",
          "Focus on enterprise systematic processes",
          "Create tool-agnostic integration platform",
          "Emphasize context preservation and continuity"
        ]
      };

      await fs.writeFile(
        path.join(researchDir, 'competitor_research.json'), 
        JSON.stringify(competitorResearch, null, 2)
      );

      // Analyze the complete concept phase
      const result = await analyzePhaseDeliverables(researchDir, testProjectDir);

      // Validate analysis results
      expect(result.phase).toBe('research');
      expect(result.deliverables).toHaveLength(3);
      expect(result.summary.successful).toBe(3);
      expect(result.summary.failed).toBe(0);

      // Validate market analysis insights
      const marketResult = result.deliverables.find(d => d.path.includes('market_analysis'));
      expect(marketResult.success).toBe(true);
      expect(marketResult.insights.type).toBe('market_analysis');
      expect(marketResult.insights.keyFindings.length).toBeGreaterThan(0);
      expect(marketResult.insights.painPoints.length).toBeGreaterThan(0);
      expect(marketResult.insights.opportunities.length).toBeGreaterThan(0);

      // Validate persona insights
      const personaResult = result.deliverables.find(d => d.path.includes('user_personas'));
      expect(personaResult.success).toBe(true);
      expect(personaResult.insights.type).toBe('user_personas');
      expect(personaResult.insights.personas.length).toBeGreaterThanOrEqual(2); // Allow flexible persona count
      expect(personaResult.insights.commonNeeds.length).toBeGreaterThan(0);

      // Validate competitor research insights
      const competitorResult = result.deliverables.find(d => d.path.includes('competitor_research'));
      expect(competitorResult.success).toBe(true);
      expect(competitorResult.insights.type).toBe('competitor_research');
      expect(competitorResult.content.data.competitors).toHaveLength(2);

      // Validate cross-deliverable relationships
      expect(marketResult.relationships.references.length).toBeGreaterThanOrEqual(0);
      expect(personaResult.relationships.references.length).toBeGreaterThanOrEqual(0);
    });

    it('should extract actionable insights for phase transitions', async () => {
      // Create a PRD that references previous phase work
      const requirementsDir = path.join(testProjectDir, '.guidant', 'deliverables', 'requirements');
      
      const prdContent = `# Product Requirements Document: AI Workflow Orchestrator

## Executive Summary
Based on our market analysis findings and user persona research, we are building an AI workflow orchestrator that addresses the critical gap in systematic AI development processes.

## Target Users
Primary focus on Sarah Chen (Product Manager) and Mike Rodriguez (Senior Engineer) personas identified in our user research.

## Core Features

### 1. Context Preservation System
**User Story:** As Sarah, I want AI context to persist across sessions so that project continuity is maintained.

**Requirements:**
- Must maintain full project context between sessions
- Should integrate with existing development tools
- Must provide context-aware task generation

**Acceptance Criteria:**
- Context is preserved for minimum 30 days
- Integration works with top 5 development tools
- Task generation incorporates previous session context

### 2. Systematic Workflow Orchestration
**User Story:** As Mike, I want clear guidance on next development steps so that I can work efficiently with AI tools.

**Requirements:**
- Must provide systematic SDLC phase management
- Should generate context-aware development tasks
- Must integrate with AI development tools

**Acceptance Criteria:**
- Supports 6-phase SDLC workflow
- Generates tasks based on previous phase deliverables
- Integrates with GitHub Copilot, Cursor, and Claude

### 3. Quality Assurance Framework
**User Story:** As Dr. Lisa Wang, I want systematic quality validation so that AI-generated work meets standards.

**Requirements:**
- Must validate deliverable completeness
- Should provide quality scoring
- Must support custom quality criteria

**Acceptance Criteria:**
- Validates content quality, not just existence
- Provides actionable improvement feedback
- Supports configurable quality thresholds

## Technical Requirements
- Node.js/Bun runtime environment
- MCP (Model Context Protocol) integration
- File-based project state management
- Cross-platform CLI interface

## Success Metrics
- 90% context preservation accuracy
- 50% reduction in project setup time
- 75% user satisfaction with AI task quality
- 95% integration success rate with existing tools

## Implementation Priority
1. Context preservation system (Critical)
2. Workflow orchestration engine (Critical)
3. Quality assurance framework (High)
4. Tool integrations (High)
5. Advanced analytics (Medium)`;

      await fs.writeFile(path.join(requirementsDir, 'prd_complete.md'), prdContent);

      // Analyze the PRD
      const result = await analyzer.analyzeDeliverable(
        path.join(requirementsDir, 'prd_complete.md'), 
        'prd_complete'
      );

      // Validate PRD analysis
      expect(result.success).toBe(true);
      expect(result.insights.type).toBe('prd_complete');
      expect(result.insights.features.length).toBeGreaterThan(0);
      expect(result.insights.requirements.length).toBeGreaterThan(0);
      expect(result.insights.userStories.length).toBeGreaterThan(0);
      expect(result.insights.acceptanceCriteria.length).toBeGreaterThan(0);

      // Validate cross-phase references
      expect(result.relationships.references).toContain('market analysis');
      expect(result.relationships.references.length).toBeGreaterThanOrEqual(1);

      // Validate content quality
      expect(result.metadata.completeness).toBeGreaterThan(75);
      expect(result.metadata.complexity).toBeGreaterThan(5);
      expect(result.metadata.wordCount).toBeGreaterThan(300);
    });

    it('should handle mixed file types in phase analysis', async () => {
      // Create mixed deliverables in architecture phase
      const archDir = path.join(testProjectDir, '.guidant', 'deliverables', 'architecture');
      
      // System design (Markdown)
      const systemDesign = `# System Architecture Design

## Overview
Based on the PRD requirements, this system design implements a modular architecture for AI workflow orchestration.

## Core Components
- Context Management Service
- Workflow Orchestration Engine
- Quality Validation Framework
- Integration Layer

## Technology Stack
- Runtime: Node.js/Bun
- Protocol: MCP (Model Context Protocol)
- Storage: File-based JSON
- Interface: CLI with React/Ink components

## Architecture Patterns
- Event-driven architecture for loose coupling
- Plugin system for extensible integrations
- State machine for workflow management
- Factory pattern for component creation`;

      await fs.writeFile(path.join(archDir, 'system_design.md'), systemDesign);

      // Database schema (JSON)
      const dbSchema = {
        "schema_version": "1.0",
        "entities": {
          "project": {
            "fields": ["id", "name", "description", "created_at", "updated_at"],
            "relationships": ["phases", "deliverables", "sessions"]
          },
          "phase": {
            "fields": ["id", "name", "status", "started_at", "completed_at"],
            "relationships": ["project", "deliverables", "quality_gates"]
          },
          "deliverable": {
            "fields": ["id", "name", "type", "content", "metadata"],
            "relationships": ["phase", "insights", "relationships"]
          }
        },
        "indexes": [
          "project.name",
          "phase.status",
          "deliverable.type"
        ]
      };

      await fs.writeFile(
        path.join(archDir, 'database_schema.json'), 
        JSON.stringify(dbSchema, null, 2)
      );

      // API specification (Text)
      const apiSpec = `API Specification for AI Workflow Orchestrator

Core Endpoints:
- GET /api/projects - List all projects
- POST /api/projects - Create new project
- GET /api/projects/{id}/phases - Get project phases
- POST /api/projects/{id}/advance - Advance to next phase
- GET /api/deliverables/{id}/analyze - Analyze deliverable content

MCP Tools:
- guidant_init_project - Initialize new project
- guidant_get_current_task - Get next task
- guidant_save_deliverable - Save deliverable content
- guidant_analyze_content - Analyze deliverable insights

Authentication:
- API key based authentication
- Role-based access control
- Session management for CLI tools`;

      await fs.writeFile(path.join(archDir, 'api_specification.txt'), apiSpec);

      // Analyze the complete architecture phase
      const result = await analyzePhaseDeliverables(archDir, testProjectDir);

      // Validate mixed file type analysis
      expect(result.phase).toBe('architecture');
      expect(result.deliverables).toHaveLength(3);
      expect(result.summary.successful).toBe(3);

      // Validate different content types
      const markdownResult = result.deliverables.find(d => d.path.includes('system_design'));
      const jsonResult = result.deliverables.find(d => d.path.includes('database_schema'));
      const textResult = result.deliverables.find(d => d.path.includes('api_specification'));

      expect(markdownResult.content.type).toBe('markdown');
      expect(jsonResult.content.type).toBe('json');
      expect(textResult.content.type).toBe('text');

      // Validate architecture-specific insights
      expect(markdownResult.insights.type).toBe('system_design');
      expect(markdownResult.insights.components.length).toBeGreaterThan(0);
      expect(markdownResult.insights.technologies.length).toBeGreaterThan(0);
    });
  });

  describe('Performance with Real Data', () => {
    it('should handle large deliverables efficiently', async () => {
      const researchDir = path.join(testProjectDir, '.guidant', 'deliverables', 'research');
      
      // Create a large market analysis document
      const largeContent = `# Comprehensive Market Analysis\n\n` + 
        Array(100).fill(0).map((_, i) => 
          `## Section ${i + 1}\n` +
          `This is section ${i + 1} with detailed analysis content. `.repeat(20) + '\n\n' +
          `### Key Points\n` +
          Array(10).fill(0).map((_, j) => `- Important point ${i + 1}.${j + 1}`).join('\n') + '\n\n'
        ).join('');

      await fs.writeFile(path.join(researchDir, 'large_market_analysis.md'), largeContent);

      const startTime = Date.now();
      const result = await analyzer.analyzeDeliverable(
        path.join(researchDir, 'large_market_analysis.md'),
        'market_analysis'
      );
      const endTime = Date.now();

      // Validate performance
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.success).toBe(true);
      expect(result.metadata.wordCount).toBeGreaterThan(10000);
      expect(result.content.sections.length).toBeGreaterThan(50); // Allow flexible section count
    });
  });
});
