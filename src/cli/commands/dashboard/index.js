/**
 * Dashboard Command - Main Entry Point
 * Clean architecture with single responsibility and proper error handling
 */

import chalk from 'chalk';
import { requireProject } from '../../utils.js';
import { renderProjectDashboard } from '../../../ui/dashboard-renderer.js';
import { StateManager } from './state-manager.js';
import { DashboardRendererFactory, determineRenderMode, validateRenderOptions } from './renderer-factory.js';
import { handleDashboardError } from './error-handler.js';
import { dynamicDashboardCommand } from '../dynamic-dashboard.js';

/**
 * Main Dashboard Command - Enhanced with dynamic mode support
 */
export async function dashboardCommand(options = {}) {
  try {
    // Check if dynamic mode is requested
    if (options.dynamic || options.preset || options.demo) {
      console.log(chalk.blue('🚀 Using Dynamic Layout System...'));
      return await dynamicDashboardCommand({
        ...options,
        preset: options.preset || 'quick', // Default to quick mode for dashboard command
        demo: options.demo || true // Enable demo mode by default
      });
    }

    // 1. Validate environment and options
    await requireProject();
    validateRenderOptions(options);

    // 2. Fetch state (separate concern)
    const { projectState, workflowState } = await StateManager.getAllStates();

    // 3. Determine render mode (clear logic)
    const mode = determineRenderMode(options);

    // 4. Create appropriate renderer (factory pattern)
    const rendererModule = await DashboardRendererFactory.createRenderer(mode);
    const renderFunction = DashboardRendererFactory.getRenderFunction(rendererModule, mode);

    // 5. Execute renderer (single responsibility) - NO console.log, Ink handles output
    const renderOptions = {
      compact: options.compact || false,
      refreshInterval: parseInt(options.interval) || 5000
    };

    await DashboardRendererFactory.executeRenderer(
      renderFunction,
      projectState,
      workflowState,
      renderOptions
    );

    // 6. Post-render actions (if needed)
    await showPostRenderActions(projectState, options);

  } catch (error) {
    const result = handleDashboardError(error, 'dashboard');

    if (result.shouldFallback) {
      console.log(chalk.gray('Falling back to legacy renderer...\n'));
      await fallbackToLegacyRenderer(projectState, workflowState, options);
    } else if (result.shouldExit) {
      process.exit(1);
    } else if (result.shouldContinue) {
      console.log(chalk.gray('Continuing with limited functionality...\n'));
    }
  }
}

/**
 * Live Dashboard Command - Enhanced with dynamic mode support
 */
export async function liveDashboardCommand(options = {}) {
  // Check if dynamic mode is requested
  if (options.dynamic || options.preset || options.demo) {
    console.log(chalk.blue('🚀 Using Dynamic Layout System (Live Mode)...'));
    return await dynamicDashboardCommand({
      ...options,
      preset: options.preset || 'development', // Default to development mode for live command
      demo: options.demo || true // Enable demo mode by default
    });
  }

  return dashboardCommand({ ...options, live: true });
}

/**
 * Interactive Dashboard Command - Enhanced with dynamic mode support
 */
export async function interactiveDashboardCommand(options = {}) {
  // Interactive mode always uses dynamic system
  console.log(chalk.blue('🚀 Using Dynamic Layout System (Interactive Mode)...'));
  return await dynamicDashboardCommand({
    ...options,
    preset: options.preset || 'monitoring', // Default to monitoring mode for interactive
    demo: options.demo || true // Enable demo mode by default
  });
}

/**
 * Legacy fallback - Only when absolutely necessary
 */
async function fallbackToLegacyRenderer(projectState, workflowState, options) {
  try {
    await renderProjectDashboard(projectState, workflowState, {
      showHeader: options.header !== false,
      showProgress: options.progress !== false,
      showCapabilities: options.capabilities !== false,
      showTasks: options.tasks !== false,
      compact: options.compact || false
    });
  } catch (legacyError) {
    console.log(chalk.red('❌ Legacy renderer also failed:'), legacyError.message);
    console.log(chalk.gray('Please check your project configuration and try again.'));
    process.exit(1);
  }
}

/**
 * Post-render actions - Separated concern
 */
async function showPostRenderActions(projectState, options) {
  // Only show actions for adaptive workflows
  if (projectState.workflow?.adaptive) {
    showAdaptiveQuickActions(projectState);
  } else {
    showUpgradePrompt();
  }
}

/**
 * Show adaptive workflow quick actions
 */
function showAdaptiveQuickActions(projectState) {
  console.log(chalk.cyan('\n💡 Quick Actions:'));
  console.log(chalk.gray('  guidant next-task - Get next recommended task'));
  console.log(chalk.gray('  guidant progress - Update task progress'));
  console.log(chalk.gray('  guidant analyze-gaps - Check capability gaps'));
}

/**
 * Show upgrade prompt for legacy workflows
 */
function showUpgradePrompt() {
  console.log(chalk.yellow('\n💡 Upgrade to Adaptive Intelligence:'));
  console.log(chalk.gray('  guidant classify - Analyze project and get optimal workflow'));
  console.log(chalk.gray('  guidant modes - See available workflow modes'));
  console.log(chalk.gray('    Benefits: Right-sized phases, flexible quality gates, progressive scaling'));
}

/**
 * Register dashboard commands with commander
 */
export function registerDashboardCommands(program) {
  // Main dashboard command
  program
    .command('dashboard')
    .alias('dash')
    .description('Show beautiful adaptive status dashboard')
    .option('-c, --compact', 'Show compact view')
    .option('--no-header', 'Hide header banner')
    .option('--no-progress', 'Hide phase progress')
    .option('--no-capabilities', 'Hide AI capabilities')
    .option('--no-tasks', 'Hide task overview')
    .option('-d, --dynamic', 'Use dynamic layout system')
    .option('-p, --preset <preset>', 'Layout preset (quick|development|monitoring|debug)')
    .option('--demo', 'Show rich demo with mock data')
    .action(dashboardCommand);

  // Live dashboard command
  program
    .command('live')
    .description('Live dashboard with auto-refresh')
    .option('-i, --interval <ms>', 'Refresh interval in milliseconds', '5000')
    .option('-c, --compact', 'Show compact view')
    .option('-d, --dynamic', 'Use dynamic layout system')
    .option('-p, --preset <preset>', 'Layout preset (quick|development|monitoring|debug)')
    .option('--demo', 'Show rich demo with mock data')
    .action(liveDashboardCommand);

  // Interactive dashboard command
  program
    .command('interactive')
    .alias('int')
    .description('Interactive dashboard with keyboard navigation')
    .option('-c, --compact', 'Show compact view')
    .option('-p, --preset <preset>', 'Layout preset (quick|development|monitoring|debug)')
    .option('--demo', 'Show rich demo with mock data')
    .action(interactiveDashboardCommand);
}
