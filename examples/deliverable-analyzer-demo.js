#!/usr/bin/env bun

/**
 * DeliverableContentAnalyzer Demo
 * Demonstrates the enhanced content analysis capabilities for Guidant workflow orchestration
 *
 * Usage: bun examples/deliverable-analyzer-demo.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DeliverableContentAnalyzer,
  analyzePhaseDeliverables
} from '../src/data-processing/deliverable-analyzer.js';

// Simple console colors without chalk dependency
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: {
    blue: (text) => `\x1b[1m\x1b[34m${text}\x1b[0m`,
    green: (text) => `\x1b[1m\x1b[32m${text}\x1b[0m`
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createDemoDeliverables() {
  console.log(colors.blue('📁 Creating demo deliverables...'));
  
  const demoDir = path.join(__dirname, 'demo-deliverables');
  await fs.mkdir(demoDir, { recursive: true });

  // Market Analysis
  const marketAnalysis = `# AI Development Tools Market Analysis

## Executive Summary
The AI development tools market is experiencing rapid growth, with a critical gap in systematic workflow orchestration for AI agents and development teams.

## Key Findings
- 73% of developers struggle with AI agent consistency across sessions
- Primary pain point: Context loss between development sessions
- Market opportunity: $2.3B in AI development tools by 2025
- Competitive gap: No comprehensive AI workflow orchestrators exist

## Target Market Segments
### Enterprise Development Teams (45% of market)
- Need systematic AI development processes
- Require context preservation across team members
- Value integration with existing development workflows

### AI/ML Engineers (30% of market)
- Struggle with reproducible AI experiments
- Need systematic approach to AI model development
- Require comprehensive documentation and tracking

### Product Teams Using AI (25% of market)
- Need visibility into AI development progress
- Require quality assurance for AI-generated work
- Value systematic project management integration

## Pain Points Analysis
### Context Loss (Critical)
- AI tools lose context between sessions
- Team members can't continue each other's work
- Project knowledge scattered across tools

### Inconsistent AI Outputs (High)
- Same prompts produce different results
- No systematic approach to AI quality
- Difficult to reproduce successful AI interactions

### Poor Integration (Medium)
- AI tools don't integrate with project management
- Manual context switching between tools
- No unified workflow across AI development lifecycle

## Competitive Landscape
### Direct Competitors
- **GitHub Copilot**: Code generation only, no workflow orchestration
- **Cursor**: IDE-focused, limited to specific environment
- **Replit Agent**: Environment-specific, no systematic approach

### Competitive Advantages
- First comprehensive AI workflow orchestrator
- Cross-session context preservation
- Systematic SDLC integration
- Tool-agnostic approach

## Market Opportunities
- Enterprise AI adoption growing 40% year-over-year
- Developer productivity tools market expanding rapidly
- Increasing demand for AI governance and consistency
- Clear gap in systematic AI workflow management

## Recommendations
1. Focus on enterprise market initially for higher value
2. Emphasize systematic approach over speed
3. Build strong integration ecosystem
4. Prioritize context preservation as key differentiator`;

  await fs.writeFile(path.join(demoDir, 'market_analysis.md'), marketAnalysis);

  // User Personas
  const userPersonas = {
    "analysis_date": "2025-01-27",
    "primary_personas": [
      {
        "name": "Sarah Chen",
        "role": "Senior Product Manager",
        "company_size": "200-500 employees",
        "experience": "8 years",
        "goals": [
          "Maintain consistent AI-assisted development workflows",
          "Ensure project continuity across team members",
          "Reduce time spent on project coordination",
          "Improve development velocity with AI tools"
        ],
        "pain_points": [
          "AI tools produce inconsistent results",
          "Context loss when switching between team members",
          "Difficulty tracking AI-generated work",
          "Lack of systematic approach to AI development"
        ],
        "needs": [
          "Systematic project tracking with AI integration",
          "Context preservation across sessions",
          "Clear visibility into AI workflow progress",
          "Integration with existing project management tools"
        ]
      },
      {
        "name": "Mike Rodriguez",
        "role": "Senior Software Engineer",
        "company_size": "50-100 employees",
        "experience": "6 years",
        "goals": [
          "Efficient AI-assisted development",
          "Consistent code quality with AI tools",
          "Clear guidance on next development steps",
          "Seamless integration with existing tools"
        ],
        "pain_points": [
          "AI suggestions lack project context",
          "Unclear what to work on next",
          "Inconsistent AI code quality",
          "Manual context switching between tools"
        ],
        "needs": [
          "Context-aware AI assistance",
          "Clear task prioritization",
          "Integrated development workflow",
          "Quality assurance for AI-generated code"
        ]
      }
    ],
    "common_needs": [
      "Context preservation across work sessions",
      "Systematic approach to AI-assisted development",
      "Integration with existing development tools",
      "Clear progress tracking and visibility",
      "Quality assurance for AI-generated work",
      "Team collaboration and knowledge sharing"
    ]
  };

  await fs.writeFile(path.join(demoDir, 'user_personas.json'), JSON.stringify(userPersonas, null, 2));

  // PRD
  const prd = `# Product Requirements Document: Guidant AI Workflow Orchestrator

## Executive Summary
Based on market analysis and user persona research, Guidant addresses the critical gap in systematic AI development workflows by providing comprehensive context preservation and workflow orchestration.

## Target Users
Primary focus on Sarah Chen (Product Manager) and Mike Rodriguez (Senior Engineer) personas from our research.

## Core Features

### 1. Context Preservation System
**User Story:** As Sarah, I want AI context to persist across sessions so that project continuity is maintained when team members collaborate.

**Requirements:**
- Must maintain full project context for minimum 30 days
- Should integrate with top 5 development tools (VS Code, GitHub, etc.)
- Must provide context-aware task generation based on previous work

**Acceptance Criteria:**
- Context preservation accuracy > 95%
- Integration success rate > 90% with existing tools
- Task generation incorporates previous session context 100% of time

### 2. Systematic Workflow Orchestration
**User Story:** As Mike, I want clear guidance on next development steps so that I can work efficiently with AI tools without losing project context.

**Requirements:**
- Must provide systematic 6-phase SDLC management
- Should generate context-aware development tasks
- Must integrate with AI development tools (Copilot, Claude, etc.)

**Acceptance Criteria:**
- Supports complete SDLC workflow (Concept → Deployment)
- Generates tasks based on previous phase deliverables
- Integrates with minimum 3 major AI development tools

### 3. Quality Assurance Framework
**User Story:** As a development team, we want systematic quality validation so that AI-generated work meets our standards consistently.

**Requirements:**
- Must validate deliverable content quality, not just existence
- Should provide actionable improvement feedback
- Must support configurable quality thresholds

**Acceptance Criteria:**
- Content-based quality validation with 90% accuracy
- Provides specific improvement recommendations
- Supports custom quality criteria configuration

## Technical Requirements
- Node.js/Bun runtime environment for cross-platform support
- MCP (Model Context Protocol) integration for AI tool compatibility
- File-based project state management for reliability
- CLI interface with React/Ink components for enhanced UX

## Success Metrics
- 90% context preservation accuracy across sessions
- 50% reduction in project setup and coordination time
- 75% user satisfaction with AI task quality and relevance
- 95% integration success rate with existing development tools

## Implementation Priority
1. **Critical**: Context preservation and analysis system
2. **Critical**: Workflow orchestration engine
3. **High**: Quality assurance framework
4. **High**: Tool integrations and MCP protocol support
5. **Medium**: Advanced analytics and reporting`;

  await fs.writeFile(path.join(demoDir, 'prd_complete.md'), prd);

  console.log(colors.green('✅ Demo deliverables created successfully!'));
  return demoDir;
}

async function demonstrateAnalysis(demoDir) {
  console.log(colors.blue('\n🔍 Analyzing deliverables with enhanced content analysis...'));
  
  const analyzer = new DeliverableContentAnalyzer();

  // Analyze each deliverable individually
  const deliverables = [
    { file: 'market_analysis.md', type: 'market_analysis' },
    { file: 'user_personas.json', type: 'user_personas' },
    { file: 'prd_complete.md', type: 'prd_complete' }
  ];

  for (const deliverable of deliverables) {
    console.log(colors.yellow(`\n📄 Analyzing ${deliverable.file}...`));

    const filePath = path.join(demoDir, deliverable.file);
    const result = await analyzer.analyzeDeliverable(filePath, deliverable.type);

    if (result.success) {
      console.log(colors.green(`✅ Analysis successful`));
      console.log(`   📊 Content Type: ${result.content.type}`);
      console.log(`   📝 Word Count: ${result.metadata.wordCount}`);
      console.log(`   🎯 Complexity Score: ${result.metadata.complexity}`);
      console.log(`   ✨ Completeness: ${result.metadata.completeness}%`);

      // Show insights
      console.log(colors.cyan(`   🧠 Insights Extracted:`));
      if (result.insights.keyFindings?.length > 0) {
        console.log(`      • Key Findings: ${result.insights.keyFindings.length} items`);
      }
      if (result.insights.painPoints?.length > 0) {
        console.log(`      • Pain Points: ${result.insights.painPoints.length} items`);
      }
      if (result.insights.personas?.length > 0) {
        console.log(`      • Personas: ${result.insights.personas.length} identified`);
      }
      if (result.insights.features?.length > 0) {
        console.log(`      • Features: ${result.insights.features.length} identified`);
      }
      if (result.insights.requirements?.length > 0) {
        console.log(`      • Requirements: ${result.insights.requirements.length} extracted`);
      }

      // Show relationships
      if (result.relationships.references.length > 0) {
        console.log(colors.magenta(`   🔗 Cross-References: ${result.relationships.references.join(', ')}`));
      }
    } else {
      console.log(colors.red(`❌ Analysis failed: ${result.error}`));
    }
  }

  // Demonstrate phase analysis
  console.log(colors.blue('\n📁 Analyzing complete phase deliverables...'));
  const phaseResult = await analyzePhaseDeliverables(demoDir);

  console.log(colors.green(`✅ Phase analysis complete`));
  console.log(`   📊 Total Deliverables: ${phaseResult.summary.total}`);
  console.log(`   ✅ Successful: ${phaseResult.summary.successful}`);
  console.log(`   ❌ Failed: ${phaseResult.summary.failed}`);
  
  // Show transformation potential
  console.log(colors.blue('\n🔄 Demonstrating transformation potential...'));

  const marketResult = phaseResult.deliverables.find(d => d.type === 'market_analysis');
  const personaResult = phaseResult.deliverables.find(d => d.type === 'user_personas');
  const prdResult = phaseResult.deliverables.find(d => d.type === 'prd_complete');

  if (marketResult && personaResult && prdResult) {
    console.log(colors.cyan('   📈 Market Analysis → Requirements Transformation:'));
    console.log(`      • Pain points identified: ${marketResult.insights.painPoints?.length || 0}`);
    console.log(`      • Opportunities found: ${marketResult.insights.opportunities?.length || 0}`);
    console.log(`      • Requirements generated: ${prdResult.insights.requirements?.length || 0}`);

    console.log(colors.cyan('   👥 User Personas → Feature Mapping:'));
    console.log(`      • Personas analyzed: ${personaResult.insights.personas?.length || 0}`);
    console.log(`      • Common needs identified: ${personaResult.insights.commonNeeds?.length || 0}`);
    console.log(`      • Features specified: ${prdResult.insights.features?.length || 0}`);

    console.log(colors.green('\n🎯 This demonstrates how Guidant can now:'));
    console.log('   ✨ Extract meaningful insights from deliverables');
    console.log('   🔄 Transform data between phases intelligently');
    console.log('   🧠 Provide rich context for AI task generation');
    console.log('   📊 Track relationships across project phases');
  }
}

async function main() {
  try {
    console.log(colors.bold.blue('🚀 Guidant DeliverableContentAnalyzer Demo'));
    console.log(colors.gray('Demonstrating enhanced content analysis for AI workflow orchestration\n'));

    const demoDir = await createDemoDeliverables();
    await demonstrateAnalysis(demoDir);

    console.log(colors.bold.green('\n🎉 Demo completed successfully!'));
    console.log(colors.gray('The DeliverableContentAnalyzer is ready to enhance Guidant\'s workflow orchestration.'));

    // Cleanup
    console.log(colors.blue('\n🧹 Cleaning up demo files...'));
    await fs.rm(demoDir, { recursive: true, force: true });
    console.log(colors.green('✅ Cleanup complete!'));

  } catch (error) {
    console.error(colors.red('❌ Demo failed:'), error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
