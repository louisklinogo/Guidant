/**
 * Command Registry
 * Central registry for all CLI commands with modular architecture
 */

import { registerStatusCommand } from './status.js';
import { registerHealthCommand } from './health.js';
import { registerInitCommand } from './init.js';
import { registerTestCapabilitiesCommand } from './test-capabilities.js';
import { registerDashboardCommands } from './dashboard/index.js';
import { registerDynamicDashboardCommands } from './dynamic-dashboard.js';
import { registerAdaptiveCommands } from './adaptive.js';
import { registerAliases } from './aliases.js';
import { registerDemoCommand } from './demo-multi-pane.js';

/**
 * Register all commands with the CLI program
 */
export function registerAllCommands(program) {
  // Core commands
  registerInitCommand(program);
  registerStatusCommand(program);
  registerHealthCommand(program);

  // Dashboard commands
  registerDashboardCommands(program);
  registerDynamicDashboardCommands(program);

  // Demo command
  registerDemoCommand(program);

  // Adaptive workflow commands
  registerAdaptiveCommands(program);

  // Analysis commands
  registerTestCapabilitiesCommand(program);

  // Command aliases and shortcuts
  registerAliases(program);

  // Future commands
  // registerDeployCommand(program);
  // registerGenerateCommand(program);
  // registerReportsCommand(program);
}

/**
 * Get list of available commands for help
 */
export function getAvailableCommands() {
  return [
    {
      name: 'init',
      description: 'Initialize a new Guidant project',
      category: 'Core'
    },
    {
      name: 'status',
      description: 'Show current project status and progress',
      category: 'Core'
    },
    {
      name: 'health',
      description: 'Check project file health and integrity',
      category: 'Core'
    },
    {
      name: 'test-capabilities',
      description: 'Discover and analyze AI agent capabilities',
      category: 'Analysis'
    }
  ];
}
