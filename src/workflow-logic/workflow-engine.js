/**
 * Workflow Orchestration Engine
 * Manages phase progression, task sequencing, and quality gates
 */

import { readProjectFile, writeProjectFile } from '../file-management/project-structure.js';
import { 
  PROJECT_PHASES, 
  CURRENT_PHASE, 
  QUALITY_GATES, 
  CURRENT_ROLE,
  DECISIONS 
} from '../constants/paths.js';
import { validateTaskCapability } from '../ai-coordination/capability-discovery.js';
import { generateAITask } from '../ai-integration/task-generator.js';
import { PROJECT_TYPES } from '../workflow-intelligence/project-classifier.js';

/**
 * SDLC Phase definitions with requirements and next steps
 */
export const PHASE_DEFINITIONS = {
  concept: {
    name: 'Concept & Research',
    description: 'Initial idea validation and market research',
    roles: ['research_agent'],
    requiredDeliverables: ['market_analysis', 'user_personas', 'competitor_research'],
    nextPhase: 'requirements'
  },
  
  requirements: {
    name: 'Requirements Analysis', 
    description: 'Detailed feature specification and PRD creation',
    roles: ['research_agent', 'business_analyst'],
    requiredDeliverables: ['prd_complete', 'user_stories', 'feature_specifications'],
    nextPhase: 'design'
  },
  
  design: {
    name: 'Design & UX',
    description: 'User interface and experience design',
    roles: ['design_agent'],
    requiredDeliverables: ['wireframes', 'user_flows', 'component_specifications'],
    nextPhase: 'architecture'
  },
  
  architecture: {
    name: 'Technical Architecture',
    description: 'System design and technology planning',
    roles: ['architecture_agent'],
    requiredDeliverables: ['system_design', 'database_schema', 'api_specification'],
    nextPhase: 'implementation'
  },
  
  implementation: {
    name: 'Development',
    description: 'Code implementation and testing',
    roles: ['development_agent'],
    requiredDeliverables: ['core_features', 'testing_suite', 'documentation'],
    nextPhase: 'deployment'
  },
  
  deployment: {
    name: 'Deployment & Launch',
    description: 'Production setup and monitoring',
    roles: ['deployment_agent'],
    requiredDeliverables: ['production_environment', 'monitoring_setup', 'user_documentation'],
    nextPhase: 'complete'
  }
};

/**
 * Get current workflow state
 */
export async function getCurrentWorkflowState(projectRoot = process.cwd()) {
  const [phases, currentPhase, qualityGates, currentRole] = await Promise.all([
    readProjectFile(PROJECT_PHASES, projectRoot),
    readProjectFile(CURRENT_PHASE, projectRoot),
    readProjectFile(QUALITY_GATES, projectRoot),
    readProjectFile(CURRENT_ROLE, projectRoot)
  ]);

  return {
    phases,
    currentPhase,
    qualityGates,
    currentRole,
    phaseDefinition: PHASE_DEFINITIONS[currentPhase.phase]
  };
}

/**
 * Generate next task based on current workflow state and AI capabilities
 */
export async function generateNextTask(capabilities, projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  const phaseDefinition = state.phaseDefinition;
  
  if (!phaseDefinition) {
    throw new Error(`Unknown phase: ${state.currentPhase.phase}`);
  }

  // Check if current phase is complete
  const phaseComplete = await checkPhaseCompletion(state.currentPhase.phase, projectRoot);
  
  if (phaseComplete.isComplete) {
    return await generatePhaseTransitionTask(state, projectRoot);
  }

  // Generate task for current phase
  return await generatePhaseTask(state, capabilities, projectRoot);
}

/**
 * Generate task for current phase
 */
async function generatePhaseTask(state, capabilities, projectRoot) {
  const phaseDefinition = state.phaseDefinition;
  const currentPhase = state.currentPhase.phase;
  
  // Find the best role for this phase based on AI capabilities
  const bestRole = findBestRole(phaseDefinition.roles, capabilities);
  
  if (!bestRole) {
    return {
      type: 'capability_limitation',
      message: `Cannot proceed with ${currentPhase} phase - missing required capabilities`,
      requiredTools: [],
      availableRoles: phaseDefinition.roles
    };
  }

  // Get specific task for this phase and role
  const task = await generateSpecificTask(currentPhase, bestRole, capabilities, projectRoot);
  
  // Update current role if changed
  if (state.currentRole.role !== bestRole.role) {
    await writeProjectFile(CURRENT_ROLE, {
      role: bestRole.role,
      assignedAt: new Date().toISOString(),
      capabilities: bestRole.capabilities,
      confidence: bestRole.confidence
    }, projectRoot);
  }

  return task;
}

/**
 * Generate specific task based on phase, role, and progress
 */
async function generateSpecificTask(phase, role, capabilities, projectRoot) {
  const phaseDefinition = PHASE_DEFINITIONS[phase];
  const qualityGates = await readProjectFile(QUALITY_GATES, projectRoot);
  const phaseGates = qualityGates[phase];
  
  // Find the next incomplete deliverable
  const nextDeliverable = phaseDefinition.requiredDeliverables.find(deliverable => 
    !phaseGates.completed?.includes(deliverable)
  );

  if (!nextDeliverable) {
    return {
      type: 'phase_review',
      phase,
      message: 'All deliverables complete - ready for phase review',
      completedDeliverables: phaseGates.completed || [],
      nextAction: 'set_review_status'
    };
  }

  // Generate AI-powered task ticket
  const aiTaskResult = await generateAITask(phase, role.role, nextDeliverable, projectRoot);
  
  if (aiTaskResult.success) {
    return {
      type: 'task_ticket',
      phase,
      role: role.role,
      deliverable: nextDeliverable,
      ticket: aiTaskResult.task,
      estimatedDuration: aiTaskResult.task.estimatedDuration || estimateTaskDuration(nextDeliverable, role.confidence),
      requiredTools: aiTaskResult.task.tools || [],
      aiGenerated: true
    };
  }
  
  // Fallback to original static task generation
  const taskTicket = await generateTaskTicket(nextDeliverable, role, capabilities, projectRoot);
  
  return {
    type: 'task_ticket',
    phase,
    role: role.role,
    deliverable: nextDeliverable,
    ticket: taskTicket,
    estimatedDuration: estimateTaskDuration(nextDeliverable, role.confidence),
    requiredTools: taskTicket.tools,
    aiGenerated: false
  };
}

/**
 * Generate detailed task ticket with step-by-step instructions
 */
async function generateTaskTicket(deliverable, role, capabilities, projectRoot) {
  const taskDefinitions = {
    market_analysis: {
      title: 'Comprehensive Market Analysis',
      description: 'Research target market, size, trends, and opportunities',
      tools: ['tavily-search', 'web_search', 'read_web_page'],
      steps: [
        'Search for industry market size and growth trends',
        'Identify target market segments and demographics', 
        'Research market challenges and pain points',
        'Analyze market timing and opportunity assessment',
        'Document findings in structured format'
      ],
      deliverables: ['Market size analysis', 'Target audience definition', 'Opportunity assessment'],
      qualityCriteria: ['Multiple credible sources', 'Quantitative data included', 'Business insights provided']
    },
    
    competitor_research: {
      title: 'Competitive Landscape Analysis',
      description: 'Identify and analyze direct and indirect competitors',
      tools: ['tavily-search', 'web_search', 'read_web_page'],
      steps: [
        'Search for direct competitors in the target market',
        'Analyze competitor features, pricing, and positioning',
        'Identify competitive advantages and weaknesses',
        'Research indirect competitors and alternative solutions',
        'Create competitive analysis matrix'
      ],
      deliverables: ['Competitor profiles', 'Feature comparison matrix', 'Competitive positioning'],
      qualityCriteria: ['At least 5 competitors analyzed', 'Feature gaps identified', 'Strategic insights provided']
    },

    wireframes: {
      title: 'UI Wireframes and Component Specifications',
      description: 'Create text-based wireframes and detailed component specs',
      tools: ['create_file', 'edit_file', 'mermaid'],
      steps: [
        'Create ASCII wireframes for key user interfaces',
        'Define component specifications (size, behavior, styling)',
        'Document responsive design considerations',
        'Specify interaction patterns and state changes',
        'Create component hierarchy and relationships'
      ],
      deliverables: ['ASCII wireframes', 'Component specifications', 'Responsive design guide'],
      qualityCriteria: ['All major screens covered', 'Detailed component specs', 'Mobile-first design']
    },

    system_design: {
      title: 'Technical System Architecture',
      description: 'Design overall system architecture and component interactions',
      tools: ['mermaid', 'create_file', 'edit_file'],
      steps: [
        'Create system architecture diagram using Mermaid',
        'Define API endpoints and data flow',
        'Design database schema and relationships',
        'Specify technology stack and dependencies',
        'Document security and scalability considerations'
      ],
      deliverables: ['Architecture diagrams', 'API specification', 'Database schema'],
      qualityCriteria: ['Scalable design', 'Security considerations', 'Clear documentation']
    }
  };

  const taskDef = taskDefinitions[deliverable];
  if (!taskDef) {
    return {
      title: `Complete ${deliverable}`,
      description: `Work on ${deliverable} deliverable`,
      steps: ['Research and implement the required deliverable'],
      tools: capabilities.toolNames
    };
  }

  // Filter tools based on what's actually available
  const availableTools = taskDef.tools.filter(tool => capabilities.toolNames.includes(tool));
  
  // Adjust steps based on available tools
  const adjustedSteps = adjustStepsForCapabilities(taskDef.steps, availableTools, capabilities);

  return {
    ...taskDef,
    tools: availableTools,
    steps: adjustedSteps,
    limitations: identifyTaskLimitations(taskDef.tools, availableTools),
    instructions: generateToolInstructions(deliverable, availableTools)
  };
}

/**
 * Adjust task steps based on available capabilities
 */
function adjustStepsForCapabilities(originalSteps, availableTools, capabilities) {
  const steps = [...originalSteps];
  
  // Add tool-specific modifications
  if (!availableTools.includes('tavily-search') && availableTools.includes('web_search')) {
    steps.push('Note: Using basic web search - results may be less comprehensive');
  }
  
  if (!availableTools.includes('mermaid')) {
    steps.push('Create text-based diagrams since visual diagram tools are not available');
  }
  
  return steps;
}

/**
 * Identify limitations for current task
 */
function identifyTaskLimitations(requiredTools, availableTools) {
  const missing = requiredTools.filter(tool => !availableTools.includes(tool));
  
  return missing.map(tool => {
    switch (tool) {
      case 'tavily-search':
        return 'Limited to basic web search - may miss comprehensive market data';
      case 'mermaid': 
        return 'Cannot create visual diagrams - will use text-based descriptions';
      case 'Bash':
        return 'Cannot run automated tools - manual setup required';
      default:
        return `Missing ${tool} - functionality limited`;
    }
  });
}

/**
 * Generate tool-specific instructions
 */
function generateToolInstructions(deliverable, availableTools) {
  const instructions = [];
  
  if (availableTools.includes('tavily-search')) {
    instructions.push('Use tavily-search for comprehensive research with multiple sources');
  }
  
  if (availableTools.includes('create_file')) {
    instructions.push('Save all deliverables as markdown files in .guidant/deliverables/');
  }
  
  if (availableTools.includes('mermaid')) {
    instructions.push('Create visual diagrams using mermaid tool for better clarity');
  }
  
  return instructions;
}

/**
 * Get the appropriate directory for deliverables based on current phase
 */
export function getDeliverableDirectory(phase) {
  const phaseDirectories = {
    concept: 'research',
    requirements: 'requirements', 
    design: 'wireframes',
    architecture: 'architecture',
    implementation: 'implementation',
    deployment: 'deployment'
  };
  
  return phaseDirectories[phase] || 'research';
}

/**
 * Find best role for phase based on AI capabilities
 */
function findBestRole(availableRoles, capabilities) {
  const roleMap = {
    research_agent: 'research',
    design_agent: 'design', 
    development_agent: 'development',
    deployment_agent: 'deployment'
  };
  
  let bestRole = null;
  let highestConfidence = 0;
  
  for (const role of availableRoles) {
    const category = roleMap[role];
    if (category && capabilities.roles[category]) {
      const roleCapability = capabilities.roles[category];
      if (roleCapability.canFulfill && roleCapability.confidence > highestConfidence) {
        bestRole = {
          role,
          category,
          confidence: roleCapability.confidence,
          capabilities: roleCapability.capabilities
        };
        highestConfidence = roleCapability.confidence;
      }
    }
  }
  
  return bestRole;
}

/**
 * Check if current phase is complete
 */
export async function checkPhaseCompletion(phase, projectRoot) {
  const qualityGates = await readProjectFile(QUALITY_GATES, projectRoot);
  const phaseGates = qualityGates[phase];
  const phaseDefinition = PHASE_DEFINITIONS[phase];
  
  if (!phaseGates || !phaseDefinition) {
    return { isComplete: false, reason: 'Invalid phase' };
  }

  const completed = phaseGates.completed || [];
  const required = phaseDefinition.requiredDeliverables;
  const isComplete = required.every(deliverable => completed.includes(deliverable));
  
  return {
    isComplete,
    completed,
    required,
    missing: required.filter(deliverable => !completed.includes(deliverable)),
    readyForReview: isComplete && phaseGates.status !== 'approved'
  };
}

/**
 * Generate phase transition task
 */
async function generatePhaseTransitionTask(state, projectRoot) {
  const currentPhase = state.currentPhase.phase;
  const phaseDefinition = state.phaseDefinition;
  const nextPhase = phaseDefinition.nextPhase;
  
  if (nextPhase === 'complete') {
    return {
      type: 'project_complete',
      message: 'Project development complete - ready for final review',
      currentPhase,
      action: 'final_review'
    };
  }

  return {
    type: 'phase_transition',
    message: `${phaseDefinition.name} complete - ready to advance to ${PHASE_DEFINITIONS[nextPhase].name}`,
    currentPhase,
    nextPhase,
    action: 'advance_phase',
    nextPhaseDescription: PHASE_DEFINITIONS[nextPhase].description
  };
}

/**
 * Advance to next phase with intelligent data transformation
 */
export async function advancePhase(projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  const currentPhase = state.currentPhase.phase;
  const nextPhase = state.phaseDefinition.nextPhase;

  if (nextPhase === 'complete') {
    // Mark project as complete
    await writeProjectFile(CURRENT_PHASE, {
      ...state.currentPhase,
      phase: 'complete',
      completedAt: new Date().toISOString()
    }, projectRoot);

    return { success: true, message: 'Project marked as complete' };
  }

  try {
    // Execute phase transition with data transformation
    const { PhaseTransitionEngine } = await import('./phase-transition-engine.js');
    const transitionEngine = new PhaseTransitionEngine(projectRoot);

    console.log(`🔄 Executing intelligent phase transition: ${currentPhase} → ${nextPhase}`);
    const transitionResult = await transitionEngine.executeTransition(currentPhase, nextPhase);

    if (!transitionResult.success) {
      return {
        success: false,
        error: `Phase transition failed: ${transitionResult.error}`,
        currentPhase,
        nextPhase
      };
    }

    // Update phase status
    const updatedPhases = {
      ...state.phases,
      phases: {
        ...state.phases.phases,
        [currentPhase]: {
          ...state.phases.phases[currentPhase],
          status: 'completed',
          completedAt: new Date().toISOString(),
          transformation: transitionResult.transformation
        },
        [nextPhase]: {
          ...state.phases.phases[nextPhase],
          status: 'active',
          startedAt: new Date().toISOString(),
          enhancedContext: transitionResult.enhancedContext
        }
      },
      current: nextPhase
    };

    await writeProjectFile(PROJECT_PHASES, updatedPhases, projectRoot);

    // Update current phase with enhanced context
    await writeProjectFile(CURRENT_PHASE, {
      phase: nextPhase,
      role: null, // Will be assigned when next task is generated
      currentTask: null,
      progress: 0,
      startedAt: new Date().toISOString(),
      enhancedContext: transitionResult.enhancedContext
    }, projectRoot);

    console.log(`✅ Successfully advanced to ${PHASE_DEFINITIONS[nextPhase].name} phase with data transformation`);

    return {
      success: true,
      message: `Advanced to ${PHASE_DEFINITIONS[nextPhase].name} phase with intelligent data transformation`,
      nextPhase,
      transformation: transitionResult.transformation,
      enhancedContext: transitionResult.enhancedContext
    };

  } catch (error) {
    console.error(`Phase transition engine failed: ${error.message}`);

    // Fallback to basic phase advancement
    console.log('Falling back to basic phase advancement...');

    const updatedPhases = {
      ...state.phases,
      phases: {
        ...state.phases.phases,
        [currentPhase]: {
          ...state.phases.phases[currentPhase],
          status: 'completed',
          completedAt: new Date().toISOString()
        },
        [nextPhase]: {
          ...state.phases.phases[nextPhase],
          status: 'active',
          startedAt: new Date().toISOString()
        }
      },
      current: nextPhase
    };

    await writeProjectFile(PROJECT_PHASES, updatedPhases, projectRoot);

    await writeProjectFile(CURRENT_PHASE, {
      phase: nextPhase,
      role: null,
      currentTask: null,
      progress: 0,
      startedAt: new Date().toISOString()
    }, projectRoot);

    return {
      success: true,
      message: `Advanced to ${PHASE_DEFINITIONS[nextPhase].name} phase (basic mode)`,
      nextPhase,
      warning: 'Phase transition engine failed, used basic advancement'
    };
  }
}

/**
 * Mark deliverable as complete
 */
export async function markDeliverableComplete(deliverable, projectRoot = process.cwd()) {
  const state = await getCurrentWorkflowState(projectRoot);
  const qualityGates = state.qualityGates;
  const currentPhase = state.currentPhase.phase;
  
  const updated = {
    ...qualityGates,
    [currentPhase]: {
      ...qualityGates[currentPhase],
      completed: [...(qualityGates[currentPhase].completed || []), deliverable],
      lastUpdated: new Date().toISOString()
    }
  };

  await writeProjectFile(QUALITY_GATES, updated, projectRoot);
  
  return { success: true, deliverable, phase: currentPhase };
}

/**
 * Format implementation ticket as YAML for display
 */
export function formatImplementationTicket(taskResult) {
  if (taskResult.type !== 'implementation_ticket') {
    return null;
  }

  const ticket = taskResult.task;

  const yamlOutput = `
## Implementation Ticket

\`\`\`yaml
ticket_id: ${ticket.ticket_id}
title: ${ticket.title}
type: ${ticket.type}
parent_story: ${ticket.parent_story}
parent_epic: ${ticket.parent_epic}
priority: ${ticket.priority}
complexity: ${ticket.complexity}
estimated_points: ${ticket.estimated_points}
status: ${ticket.status}

description: |
  ${ticket.description}

acceptance_criteria:
${ticket.acceptance_criteria?.map(criteria => `  - ${criteria}`).join('\n') || '  - No criteria specified'}

technical_specifications:
${ticket.technical_specifications?.map(spec => `  - ${spec}`).join('\n') || '  - No specifications provided'}

dependencies:
${ticket.dependencies?.map(dep => `  - ${dep}`).join('\n') || '  - No dependencies'}

implementation_guide: |
  ${ticket.implementation_guide || 'No implementation guide provided'}

code_examples:
${ticket.code_examples?.map(example =>
  `  - language: ${example.language}
    description: "${example.description}"
    code: |
      ${example.code.split('\n').map(line => `      ${line}`).join('\n')}`
).join('\n') || '  - No code examples provided'}

testing_requirements:
${ticket.testing_requirements?.map(req => `  - ${req}`).join('\n') || '  - No testing requirements specified'}
\`\`\`
  `.trim();

  return yamlOutput;
}

/**
 * Estimate task duration based on complexity and AI confidence
 */
function estimateTaskDuration(deliverable, confidence) {
  const baseDurations = {
    market_analysis: 30,
    competitor_research: 25,
    user_personas: 20,
    wireframes: 45,
    user_flows: 30,
    system_design: 60,
    database_schema: 40,
    code_implementation: 120,
    testing_suite: 60,
    deployment_setup: 45
  };
  
  const base = baseDurations[deliverable] || 30;
  const confidenceMultiplier = confidence > 0.8 ? 1.0 : confidence > 0.6 ? 1.3 : 1.6;
  
  return Math.round(base * confidenceMultiplier);
}
