/**
 * Status Command
 * Show current project status and progress with professional dashboard
 */

import { getCurrentWorkflowState } from '../../workflow-logic/workflow-engine.js';
import { getProjectState } from '../../file-management/project-structure.js';
import { renderProjectDashboard } from '../../ui/dashboard-renderer.js';
import { createTaskFocusDisplay } from '../../ui/components/TaskFocusDisplay.js';
import { withProject, CommandMiddleware } from '../middleware/index.js';

/**
 * Status command implementation with middleware
 */
export const statusCommand = withProject(async (options = {}) => {
  try {
    const state = await getProjectState();
    const workflowState = await getCurrentWorkflowState();

    // Check if focus mode is requested
    if (options.focus) {
      await renderTaskFocusMode(state, workflowState, options);
    } else {
      // Use dashboard renderer for full status
      await renderProjectDashboard(state, workflowState, {
        compact: options.compact || false,
        showHeader: options.header !== false,
        showProgress: options.progress !== false,
        showCapabilities: options.capabilities !== false,
        showTasks: options.tasks !== false
      });
    }
  } catch (error) {
    console.error('❌ Status command failed:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
});

/**
 * Render task focus mode - single-task display with workflow context
 */
async function renderTaskFocusMode(projectState, workflowState, options = {}) {
  // Get current task from workflow state or generate a real task
  const currentTask = await getCurrentTask(projectState, workflowState);

  // Build workflow context
  const workflowContext = {
    currentPhase: workflowState.currentPhase?.phase,
    totalPhases: Object.keys(workflowState.phases || {}).length,
    workflowType: projectState.config?.projectType || 'standard',
    overallProgress: calculateOverallProgress(workflowState.phases),
    nextPhase: getNextPhase(workflowState.phases, workflowState.currentPhase),
    readyToAdvance: checkPhaseReadyToAdvance(workflowState)
  };

  // Render the focused task display
  const focusDisplay = createTaskFocusDisplay(currentTask, workflowContext, {
    compact: options.compact || false,
    showDependencies: options.dependencies !== false,
    showActions: options.actions !== false,
    showPhaseContext: options.phase !== false
  });

  console.log(focusDisplay);
}

/**
 * Get current task based on project state and workflow
 */
async function getCurrentTask(projectState, workflowState) {
  // For now, generate a task based on current phase
  const currentPhase = workflowState.currentPhase?.phase || 'concept';
  const projectName = projectState.config?.name || 'Project';

  return {
    id: `${currentPhase.toUpperCase()}-001`,
    title: `${getPhaseTaskTitle(currentPhase, projectName)}`,
    description: getPhaseTaskDescription(currentPhase, projectName),
    priority: 'high',
    status: 'pending',
    phase: currentPhase,
    progress: 0,
    estimatedHours: getPhaseEstimatedHours(currentPhase),
    actualHours: 0,
    dependencies: getPhaseTaskDependencies(currentPhase),
    blockers: []
  };
}

/**
 * Helper functions for task generation
 */
function getPhaseTaskTitle(phase, projectName) {
  const titles = {
    concept: `Define ${projectName} Vision and Requirements`,
    requirements: `Create Detailed Requirements for ${projectName}`,
    design: `Design User Experience for ${projectName}`,
    architecture: `Design System Architecture for ${projectName}`,
    implementation: `Implement Core Features for ${projectName}`,
    deployment: `Deploy and Launch ${projectName}`
  };
  return titles[phase] || `Work on ${projectName}`;
}

function getPhaseTaskDescription(phase, projectName) {
  const descriptions = {
    concept: `Research market needs, define user personas, and establish the core value proposition for ${projectName}.`,
    requirements: `Document functional and non-functional requirements, create user stories, and define acceptance criteria.`,
    design: `Create wireframes, user flows, and visual designs that deliver an excellent user experience.`,
    architecture: `Design the technical architecture, choose technology stack, and plan system components.`,
    implementation: `Build the core features, implement business logic, and ensure quality through testing.`,
    deployment: `Deploy to production, set up monitoring, and prepare for user launch.`
  };
  return descriptions[phase] || `Continue development work on ${projectName}.`;
}

function getPhaseEstimatedHours(phase) {
  const estimates = {
    concept: 16,
    requirements: 24,
    design: 32,
    architecture: 20,
    implementation: 80,
    deployment: 16
  };
  return estimates[phase] || 20;
}

function getPhaseTaskDependencies(phase) {
  const dependencies = {
    concept: [],
    requirements: [
      { id: 'CONCEPT-001', title: 'Vision and market research completed', status: 'completed' }
    ],
    design: [
      { id: 'REQ-001', title: 'Requirements documented', status: 'completed' }
    ],
    architecture: [
      { id: 'DESIGN-001', title: 'User experience designed', status: 'completed' }
    ],
    implementation: [
      { id: 'ARCH-001', title: 'Architecture designed', status: 'completed' }
    ],
    deployment: [
      { id: 'IMPL-001', title: 'Core features implemented', status: 'completed' }
    ]
  };
  return dependencies[phase] || [];
}

/**
 * Helper function to calculate overall progress
 */
function calculateOverallProgress(phases) {
  if (!phases || Object.keys(phases).length === 0) return 0;

  const phaseEntries = Object.entries(phases);
  const completedPhases = phaseEntries.filter(([_, phase]) => phase.status === 'completed').length;

  return Math.round((completedPhases / phaseEntries.length) * 100);
}

/**
 * Helper function to get next phase
 */
function getNextPhase(phases, currentPhase) {
  if (!phases || !currentPhase) return null;

  const phaseNames = Object.keys(phases);
  const currentIndex = phaseNames.indexOf(currentPhase.phase);

  if (currentIndex >= 0 && currentIndex < phaseNames.length - 1) {
    return phaseNames[currentIndex + 1];
  }

  return null;
}

/**
 * Check if current phase is ready to advance
 */
function checkPhaseReadyToAdvance(workflowState) {
  if (!workflowState?.currentPhase) return false;

  const currentPhase = workflowState.currentPhase;
  const progress = currentPhase.progress || 0;

  // Phase is ready to advance if progress is 75% or higher
  return progress >= 75;
}

/**
 * Register status command with commander
 */
export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Show current project status and progress')
    .option('-c, --compact', 'Show compact view')
    .option('-f, --focus', 'Show single-task focus display')
    .option('--no-header', 'Hide header banner')
    .option('--no-progress', 'Hide phase progress')
    .option('--no-capabilities', 'Hide AI capabilities')
    .option('--no-tasks', 'Hide task overview')
    .option('--no-dependencies', 'Hide task dependencies (focus mode)')
    .option('--no-actions', 'Hide action suggestions (focus mode)')
    .option('--no-phase', 'Hide phase context (focus mode)')
    .action(statusCommand);
}
