/**
 * Workflow DSL (Domain Specific Language) for Tool Orchestration
 * Provides a declarative way to define multi-tool workflows
 * 
 * MCP-009: Tool Orchestration Engine Implementation
 */

import { z } from 'zod';

/**
 * Workflow Step Schema
 * Defines a single step in a workflow
 */
export const workflowStepSchema = z.object({
  id: z.string().describe('Unique identifier for this step'),
  name: z.string().describe('Human-readable name for this step'),
  tool: z.string().describe('MCP tool name to execute'),
  parameters: z.record(z.any()).optional().describe('Parameters to pass to the tool'),
  condition: z.string().optional().describe('JavaScript expression to evaluate before execution'),
  retryPolicy: z.object({
    maxAttempts: z.number().default(3),
    backoffMs: z.number().default(1000),
    exponentialBackoff: z.boolean().default(true)
  }).optional(),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  onSuccess: z.string().optional().describe('Next step ID on success'),
  onFailure: z.string().optional().describe('Next step ID on failure'),
  rollbackSteps: z.array(z.string()).optional().describe('Steps to execute if rollback is needed')
});

/**
 * Workflow Definition Schema
 * Defines a complete workflow with multiple steps
 */
export const workflowDefinitionSchema = z.object({
  id: z.string().describe('Unique workflow identifier'),
  name: z.string().describe('Human-readable workflow name'),
  description: z.string().describe('Workflow description'),
  version: z.string().default('1.0.0'),
  metadata: z.record(z.any()).optional().describe('Additional workflow metadata'),
  variables: z.record(z.any()).optional().describe('Workflow-level variables'),
  steps: z.array(workflowStepSchema).describe('Workflow steps'),
  startStep: z.string().describe('ID of the first step to execute'),
  errorHandling: z.object({
    strategy: z.enum(['fail-fast', 'continue', 'rollback']).default('fail-fast'),
    maxErrors: z.number().default(5),
    rollbackOnFailure: z.boolean().default(false)
  }).optional(),
  timeout: z.number().optional().describe('Overall workflow timeout in milliseconds')
});

/**
 * Workflow Execution Context Schema
 * Runtime context for workflow execution
 */
export const workflowContextSchema = z.object({
  workflowId: z.string(),
  executionId: z.string(),
  startTime: z.string(),
  currentStep: z.string().optional(),
  variables: z.record(z.any()).default({}),
  stepResults: z.record(z.any()).default({}),
  errors: z.array(z.object({
    stepId: z.string(),
    error: z.string(),
    timestamp: z.string()
  })).default([]),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).default('pending')
});

/**
 * Workflow DSL Builder
 * Fluent API for building workflows programmatically
 */
export class WorkflowBuilder {
  constructor() {
    this.workflow = {
      steps: [],
      variables: {},
      metadata: {}
    };
  }

  /**
   * Set workflow basic information
   */
  setInfo(id, name, description) {
    this.workflow.id = id;
    this.workflow.name = name;
    this.workflow.description = description;
    return this;
  }

  /**
   * Set workflow version
   */
  setVersion(version) {
    this.workflow.version = version;
    return this;
  }

  /**
   * Add workflow variable
   */
  addVariable(name, value) {
    this.workflow.variables[name] = value;
    return this;
  }

  /**
   * Add workflow metadata
   */
  addMetadata(key, value) {
    this.workflow.metadata[key] = value;
    return this;
  }

  /**
   * Add a workflow step
   */
  addStep(stepConfig) {
    const step = workflowStepSchema.parse(stepConfig);
    this.workflow.steps.push(step);
    return this;
  }

  /**
   * Set the starting step
   */
  setStartStep(stepId) {
    this.workflow.startStep = stepId;
    return this;
  }

  /**
   * Set error handling strategy
   */
  setErrorHandling(strategy, options = {}) {
    this.workflow.errorHandling = {
      strategy,
      ...options
    };
    return this;
  }

  /**
   * Set workflow timeout
   */
  setTimeout(timeoutMs) {
    this.workflow.timeout = timeoutMs;
    return this;
  }

  /**
   * Build and validate the workflow
   */
  build() {
    return workflowDefinitionSchema.parse(this.workflow);
  }
}

/**
 * Workflow Template Definitions
 * Pre-built workflow templates for common scenarios
 */
export const WORKFLOW_TEMPLATES = {
  PROJECT_INITIALIZATION: {
    id: 'project-init',
    name: 'Project Initialization',
    description: 'Initialize a new project with full setup',
    steps: [
      {
        id: 'init-project',
        name: 'Initialize Project Structure',
        tool: 'guidant_init_project',
        parameters: {
          projectName: '${projectName}',
          description: '${projectDescription}',
          availableTools: '${availableTools}'
        },
        onSuccess: 'discover-agent',
        onFailure: 'cleanup'
      },
      {
        id: 'discover-agent',
        name: 'Discover Agent Capabilities',
        tool: 'guidant_discover_agent',
        parameters: {
          availableTools: '${availableTools}'
        },
        onSuccess: 'classify-project',
        onFailure: 'cleanup'
      },
      {
        id: 'classify-project',
        name: 'Classify Project Type',
        tool: 'guidant_classify_project',
        parameters: {
          projectDescription: '${projectDescription}'
        },
        onSuccess: 'complete',
        onFailure: 'cleanup'
      },
      {
        id: 'cleanup',
        name: 'Cleanup on Failure',
        tool: 'guidant_cleanup_project',
        parameters: {},
        rollbackSteps: ['init-project']
      }
    ],
    startStep: 'init-project',
    errorHandling: {
      strategy: 'rollback',
      rollbackOnFailure: true
    }
  },

  DELIVERABLE_ANALYSIS: {
    id: 'deliverable-analysis',
    name: 'Complete Deliverable Analysis',
    description: 'Analyze deliverable with quality validation',
    steps: [
      {
        id: 'analyze-deliverable',
        name: 'Analyze Deliverable Content',
        tool: 'guidant_analyze_deliverable',
        parameters: {
          deliverablePath: '${deliverablePath}',
          aiEnhanced: true
        },
        onSuccess: 'validate-quality',
        onFailure: 'report-error'
      },
      {
        id: 'validate-quality',
        name: 'Validate Content Quality',
        tool: 'guidant_validate_content',
        parameters: {
          operation: 'validate',
          deliverablePath: '${deliverablePath}'
        },
        onSuccess: 'extract-insights',
        onFailure: 'report-error'
      },
      {
        id: 'extract-insights',
        name: 'Extract Structured Insights',
        tool: 'guidant_extract_insights',
        parameters: {
          content: '${analysisResult.content}',
          contentType: 'markdown',
          aiEnhanced: true
        },
        onSuccess: 'complete',
        onFailure: 'report-error'
      },
      {
        id: 'report-error',
        name: 'Report Analysis Error',
        tool: 'guidant_report_progress',
        parameters: {
          deliverable: '${deliverablePath}',
          status: 'blocked',
          workCompleted: 'Analysis failed',
          blockers: ['${error}']
        }
      }
    ],
    startStep: 'analyze-deliverable',
    errorHandling: {
      strategy: 'continue',
      maxErrors: 3
    }
  }
};

/**
 * Workflow Validation Utilities
 */
export class WorkflowValidator {
  /**
   * Validate workflow definition
   */
  static validateWorkflow(workflow) {
    const errors = [];
    
    try {
      workflowDefinitionSchema.parse(workflow);
    } catch (error) {
      errors.push(`Schema validation failed: ${error.message}`);
      return { valid: false, errors };
    }

    // Validate step references
    const stepIds = new Set(workflow.steps.map(step => step.id));
    
    // Check start step exists
    if (!stepIds.has(workflow.startStep)) {
      errors.push(`Start step '${workflow.startStep}' not found in workflow steps`);
    }

    // Check step transitions
    workflow.steps.forEach(step => {
      if (step.onSuccess && !stepIds.has(step.onSuccess)) {
        errors.push(`Step '${step.id}' references non-existent success step '${step.onSuccess}'`);
      }
      if (step.onFailure && !stepIds.has(step.onFailure)) {
        errors.push(`Step '${step.id}' references non-existent failure step '${step.onFailure}'`);
      }
      if (step.rollbackSteps) {
        step.rollbackSteps.forEach(rollbackStep => {
          if (!stepIds.has(rollbackStep)) {
            errors.push(`Step '${step.id}' references non-existent rollback step '${rollbackStep}'`);
          }
        });
      }
    });

    // Check for circular dependencies
    const circularDeps = this.detectCircularDependencies(workflow);
    if (circularDeps.length > 0) {
      errors.push(`Circular dependencies detected: ${circularDeps.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect circular dependencies in workflow
   */
  static detectCircularDependencies(workflow) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (stepId, path = []) => {
      if (recursionStack.has(stepId)) {
        const cycleStart = path.indexOf(stepId);
        cycles.push(path.slice(cycleStart).concat(stepId).join(' -> '));
        return;
      }

      if (visited.has(stepId)) return;

      visited.add(stepId);
      recursionStack.add(stepId);
      path.push(stepId);

      const step = workflow.steps.find(s => s.id === stepId);
      if (step) {
        if (step.onSuccess) dfs(step.onSuccess, [...path]);
        if (step.onFailure) dfs(step.onFailure, [...path]);
      }

      recursionStack.delete(stepId);
    };

    workflow.steps.forEach(step => {
      if (!visited.has(step.id)) {
        dfs(step.id);
      }
    });

    return cycles;
  }
}
