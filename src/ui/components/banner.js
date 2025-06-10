/**
 * Banner Component
 * Professional banner display with figlet and gradients
 */

import chalk from 'chalk';
import figlet from 'figlet';
import boxen from 'boxen';
import gradient from 'gradient-string';
import { gradients, getBoxenConfig } from '../shared/terminal-utils.js';

/**
 * Create gradient function from color array
 */
function createGradient(colors) {
  return gradient(colors);
}

/**
 * Display professional banner with project info
 */
export function renderBanner(options = {}) {
  const {
    title = 'Guidant',
    subtitle = 'AI Agent Workflow Orchestrator',
    version = null,
    projectName = null,
    gradientType = 'cool',
    clearScreen = false
  } = options;

  if (clearScreen) {
    console.clear();
  }

  // Create figlet banner
  const bannerText = figlet.textSync(title, {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });

  // Apply gradient
  const gradientColors = gradients[gradientType] || gradients.cool;
  const coloredBanner = createGradient(gradientColors)(bannerText);

  console.log(coloredBanner);

  // Add subtitle
  if (subtitle) {
    console.log(chalk.gray(subtitle));
  }

  // Add version and project info box
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

  return {
    banner: coloredBanner,
    subtitle,
    version,
    projectName
  };
}

/**
 * Render simple banner for compact displays
 */
export function renderCompactBanner(options = {}) {
  const {
    title = 'Guidant',
    version = null,
    projectName = null
  } = options;

  const titleText = chalk.cyan.bold(title);
  const versionText = version ? chalk.gray(`v${version}`) : '';
  const projectText = projectName ? chalk.gray(`• ${projectName}`) : '';

  const bannerLine = [titleText, versionText, projectText]
    .filter(Boolean)
    .join(' ');

  console.log(bannerLine);
  console.log(chalk.gray('─'.repeat(Math.min(bannerLine.length, 60))));

  return bannerLine;
}

/**
 * Render adaptive workflow status banner
 */
export function renderWorkflowBanner(workflowState = {}) {
  const { adaptive, currentPhase, projectType } = workflowState;

  if (adaptive) {
    const statusText = chalk.green('✨ Adaptive Workflow Intelligence Active');
    const phaseText = currentPhase ? chalk.cyan(`• ${currentPhase.phase}`) : '';
    const typeText = projectType ? chalk.gray(`• ${projectType}`) : '';

    const bannerLine = [statusText, phaseText, typeText]
      .filter(Boolean)
      .join(' ');

    console.log(bannerLine);
  } else {
    console.log(chalk.yellow('⚠️ Legacy workflow detected - consider upgrading to adaptive intelligence'));
  }

  console.log(); // Add spacing
}

/**
 * Render section header
 */
export function renderSectionHeader(title, options = {}) {
  const {
    color = 'cyan',
    icon = null,
    compact = false
  } = options;

  const iconText = icon ? `${icon} ` : '';
  const titleText = chalk[color].bold(`${iconText}${title}`);

  if (compact) {
    console.log(titleText);
    console.log(chalk.gray('─'.repeat(Math.min(title.length + (icon ? 2 : 0), 40))));
  } else {
    const headerBox = boxen(titleText, {
      ...getBoxenConfig('section'),
      borderColor: color
    });
    console.log(headerBox);
  }

  return titleText;
}
