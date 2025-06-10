/**
 * Quality Validation MCP Tools - CONSOLIDATED (MCP-006)
 * MCP server tools for AI agent integration with Guidant's quality system
 * 
 * CONSOLIDATION: 4 tools → 2 tools (50% reduction)
 * - guidant_validate_content (consolidates validation + statistics)
 * - guidant_quality_management (consolidates history + configuration)
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 */

import { z } from 'zod';
import path from 'path';
import { QualityOrchestrator } from '../../../../src/quality/quality-orchestrator.js';
import { validateQualityContext } from '../../../../src/quality/schemas/quality-schemas.js';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';

/**
 * CONSOLIDATED: Content validation (validation + statistics operations)
 */
export const validateContent = {
  name: 'guidant_validate_content',
  description: 'Content validation with operation: validate, statistics, or analyze_all',
  inputSchema: z.object({
    operation: z.enum(['validate', 'statistics', 'analyze_all']).describe('Validation operation to perform'),
    deliverablePath: z.string().optional().describe('Path to the deliverable file to validate (required for validate operation)'),
    projectType: z.string().default('standard').describe('Project type (simple, standard, enterprise)'),
    phase: z.string().optional().describe('Current project phase (concept, requirements, design, architecture, implementation, deployment)'),
    deliverableType: z.string().optional().describe('Type of deliverable (market_analysis, user_personas, prd_complete, etc.)'),
    projectRoot: z.string().optional().describe('Project root directory (defaults to current)'),
    dateFrom: z.string().optional().describe('Start date for statistics (ISO string)'),
    dateTo: z.string().optional().describe('End date for statistics (ISO string)'),
    options: z.object({
      enabledRules: z.array(z.string()).optional().describe('Specific rules to enable'),
      disabledRules: z.array(z.string()).optional().describe('Specific rules to disable'),
      scoringAlgorithm: z.enum(['weighted_average', 'simple_average', 'minimum_score', 'confidence_weighted']).optional(),
      feedbackLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional(),
      cacheResults: z.boolean().default(true).describe('Whether to cache validation results'),
      timeout: z.number().min(5000).max(60000).optional().describe('Validation timeout in milliseconds')
    }).optional().describe('Validation options')
  }),

  async handler({ operation, deliverablePath, projectType, phase, deliverableType, projectRoot, dateFrom, dateTo, options = {} }) {
    try {
      const workingDir = projectRoot || process.cwd();

      if (operation === 'validate') {
        if (!deliverablePath) {
          return formatErrorResponse('deliverablePath is required for validate operation');
        }

        // Build validation context
        const context = {
          projectType,
          phase,
          deliverableType,
          deliverablePath,
          projectRoot: workingDir,
          configuration: { projectType },
          metadata: {
            requestedAt: new Date().toISOString(),
            source: 'mcp-tool'
          }
        };

        // Validate context
        const contextValidation = validateQualityContext(context);
        if (!contextValidation.success) {
          return formatErrorResponse(`Invalid validation context: ${contextValidation.error.message}`, {
            details: contextValidation.error.issues
          });
        }

        // Create quality orchestrator
        const orchestrator = new QualityOrchestrator(workingDir, {
          enabledRules: options.enabledRules || ['content-length', 'structure-completeness'],
          scoringAlgorithm: options.scoringAlgorithm || 'weighted_average',
          feedbackLevel: options.feedbackLevel || 'detailed',
          timeout: options.timeout || 30000
        });

        // Validate deliverable quality
        const result = await orchestrator.validateQuality(deliverablePath, context, options);

        if (!result.success) {
          return formatErrorResponse(result.error, {
            deliverablePath,
            executionTime: result.executionTime
          });
        }

        // Return comprehensive quality validation result
        return formatMCPResponse({
          success: true,
          deliverableId: result.deliverableId,
          deliverablePath: result.deliverablePath,
          qualityAssessment: {
            overallScore: result.qualityScore.overallScore,
            weightedScore: result.qualityScore.weightedScore,
            passThreshold: result.qualityScore.passThreshold,
            passed: result.qualityScore.passed,
            readyForTransition: result.readyForTransition
          },
          ruleResults: result.qualityScore.ruleResults.map(rule => ({
            ruleId: rule.ruleId,
            ruleName: rule.ruleName,
            passed: rule.passed,
            score: rule.score,
            message: rule.message,
            suggestions: rule.suggestions
          })),
          feedback: {
            summary: result.feedback.summary,
            priority: result.feedback.priority,
            estimatedEffort: result.feedback.estimatedEffort,
            strengths: result.feedback.strengths,
            improvements: result.feedback.improvements.map(imp => ({
              issue: imp.issue,
              suggestion: imp.suggestion,
              priority: imp.priority,
              effort: imp.estimatedEffort
            })),
            criticalIssues: result.feedback.criticalIssues,
            nextSteps: result.feedback.nextSteps
          },
          recommendations: result.recommendations,
          blockers: result.blockers,
          metadata: {
            validatedAt: result.validatedAt,
            executionTime: result.executionTime,
            cacheHit: result.cacheHit,
            projectType,
            phase,
            deliverableType
          }
        });
      }

      if (operation === 'statistics') {
        // Create orchestrator with storage
        const orchestrator = new QualityOrchestrator(workingDir);
        
        if (!orchestrator.qualityStorage) {
          return formatErrorResponse('Quality statistics storage not configured', {
            message: 'Enable quality storage to track validation statistics'
          });
        }

        // Build filter criteria
        const filter = {
          projectType,
          phase,
          deliverableType,
          dateFrom,
          dateTo
        };

        // Get statistics from storage
        const statistics = await orchestrator.qualityStorage.getStatistics(filter);

        return formatMCPResponse({
          success: true,
          statistics: {
            overview: {
              totalValidations: statistics.totalValidations,
              passedValidations: statistics.passedValidations,
              failedValidations: statistics.failedValidations,
              averageScore: Math.round(statistics.averageScore * 100) / 100,
              passRate: Math.round((statistics.passedValidations / statistics.totalValidations) * 100) / 100
            },
            scoreDistribution: statistics.scoreDistribution,
            rulePerformance: statistics.ruleStatistics?.map(rule => ({
              ruleId: rule.ruleId,
              ruleName: rule.ruleName,
              totalEvaluations: rule.totalEvaluations,
              passRate: Math.round(rule.passRate * 100) / 100,
              averageScore: Math.round(rule.averageScore * 100) / 100
            })) || [],
            phaseBreakdown: statistics.phaseStatistics || {},
            timeRange: statistics.timeRange
          },
          filter,
          generatedAt: statistics.generatedAt
        });
      }

      if (operation === 'analyze_all') {
        // Comprehensive content analysis
        const orchestrator = new QualityOrchestrator(workingDir);
        let validationResult = null;
        let statisticsResult = null;

        // If deliverable path provided, validate it
        if (deliverablePath) {
          const context = {
            projectType,
            phase,
            deliverableType,
            deliverablePath,
            projectRoot: workingDir,
            configuration: { projectType },
            metadata: {
              requestedAt: new Date().toISOString(),
              source: 'mcp-tool'
            }
          };

          const result = await orchestrator.validateQuality(deliverablePath, context, options);
          if (result.success) {
            validationResult = {
              overallScore: result.qualityScore.overallScore,
              passed: result.qualityScore.passed,
              readyForTransition: result.readyForTransition,
              feedback: result.feedback.summary
            };
          }
        }

        // Get statistics if storage available
        if (orchestrator.qualityStorage) {
          const filter = { projectType, phase, deliverableType };
          const statistics = await orchestrator.qualityStorage.getStatistics(filter);
          statisticsResult = {
            totalValidations: statistics.totalValidations,
            averageScore: Math.round(statistics.averageScore * 100) / 100,
            passRate: Math.round((statistics.passedValidations / statistics.totalValidations) * 100) / 100
          };
        }

        return formatMCPResponse({
          success: true,
          analysis: {
            validation: validationResult,
            statistics: statisticsResult,
            projectType,
            phase,
            deliverableType
          },
          recommendations: validationResult ? 
            (validationResult.passed ? 'Content meets quality standards' : 'Content needs improvement') :
            'Provide deliverable path for validation analysis',
          nextAction: validationResult ? 
            'Use specific operations for detailed analysis' : 
            'Use operation: validate with deliverable path'
        });
      }

      return formatErrorResponse(`Unknown operation: ${operation}`);

    } catch (error) {
      return formatErrorResponse(`Content validation failed: ${error.message}`, {
        deliverablePath,
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * CONSOLIDATED: Quality management (history + configuration operations)
 */
export const qualityManagement = {
  name: 'guidant_quality_management',
  description: 'Quality management with operation: get_history, configure, or manage_all',
  inputSchema: z.object({
    operation: z.enum(['get_history', 'configure', 'manage_all']).describe('Management operation to perform'),
    deliverablePath: z.string().optional().describe('Path to specific deliverable (optional)'),
    projectType: z.string().optional().describe('Filter by project type'),
    phase: z.string().optional().describe('Filter by project phase'),
    deliverableType: z.string().optional().describe('Filter by deliverable type'),
    limit: z.number().min(1).max(100).default(10).describe('Maximum number of results'),
    projectRoot: z.string().optional().describe('Project root directory'),
    enabledRules: z.array(z.string()).optional().describe('Rules to enable'),
    disabledRules: z.array(z.string()).optional().describe('Rules to disable'),
    scoringAlgorithm: z.enum(['weighted_average', 'simple_average', 'minimum_score', 'confidence_weighted']).optional(),
    feedbackLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional(),
    passThresholds: z.record(z.number().min(0).max(100)).optional().describe('Pass thresholds by project type'),
    cacheEnabled: z.boolean().optional().describe('Enable result caching'),
    cacheTTL: z.number().min(60000).max(3600000).optional().describe('Cache TTL in milliseconds'),
    timeout: z.number().min(5000).max(300000).optional().describe('Validation timeout')
  }),

  async handler({ operation, deliverablePath, projectType, phase, deliverableType, limit, projectRoot, enabledRules, disabledRules, scoringAlgorithm, feedbackLevel, passThresholds, cacheEnabled, cacheTTL, timeout }) {
    try {
      const workingDir = projectRoot || process.cwd();

      if (operation === 'get_history') {
        // Create orchestrator with storage (if available)
        const orchestrator = new QualityOrchestrator(workingDir);

        if (!orchestrator.qualityStorage) {
          return formatErrorResponse('Quality history storage not configured', {
            message: 'Enable quality storage to track validation history'
          });
        }

        // Build filter criteria
        const filter = {
          projectType,
          phase,
          deliverableType,
          limit
        };

        // Get history from storage
        let history = [];
        if (deliverablePath) {
          const deliverableId = orchestrator.generateDeliverableId(deliverablePath);
          history = await orchestrator.qualityStorage.getHistory(deliverableId, limit);
        } else {
          const stats = await orchestrator.qualityStorage.getStatistics(filter);
          history = stats.recentValidations || [];
        }

        return formatMCPResponse({
          success: true,
          history: history.map(record => ({
            deliverableId: record.deliverableId,
            deliverablePath: record.deliverablePath,
            overallScore: record.qualityScore?.overallScore,
            passed: record.qualityScore?.passed,
            readyForTransition: record.readyForTransition,
            validatedAt: record.validatedAt,
            executionTime: record.executionTime,
            feedback: {
              summary: record.feedback?.summary,
              priority: record.feedback?.priority
            }
          })),
          filter,
          totalResults: history.length,
          retrievedAt: new Date().toISOString()
        });
      }

      if (operation === 'configure') {
        // Create orchestrator
        const orchestrator = new QualityOrchestrator(workingDir);

        // Build configuration
        const config = {
          enabledRules,
          disabledRules,
          scoringAlgorithm,
          feedbackLevel,
          passThresholds,
          cacheEnabled,
          cacheTTL,
          timeout
        };

        // Apply configuration
        const success = orchestrator.configure(config);

        if (!success) {
          return formatErrorResponse('Failed to apply quality system configuration', {
            message: 'Check configuration values and try again'
          });
        }

        // Get updated metadata
        const metadata = orchestrator.getMetadata();

        return formatMCPResponse({
          success: true,
          message: 'Quality system configuration updated successfully',
          configuration: metadata.configuration,
          availableRules: metadata.availableRules,
          performance: metadata.performance,
          appliedAt: new Date().toISOString()
        });
      }

      if (operation === 'manage_all') {
        // Comprehensive quality management
        const orchestrator = new QualityOrchestrator(workingDir);
        let historyResult = null;
        let configResult = null;

        // Get history if storage available
        if (orchestrator.qualityStorage) {
          const filter = { projectType, phase, deliverableType, limit: limit || 5 };
          let history = [];

          if (deliverablePath) {
            const deliverableId = orchestrator.generateDeliverableId(deliverablePath);
            history = await orchestrator.qualityStorage.getHistory(deliverableId, limit || 5);
          } else {
            const stats = await orchestrator.qualityStorage.getStatistics(filter);
            history = stats.recentValidations || [];
          }

          historyResult = {
            totalRecords: history.length,
            recentValidations: history.slice(0, 3).map(record => ({
              deliverablePath: record.deliverablePath,
              overallScore: record.qualityScore?.overallScore,
              passed: record.qualityScore?.passed,
              validatedAt: record.validatedAt
            }))
          };
        }

        // Get current configuration
        const metadata = orchestrator.getMetadata();
        configResult = {
          configuration: metadata.configuration,
          availableRules: metadata.availableRules?.length || 0,
          performance: metadata.performance
        };

        return formatMCPResponse({
          success: true,
          management: {
            history: historyResult,
            configuration: configResult,
            projectType,
            phase,
            deliverableType
          },
          recommendations: historyResult ?
            (historyResult.totalRecords > 0 ? 'Quality tracking active' : 'No validation history found') :
            'Enable quality storage for history tracking',
          nextAction: 'Use specific operations for detailed management'
        });
      }

      return formatErrorResponse(`Unknown operation: ${operation}`);

    } catch (error) {
      return formatErrorResponse(`Quality management failed: ${error.message}`, {
        timestamp: new Date().toISOString()
      });
    }
  }
};

// ========================================
// DEPRECATED TOOLS (Backward Compatibility)
// ========================================

// DEPRECATED: Use guidant_validate_content with operation: 'validate'
export const validateDeliverableQuality = {
  name: 'guidant_validate_deliverable_quality',
  description: '[DEPRECATED] Use guidant_validate_content with operation: validate instead',
  inputSchema: z.object({
    deliverablePath: z.string().describe('Path to deliverable'),
    projectType: z.string().optional().describe('Project type'),
    phase: z.string().optional().describe('Project phase'),
    deliverableType: z.string().optional().describe('Deliverable type'),
    projectRoot: z.string().optional().describe('Project root'),
    options: z.object({}).optional().describe('Validation options')
  }),
  async handler({ deliverablePath, projectType, phase, deliverableType, projectRoot, options }) {
    return formatMCPResponse({
      success: false,
      deprecated: true,
      message: 'This tool has been deprecated. Use guidant_validate_content instead.',
      migration: {
        newTool: 'guidant_validate_content',
        newParameters: {
          operation: 'validate',
          deliverablePath,
          projectType,
          phase,
          deliverableType,
          projectRoot,
          options
        }
      }
    });
  }
};

// DEPRECATED: Use guidant_quality_management with operation: 'get_history'
export const getQualityHistory = {
  name: 'guidant_get_quality_history',
  description: '[DEPRECATED] Use guidant_quality_management with operation: get_history instead',
  inputSchema: z.object({
    deliverablePath: z.string().optional().describe('Path to deliverable'),
    projectType: z.string().optional().describe('Project type'),
    phase: z.string().optional().describe('Project phase'),
    deliverableType: z.string().optional().describe('Deliverable type'),
    limit: z.number().optional().describe('Result limit'),
    projectRoot: z.string().optional().describe('Project root')
  }),
  async handler({ deliverablePath, projectType, phase, deliverableType, limit, projectRoot }) {
    return formatMCPResponse({
      success: false,
      deprecated: true,
      message: 'This tool has been deprecated. Use guidant_quality_management instead.',
      migration: {
        newTool: 'guidant_quality_management',
        newParameters: {
          operation: 'get_history',
          deliverablePath,
          projectType,
          phase,
          deliverableType,
          limit,
          projectRoot
        }
      }
    });
  }
};

// DEPRECATED: Use guidant_validate_content with operation: 'statistics'
export const getQualityStatistics = {
  name: 'guidant_get_quality_statistics',
  description: '[DEPRECATED] Use guidant_validate_content with operation: statistics instead',
  inputSchema: z.object({
    projectType: z.string().optional().describe('Project type'),
    phase: z.string().optional().describe('Project phase'),
    deliverableType: z.string().optional().describe('Deliverable type'),
    dateFrom: z.string().optional().describe('Start date'),
    dateTo: z.string().optional().describe('End date'),
    projectRoot: z.string().optional().describe('Project root')
  }),
  async handler({ projectType, phase, deliverableType, dateFrom, dateTo, projectRoot }) {
    return formatMCPResponse({
      success: false,
      deprecated: true,
      message: 'This tool has been deprecated. Use guidant_validate_content instead.',
      migration: {
        newTool: 'guidant_validate_content',
        newParameters: {
          operation: 'statistics',
          projectType,
          phase,
          deliverableType,
          dateFrom,
          dateTo,
          projectRoot
        }
      }
    });
  }
};

// DEPRECATED: Use guidant_quality_management with operation: 'configure'
export const configureQualitySystem = {
  name: 'guidant_configure_quality_system',
  description: '[DEPRECATED] Use guidant_quality_management with operation: configure instead',
  inputSchema: z.object({
    enabledRules: z.array(z.string()).optional().describe('Rules to enable'),
    disabledRules: z.array(z.string()).optional().describe('Rules to disable'),
    scoringAlgorithm: z.string().optional().describe('Scoring algorithm'),
    feedbackLevel: z.string().optional().describe('Feedback level'),
    passThresholds: z.record(z.number()).optional().describe('Pass thresholds'),
    cacheEnabled: z.boolean().optional().describe('Cache enabled'),
    cacheTTL: z.number().optional().describe('Cache TTL'),
    timeout: z.number().optional().describe('Timeout'),
    projectRoot: z.string().optional().describe('Project root')
  }),
  async handler({ enabledRules, disabledRules, scoringAlgorithm, feedbackLevel, passThresholds, cacheEnabled, cacheTTL, timeout, projectRoot }) {
    return formatMCPResponse({
      success: false,
      deprecated: true,
      message: 'This tool has been deprecated. Use guidant_quality_management instead.',
      migration: {
        newTool: 'guidant_quality_management',
        newParameters: {
          operation: 'configure',
          enabledRules,
          disabledRules,
          scoringAlgorithm,
          feedbackLevel,
          passThresholds,
          cacheEnabled,
          cacheTTL,
          timeout,
          projectRoot
        }
      }
    });
  }
};

// Export all quality validation tools (consolidated + deprecated)
export const qualityValidationTools = [
  // New consolidated tools
  validateContent,
  qualityManagement,
  // Deprecated tools for backward compatibility
  validateDeliverableQuality,
  getQualityHistory,
  getQualityStatistics,
  configureQualitySystem
];
