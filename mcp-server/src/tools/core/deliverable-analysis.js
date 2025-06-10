/**
 * MCP Tools for Deliverable Content Analysis
 * Exposes DeliverableContentAnalyzer capabilities to AI agents via MCP protocol
 * 
 * This allows AI agents to perform sophisticated content analysis using Guidant's
 * systematic approach while maintaining the hybrid rule-based + AI enhancement model.
 */

import { z } from 'zod';
import path from 'path';
import { 
  DeliverableContentAnalyzer, 
  analyzePhaseDeliverables 
} from '../../../../src/data-processing/deliverable-analyzer.js';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';

// Input validation schemas
const AnalyzeDeliverableSchema = z.object({
  deliverablePath: z.string().describe('Path to the deliverable file to analyze'),
  deliverableType: z.string().optional().describe('Type of deliverable (market_analysis, user_personas, prd_complete, etc.)'),
  aiEnhanced: z.boolean().default(false).describe('Enable AI enhancement for deeper analysis'),
  projectRoot: z.string().optional().describe('Project root directory (defaults to current)')
});

const AnalyzePhaseSchema = z.object({
  phaseDirectory: z.string().describe('Path to phase directory containing deliverables'),
  aiEnhanced: z.boolean().default(false).describe('Enable AI enhancement for all deliverables'),
  projectRoot: z.string().optional().describe('Project root directory (defaults to current)')
});

const ExtractInsightsSchema = z.object({
  content: z.string().describe('Raw content to analyze'),
  contentType: z.enum(['markdown', 'json', 'text']).describe('Type of content'),
  deliverableType: z.string().optional().describe('Type of deliverable for specialized analysis'),
  aiEnhanced: z.boolean().default(false).describe('Enable AI enhancement for insight extraction')
});

/**
 * Analyze a single deliverable file
 * Provides comprehensive content analysis with optional AI enhancement
 */
export const analyzeDeliverable = {
  name: 'guidant_analyze_deliverable',
  description: `Analyze a deliverable file to extract structured insights, metadata, and relationships.
  
This tool performs comprehensive analysis of project deliverables including:
- Content parsing (markdown, JSON, text)
- Insight extraction (pain points, opportunities, requirements, etc.)
- Metadata generation (complexity, completeness, word count)
- Cross-phase relationship identification
- Optional AI enhancement for semantic understanding

The analysis follows Guidant's systematic approach to ensure consistent, high-quality insights
that can be used for phase transitions and context-aware task generation.`,
  
  inputSchema: AnalyzeDeliverableSchema,
  
  async handler({ deliverablePath, deliverableType, aiEnhanced = false, projectRoot }) {
    try {
      const analyzer = new DeliverableContentAnalyzer(projectRoot || process.cwd(), {
        aiEnhancementEnabled: aiEnhanced,
        fallbackToRules: true
      });

      const result = await analyzer.analyzeDeliverable(deliverablePath, deliverableType);

      if (!result.success) {
        return formatErrorResponse(
          `Failed to analyze deliverable: ${result.error}`
        );
      }

      // Enhance response with analysis summary
      const summary = {
        analysisType: aiEnhanced ? 'AI-Enhanced' : 'Rule-Based',
        contentType: result.content.type,
        wordCount: result.metadata.wordCount,
        complexity: result.metadata.complexity,
        completeness: result.metadata.completeness,
        insightCount: {
          keyFindings: result.insights.keyFindings?.length || 0,
          painPoints: result.insights.painPoints?.length || 0,
          opportunities: result.insights.opportunities?.length || 0,
          features: result.insights.features?.length || 0,
          requirements: result.insights.requirements?.length || 0
        },
        relationships: result.relationships.references.length,
        aiEnhanced: result.insights.aiEnhanced || false
      };

      return formatSuccessResponse({
        analysis: result,
        summary,
        recommendations: generateAnalysisRecommendations(result)
      }, `Successfully analyzed ${deliverableType || 'deliverable'} with ${summary.analysisType} approach`);

    } catch (error) {
      return formatErrorResponse(
        'Deliverable analysis failed due to unexpected error: ' + error.message
      );
    }
  }
};

/**
 * Analyze all deliverables in a phase directory
 * Provides batch analysis for complete phase assessment
 */
export const analyzePhase = {
  name: 'guidant_analyze_phase',
  description: `Analyze all deliverables in a phase directory for comprehensive phase assessment.

This tool performs batch analysis of all deliverables within a project phase:
- Analyzes multiple files simultaneously
- Provides phase-level summary and insights
- Identifies cross-deliverable relationships
- Assesses phase completion quality
- Optional AI enhancement for all deliverables

Results include individual deliverable analyses plus phase-level aggregated insights
that can inform phase transition decisions and next-phase task generation.`,

  inputSchema: AnalyzePhaseSchema,

  async handler({ phaseDirectory, aiEnhanced = false, projectRoot }) {
    try {
      const analyzer = new DeliverableContentAnalyzer(projectRoot || process.cwd(), {
        aiEnhancementEnabled: aiEnhanced,
        fallbackToRules: true
      });

      const result = await analyzePhaseDeliverables(phaseDirectory, projectRoot);

      if (result.error) {
        return formatErrorResponse(
          `Failed to analyze phase deliverables: ${result.error}`
        );
      }

      // Generate phase-level insights
      const phaseInsights = aggregatePhaseInsights(result);
      const phaseQuality = assessPhaseQuality(result);
      const transitionReadiness = assessTransitionReadiness(result);

      return formatSuccessResponse({
        phaseAnalysis: result,
        phaseInsights,
        phaseQuality,
        transitionReadiness,
        recommendations: generatePhaseRecommendations(result, phaseQuality)
      }, `Successfully analyzed ${result.summary.total} deliverables in ${result.phase} phase`);

    } catch (error) {
      return formatErrorResponse(
        'Phase analysis failed due to unexpected error: ' + error.message
      );
    }
  }
};

/**
 * Extract insights from raw content
 * Allows AI agents to analyze content without file system access
 */
export const extractContentInsights = {
  name: 'guidant_extract_insights',
  description: `Extract structured insights from raw content using Guidant's analysis engine.

This tool allows analysis of content that hasn't been saved to files yet:
- Parses content in memory
- Extracts type-specific insights
- Provides immediate feedback on content quality
- Optional AI enhancement for semantic analysis

Useful for analyzing draft content, user input, or content from external sources
before committing to the project structure.`,

  inputSchema: ExtractInsightsSchema,

  async handler({ content, contentType, deliverableType, aiEnhanced = false }) {
    try {
      const analyzer = new DeliverableContentAnalyzer(process.cwd(), {
        aiEnhancementEnabled: aiEnhanced,
        fallbackToRules: true
      });

      // Parse content based on type
      let parsed;
      switch (contentType) {
        case 'markdown':
          parsed = await analyzer.parseMarkdown(content, 'memory://content.md');
          break;
        case 'json':
          parsed = await analyzer.parseJSON(content, 'memory://content.json');
          break;
        case 'text':
          parsed = await analyzer.parseText(content, 'memory://content.txt');
          break;
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }

      // Extract insights
      const insights = await analyzer.extractInsights(parsed, deliverableType, 'memory://content');

      // Generate metadata
      const metadata = {
        contentType: parsed.type,
        wordCount: parsed.wordCount || 0,
        complexity: analyzer.calculateComplexity(parsed),
        completeness: analyzer.assessCompleteness(parsed),
        analyzedAt: new Date().toISOString()
      };

      return formatSuccessResponse({
        insights,
        metadata,
        structure: {
          headings: parsed.headings?.length || 0,
          sections: parsed.sections?.length || 0,
          keyPoints: parsed.keyPoints?.length || 0
        },
        recommendations: generateContentRecommendations(insights, metadata)
      }, `Successfully extracted insights from ${contentType} content`);

    } catch (error) {
      return formatErrorResponse(
        'Content insight extraction failed: ' + error.message
      );
    }
  }
};

// Helper functions for enhanced analysis

function generateAnalysisRecommendations(result) {
  const recommendations = [];

  if (result.metadata.completeness < 75) {
    recommendations.push({
      type: 'quality',
      priority: 'high',
      message: 'Deliverable appears incomplete. Consider adding more detailed content.',
      suggestion: 'Add more sections, examples, or detailed explanations to improve completeness.'
    });
  }

  if (result.insights.painPoints?.length === 0 && result.type === 'market_analysis') {
    recommendations.push({
      type: 'content',
      priority: 'medium',
      message: 'No pain points identified in market analysis.',
      suggestion: 'Consider adding user pain points or market challenges to strengthen the analysis.'
    });
  }

  if (result.relationships.references.length === 0) {
    recommendations.push({
      type: 'integration',
      priority: 'low',
      message: 'No cross-references to other deliverables found.',
      suggestion: 'Consider referencing related deliverables to improve project coherence.'
    });
  }

  return recommendations;
}

function aggregatePhaseInsights(phaseResult) {
  const allInsights = phaseResult.deliverables
    .filter(d => d.success)
    .map(d => d.insights);

  return {
    totalKeyFindings: allInsights.reduce((sum, i) => sum + (i.keyFindings?.length || 0), 0),
    totalPainPoints: allInsights.reduce((sum, i) => sum + (i.painPoints?.length || 0), 0),
    totalOpportunities: allInsights.reduce((sum, i) => sum + (i.opportunities?.length || 0), 0),
    totalFeatures: allInsights.reduce((sum, i) => sum + (i.features?.length || 0), 0),
    aiEnhancedCount: allInsights.filter(i => i.aiEnhanced).length
  };
}

function assessPhaseQuality(phaseResult) {
  const deliverables = phaseResult.deliverables.filter(d => d.success);
  
  if (deliverables.length === 0) {
    return { score: 0, level: 'poor', issues: ['No successful deliverable analysis'] };
  }

  const avgCompleteness = deliverables.reduce((sum, d) => sum + d.metadata.completeness, 0) / deliverables.length;
  const avgComplexity = deliverables.reduce((sum, d) => sum + d.metadata.complexity, 0) / deliverables.length;

  let score = avgCompleteness;
  let level = 'poor';
  let issues = [];

  if (avgCompleteness >= 90) level = 'excellent';
  else if (avgCompleteness >= 75) level = 'good';
  else if (avgCompleteness >= 60) level = 'fair';
  else issues.push('Low content completeness across deliverables');

  if (avgComplexity < 3) issues.push('Deliverables may lack sufficient detail');

  return { score, level, issues, avgCompleteness, avgComplexity };
}

function assessTransitionReadiness(phaseResult) {
  const quality = assessPhaseQuality(phaseResult);
  const hasRequiredDeliverables = phaseResult.summary.successful >= 2;
  const hasInsights = phaseResult.deliverables.some(d => 
    d.success && (d.insights.keyFindings?.length > 0 || d.insights.painPoints?.length > 0)
  );

  const ready = quality.score >= 75 && hasRequiredDeliverables && hasInsights;

  return {
    ready,
    score: quality.score,
    requirements: {
      qualityThreshold: quality.score >= 75,
      minimumDeliverables: hasRequiredDeliverables,
      hasActionableInsights: hasInsights
    },
    blockers: ready ? [] : [
      ...(quality.score < 75 ? ['Deliverable quality below threshold'] : []),
      ...(!hasRequiredDeliverables ? ['Insufficient deliverables completed'] : []),
      ...(!hasInsights ? ['No actionable insights extracted'] : [])
    ]
  };
}

function generatePhaseRecommendations(phaseResult, phaseQuality) {
  const recommendations = [];

  if (phaseQuality.level === 'poor') {
    recommendations.push({
      type: 'quality',
      priority: 'critical',
      message: 'Phase quality is below acceptable standards.',
      suggestion: 'Review and enhance deliverable content before proceeding to next phase.'
    });
  }

  if (phaseResult.summary.failed > 0) {
    recommendations.push({
      type: 'completion',
      priority: 'high',
      message: `${phaseResult.summary.failed} deliverables failed analysis.`,
      suggestion: 'Review failed deliverables and ensure they meet format and content requirements.'
    });
  }

  return recommendations;
}

function generateContentRecommendations(insights, metadata) {
  const recommendations = [];

  if (metadata.wordCount < 100) {
    recommendations.push({
      type: 'length',
      priority: 'medium',
      message: 'Content appears brief.',
      suggestion: 'Consider adding more detail and examples to improve comprehensiveness.'
    });
  }

  if (metadata.complexity < 3) {
    recommendations.push({
      type: 'depth',
      priority: 'low',
      message: 'Content structure is simple.',
      suggestion: 'Consider adding subsections, examples, or more detailed analysis.'
    });
  }

  return recommendations;
}

/**
 * Register deliverable analysis tools with MCP server
 * @param {object} server - MCP server instance
 */
export function registerDeliverableAnalysisTools(server) {
  // Analyze single deliverable
  server.addTool({
    name: analyzeDeliverable.name,
    description: analyzeDeliverable.description,
    parameters: analyzeDeliverable.inputSchema,
    handler: analyzeDeliverable.handler
  });

  // Analyze phase deliverables
  server.addTool({
    name: analyzePhase.name,
    description: analyzePhase.description,
    parameters: analyzePhase.inputSchema,
    handler: analyzePhase.handler
  });

  // Extract content insights
  server.addTool({
    name: extractContentInsights.name,
    description: extractContentInsights.description,
    parameters: extractContentInsights.inputSchema,
    handler: extractContentInsights.handler
  });

  console.log('✅ Deliverable Analysis tools registered');
}

export default {
  analyzeDeliverable,
  analyzePhase,
  extractContentInsights,
  registerDeliverableAnalysisTools
};
