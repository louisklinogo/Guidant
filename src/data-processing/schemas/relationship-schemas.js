/**
 * Zod Validation Schemas for Cross-Phase Relationship Tracking System
 * Comprehensive validation for all relationship data structures
 */

import { z } from 'zod';
import { RELATIONSHIP_TYPES, RELATIONSHIP_STRENGTH, IMPACT_SEVERITY } from '../interfaces/relationship-interfaces.js';

// Basic deliverable identifier schema
export const DeliverableIdSchema = z.object({
  phase: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  path: z.string().optional()
});

// Relationship type validation
export const RelationshipTypeSchema = z.enum([
  RELATIONSHIP_TYPES.REFERENCES,
  RELATIONSHIP_TYPES.MENTIONS,
  RELATIONSHIP_TYPES.QUOTES,
  RELATIONSHIP_TYPES.DEPENDS_ON,
  RELATIONSHIP_TYPES.INFLUENCES,
  RELATIONSHIP_TYPES.DERIVES_FROM,
  RELATIONSHIP_TYPES.PART_OF,
  RELATIONSHIP_TYPES.CONTAINS,
  RELATIONSHIP_TYPES.EXTENDS,
  RELATIONSHIP_TYPES.PRECEDES,
  RELATIONSHIP_TYPES.FOLLOWS,
  RELATIONSHIP_TYPES.CONCURRENT,
  RELATIONSHIP_TYPES.VALIDATES,
  RELATIONSHIP_TYPES.CONFLICTS_WITH,
  RELATIONSHIP_TYPES.SUPPORTS
]);

// Relationship strength validation
export const RelationshipStrengthSchema = z.number()
  .min(0)
  .max(1)
  .refine(val => 
    val === RELATIONSHIP_STRENGTH.WEAK ||
    val === RELATIONSHIP_STRENGTH.LOW ||
    val === RELATIONSHIP_STRENGTH.MEDIUM ||
    val === RELATIONSHIP_STRENGTH.HIGH ||
    val === RELATIONSHIP_STRENGTH.STRONG ||
    (val >= 0 && val <= 1), 
    { message: "Strength must be between 0 and 1 or use predefined constants" }
  );

// Individual relationship schema
export const RelationshipSchema = z.object({
  id: z.string().min(1),
  source: DeliverableIdSchema,
  target: DeliverableIdSchema,
  type: RelationshipTypeSchema,
  strength: RelationshipStrengthSchema,
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.object({
    type: z.enum(['content_match', 'structural_reference', 'semantic_similarity', 'explicit_mention']),
    description: z.string(),
    location: z.string().optional(),
    score: z.number().min(0).max(1).optional()
  })),
  metadata: z.object({
    detectedBy: z.string(),
    detectedAt: z.string(),
    lastValidated: z.string().optional(),
    validationStatus: z.enum(['pending', 'confirmed', 'rejected', 'needs_review']).optional()
  }),
  context: z.object({
    sourceContent: z.string().optional(),
    targetContent: z.string().optional(),
    matchingTerms: z.array(z.string()).optional(),
    semanticSimilarity: z.number().min(0).max(1).optional()
  }).optional()
});

// Relationship graph schema
export const RelationshipGraphSchema = z.object({
  projectId: z.string().min(1),
  version: z.string().default('1.0'),
  generatedAt: z.string(),
  lastUpdated: z.string(),
  relationships: z.array(RelationshipSchema),
  deliverables: z.array(DeliverableIdSchema),
  statistics: z.object({
    totalRelationships: z.number().min(0),
    relationshipsByType: z.record(z.string(), z.number()),
    relationshipsByPhase: z.record(z.string(), z.number()),
    averageStrength: z.number().min(0).max(1),
    averageConfidence: z.number().min(0).max(1)
  }),
  metadata: z.object({
    generatedBy: z.string(),
    detectionAlgorithms: z.array(z.string()),
    validationRules: z.array(z.string()).optional(),
    qualityScore: z.number().min(0).max(1).optional()
  })
});

// Impact severity validation
export const ImpactSeveritySchema = z.enum([
  IMPACT_SEVERITY.MINIMAL,
  IMPACT_SEVERITY.LOW,
  IMPACT_SEVERITY.MEDIUM,
  IMPACT_SEVERITY.HIGH,
  IMPACT_SEVERITY.CRITICAL
]);

// Impact analysis result schema
export const ImpactAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  sourceDeliverable: DeliverableIdSchema,
  changeDescription: z.string(),
  analyzedAt: z.string(),
  impactedDeliverables: z.array(z.object({
    deliverable: DeliverableIdSchema,
    impactType: z.enum(['direct', 'indirect', 'cascading']),
    severity: ImpactSeveritySchema,
    confidence: z.number().min(0).max(1),
    propagationPath: z.array(DeliverableIdSchema),
    estimatedEffort: z.object({
      hours: z.number().min(0).optional(),
      complexity: z.enum(['trivial', 'simple', 'moderate', 'complex', 'major']).optional()
    }).optional(),
    recommendations: z.array(z.string()).optional()
  })),
  summary: z.object({
    totalImpacted: z.number().min(0),
    highestSeverity: ImpactSeveritySchema,
    averageConfidence: z.number().min(0).max(1),
    criticalPath: z.array(DeliverableIdSchema).optional(),
    estimatedTotalEffort: z.object({
      hours: z.number().min(0).optional(),
      complexity: z.enum(['trivial', 'simple', 'moderate', 'complex', 'major']).optional()
    }).optional()
  }),
  metadata: z.object({
    analyzer: z.string(),
    analysisVersion: z.string(),
    qualityScore: z.number().min(0).max(1).optional()
  })
});

// Relationship detection options schema
export const DetectionOptionsSchema = z.object({
  algorithms: z.array(z.string()).optional(),
  minConfidence: z.number().min(0).max(1).default(0.3),
  maxRelationships: z.number().min(1).default(100),
  includeWeakRelationships: z.boolean().default(false),
  semanticAnalysis: z.boolean().default(true),
  structuralAnalysis: z.boolean().default(true),
  contentAnalysis: z.boolean().default(true),
  crossPhaseOnly: z.boolean().default(false),
  targetPhases: z.array(z.string()).optional(),
  excludeTypes: z.array(RelationshipTypeSchema).optional()
});

// Relationship query options schema
export const QueryOptionsSchema = z.object({
  relationshipTypes: z.array(RelationshipTypeSchema).optional(),
  minStrength: z.number().min(0).max(1).optional(),
  maxDepth: z.number().min(1).max(10).default(3),
  includeMetadata: z.boolean().default(true),
  includeEvidence: z.boolean().default(false),
  sortBy: z.enum(['strength', 'confidence', 'type', 'created']).default('strength'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(1000).default(50)
});

// Storage health schema
export const StorageHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  lastCheck: z.string(),
  metrics: z.object({
    totalRelationships: z.number().min(0),
    storageSize: z.number().min(0),
    lastBackup: z.string().optional(),
    corruptedRecords: z.number().min(0).default(0)
  }),
  issues: z.array(z.object({
    type: z.enum(['corruption', 'performance', 'capacity', 'access']),
    severity: ImpactSeveritySchema,
    description: z.string(),
    recommendation: z.string().optional()
  })).default([])
});

// Detector info schema
export const DetectorInfoSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  type: z.enum(['semantic', 'structural', 'content', 'hybrid']),
  capabilities: z.array(z.string()),
  supportedTypes: z.array(RelationshipTypeSchema),
  priority: z.number().min(0).max(100),
  performance: z.object({
    averageTime: z.number().min(0),
    accuracy: z.number().min(0).max(1).optional(),
    throughput: z.number().min(0).optional()
  }).optional(),
  configuration: z.record(z.string(), z.any()).optional()
});

// Validation helper functions
export const validateRelationship = (data) => {
  return RelationshipSchema.parse(data);
};

export const validateRelationshipGraph = (data) => {
  return RelationshipGraphSchema.parse(data);
};

export const validateImpactAnalysis = (data) => {
  return ImpactAnalysisSchema.parse(data);
};

export const validateDetectionOptions = (data) => {
  return DetectionOptionsSchema.parse(data);
};

export const validateQueryOptions = (data) => {
  return QueryOptionsSchema.parse(data);
};

export const validateStorageHealth = (data) => {
  return StorageHealthSchema.parse(data);
};

export const validateDetectorInfo = (data) => {
  return DetectorInfoSchema.parse(data);
};
