/**
 * Guidant UI System
 * TaskMaster-inspired boxen-based visual hierarchy for professional CLI output
 * 
 * Implements consistent visual patterns with color-coded hierarchy:
 * - Blue: Information and status
 * - Green: Success and completion
 * - Yellow: Warnings and attention
 * - Red: Errors and critical issues
 * - Cyan: Headers and navigation
 */

import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { getBoxenConfig, getTerminalWidth } from '../../ui/shared/terminal-utils.js';

/**
 * Display professional Guidant banner with TaskMaster-style presentation
 * @param {Object} options - Banner configuration options
 */
export function displayGuidantBanner(options = {}) {
  const {
    title = 'Guidant',
    subtitle = 'AI Agent Workflow Orchestrator',
    version = null,
    projectName = null,
    clearScreen = false,
    compact = false
  } = options;

  if (clearScreen) {
    console.clear();
  }

  if (compact) {
    // Compact banner for status displays
    const titleText = chalk.cyan.bold(title);
    const versionText = version ? chalk.gray(`v${version}`) : '';
    const projectText = projectName ? chalk.gray(`• ${projectName}`) : '';
    
    const bannerLine = [titleText, versionText, projectText]
      .filter(Boolean)
      .join(' ');
    
    console.log(bannerLine);
    console.log(chalk.gray('─'.repeat(Math.min(bannerLine.length, 60))));
  } else {
    // Full banner with figlet and gradient
    const bannerText = figlet.textSync(title, { font: 'Standard' });
    const coloredBanner = gradient(['cyan', 'magenta'])(bannerText);
    
    console.log(coloredBanner);
    
    if (subtitle) {
      console.log(chalk.gray(subtitle));
    }
    
    // Project info box (TaskMaster style)
    if (version || projectName) {
      const infoLines = [];
      if (version) {
        infoLines.push(`${chalk.bold('Version:')} ${version}`);
      }
      if (projectName) {
        infoLines.push(`${chalk.bold('Project:')} ${projectName}`);
      }
      
      const infoBox = boxen(
        chalk.white(infoLines.join('   ')),
        {
          ...getBoxenConfig('header'),
          borderColor: 'cyan'
        }
      );
      
      console.log(infoBox);
    }
  }
  
  console.log(); // Add spacing
}

/**
 * Create status box with TaskMaster-style color coding
 * @param {string} message - Status message to display
 * @param {string} type - Status type (info, success, warning, error)
 * @param {Object} options - Additional options
 */
export function createStatusBox(message, type = 'info', options = {}) {
  const {
    title = null,
    compact = false,
    width = null
  } = options;

  // Color mapping following TaskMaster patterns
  const typeConfig = {
    info: { color: 'blue', icon: 'ℹ️', textColor: chalk.white },
    success: { color: 'green', icon: '✅', textColor: chalk.white },
    warning: { color: 'yellow', icon: '⚠️', textColor: chalk.black },
    error: { color: 'red', icon: '❌', textColor: chalk.white },
    progress: { color: 'cyan', icon: '🔄', textColor: chalk.white }
  };

  const config = typeConfig[type] || typeConfig.info;
  
  let content = message;
  if (title) {
    content = `${chalk.bold(title)}\n\n${message}`;
  }
  
  // Add icon to content
  const iconContent = `${config.icon} ${content}`;
  
  const boxConfig = {
    ...getBoxenConfig(compact ? 'compact' : 'section'),
    borderColor: config.color
  };
  
  if (width) {
    boxConfig.width = Math.min(width, getTerminalWidth() - 4);
  }
  
  return boxen(config.textColor(iconContent), boxConfig);
}

/**
 * Create progress display with workflow phase context
 * @param {string} phase - Current workflow phase
 * @param {Object} progress - Progress data
 * @param {Object} options - Display options
 */
export function createProgressDisplay(phase, progress = {}, options = {}) {
  const {
    compact = false,
    showDetails = true
  } = options;

  const {
    current = 0,
    total = 0,
    percentage = 0,
    status = 'in-progress',
    nextPhase = null
  } = progress;

  // Create progress bar
  const barLength = compact ? 20 : 30;
  const filled = Math.round((percentage * barLength) / 100);
  const empty = barLength - filled;
  
  let barColor;
  if (percentage < 25) barColor = chalk.red;
  else if (percentage < 50) barColor = chalk.hex('#FFA500');
  else if (percentage < 75) barColor = chalk.yellow;
  else barColor = chalk.green;
  
  const progressBar = `${barColor('█'.repeat(filled))}${chalk.gray('░'.repeat(empty))} ${barColor(`${percentage.toFixed(0)}%`)}`;
  
  let content = `${chalk.cyan.bold('Current Phase:')} ${chalk.white(phase)}\n`;
  content += `${chalk.gray('Progress:')} ${progressBar}`;
  
  if (showDetails && !compact) {
    if (current && total) {
      content += `\n${chalk.gray('Tasks:')} ${current}/${total} completed`;
    }
    if (nextPhase) {
      content += `\n${chalk.gray('Next Phase:')} ${nextPhase}`;
    }
  }
  
  return boxen(content, {
    ...getBoxenConfig(compact ? 'compact' : 'section'),
    borderColor: percentage >= 100 ? 'green' : 'cyan'
  });
}

/**
 * Create action suggestions box (TaskMaster's excellent pattern)
 * @param {Array} actions - Array of suggested actions
 * @param {Object} options - Display options
 */
export function createActionSuggestions(actions = [], options = {}) {
  const {
    title = 'Suggested Actions',
    compact = false,
    maxActions = compact ? 3 : 5
  } = options;

  if (!actions.length) {
    return createStatusBox('No actions available at this time.', 'info', { compact });
  }

  const displayActions = actions.slice(0, maxActions);
  
  let content = `${chalk.cyan.bold(title)}:\n\n`;
  
  displayActions.forEach((action, index) => {
    const number = chalk.cyan(`${index + 1}.`);
    const command = action.command ? chalk.yellow(action.command) : '';
    const description = action.description || action.title || action;
    
    if (typeof action === 'string') {
      content += `${number} ${description}\n`;
    } else {
      content += `${number} ${description}`;
      if (command) {
        content += `\n   ${chalk.gray('Command:')} ${command}`;
      }
      content += '\n';
    }
  });
  
  // Remove trailing newline
  content = content.trim();
  
  return boxen(content, {
    ...getBoxenConfig(compact ? 'compact' : 'section'),
    borderColor: 'green'
  });
}

/**
 * Create task display with workflow context
 * @param {Object} task - Current task data
 * @param {Object} context - Workflow context
 * @param {Object} options - Display options
 */
export function createTaskDisplay(task, context = {}, options = {}) {
  const {
    compact = false,
    showContext = true
  } = options;

  if (!task) {
    return createStatusBox('No current task available.', 'info', { compact });
  }

  const {
    title = 'Untitled Task',
    id = null,
    priority = 'medium',
    status = 'pending',
    phase = null,
    description = null
  } = task;

  const {
    currentPhase = null,
    totalPhases = null,
    workflowType = null
  } = context;

  // Status color mapping
  const statusColors = {
    pending: chalk.yellow,
    'in-progress': chalk.hex('#FFA500'),
    completed: chalk.green,
    blocked: chalk.red,
    review: chalk.magenta
  };

  const priorityColors = {
    low: chalk.gray,
    medium: chalk.yellow,
    high: chalk.hex('#FFA500'),
    critical: chalk.red
  };

  let content = `${chalk.cyan.bold('Current Task:')}\n\n`;
  content += `${chalk.white.bold(title)}\n`;
  
  if (id) {
    content += `${chalk.gray('ID:')} ${id}\n`;
  }
  
  const statusColor = statusColors[status] || chalk.gray;
  const priorityColor = priorityColors[priority] || chalk.gray;
  
  content += `${chalk.gray('Status:')} ${statusColor(status)}\n`;
  content += `${chalk.gray('Priority:')} ${priorityColor(priority)}`;
  
  if (showContext && !compact) {
    if (phase || currentPhase) {
      content += `\n${chalk.gray('Phase:')} ${phase || currentPhase}`;
    }
    if (workflowType) {
      content += `\n${chalk.gray('Workflow:')} ${workflowType}`;
    }
    if (description) {
      content += `\n\n${chalk.gray('Description:')}\n${description}`;
    }
  }
  
  return boxen(content, {
    ...getBoxenConfig(compact ? 'compact' : 'section'),
    borderColor: status === 'completed' ? 'green' : 'cyan'
  });
}

/**
 * Create TaskMaster-style 10-step progressive onboarding display
 * @param {Array} steps - Array of onboarding steps
 * @param {Object} options - Display options
 */
export function createProgressiveOnboarding(steps = [], options = {}) {
  const {
    title = 'Things you should do next',
    compact = false,
    projectType = null,
    classification = null
  } = options;

  if (!steps.length) {
    // Generate project-type specific onboarding steps
    steps = generateProjectSpecificSteps(projectType, classification);
  }

  let content = `${chalk.cyan.bold(title)}:\n\n`;

  steps.forEach((step, index) => {
    const number = chalk.white(`${index + 1}.`);
    const stepText = typeof step === 'string' ? step : step.description || step.title;
    const command = (typeof step === 'object' && step.command) ? chalk.yellow(step.command) : null;

    content += `${number} ${chalk.yellow(stepText)}`;
    if (command && !compact) {
      content += `\n   ${chalk.gray('Command:')} ${command}`;
    }
    content += '\n';
  });

  return boxen(content.trim(), {
    ...getBoxenConfig('section'),
    borderColor: 'yellow',
    padding: { top: 0, bottom: 0, left: 1, right: 1 }
  });
}

/**
 * Generate project-type specific onboarding steps
 * @param {string} projectType - Project type from classification
 * @param {Object} classification - Full classification result
 */
function generateProjectSpecificSteps(projectType, classification) {
  // Base steps that apply to all projects
  const baseSteps = [
    { description: 'Run "guidant status" to see project overview', command: 'guidant status' },
    { description: 'Analyze AI agent capabilities', command: 'guidant test-capabilities' }
  ];

  // Project-type specific workflow steps
  const projectSpecificSteps = getProjectTypeSteps(projectType, classification);

  // Common final steps
  const finalSteps = [
    { description: 'Iterate based on feedback and learnings' },
    { description: 'Ship it!' }
  ];

  return [...baseSteps, ...projectSpecificSteps, ...finalSteps];
}

/**
 * Get project-type specific workflow steps
 * @param {string} projectType - Project type (prototype, feature, product, research, script)
 * @param {Object} classification - Classification result with complexity and phases
 */
function getProjectTypeSteps(projectType, classification) {
  const complexity = classification?.complexity || 'standard';
  const phases = classification?.projectType?.phases || [];

  const stepTemplates = {
    prototype: [
      { description: 'Define core concept and MVP scope', command: 'guidant adaptive classify' },
      { description: 'Create rapid prototype structure' },
      { description: 'Build and test core functionality' },
      { description: 'Validate with users and stakeholders' },
      { description: 'Document learnings and next steps' },
      { description: 'Prepare for potential scaling' }
    ],

    feature: [
      { description: 'Classify project for optimal workflow', command: 'guidant adaptive classify' },
      { description: 'Analyze existing codebase integration points' },
      { description: 'Design feature architecture and interfaces' },
      { description: 'Implement feature with comprehensive testing' },
      { description: 'Integrate with existing system workflows' },
      { description: 'Deploy and monitor feature performance' }
    ],

    product: [
      { description: 'Classify project for enterprise workflow', command: 'guidant adaptive classify' },
      { description: 'Create comprehensive requirements document' },
      { description: 'Design system architecture and scalability plan' },
      { description: 'Implement core product functionality' },
      { description: 'Build comprehensive testing and quality assurance' },
      { description: 'Prepare production deployment and monitoring' }
    ],

    research: [
      { description: 'Set up research methodology and workflow', command: 'guidant adaptive classify' },
      { description: 'Define research questions and success criteria' },
      { description: 'Collect and organize research data' },
      { description: 'Analyze findings and generate insights' },
      { description: 'Document research results and recommendations' },
      { description: 'Present findings to stakeholders' }
    ],

    script: [
      { description: 'Define automation requirements and scope', command: 'guidant adaptive classify' },
      { description: 'Design script architecture and error handling' },
      { description: 'Implement core automation logic' },
      { description: 'Test script with various scenarios and edge cases' },
      { description: 'Document usage and deployment instructions' },
      { description: 'Deploy and schedule automation' }
    ]
  };

  // Get base steps for project type
  let steps = stepTemplates[projectType] || stepTemplates.feature;

  // Adjust steps based on complexity
  if (complexity === 'simple') {
    // Simplify steps for basic projects
    steps = steps.map(step => ({
      ...step,
      description: step.description.replace('comprehensive', 'basic').replace('enterprise', 'standard')
    }));
  } else if (complexity === 'enterprise') {
    // Add additional rigor for enterprise projects
    const enterpriseSteps = [
      { description: 'Conduct security and compliance review' },
      { description: 'Implement enterprise monitoring and logging' }
    ];
    steps = [...steps.slice(0, -2), ...enterpriseSteps, ...steps.slice(-2)];
  }

  return steps;
}
