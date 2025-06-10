/**
 * MCP Tools for Cross-Phase Relationship Analysis
 * Exposes relationship tracking functionality to AI agents
 */

import { z } from 'zod';
import { RelationshipOrchestrator } from '../../../../src/data-processing/relationship-orchestrator.js';
import { validateDetectionOptions, validateQueryOptions } from '../../../../src/data-processing/schemas/relationship-schemas.js';

// Initialize relationship orchestrator
const relationshipOrchestrator = new RelationshipOrchestrator({
  enableCaching: true,
  cacheTTL: 30 * 60 * 1000, // 30 minutes
  enableParallelDetection: true
});

/**
 * Analyze relationships across all project deliverables
 */
export const analyzeProjectRelationships = {
  name: 'guidant_analyze_project_relationships',
  description: 'Analyze and map relationships between all deliverables in the project',
  inputSchema: z.object({
    projectRoot: z.string().optional().describe('Project root directory (defaults to current)'),
    options: z.object({
      algorithms: z.array(z.string()).optional().describe('Specific detection algorithms to use'),
      minConfidence: z.number().min(0).max(1).default(0.3).describe('Minimum confidence threshold'),
      maxRelationships: z.number().min(1).default(100).describe('Maximum relationships to detect'),
      includeWeakRelationships: z.boolean().default(false).describe('Include weak relationships'),
      semanticAnalysis: z.boolean().default(true).describe('Enable semantic analysis'),
      structuralAnalysis: z.boolean().default(true).describe('Enable structural analysis'),
      contentAnalysis: z.boolean().default(true).describe('Enable content analysis'),
      crossPhaseOnly: z.boolean().default(false).describe('Only detect cross-phase relationships'),
      targetPhases: z.array(z.string()).optional().describe('Specific phases to analyze'),
      excludeTypes: z.array(z.string()).optional().describe('Relationship types to exclude')
    }).optional().describe('Analysis options')
  }),

  async handler({ projectRoot = process.cwd(), options = {} }) {
    try {
      console.log('🔄 Starting comprehensive relationship analysis...');
      
      // Validate options
      const validatedOptions = validateDetectionOptions(options);
      
      // Perform relationship analysis
      const relationshipGraph = await relationshipOrchestrator.analyzeProjectRelationships(
        projectRoot,
        validatedOptions
      );

      // Generate summary
      const summary = {
        totalRelationships: relationshipGraph.relationships.length,
        totalDeliverables: relationshipGraph.deliverables.length,
        relationshipsByType: relationshipGraph.statistics.relationshipsByType,
        relationshipsByPhase: relationshipGraph.statistics.relationshipsByPhase,
        averageStrength: relationshipGraph.statistics.averageStrength,
        averageConfidence: relationshipGraph.statistics.averageConfidence,
        qualityScore: relationshipGraph.metadata.qualityScore,
        detectionAlgorithms: relationshipGraph.metadata.detectionAlgorithms
      };

      return {
        success: true,
        message: `Successfully analyzed ${relationshipGraph.relationships.length} relationships across ${relationshipGraph.deliverables.length} deliverables`,
        data: {
          summary,
          relationshipGraph,
          metrics: relationshipOrchestrator.getMetrics()
        }
      };

    } catch (error) {
      console.error('Error in relationship analysis:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to analyze project relationships'
      };
    }
  }
};

/**
 * Get relationships for a specific deliverable
 */
export const getDeliverableRelationships = {
  name: 'guidant_get_deliverable_relationships',
  description: 'Get all relationships for a specific deliverable',
  inputSchema: z.object({
    deliverableId: z.string().describe('Deliverable identifier (name or phase_name format)'),
    projectRoot: z.string().optional().describe('Project root directory (defaults to current)'),
    options: z.object({
      relationshipTypes: z.array(z.string()).optional().describe('Filter by relationship types'),
      minStrength: z.number().min(0).max(1).optional().describe('Minimum relationship strength'),
      maxDepth: z.number().min(1).max(10).default(3).describe('Maximum traversal depth'),
      includeMetadata: z.boolean().default(true).describe('Include relationship metadata'),
      includeEvidence: z.boolean().default(false).describe('Include detection evidence'),
      sortBy: z.enum(['strength', 'confidence', 'type', 'created']).default('strength').describe('Sort criteria'),
      sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
      limit: z.number().min(1).max(1000).default(50).describe('Maximum results to return')
    }).optional().describe('Query options')
  }),

  async handler({ deliverableId, projectRoot = process.cwd(), options = {} }) {
    try {
      console.log(`🔍 Getting relationships for deliverable: ${deliverableId}`);
      
      // Validate options
      const validatedOptions = validateQueryOptions(options);
      
      // Get relationships
      const relationships = await relationshipOrchestrator.getDeliverableRelationships(
        projectRoot,
        deliverableId,
        validatedOptions
      );

      // Categorize relationships
      const categorized = {
        incoming: relationships.filter(rel => 
          rel.target.name === deliverableId || 
          `${rel.target.phase}_${rel.target.name}` === deliverableId
        ),
        outgoing: relationships.filter(rel => 
          rel.source.name === deliverableId || 
          `${rel.source.phase}_${rel.source.name}` === deliverableId
        )
      };

      // Generate insights
      const insights = {
        totalRelationships: relationships.length,
        incomingCount: categorized.incoming.length,
        outgoingCount: categorized.outgoing.length,
        strongestRelationship: relationships.reduce((strongest, rel) => 
          rel.strength > (strongest?.strength || 0) ? rel : strongest, null
        ),
        relationshipTypes: [...new Set(relationships.map(rel => rel.type))],
        averageStrength: relationships.length > 0 
          ? relationships.reduce((sum, rel) => sum + rel.strength, 0) / relationships.length 
          : 0,
        averageConfidence: relationships.length > 0 
          ? relationships.reduce((sum, rel) => sum + rel.confidence, 0) / relationships.length 
          : 0
      };

      return {
        success: true,
        message: `Found ${relationships.length} relationships for ${deliverableId}`,
        data: {
          deliverableId,
          relationships,
          categorized,
          insights
        }
      };

    } catch (error) {
      console.error('Error getting deliverable relationships:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to get relationships for ${deliverableId}`
      };
    }
  }
};

/**
 * Analyze impact of changes to a deliverable
 */
export const analyzeChangeImpact = {
  name: 'guidant_analyze_change_impact',
  description: 'Analyze the impact of changes to a deliverable on related deliverables',
  inputSchema: z.object({
    deliverableId: z.string().describe('Deliverable that is being changed'),
    changeData: z.object({
      type: z.enum(['creation', 'modification', 'deletion', 'restructure']).default('modification').describe('Type of change'),
      scope: z.enum(['trivial', 'minor', 'moderate', 'major', 'critical']).default('minor').describe('Scope of change'),
      description: z.string().describe('Description of the change'),
      confidence: z.number().min(0).max(1).default(0.8).describe('Confidence in change assessment')
    }).describe('Details about the change'),
    projectRoot: z.string().optional().describe('Project root directory (defaults to current)'),
    options: z.object({
      maxDepth: z.number().min(1).max(10).default(5).describe('Maximum impact propagation depth'),
      minImpactThreshold: z.number().min(0).max(1).default(0.1).describe('Minimum impact threshold'),
      includeRecommendations: z.boolean().default(true).describe('Include recommendations'),
      includeEffortEstimates: z.boolean().default(true).describe('Include effort estimates')
    }).optional().describe('Analysis options')
  }),

  async handler({ deliverableId, changeData, projectRoot = process.cwd(), options = {} }) {
    try {
      console.log(`🔍 Analyzing impact of changes to ${deliverableId}...`);
      
      // Perform impact analysis
      const impactAnalysis = await relationshipOrchestrator.analyzeChangeImpact(
        projectRoot,
        deliverableId,
        changeData,
        options
      );

      // Generate executive summary
      const executiveSummary = {
        sourceDeliverable: impactAnalysis.sourceDeliverable,
        changeDescription: impactAnalysis.changeDescription,
        totalImpacted: impactAnalysis.summary.totalImpacted,
        highestSeverity: impactAnalysis.summary.highestSeverity,
        averageConfidence: impactAnalysis.summary.averageConfidence,
        criticalPath: impactAnalysis.summary.criticalPath,
        estimatedTotalEffort: impactAnalysis.summary.estimatedTotalEffort,
        keyRecommendations: impactAnalysis.impactedDeliverables
          .filter(impact => impact.severity === 'high' || impact.severity === 'critical')
          .flatMap(impact => impact.recommendations || [])
          .slice(0, 5) // Top 5 recommendations
      };

      // Categorize impacts by severity
      const impactsBySeverity = {
        critical: impactAnalysis.impactedDeliverables.filter(i => i.severity === 'critical'),
        high: impactAnalysis.impactedDeliverables.filter(i => i.severity === 'high'),
        medium: impactAnalysis.impactedDeliverables.filter(i => i.severity === 'medium'),
        low: impactAnalysis.impactedDeliverables.filter(i => i.severity === 'low'),
        minimal: impactAnalysis.impactedDeliverables.filter(i => i.severity === 'minimal')
      };

      return {
        success: true,
        message: `Impact analysis complete: ${impactAnalysis.summary.totalImpacted} deliverables affected with ${impactAnalysis.summary.highestSeverity} severity`,
        data: {
          executiveSummary,
          fullAnalysis: impactAnalysis,
          impactsBySeverity,
          analysisMetadata: {
            analyzedAt: impactAnalysis.analyzedAt,
            analyzer: impactAnalysis.metadata.analyzer,
            qualityScore: impactAnalysis.metadata.qualityScore
          }
        }
      };

    } catch (error) {
      console.error('Error in change impact analysis:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to analyze impact for ${deliverableId}`
      };
    }
  }
};

/**
 * Get relationship system health and metrics
 */
export const getRelationshipSystemHealth = {
  name: 'guidant_get_relationship_system_health',
  description: 'Get health status and metrics for the relationship tracking system',
  inputSchema: z.object({
    projectRoot: z.string().optional().describe('Project root directory (defaults to current)')
  }),

  async handler({ projectRoot = process.cwd() }) {
    try {
      console.log('🔍 Checking relationship system health...');
      
      // Get storage health
      const storageHealth = await relationshipOrchestrator.getStorageHealth();
      
      // Get system metrics
      const metrics = relationshipOrchestrator.getMetrics();
      
      // Get detector information
      const detectorInfo = relationshipOrchestrator.getDetectorInfo();
      
      // Get analyzer information
      const analyzerInfo = relationshipOrchestrator.getAnalyzerInfo();

      // Overall system status
      const systemStatus = storageHealth.status === 'healthy' && 
                          detectorInfo.length > 0 ? 'healthy' : 'degraded';

      return {
        success: true,
        message: `Relationship system status: ${systemStatus}`,
        data: {
          systemStatus,
          storageHealth,
          metrics,
          detectorInfo,
          analyzerInfo,
          capabilities: {
            relationshipDetection: detectorInfo.length > 0,
            impactAnalysis: !!analyzerInfo,
            caching: true,
            parallelProcessing: true
          }
        }
      };

    } catch (error) {
      console.error('Error checking relationship system health:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to check relationship system health'
      };
    }
  }
};

/**
 * Register all relationship analysis tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerRelationshipAnalysisTools(server) {
  try {
    // Register relationship analysis tools
    server.addTool(analyzeProjectRelationships);
    server.addTool(getDeliverableRelationships);
    server.addTool(analyzeChangeImpact);
    server.addTool(getRelationshipSystemHealth);

    console.log('✅ Relationship analysis tools registered successfully');
    console.log('   • guidant_analyze_project_relationships');
    console.log('   • guidant_get_deliverable_relationships');
    console.log('   • guidant_analyze_change_impact');
    console.log('   • guidant_get_relationship_system_health');

  } catch (error) {
    console.error('❌ Error registering relationship analysis tools:', error);
    throw error;
  }
}
