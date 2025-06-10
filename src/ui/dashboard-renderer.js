/**
 * Dashboard Renderer (Legacy Fallback)
 * Professional dashboard rendering using proven legacy patterns
 */

import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { renderBanner, renderCompactBanner, renderWorkflowBanner, renderSectionHeader } from './components/banner.js';
import { createProgressBar, renderProgressSection } from './components/progress-bar.js';
import { 
  getTerminalWidth, 
  getAvailableWidth, 
  calculateColumnWidth,
  getStatusWithColor,
  getPriorityWithColor,
  getBoxenConfig,
  getTableConfig,
  truncate
} from './shared/terminal-utils.js';

/**
 * Main dashboard renderer function
 */
export async function renderProjectDashboard(projectState, workflowState, options = {}) {
  const {
    showHeader = true,
    showProgress = true,
    showCapabilities = true,
    showTasks = true,
    compact = false
  } = options;

  let output = '';

  try {
    // Header Section
    if (showHeader) {
      if (compact) {
        renderCompactBanner({
          title: 'Guidant',
          version: projectState.config?.version,
          projectName: projectState.config?.name
        });
      } else {
        renderBanner({
          title: 'Guidant',
          subtitle: 'AI Agent Workflow Orchestrator',
          version: projectState.config?.version,
          projectName: projectState.config?.name,
          clearScreen: false
        });
      }

      // Workflow status banner
      renderWorkflowBanner({
        adaptive: projectState.workflow?.adaptive,
        currentPhase: workflowState.currentPhase,
        projectType: projectState.workflow?.projectType
      });
    }

    // Progress Section
    if (showProgress && workflowState.phases) {
      renderProgressSection('📊 Project Progress', {
        percent: calculateOverallProgress(workflowState.phases),
        total: Object.keys(workflowState.phases).length,
        completed: countCompletedPhases(workflowState.phases)
      }, { compact });

      // Phase breakdown
      if (!compact) {
        renderPhaseBreakdown(workflowState.phases, workflowState.currentPhase);
      }
    }

    // Capabilities Section
    if (showCapabilities) {
      renderCapabilitiesSection(projectState, { compact });
    }

    // Tasks Section
    if (showTasks) {
      await renderTasksSection(projectState, workflowState, { compact });
    }

    return output;

  } catch (error) {
    console.error(chalk.red('❌ Dashboard rendering error:'), error.message);
    return renderErrorDashboard(error);
  }
}

/**
 * Calculate overall project progress
 */
function calculateOverallProgress(phases) {
  if (!phases || Object.keys(phases).length === 0) return 0;

  const phaseEntries = Object.entries(phases);
  const completedPhases = phaseEntries.filter(([_, phase]) => phase.completed).length;
  
  return Math.round((completedPhases / phaseEntries.length) * 100);
}

/**
 * Count completed phases
 */
function countCompletedPhases(phases) {
  if (!phases) return 0;
  return Object.values(phases).filter(phase => phase.completed).length;
}

/**
 * Render phase breakdown
 */
function renderPhaseBreakdown(phases, currentPhase) {
  renderSectionHeader('Phase Progress', { icon: '🔄', compact: true });

  const terminalWidth = getTerminalWidth();
  const nameWidth = calculateColumnWidth(30, terminalWidth);
  const statusWidth = calculateColumnWidth(20, terminalWidth);
  const progressWidth = calculateColumnWidth(50, terminalWidth);

  const table = new Table({
    ...getTableConfig([nameWidth, statusWidth, progressWidth]),
    head: [
      chalk.cyan.bold('Phase'),
      chalk.cyan.bold('Status'),
      chalk.cyan.bold('Progress')
    ]
  });

  Object.entries(phases).forEach(([phaseName, phase]) => {
    const isCurrent = currentPhase?.phase === phaseName;
    const status = phase.completed ? 'completed' : (isCurrent ? 'in-progress' : 'pending');
    const progress = phase.progress || 0;

    table.push([
      isCurrent ? chalk.yellow.bold(`► ${phaseName}`) : phaseName,
      getStatusWithColor(status, true),
      createProgressBar(progress, 20)
    ]);
  });

  console.log(table.toString());
  console.log();
}

/**
 * Render capabilities section
 */
function renderCapabilitiesSection(projectState, options = {}) {
  const { compact } = options;

  renderSectionHeader('AI Capabilities', { icon: '🤖', compact });

  // Mock capabilities data - replace with actual data from projectState
  const capabilities = projectState.ai?.capabilities || {
    totalTools: 16,
    categories: 5,
    coverage: 85
  };

  if (compact) {
    console.log(`Tools: ${capabilities.totalTools} • Categories: ${capabilities.categories} • Coverage: ${capabilities.coverage}%`);
  } else {
    const capabilityBox = boxen(
      `${chalk.cyan('Available Tools:')} ${capabilities.totalTools}\n` +
      `${chalk.cyan('Categories:')} ${capabilities.categories}\n` +
      `${chalk.cyan('Coverage:')} ${createProgressBar(capabilities.coverage, 20)}`,
      {
        ...getBoxenConfig('section'),
        borderColor: 'blue'
      }
    );
    console.log(capabilityBox);
  }

  console.log();
}

/**
 * Render tasks section
 */
async function renderTasksSection(projectState, workflowState, options = {}) {
  const { compact } = options;

  renderSectionHeader('Current Tasks', { icon: '📋', compact });

  // Mock task data - replace with actual task generation
  const currentTask = {
    id: 'TASK-001',
    title: 'Implement Professional Status Dashboard',
    priority: 'high',
    status: 'in-progress',
    phase: workflowState.currentPhase?.phase || 'implementation'
  };

  if (compact) {
    console.log(`${chalk.yellow('►')} ${currentTask.title} ${getPriorityWithColor(currentTask.priority)}`);
  } else {
    const taskBox = boxen(
      `${chalk.cyan.bold('Current Task:')}\n\n` +
      `${chalk.white.bold(currentTask.title)}\n` +
      `${chalk.gray('ID:')} ${currentTask.id}\n` +
      `${chalk.gray('Priority:')} ${getPriorityWithColor(currentTask.priority)}\n` +
      `${chalk.gray('Status:')} ${getStatusWithColor(currentTask.status)}\n` +
      `${chalk.gray('Phase:')} ${currentTask.phase}`,
      {
        ...getBoxenConfig('section'),
        borderColor: 'green'
      }
    );
    console.log(taskBox);
  }

  console.log();
}

/**
 * Render error dashboard
 */
function renderErrorDashboard(error) {
  const errorBox = boxen(
    chalk.red.bold('Dashboard Error\n\n') +
    chalk.white(`${error.message}\n\n`) +
    chalk.gray('Please check your project configuration and try again.'),
    {
      ...getBoxenConfig('section'),
      borderColor: 'red'
    }
  );

  console.log(errorBox);
  return errorBox;
}
