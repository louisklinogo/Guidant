/**
 * Zod Validation Schemas for Phase Transition Engine
 * Comprehensive validation for all transformation inputs and outputs
 */

import { z } from 'zod';

// Phase names validation
export const PhaseNameSchema = z.enum([
  'concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment', 'complete'
]);

// Tech stack validation schema
export const TechStackSchema = z.object({
  frontend: z.string().optional(),
  backend: z.string().optional(),
  database: z.string().optional(),
  deployment: z.string().optional(),
  cicd: z.string().optional(),
  containerization: z.string().optional(),
  vector_db: z.string().optional(),
  ai_framework: z.string().optional()
}).strict();

// Deliverable analysis schema
export const DeliverableAnalysisSchema = z.object({
  phase: PhaseNameSchema,
  deliverables: z.record(z.object({
    success: z.boolean(),
    path: z.string(),
    type: z.string(),
    content: z.any(),
    insights: z.record(z.any()),
    metadata: z.record(z.any()),
    relationships: z.record(z.any()),
    analyzedAt: z.string()
  })),
  insights: z.record(z.any()),
  relationships: z.record(z.any()),
  metadata: z.object({
    analyzedAt: z.string(),
    totalDeliverables: z.number(),
    successfulAnalyses: z.number()
  })
});

// Transformation input schema
export const TransformationInputSchema = z.object({
  fromPhase: PhaseNameSchema,
  toPhase: PhaseNameSchema,
  deliverableAnalysis: DeliverableAnalysisSchema,
  projectType: z.string().optional(),
  projectConfig: z.record(z.any()).optional()
});

// Enhanced context schema
export const EnhancedContextSchema = z.object({
  phase: PhaseNameSchema,
  focusAreas: z.array(z.string()),
  keyInsights: z.array(z.string()),
  techStackGuidance: TechStackSchema.optional(),
  prioritizedTasks: z.array(z.object({
    task: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    rationale: z.string(),
    dependencies: z.array(z.string()).optional()
  })),
  riskFactors: z.array(z.object({
    risk: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    mitigation: z.string()
  })),
  qualityGates: z.array(z.string()),
  generatedAt: z.string()
});

// Transformation output schema
export const TransformationOutputSchema = z.object({
  type: z.string(),
  insights: z.record(z.any()),
  techStack: TechStackSchema.optional(),
  decisions: z.array(z.string()),
  recommendations: z.array(z.string()),
  transformedAt: z.string(),
  // Phase-specific outputs
  // Concept to Requirements
  functionalRequirements: z.array(z.any()).optional(),
  userStories: z.array(z.any()).optional(),
  featureSpecifications: z.array(z.any()).optional(),
  // Requirements to Design
  wireframes: z.array(z.any()).optional(),
  userFlows: z.array(z.any()).optional(),
  componentSpecs: z.array(z.any()).optional(),
  designSystem: z.record(z.any()).optional(),
  // Design to Architecture
  systemDesign: z.record(z.any()).optional(),
  databaseSchema: z.record(z.any()).optional(),
  apiSpecs: z.record(z.any()).optional(),
  securityArchitecture: z.record(z.any()).optional(),
  scalabilityPlan: z.record(z.any()).optional(),
  // Architecture to Implementation
  coreFeatures: z.array(z.any()).optional(),
  testingSuite: z.record(z.any()).optional(),
  documentation: z.record(z.any()).optional(),
  developmentPlan: z.record(z.any()).optional(),
  qualityAssurance: z.record(z.any()).optional(),
  // Implementation to Deployment
  deploymentPlan: z.record(z.any()).optional(),
  monitoringSetup: z.record(z.any()).optional(),
  userDocumentation: z.record(z.any()).optional(),
  operationalPlan: z.record(z.any()).optional(),
  maintenancePlan: z.record(z.any()).optional()
});

// Phase transition options schema
export const PhaseTransitionOptionsSchema = z.object({
  enableAITransformation: z.boolean().default(true),
  transformationTimeout: z.number().default(15000),
  maxRetries: z.number().default(2),
  enableCaching: z.boolean().default(true),
  projectType: z.string().optional(),
  customTechStack: TechStackSchema.optional(),
  aiEnhancementEnabled: z.boolean().default(true),
  fallbackToRules: z.boolean().default(true)
});

// Validation result schema
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  error: z.string().optional(),
  warnings: z.array(z.string()).optional()
});

// Transformation result schema
export const TransformationResultSchema = z.object({
  success: z.boolean(),
  fromPhase: PhaseNameSchema,
  toPhase: PhaseNameSchema,
  transformation: TransformationOutputSchema.optional(),
  enhancedContext: EnhancedContextSchema.optional(),
  deliverableAnalysis: DeliverableAnalysisSchema.optional(),
  error: z.string().optional(),
  transformedAt: z.string()
});

// Cache entry schema
export const CacheEntrySchema = z.object({
  key: z.string(),
  result: TransformationResultSchema,
  createdAt: z.string(),
  expiresAt: z.string()
});

/**
 * Validate transformation input
 */
export function validateTransformationInput(input) {
  try {
    return {
      success: true,
      data: TransformationInputSchema.parse(input)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues: error.issues
    };
  }
}

/**
 * Validate transformation output
 */
export function validateTransformationOutput(output) {
  try {
    return {
      success: true,
      data: TransformationOutputSchema.parse(output)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues: error.issues
    };
  }
}

/**
 * Validate tech stack against project type
 */
export function validateTechStackForProject(techStack, projectType) {
  try {
    const validatedTechStack = TechStackSchema.parse(techStack);
    
    // Additional project-specific validation can be added here
    // using the existing validateTechStack from project-types.js
    
    return {
      success: true,
      data: validatedTechStack
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      issues: error.issues
    };
  }
}
