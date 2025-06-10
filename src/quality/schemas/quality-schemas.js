/**
 * Quality System Validation Schemas
 * Zod schemas for quality validation data structures
 * 
 * BACKEND-005: Content-Based Quality Gates Implementation
 */

import { z } from 'zod';

// Quality rule evaluation result schema
export const QualityRuleResultSchema = z.object({
  ruleId: z.string().min(1),
  ruleName: z.string().min(1),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1).default(1.0),
  message: z.string(),
  details: z.record(z.any()).optional(),
  suggestions: z.array(z.string()).default([]),
  evaluatedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
  metadata: z.record(z.any()).optional()
});

// Quality score result schema
export const QualityScoreResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  weightedScore: z.number().min(0).max(100),
  passThreshold: z.number().min(0).max(100).default(75),
  passed: z.boolean(),
  ruleResults: z.array(QualityRuleResultSchema),
  metadata: z.object({
    totalRules: z.number().min(0),
    passedRules: z.number().min(0),
    failedRules: z.number().min(0),
    averageConfidence: z.number().min(0).max(1).optional(),
    scoringAlgorithm: z.string(),
    projectType: z.string(),
    phase: z.string()
  }),
  calculatedAt: z.string().datetime()
});

// Quality feedback schema
export const QualityFeedbackSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.object({
    issue: z.string(),
    suggestion: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedEffort: z.string().optional(),
    category: z.string().optional()
  })).default([]),
  criticalIssues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  nextSteps: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  estimatedEffort: z.string().optional(),
  generatedAt: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional()
});

// Quality validation context schema
export const QualityContextSchema = z.object({
  projectType: z.string().min(1),
  phase: z.string().min(1),
  deliverableType: z.string().min(1),
  deliverablePath: z.string().min(1),
  projectRoot: z.string().min(1),
  configuration: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({})
});

// Quality rule configuration schema
export const QualityRuleConfigSchema = z.object({
  ruleId: z.string().min(1),
  enabled: z.boolean().default(true),
  weight: z.number().min(0).max(1).default(1.0),
  threshold: z.number().min(0).max(100).optional(),
  parameters: z.record(z.any()).default({}),
  applicablePhases: z.array(z.string()).default([]),
  applicableTypes: z.array(z.string()).default([]),
  description: z.string().optional(),
  category: z.string().optional()
});

// Quality configuration schema
export const QualityConfigSchema = z.object({
  projectType: z.string().min(1),
  phase: z.string().min(1),
  passThreshold: z.number().min(0).max(100).default(75),
  rules: z.array(QualityRuleConfigSchema),
  scoringAlgorithm: z.enum(['weighted', 'average', 'minimum', 'custom']).default('weighted'),
  scoringWeights: z.record(z.number()).optional(),
  feedbackLevel: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
  metadata: z.record(z.any()).default({})
});

// Quality storage filter schema
export const QualityStorageFilterSchema = z.object({
  projectType: z.string().optional(),
  phase: z.string().optional(),
  deliverableType: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  passed: z.boolean().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

// Quality statistics schema
export const QualityStatisticsSchema = z.object({
  totalValidations: z.number().min(0),
  passedValidations: z.number().min(0),
  failedValidations: z.number().min(0),
  averageScore: z.number().min(0).max(100),
  scoreDistribution: z.object({
    excellent: z.number().min(0), // 90-100
    good: z.number().min(0),      // 75-89
    fair: z.number().min(0),      // 60-74
    poor: z.number().min(0)       // 0-59
  }),
  ruleStatistics: z.array(z.object({
    ruleId: z.string(),
    ruleName: z.string(),
    totalEvaluations: z.number().min(0),
    passedEvaluations: z.number().min(0),
    averageScore: z.number().min(0).max(100),
    passRate: z.number().min(0).max(1)
  })),
  phaseStatistics: z.record(z.object({
    totalValidations: z.number().min(0),
    averageScore: z.number().min(0).max(100),
    passRate: z.number().min(0).max(1)
  })),
  timeRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  generatedAt: z.string().datetime()
});

// Quality validation options schema
export const QualityValidationOptionsSchema = z.object({
  enabledRules: z.array(z.string()).optional(),
  disabledRules: z.array(z.string()).optional(),
  customThresholds: z.record(z.number()).optional(),
  scoringAlgorithm: z.enum(['weighted', 'average', 'minimum', 'custom']).optional(),
  feedbackLevel: z.enum(['basic', 'detailed', 'comprehensive']).optional(),
  includeHistory: z.boolean().default(false),
  cacheResults: z.boolean().default(true),
  timeout: z.number().min(1000).max(60000).default(30000), // 30 seconds
  retryAttempts: z.number().min(0).max(5).default(2),
  metadata: z.record(z.any()).default({})
});

// Quality orchestrator result schema
export const QualityOrchestratorResultSchema = z.object({
  success: z.boolean(),
  deliverableId: z.string(),
  deliverablePath: z.string(),
  qualityScore: QualityScoreResultSchema.optional(),
  feedback: QualityFeedbackSchema.optional(),
  recommendations: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  readyForTransition: z.boolean(),
  error: z.string().optional(),
  warnings: z.array(z.string()).default([]),
  executionTime: z.number().min(0),
  cacheHit: z.boolean().default(false),
  validatedAt: z.string().datetime()
});

// Quality rule metadata schema
export const QualityRuleMetadataSchema = z.object({
  ruleId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  version: z.string().default('1.0.0'),
  author: z.string().optional(),
  applicablePhases: z.array(z.string()),
  applicableTypes: z.array(z.string()),
  defaultWeight: z.number().min(0).max(1).default(1.0),
  defaultThreshold: z.number().min(0).max(100).optional(),
  configurable: z.boolean().default(true),
  dependencies: z.array(z.string()).default([]),
  performance: z.object({
    averageExecutionTime: z.number().min(0),
    complexity: z.enum(['low', 'medium', 'high'])
  }).optional(),
  examples: z.array(z.object({
    input: z.string(),
    expectedOutput: z.any(),
    description: z.string()
  })).default([])
});

// Export all schemas for validation
export const QualitySchemas = {
  QualityRuleResult: QualityRuleResultSchema,
  QualityScoreResult: QualityScoreResultSchema,
  QualityFeedback: QualityFeedbackSchema,
  QualityContext: QualityContextSchema,
  QualityRuleConfig: QualityRuleConfigSchema,
  QualityConfig: QualityConfigSchema,
  QualityStorageFilter: QualityStorageFilterSchema,
  QualityStatistics: QualityStatisticsSchema,
  QualityValidationOptions: QualityValidationOptionsSchema,
  QualityOrchestratorResult: QualityOrchestratorResultSchema,
  QualityRuleMetadata: QualityRuleMetadataSchema
};

// Validation helper functions
export function validateQualityRuleResult(data) {
  return QualityRuleResultSchema.safeParse(data);
}

export function validateQualityScoreResult(data) {
  return QualityScoreResultSchema.safeParse(data);
}

export function validateQualityFeedback(data) {
  return QualityFeedbackSchema.safeParse(data);
}

export function validateQualityContext(data) {
  return QualityContextSchema.safeParse(data);
}

export function validateQualityConfig(data) {
  return QualityConfigSchema.safeParse(data);
}

export function validateQualityValidationOptions(data) {
  return QualityValidationOptionsSchema.safeParse(data);
}
