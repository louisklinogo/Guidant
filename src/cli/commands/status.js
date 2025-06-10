/**
 * Status Command
 * Show current project status and progress with professional dashboard
 */

import { getCurrentWorkflowState } from '../../workflow-logic/workflow-engine.js';
import { getProjectState } from '../../file-management/project-structure.js';
import { renderProjectDashboard } from '../../ui/dashboard-renderer.js';
import { withProject, CommandMiddleware } from '../middleware/index.js';

/**
 * Status command implementation with middleware
 */
export const statusCommand = withProject(async (options = {}) => {
  try {
    const state = await getProjectState();
    const workflowState = await getCurrentWorkflowState();

    // Use dashboard renderer
    await renderProjectDashboard(state, workflowState, {
      compact: options.compact || false,
      showHeader: options.header !== false,
      showProgress: options.progress !== false,
      showCapabilities: options.capabilities !== false,
      showTasks: options.tasks !== false
    });
  } catch (error) {
    console.error('❌ Status command failed:', error.message);
    if (options.debug) {
      console.error(error.stack);
    }
  }
});

/**
 * Register status command with commander
 */
export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Show current project status and progress')
    .option('-c, --compact', 'Show compact view')
    .option('--no-header', 'Hide header banner')
    .option('--no-progress', 'Hide phase progress')
    .option('--no-capabilities', 'Hide AI capabilities')
    .option('--no-tasks', 'Hide task overview')
    .action(statusCommand);
}
