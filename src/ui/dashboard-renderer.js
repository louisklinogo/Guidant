/**
 * Dashboard Renderer
 * Professional dashboard rendering using TaskMaster-inspired UI patterns
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
import {
  displayGuidantBanner,
  createStatusBox,
  createProgressDisplay,
  createTaskDisplay,
  createActionSuggestions
} from '../cli/utils/guidant-ui.js';

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
    // Header Section - Use new TaskMaster-style UI
    if (showHeader) {
      displayGuidantBanner({
        version: projectState.config?.version,
        projectName: projectState.config?.name,
        compact: compact,
        clearScreen: false
      });

      // Workflow status using new UI system
      if (projectState.workflow?.adaptive) {
        console.log(createStatusBox(
          `Adaptive Workflow Intelligence Active • ${workflowState.currentPhase?.phase || 'Unknown Phase'} • ${projectState.workflow?.projectType || 'Standard Project'}`,
          'success',
          { title: '✨ Intelligent Orchestration' }
        ));
      } else {
        console.log(createStatusBox(
          'Legacy workflow detected - consider upgrading to adaptive intelligence',
          'warning',
          { title: '⚠️ Workflow Status' }
        ));
      }
    }

    // Progress Section - Use new TaskMaster-style progress display
    if (showProgress && workflowState.phases) {
      const overallProgress = calculateOverallProgress(workflowState.phases);
      const totalPhases = Object.keys(workflowState.phases).length;
      const completedPhases = countCompletedPhases(workflowState.phases);

      console.log(createProgressDisplay(
        workflowState.currentPhase?.phase || 'Unknown Phase',
        {
          current: completedPhases,
          total: totalPhases,
          percentage: overallProgress,
          status: overallProgress >= 100 ? 'completed' : 'in-progress',
          nextPhase: getNextPhase(workflowState.phases, workflowState.currentPhase)
        },
        { compact, showDetails: !compact }
      ));

      // Phase breakdown table (keep existing implementation for detailed view)
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
 * Get next phase in workflow
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

  // Calculate real capabilities from current environment
  const capabilities = calculateRealCapabilities(projectState);

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
 * Render tasks section using new TaskMaster-style UI
 */
async function renderTasksSection(projectState, workflowState, options = {}) {
  const { compact } = options;

  // Generate dynamic task based on current project state and workflow
  const currentTask = await generateCurrentTask(projectState, workflowState);

  // Use new TaskMaster-style task display
  console.log(createTaskDisplay(
    currentTask,
    {
      currentPhase: workflowState.currentPhase?.phase,
      totalPhases: Object.keys(workflowState.phases || {}).length,
      workflowType: projectState.workflow?.projectType
    },
    { compact, showContext: !compact }
  ));

  // Add TaskMaster-style action suggestions
  if (!compact) {
    const suggestedActions = generateContextualActions(projectState, workflowState);

    console.log(createActionSuggestions(suggestedActions, {
      title: 'Suggested Next Actions',
      maxActions: 3
    }));
  }
}

/**
 * Render error dashboard using TaskMaster-style error display
 */
function renderErrorDashboard(error) {
  const errorDisplay = createStatusBox(
    `${error.message}\n\nPlease check your project configuration and try again.`,
    'error',
    { title: 'Dashboard Error' }
  );

  console.log(errorDisplay);
  return errorDisplay;
}

/**
 * Calculate real AI capabilities from current environment
 */
function calculateRealCapabilities(projectState) {
  // Get real capabilities from stored data or calculate from environment
  const storedCapabilities = projectState.capabilities;

  if (storedCapabilities && storedCapabilities.tools && storedCapabilities.tools.length > 0) {
    // Use stored capabilities if available
    return {
      totalTools: storedCapabilities.tools.length,
      categories: calculateToolCategories(storedCapabilities.tools),
      coverage: calculateCoverage(storedCapabilities.tools)
    };
  }

  // Fallback: Estimate based on current agent's known capabilities
  const knownTools = [
    // Research tools
    'tavily-search', 'tavily-extract', 'tavily-crawl', 'tavily-map',
    'web-search', 'web-fetch', 'resolve-library-id_context7', 'get-library-docs_context7',

    // File management tools
    'str-replace-editor', 'save-file', 'view', 'remove-files',

    // Development tools
    'launch-process', 'read-process', 'write-process', 'kill-process', 'list-processes',
    'read-terminal', 'diagnostics', 'codebase-retrieval',

    // Design tools
    'render-mermaid', 'open-browser', 'remember',

    // Guidant MCP tools
    'guidant_init_project', 'guidant_get_current_task', 'guidant_report_progress',
    'guidant_advance_phase', 'guidant_save_deliverable', 'guidant_analyze_deliverable'
  ];

  return {
    totalTools: knownTools.length,
    categories: calculateToolCategories(knownTools),
    coverage: calculateCoverage(knownTools)
  };
}

/**
 * Calculate number of tool categories
 */
function calculateToolCategories(tools) {
  if (!tools || !Array.isArray(tools)) return 0;

  const categories = new Set();

  tools.forEach(tool => {
    if (typeof tool === 'string') {
      if (tool.includes('tavily') || tool.includes('web') || tool.includes('search') || tool.includes('library-docs')) {
        categories.add('research');
      } else if (tool.includes('file') || tool.includes('edit') || tool.includes('save') || tool.includes('view') || tool.includes('remove')) {
        categories.add('file_management');
      } else if (tool.includes('process') || tool.includes('terminal') || tool.includes('launch') || tool.includes('diagnostics')) {
        categories.add('development');
      } else if (tool.includes('mermaid') || tool.includes('render') || tool.includes('browser')) {
        categories.add('design');
      } else if (tool.includes('codebase') || tool.includes('retrieval')) {
        categories.add('code_analysis');
      } else if (tool.includes('guidant')) {
        categories.add('workflow_management');
      } else {
        categories.add('utility');
      }
    }
  });

  return categories.size;
}

/**
 * Calculate coverage percentage based on available tools
 */
function calculateCoverage(tools) {
  if (!tools || !Array.isArray(tools)) return 0;

  // Define essential tool categories and their requirements
  const essentialCategories = {
    research: ['tavily-search', 'web-search', 'get-library-docs'],
    file_management: ['str-replace-editor', 'save-file', 'view'],
    development: ['launch-process', 'diagnostics', 'codebase-retrieval'],
    design: ['render-mermaid'],
    workflow_management: ['guidant_init_project', 'guidant_get_current_task']
  };

  let totalCoverage = 0;
  let categoryCount = 0;

  Object.entries(essentialCategories).forEach(([category, requiredTools]) => {
    const availableInCategory = requiredTools.filter(tool =>
      tools.some(availableTool =>
        typeof availableTool === 'string' ?
          availableTool.includes(tool) || tool.includes(availableTool) :
          availableTool.name === tool
      )
    ).length;

    const categoryPercentage = (availableInCategory / requiredTools.length) * 100;
    totalCoverage += categoryPercentage;
    categoryCount++;
  });

  return Math.round(totalCoverage / categoryCount);
}

/**
 * Generate current task based on project state and workflow
 */
async function generateCurrentTask(projectState, workflowState) {
  const currentPhase = workflowState.currentPhase?.phase || 'concept';
  const projectName = projectState.config?.name || 'Final Test Project';

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
 * Generate contextual action suggestions based on project state
 */
function generateContextualActions(projectState, workflowState) {
  const currentPhase = workflowState?.currentPhase?.phase || 'concept';
  const projectName = projectState?.config?.name || 'Project';
  const progress = workflowState?.currentPhase?.progress || 0;

  const actions = [];

  // Phase-specific actions
  switch (currentPhase) {
    case 'concept':
      actions.push(
        { description: `Research market for ${projectName}`, command: 'guidant research --market-analysis' },
        { description: 'Define user personas and requirements', command: 'guidant generate --user-personas' },
        { description: 'Advance to requirements phase', command: 'guidant advance-phase' }
      );
      break;

    case 'requirements':
      actions.push(
        { description: 'Create detailed requirements document', command: 'guidant generate --requirements' },
        { description: 'Define user stories and acceptance criteria', command: 'guidant generate --user-stories' },
        { description: 'Review and advance to design phase', command: 'guidant advance-phase' }
      );
      break;

    case 'design':
      actions.push(
        { description: 'Create wireframes and user flows', command: 'guidant generate --wireframes' },
        { description: 'Design visual mockups', command: 'guidant generate --mockups' },
        { description: 'Validate design and advance phase', command: 'guidant advance-phase' }
      );
      break;

    case 'architecture':
      actions.push(
        { description: 'Design system architecture', command: 'guidant generate --architecture' },
        { description: 'Choose technology stack', command: 'guidant analyze --tech-stack' },
        { description: 'Advance to implementation phase', command: 'guidant advance-phase' }
      );
      break;

    case 'implementation':
      actions.push(
        { description: 'Continue feature development', command: 'guidant status --focus' },
        { description: 'Run tests and quality checks', command: 'guidant test --all' },
        { description: 'Review progress and plan deployment', command: 'guidant advance-phase' }
      );
      break;

    case 'deployment':
      actions.push(
        { description: 'Set up production environment', command: 'guidant deploy --setup' },
        { description: 'Deploy application', command: 'guidant deploy --production' },
        { description: 'Monitor and validate deployment', command: 'guidant monitor --health' }
      );
      break;

    default:
      actions.push(
        { description: 'Check project status', command: 'guidant status --compact' },
        { description: 'Review workflow configuration', command: 'guidant adaptive --status' },
        { description: 'Get help with next steps', command: 'guidant help' }
      );
  }

  // Add progress-based actions
  if (progress > 75) {
    actions.unshift({ description: 'Phase nearly complete - consider advancing', command: 'guidant advance-phase' });
  } else if (progress === 0) {
    actions.unshift({ description: 'Get started with current phase tasks', command: 'guidant status --focus' });
  }

  return actions.slice(0, 3); // Return top 3 most relevant actions
}
