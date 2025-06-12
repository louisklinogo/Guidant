/**
 * Tool Orchestration MCP Tools
 * MCP tools for workflow orchestration and multi-tool execution
 * 
 * MCP-009: Tool Orchestration Engine Implementation
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import { toolOrchestrator } from './tool-orchestrator.js';
import { 
  workflowDefinitionSchema, 
  WorkflowBuilder, 
  WorkflowValidator 
} from './workflow-dsl.js';
import { 
  getWorkflowTemplate, 
  listWorkflowTemplates, 
  createWorkflowFromTemplate,
  WORKFLOW_TEMPLATE_REGISTRY 
} from './workflow-templates.js';

// Import existing tool handlers for registration
import { registerProjectManagementTools } from '../core/project-management.js';
import { registerWorkflowControlTools } from '../core/workflow-control.js';
import { registerDeliverableAnalysisTools } from '../core/deliverable-analysis.js';
import { registerAgentDiscoveryTools } from '../agent-registry/agent-discovery.js';
import { registerCapabilityAnalysisTools } from '../agent-registry/capability-analysis.js';
import { registerAdaptiveWorkflowTools } from '../workflow-intelligence/adaptive-tools.js';
import { registerQualityValidationTools } from '../quality/quality-validation-tools.js';

/**
 * Initialize tool orchestrator with all available tools
 */
function initializeOrchestrator() {
  // Create a mock server to collect tool handlers
  const mockServer = {
    tools: new Map(),
    addTool: function(toolConfig) {
      this.tools.set(toolConfig.name, toolConfig.execute);
    }
  };

  // Register all tools with mock server
  registerProjectManagementTools(mockServer);
  registerWorkflowControlTools(mockServer);
  registerDeliverableAnalysisTools(mockServer);
  registerAgentDiscoveryTools(mockServer);
  registerCapabilityAnalysisTools(mockServer);
  registerAdaptiveWorkflowTools(mockServer);
  registerQualityValidationTools(mockServer);

  // Register tools with orchestrator
  for (const [toolName, toolHandler] of mockServer.tools) {
    toolOrchestrator.registerTool(toolName, toolHandler);
  }

  console.log(`🎭 Tool orchestrator initialized with ${mockServer.tools.size} tools`);
}

// Initialize orchestrator on module load
initializeOrchestrator();

/**
 * Register orchestration tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerOrchestrationTools(server) {
  // Execute workflow
  server.addTool({
    name: 'guidant_execute_workflow',
    description: 'Execute a multi-tool workflow with orchestration, error handling, and monitoring',
    parameters: z.object({
      workflow: workflowDefinitionSchema.optional().describe('Complete workflow definition'),
      templateId: z.string().optional().describe('ID of workflow template to use'),
      variables: z.record(z.any()).optional().describe('Variables to pass to the workflow'),
      customizations: z.object({
        timeout: z.number().optional(),
        errorHandling: z.object({
          strategy: z.enum(['fail-fast', 'continue', 'rollback']).optional(),
          maxErrors: z.number().optional()
        }).optional()
      }).optional().describe('Workflow customizations')
    }),
    execute: async ({ workflow, templateId, variables = {}, customizations = {} }) => {
      try {
        let workflowDefinition;

        if (workflow) {
          // Use provided workflow definition
          workflowDefinition = workflow;
        } else if (templateId) {
          // Use template
          workflowDefinition = createWorkflowFromTemplate(templateId, customizations);
          if (!workflowDefinition) {
            return formatErrorResponse(`Workflow template '${templateId}' not found`);
          }
        } else {
          return formatErrorResponse('Either workflow definition or templateId must be provided');
        }

        // Execute workflow
        const result = await toolOrchestrator.executeWorkflow(workflowDefinition, variables);

        return formatSuccessResponse({
          executionId: result.executionId,
          success: result.success,
          executionTime: result.executionTime,
          result: result.result,
          context: result.context,
          message: result.success 
            ? 'Workflow executed successfully' 
            : 'Workflow execution completed with errors'
        });

      } catch (error) {
        return formatErrorResponse(`Workflow execution failed: ${error.message}`);
      }
    }
  });

  // Get workflow status
  server.addTool({
    name: 'guidant_get_workflow_status',
    description: 'Get the status and details of a workflow execution',
    parameters: z.object({
      executionId: z.string().describe('Workflow execution ID')
    }),
    execute: async ({ executionId }) => {
      try {
        const status = toolOrchestrator.getWorkflowStatus(executionId);
        
        if (!status) {
          return formatErrorResponse(`Workflow execution '${executionId}' not found`);
        }

        return formatSuccessResponse({
          executionId,
          status: status.status,
          context: status.context,
          result: status.result,
          executionTime: status.executionTime,
          message: `Workflow status: ${status.status}`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to get workflow status: ${error.message}`);
      }
    }
  });

  // Cancel workflow
  server.addTool({
    name: 'guidant_cancel_workflow',
    description: 'Cancel a running workflow execution',
    parameters: z.object({
      executionId: z.string().describe('Workflow execution ID to cancel')
    }),
    execute: async ({ executionId }) => {
      try {
        const result = await toolOrchestrator.cancelWorkflow(executionId);
        
        return formatSuccessResponse({
          executionId,
          cancelled: result.success,
          message: result.message
        });

      } catch (error) {
        return formatErrorResponse(`Failed to cancel workflow: ${error.message}`);
      }
    }
  });

  // List workflow templates
  server.addTool({
    name: 'guidant_list_workflow_templates',
    description: 'List all available workflow templates',
    parameters: z.object({
      category: z.string().optional().describe('Filter templates by category')
    }),
    execute: async ({ category }) => {
      try {
        let templates = listWorkflowTemplates();
        
        if (category) {
          templates = templates.filter(template => template.category === category);
        }

        return formatSuccessResponse({
          templates,
          totalCount: templates.length,
          categories: [...new Set(templates.map(t => t.category))],
          message: `Found ${templates.length} workflow templates`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to list workflow templates: ${error.message}`);
      }
    }
  });

  // Get workflow template
  server.addTool({
    name: 'guidant_get_workflow_template',
    description: 'Get detailed information about a specific workflow template',
    parameters: z.object({
      templateId: z.string().describe('Template ID to retrieve')
    }),
    execute: async ({ templateId }) => {
      try {
        const template = getWorkflowTemplate(templateId);
        
        if (!template) {
          return formatErrorResponse(`Workflow template '${templateId}' not found`);
        }

        return formatSuccessResponse({
          template,
          templateId,
          stepCount: template.steps.length,
          variables: Object.keys(template.variables || {}),
          message: `Retrieved workflow template: ${template.name}`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to get workflow template: ${error.message}`);
      }
    }
  });

  // Create custom workflow
  server.addTool({
    name: 'guidant_create_workflow',
    description: 'Create a custom workflow using the workflow builder',
    parameters: z.object({
      workflowInfo: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        version: z.string().optional().default('1.0.0')
      }),
      steps: z.array(z.object({
        id: z.string(),
        name: z.string(),
        tool: z.string(),
        parameters: z.record(z.any()).optional(),
        condition: z.string().optional(),
        retryPolicy: z.object({
          maxAttempts: z.number().default(3),
          backoffMs: z.number().default(1000),
          exponentialBackoff: z.boolean().default(true)
        }).optional(),
        timeout: z.number().optional(),
        onSuccess: z.string().optional(),
        onFailure: z.string().optional(),
        rollbackSteps: z.array(z.string()).optional()
      })),
      startStep: z.string(),
      variables: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
      errorHandling: z.object({
        strategy: z.enum(['fail-fast', 'continue', 'rollback']).default('fail-fast'),
        maxErrors: z.number().default(5),
        rollbackOnFailure: z.boolean().default(false)
      }).optional(),
      timeout: z.number().optional()
    }),
    execute: async ({ workflowInfo, steps, startStep, variables, metadata, errorHandling, timeout }) => {
      try {
        const builder = new WorkflowBuilder()
          .setInfo(workflowInfo.id, workflowInfo.name, workflowInfo.description)
          .setVersion(workflowInfo.version)
          .setStartStep(startStep);

        // Add variables
        if (variables) {
          Object.entries(variables).forEach(([name, value]) => {
            builder.addVariable(name, value);
          });
        }

        // Add metadata
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            builder.addMetadata(key, value);
          });
        }

        // Add steps
        steps.forEach(step => {
          builder.addStep(step);
        });

        // Set error handling
        if (errorHandling) {
          builder.setErrorHandling(errorHandling.strategy, errorHandling);
        }

        // Set timeout
        if (timeout) {
          builder.setTimeout(timeout);
        }

        const workflow = builder.build();

        return formatSuccessResponse({
          workflow,
          workflowId: workflow.id,
          stepCount: workflow.steps.length,
          message: `Custom workflow '${workflow.name}' created successfully`
        });

      } catch (error) {
        return formatErrorResponse(`Failed to create workflow: ${error.message}`);
      }
    }
  });

  // Validate workflow
  server.addTool({
    name: 'guidant_validate_workflow',
    description: 'Validate a workflow definition for correctness and best practices',
    parameters: z.object({
      workflow: workflowDefinitionSchema.describe('Workflow definition to validate')
    }),
    execute: async ({ workflow }) => {
      try {
        const validation = WorkflowValidator.validateWorkflow(workflow);
        
        return formatSuccessResponse({
          valid: validation.valid,
          errors: validation.errors,
          workflowId: workflow.id,
          stepCount: workflow.steps.length,
          message: validation.valid 
            ? 'Workflow validation passed' 
            : `Workflow validation failed with ${validation.errors.length} errors`
        });

      } catch (error) {
        return formatErrorResponse(`Workflow validation failed: ${error.message}`);
      }
    }
  });

  // Get orchestrator metrics
  server.addTool({
    name: 'guidant_get_orchestrator_metrics',
    description: 'Get orchestration performance metrics and statistics',
    parameters: z.object({
      includeDetails: z.boolean().default(false).describe('Include detailed metrics')
    }),
    execute: async ({ includeDetails }) => {
      try {
        const metrics = toolOrchestrator.getMetrics();
        
        const response = {
          summary: {
            totalWorkflows: metrics.workflowsExecuted,
            successRate: metrics.workflowsExecuted > 0 
              ? ((metrics.workflowsSucceeded / metrics.workflowsExecuted) * 100).toFixed(2)
              : 0,
            averageExecutionTime: Math.round(metrics.averageExecutionTime),
            activeWorkflows: metrics.activeWorkflows,
            peakConcurrency: metrics.peakConcurrency
          },
          message: `Orchestrator has executed ${metrics.workflowsExecuted} workflows`
        };

        if (includeDetails) {
          response.details = {
            stepExecutions: metrics.stepExecutions,
            errorsByType: metrics.errorsByType,
            fullMetrics: metrics
          };
        }

        return formatSuccessResponse(response);

      } catch (error) {
        return formatErrorResponse(`Failed to get orchestrator metrics: ${error.message}`);
      }
    }
  });

  console.log('🎭 Tool orchestration tools registered successfully');
}
