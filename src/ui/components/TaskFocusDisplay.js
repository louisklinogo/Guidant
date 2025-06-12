/**
 * TaskFocusDisplay Component
 * Implements TaskMaster's single-task focus philosophy with Guidant's workflow intelligence
 * 
 * SOLID Principles:
 * - SRP: Only handles task presentation and focus display
 * - OCP: Extensible for different task types and display modes
 * - ISP: Shows only relevant information for current context
 * - DIP: Depends on display abstractions, not implementations
 */

import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import {
  createStatusBox,
  createProgressDisplay,
  createActionSuggestions
} from '../../cli/utils/guidant-ui.js';
import {
  getTerminalWidth,
  getAvailableWidth,
  calculateColumnWidth,
  getStatusWithColor,
  getPriorityWithColor,
  getTableConfig,
  getBoxenConfig,
  truncate
} from '../shared/terminal-utils.js';

/**
 * Main TaskFocusDisplay function
 * Creates a comprehensive single-task focus display with workflow context
 * 
 * @param {Object} task - Current task data
 * @param {Object} workflowContext - Workflow and phase context
 * @param {Object} options - Display options
 * @returns {string} Formatted display output
 */
export function createTaskFocusDisplay(task, workflowContext = {}, options = {}) {
  const {
    compact = false,
    showDependencies = true,
    showActions = true,
    showPhaseContext = true,
    maxWidth = getTerminalWidth()
  } = options;

  if (!task) {
    return createStatusBox(
      'No current task available.\n\nUse "guidant init" to start a new project or check your workflow status.',
      'info',
      { title: '📋 Task Focus', compact }
    );
  }

  let output = '';

  try {
    // 1. Task Header - Professional TaskMaster-style banner
    output += renderTaskHeader(task, workflowContext, { compact, maxWidth });

    // 2. Task Details - Core information in focused layout
    output += renderTaskDetails(task, workflowContext, { compact, maxWidth });

    // 3. Workflow Context - Phase and progress information
    if (showPhaseContext && !compact) {
      output += renderWorkflowContext(task, workflowContext, { maxWidth });
    }

    // 4. Dependencies - Visual dependency status
    if (showDependencies && task.dependencies && task.dependencies.length > 0) {
      output += renderDependencyStatus(task.dependencies, { compact, maxWidth });
    }

    // 5. Action Suggestions - TaskMaster-style next steps
    if (showActions && !compact) {
      output += renderActionSuggestions(task, workflowContext, { maxWidth });
    }

    // 6. Phase Transition Guidance - When ready to advance
    if (workflowContext.readyToAdvance && !compact) {
      output += renderPhaseTransitionGuidance(workflowContext, { maxWidth });
    }

    return output;

  } catch (error) {
    return createStatusBox(
      `Error displaying task: ${error.message}\n\nPlease check your task data and try again.`,
      'error',
      { title: '❌ Display Error', compact }
    );
  }
}

/**
 * Render task header with professional banner
 */
function renderTaskHeader(task, workflowContext, options = {}) {
  const { compact, maxWidth } = options;
  const { title, id, priority, status } = task;
  const { currentPhase } = workflowContext;

  // Create main title with task ID and priority
  const headerTitle = `${title}`;
  const headerSubtitle = `${id ? `ID: ${id}` : ''} • Priority: ${priority?.toUpperCase() || 'MEDIUM'} • Status: ${status?.toUpperCase() || 'PENDING'}`;
  
  // Add phase context if available
  const phaseInfo = currentPhase ? ` • Phase: ${currentPhase}` : '';
  const fullSubtitle = headerSubtitle + phaseInfo;

  // Use status-based color for border
  const borderColor = getTaskBorderColor(status);
  
  if (compact) {
    return boxen(
      `${chalk.white.bold(headerTitle)}\n${chalk.gray(fullSubtitle)}`,
      {
        ...getBoxenConfig('compact'),
        borderColor,
        title: '📋 Current Task',
        titleAlignment: 'left'
      }
    ) + '\n\n';
  }

  return boxen(
    `${chalk.white.bold(headerTitle)}\n\n${chalk.gray(fullSubtitle)}`,
    {
      ...getBoxenConfig('banner'),
      borderColor,
      title: '📋 Task Focus',
      titleAlignment: 'center'
    }
  ) + '\n\n';
}

/**
 * Render detailed task information
 */
function renderTaskDetails(task, workflowContext, options = {}) {
  const { compact, maxWidth } = options;
  const { description, progress, estimatedHours, actualHours, blockers } = task;

  if (!description && !progress && !estimatedHours && !blockers) {
    return '';
  }

  let content = '';

  // Description
  if (description) {
    content += `${chalk.cyan('Description:')}\n${description}\n\n`;
  }

  // Progress information
  if (progress !== undefined) {
    const progressBar = createProgressBar(progress, compact ? 20 : 30);
    content += `${chalk.cyan('Progress:')} ${progressBar} ${progress}%\n`;
  }

  // Time tracking
  if (estimatedHours || actualHours) {
    const estimated = estimatedHours ? `${estimatedHours}h estimated` : '';
    const actual = actualHours ? `${actualHours}h spent` : '';
    const timeInfo = [estimated, actual].filter(Boolean).join(' • ');
    if (timeInfo) {
      content += `${chalk.cyan('Time:')} ${timeInfo}\n`;
    }
  }

  // Blockers
  if (blockers && blockers.length > 0) {
    content += `\n${chalk.red.bold('⚠️ Blockers:')}\n`;
    blockers.forEach((blocker, index) => {
      content += `${chalk.red('•')} ${blocker}\n`;
    });
  }

  if (content) {
    return boxen(content.trim(), {
      ...getBoxenConfig(compact ? 'compact' : 'section'),
      borderColor: 'blue',
      title: 'Task Details'
    }) + '\n\n';
  }

  return '';
}

/**
 * Render workflow context information
 */
function renderWorkflowContext(task, workflowContext, options = {}) {
  const { maxWidth } = options;
  const { 
    currentPhase, 
    totalPhases, 
    workflowType, 
    overallProgress,
    nextPhase 
  } = workflowContext;

  if (!currentPhase && !workflowType) {
    return '';
  }

  let content = '';

  // Current phase and workflow type
  if (currentPhase) {
    content += `${chalk.cyan('Current Phase:')} ${currentPhase}\n`;
  }
  if (workflowType) {
    content += `${chalk.cyan('Workflow Type:')} ${workflowType}\n`;
  }

  // Overall progress
  if (overallProgress !== undefined && totalPhases) {
    const progressBar = createProgressBar(overallProgress, 25);
    content += `${chalk.cyan('Overall Progress:')} ${progressBar} ${overallProgress}%\n`;
  }

  // Next phase
  if (nextPhase) {
    content += `${chalk.cyan('Next Phase:')} ${nextPhase}\n`;
  }

  if (content) {
    return boxen(content.trim(), {
      ...getBoxenConfig('section'),
      borderColor: 'cyan',
      title: '🔄 Workflow Context'
    }) + '\n\n';
  }

  return '';
}

/**
 * Render dependency status
 */
function renderDependencyStatus(dependencies, options = {}) {
  const { compact, maxWidth } = options;

  if (!dependencies || dependencies.length === 0) {
    return '';
  }

  let content = '';

  dependencies.forEach((dep, index) => {
    const statusIcon = getStatusIcon(dep.status);
    const statusColor = getStatusColor(dep.status);
    const depTitle = truncate(dep.title || dep.id, compact ? 40 : 60);
    
    content += `${chalk[statusColor](statusIcon)} ${depTitle}`;
    if (dep.status === 'blocked') {
      content += ` ${chalk.red('🚫')}`;
    }
    content += '\n';
  });

  return boxen(content.trim(), {
    ...getBoxenConfig(compact ? 'compact' : 'section'),
    borderColor: 'yellow',
    title: '🔗 Dependencies'
  }) + '\n\n';
}

/**
 * Render action suggestions
 */
function renderActionSuggestions(task, workflowContext, options = {}) {
  const { maxWidth } = options;

  // Generate context-aware action suggestions
  const actions = generateContextualActions(task, workflowContext);

  if (actions.length === 0) {
    return '';
  }

  return createActionSuggestions(actions, {
    title: 'Suggested Next Actions',
    maxActions: 4,
    compact: false
  }) + '\n\n';
}

/**
 * Render phase transition guidance
 */
function renderPhaseTransitionGuidance(workflowContext, options = {}) {
  const { currentPhase, nextPhase } = workflowContext;

  if (!nextPhase) {
    return '';
  }

  const content = `Phase "${currentPhase}" is complete!\n\n` +
    `${chalk.green('✅')} All deliverables completed\n` +
    `${chalk.green('✅')} Quality gates passed\n` +
    `${chalk.cyan('➡️')} Ready to advance to "${nextPhase}"\n\n` +
    `Run: ${chalk.yellow('guidant advance-phase')}`;

  return boxen(content, {
    ...getBoxenConfig('section'),
    borderColor: 'green',
    title: '🚀 Phase Transition Ready'
  }) + '\n\n';
}

/**
 * Helper Functions
 */

function getTaskBorderColor(status) {
  const colors = {
    'completed': 'green',
    'in-progress': 'cyan',
    'blocked': 'red',
    'pending': 'yellow'
  };
  return colors[status?.toLowerCase()] || 'gray';
}

function getStatusIcon(status) {
  const icons = {
    'completed': '✅',
    'in-progress': '🔄',
    'blocked': '🚫',
    'pending': '⏳'
  };
  return icons[status?.toLowerCase()] || '📋';
}

function getStatusColor(status) {
  const colors = {
    'completed': 'green',
    'in-progress': 'cyan',
    'blocked': 'red',
    'pending': 'yellow'
  };
  return colors[status?.toLowerCase()] || 'gray';
}

function createProgressBar(progress, width = 20) {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function generateContextualActions(task, workflowContext) {
  const actions = [];
  const { status, phase } = task;
  const { currentPhase, readyToAdvance } = workflowContext;

  // Status-based actions
  if (status === 'pending') {
    actions.push({
      description: 'Start working on this task',
      command: 'guidant progress --status=in-progress'
    });
  } else if (status === 'in-progress') {
    actions.push({
      description: 'Report progress on current work',
      command: 'guidant progress --update'
    });
    actions.push({
      description: 'Mark task as completed',
      command: 'guidant progress --status=completed'
    });
  }

  // Phase-based actions
  if (readyToAdvance) {
    actions.push({
      description: 'Advance to next phase',
      command: 'guidant advance-phase'
    });
  } else {
    actions.push({
      description: 'Check phase completion status',
      command: 'guidant status --phase'
    });
  }

  // General actions
  actions.push({
    description: 'View detailed project status',
    command: 'guidant status'
  });

  return actions.slice(0, 4); // Limit to 4 actions
}
