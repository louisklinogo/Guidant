/**
 * Workflow Templates for Common Orchestration Patterns
 * Pre-built workflow definitions for typical AI agent tasks
 * 
 * MCP-009: Tool Orchestration Engine Implementation
 */

import { WorkflowBuilder } from './workflow-dsl.js';

/**
 * Project Setup Workflow Template
 * Complete project initialization with agent discovery and classification
 */
export const PROJECT_SETUP_WORKFLOW = new WorkflowBuilder()
  .setInfo(
    'project-setup-complete',
    'Complete Project Setup',
    'Initialize project, discover agent capabilities, and classify project type'
  )
  .setVersion('1.0.0')
  .addVariable('projectName', '')
  .addVariable('projectDescription', '')
  .addVariable('availableTools', [])
  .addMetadata('category', 'initialization')
  .addMetadata('estimatedDuration', '2-5 minutes')
  .addStep({
    id: 'init-project',
    name: 'Initialize Project Structure',
    tool: 'guidant_init_project',
    parameters: {
      projectName: '${projectName}',
      description: '${projectDescription}',
      availableTools: '${availableTools}'
    },
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: 1000
    },
    onSuccess: 'discover-agent',
    onFailure: 'report-init-failure'
  })
  .addStep({
    id: 'discover-agent',
    name: 'Discover Agent Capabilities',
    tool: 'guidant_discover_agent',
    parameters: {
      availableTools: '${availableTools}',
      agentName: 'project-setup-agent'
    },
    onSuccess: 'classify-project',
    onFailure: 'report-discovery-failure'
  })
  .addStep({
    id: 'classify-project',
    name: 'Classify Project Type and Complexity',
    tool: 'guidant_classify_project',
    parameters: {
      method: 'ai',
      projectDescription: '${projectDescription}'
    },
    onSuccess: 'generate-workflow',
    onFailure: 'report-classification-failure'
  })
  .addStep({
    id: 'generate-workflow',
    name: 'Generate Adaptive Workflow',
    tool: 'guidant_manage_adaptive_workflow',
    parameters: {
      operation: 'generate_and_apply',
      classification: '${stepResults.classify-project.classification}'
    },
    onSuccess: 'complete-setup',
    onFailure: 'report-workflow-failure'
  })
  .addStep({
    id: 'complete-setup',
    name: 'Complete Project Setup',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'project-initialization',
      workCompleted: 'Project setup completed successfully',
      status: 'completed',
      nextSteps: 'Ready to begin development workflow'
    }
  })
  .addStep({
    id: 'report-init-failure',
    name: 'Report Initialization Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'project-initialization',
      workCompleted: 'Project initialization failed',
      status: 'blocked',
      blockers: ['Project structure creation failed']
    }
  })
  .addStep({
    id: 'report-discovery-failure',
    name: 'Report Agent Discovery Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'project-initialization',
      workCompleted: 'Agent capability discovery failed',
      status: 'blocked',
      blockers: ['Agent discovery failed']
    }
  })
  .addStep({
    id: 'report-classification-failure',
    name: 'Report Classification Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'project-initialization',
      workCompleted: 'Project classification failed',
      status: 'blocked',
      blockers: ['Project type classification failed']
    }
  })
  .addStep({
    id: 'report-workflow-failure',
    name: 'Report Workflow Generation Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'project-initialization',
      workCompleted: 'Workflow generation failed',
      status: 'blocked',
      blockers: ['Adaptive workflow generation failed']
    }
  })
  .setStartStep('init-project')
  .setErrorHandling('continue', { maxErrors: 3 })
  .setTimeout(300000) // 5 minutes
  .build();

/**
 * Quality Analysis Workflow Template
 * Comprehensive deliverable analysis with quality validation
 */
export const QUALITY_ANALYSIS_WORKFLOW = new WorkflowBuilder()
  .setInfo(
    'quality-analysis-complete',
    'Complete Quality Analysis',
    'Analyze deliverable content, validate quality, and extract insights'
  )
  .setVersion('1.0.0')
  .addVariable('deliverablePath', '')
  .addVariable('deliverableType', '')
  .addVariable('aiEnhanced', true)
  .addMetadata('category', 'analysis')
  .addMetadata('estimatedDuration', '1-3 minutes')
  .addStep({
    id: 'analyze-content',
    name: 'Analyze Deliverable Content',
    tool: 'guidant_analyze_deliverable',
    parameters: {
      deliverablePath: '${deliverablePath}',
      deliverableType: '${deliverableType}',
      aiEnhanced: '${aiEnhanced}'
    },
    retryPolicy: {
      maxAttempts: 2,
      backoffMs: 2000
    },
    onSuccess: 'validate-quality',
    onFailure: 'report-analysis-failure'
  })
  .addStep({
    id: 'validate-quality',
    name: 'Validate Content Quality',
    tool: 'guidant_validate_content',
    parameters: {
      operation: 'validate',
      deliverablePath: '${deliverablePath}',
      deliverableType: '${deliverableType}',
      options: {
        feedbackLevel: 'comprehensive'
      }
    },
    onSuccess: 'extract-insights',
    onFailure: 'report-validation-failure'
  })
  .addStep({
    id: 'extract-insights',
    name: 'Extract Structured Insights',
    tool: 'guidant_extract_insights',
    parameters: {
      content: '${stepResults.analyze-content.content}',
      contentType: 'markdown',
      deliverableType: '${deliverableType}',
      aiEnhanced: '${aiEnhanced}'
    },
    onSuccess: 'generate-report',
    onFailure: 'report-insight-failure'
  })
  .addStep({
    id: 'generate-report',
    name: 'Generate Analysis Report',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: '${deliverablePath}',
      workCompleted: 'Quality analysis completed successfully',
      status: 'completed',
      nextSteps: 'Analysis results available for review'
    }
  })
  .addStep({
    id: 'report-analysis-failure',
    name: 'Report Content Analysis Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: '${deliverablePath}',
      workCompleted: 'Content analysis failed',
      status: 'blocked',
      blockers: ['Deliverable content analysis failed']
    }
  })
  .addStep({
    id: 'report-validation-failure',
    name: 'Report Quality Validation Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: '${deliverablePath}',
      workCompleted: 'Quality validation failed',
      status: 'blocked',
      blockers: ['Quality validation process failed']
    }
  })
  .addStep({
    id: 'report-insight-failure',
    name: 'Report Insight Extraction Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: '${deliverablePath}',
      workCompleted: 'Insight extraction failed',
      status: 'blocked',
      blockers: ['Structured insight extraction failed']
    }
  })
  .setStartStep('analyze-content')
  .setErrorHandling('continue', { maxErrors: 2 })
  .setTimeout(180000) // 3 minutes
  .build();

/**
 * Phase Transition Workflow Template
 * Automated phase advancement with validation and setup
 */
export const PHASE_TRANSITION_WORKFLOW = new WorkflowBuilder()
  .setInfo(
    'phase-transition-complete',
    'Complete Phase Transition',
    'Validate current phase completion and advance to next phase'
  )
  .setVersion('1.0.0')
  .addVariable('currentPhase', '')
  .addVariable('confirmAdvancement', true)
  .addMetadata('category', 'workflow')
  .addMetadata('estimatedDuration', '30 seconds - 2 minutes')
  .addStep({
    id: 'validate-phase',
    name: 'Validate Current Phase Completion',
    tool: 'guidant_analyze_phase',
    parameters: {
      phaseDirectory: '.guidant/deliverables/${currentPhase}',
      aiEnhanced: true
    },
    condition: 'context.variables.currentPhase !== ""',
    onSuccess: 'check-readiness',
    onFailure: 'report-validation-failure'
  })
  .addStep({
    id: 'check-readiness',
    name: 'Check Phase Advancement Readiness',
    tool: 'guidant_get_current_task',
    parameters: {
      includeFullState: true
    },
    condition: 'stepResults["validate-phase"].completionScore >= 80',
    onSuccess: 'advance-phase',
    onFailure: 'report-not-ready'
  })
  .addStep({
    id: 'advance-phase',
    name: 'Advance to Next Phase',
    tool: 'guidant_advance_phase',
    parameters: {
      confirmAdvancement: '${confirmAdvancement}'
    },
    onSuccess: 'setup-next-phase',
    onFailure: 'report-advancement-failure'
  })
  .addStep({
    id: 'setup-next-phase',
    name: 'Setup Next Phase Tasks',
    tool: 'guidant_get_current_task',
    parameters: {
      includeFullState: true
    },
    onSuccess: 'complete-transition',
    onFailure: 'report-setup-failure'
  })
  .addStep({
    id: 'complete-transition',
    name: 'Complete Phase Transition',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'phase-transition',
      workCompleted: 'Phase transition completed successfully',
      status: 'completed',
      nextSteps: 'Ready to begin next phase tasks'
    }
  })
  .addStep({
    id: 'report-validation-failure',
    name: 'Report Phase Validation Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'phase-transition',
      workCompleted: 'Phase validation failed',
      status: 'blocked',
      blockers: ['Current phase validation failed']
    }
  })
  .addStep({
    id: 'report-not-ready',
    name: 'Report Phase Not Ready',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'phase-transition',
      workCompleted: 'Phase not ready for advancement',
      status: 'in_progress',
      blockers: ['Phase completion requirements not met']
    }
  })
  .addStep({
    id: 'report-advancement-failure',
    name: 'Report Phase Advancement Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'phase-transition',
      workCompleted: 'Phase advancement failed',
      status: 'blocked',
      blockers: ['Phase advancement process failed']
    }
  })
  .addStep({
    id: 'report-setup-failure',
    name: 'Report Next Phase Setup Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'phase-transition',
      workCompleted: 'Next phase setup failed',
      status: 'blocked',
      blockers: ['Next phase task setup failed']
    }
  })
  .setStartStep('validate-phase')
  .setErrorHandling('fail-fast')
  .setTimeout(120000) // 2 minutes
  .build();

/**
 * Agent Optimization Workflow Template
 * Analyze agent capabilities and suggest improvements
 */
export const AGENT_OPTIMIZATION_WORKFLOW = new WorkflowBuilder()
  .setInfo(
    'agent-optimization-complete',
    'Complete Agent Optimization',
    'Analyze agent capabilities, identify gaps, and suggest tool configurations'
  )
  .setVersion('1.0.0')
  .addVariable('agentId', '')
  .addVariable('targetProject', {})
  .addVariable('availableTools', [])
  .addMetadata('category', 'optimization')
  .addMetadata('estimatedDuration', '1-2 minutes')
  .addStep({
    id: 'discover-agent',
    name: 'Discover Agent Capabilities',
    tool: 'guidant_discover_agent',
    parameters: {
      availableTools: '${availableTools}',
      agentName: 'optimization-target'
    },
    onSuccess: 'analyze-gaps',
    onFailure: 'report-discovery-failure'
  })
  .addStep({
    id: 'analyze-gaps',
    name: 'Analyze Capability Gaps',
    tool: 'guidant_analyze_gaps',
    parameters: {
      agentId: '${stepResults.discover-agent.agentId}',
      targetProject: '${targetProject}'
    },
    onSuccess: 'suggest-config',
    onFailure: 'report-gap-analysis-failure'
  })
  .addStep({
    id: 'suggest-config',
    name: 'Suggest Tool Configuration',
    tool: 'guidant_suggest_config',
    parameters: {
      agentId: '${stepResults.discover-agent.agentId}',
      targetProject: '${targetProject}'
    },
    onSuccess: 'generate-recommendations',
    onFailure: 'report-config-failure'
  })
  .addStep({
    id: 'generate-recommendations',
    name: 'Generate Optimization Report',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'agent-optimization',
      workCompleted: 'Agent optimization analysis completed',
      status: 'completed',
      nextSteps: 'Review recommendations and apply suggested configurations'
    }
  })
  .addStep({
    id: 'report-discovery-failure',
    name: 'Report Agent Discovery Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'agent-optimization',
      workCompleted: 'Agent discovery failed',
      status: 'blocked',
      blockers: ['Agent capability discovery failed']
    }
  })
  .addStep({
    id: 'report-gap-analysis-failure',
    name: 'Report Gap Analysis Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'agent-optimization',
      workCompleted: 'Gap analysis failed',
      status: 'blocked',
      blockers: ['Capability gap analysis failed']
    }
  })
  .addStep({
    id: 'report-config-failure',
    name: 'Report Configuration Failure',
    tool: 'guidant_report_progress',
    parameters: {
      deliverable: 'agent-optimization',
      workCompleted: 'Configuration suggestion failed',
      status: 'blocked',
      blockers: ['Tool configuration suggestion failed']
    }
  })
  .setStartStep('discover-agent')
  .setErrorHandling('continue', { maxErrors: 2 })
  .setTimeout(120000) // 2 minutes
  .build();

/**
 * Template Registry
 * Central registry for all workflow templates
 */
export const WORKFLOW_TEMPLATE_REGISTRY = {
  'project-setup': PROJECT_SETUP_WORKFLOW,
  'quality-analysis': QUALITY_ANALYSIS_WORKFLOW,
  'phase-transition': PHASE_TRANSITION_WORKFLOW,
  'agent-optimization': AGENT_OPTIMIZATION_WORKFLOW
};

/**
 * Get workflow template by ID
 */
export function getWorkflowTemplate(templateId) {
  return WORKFLOW_TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * List all available workflow templates
 */
export function listWorkflowTemplates() {
  return Object.keys(WORKFLOW_TEMPLATE_REGISTRY).map(id => ({
    id,
    name: WORKFLOW_TEMPLATE_REGISTRY[id].name,
    description: WORKFLOW_TEMPLATE_REGISTRY[id].description,
    category: WORKFLOW_TEMPLATE_REGISTRY[id].metadata?.category || 'general',
    estimatedDuration: WORKFLOW_TEMPLATE_REGISTRY[id].metadata?.estimatedDuration || 'unknown'
  }));
}

/**
 * Create custom workflow from template
 */
export function createWorkflowFromTemplate(templateId, customizations = {}) {
  const template = getWorkflowTemplate(templateId);
  if (!template) {
    throw new Error(`Workflow template '${templateId}' not found`);
  }

  // Deep clone template
  const workflow = JSON.parse(JSON.stringify(template));
  
  // Apply customizations
  if (customizations.variables) {
    workflow.variables = { ...workflow.variables, ...customizations.variables };
  }
  
  if (customizations.metadata) {
    workflow.metadata = { ...workflow.metadata, ...customizations.metadata };
  }
  
  if (customizations.timeout) {
    workflow.timeout = customizations.timeout;
  }
  
  if (customizations.errorHandling) {
    workflow.errorHandling = { ...workflow.errorHandling, ...customizations.errorHandling };
  }

  return workflow;
}
