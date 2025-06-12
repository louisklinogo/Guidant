/**
 * Command Registry
 * Central registry for all CLI commands with modular architecture
 */

import { registerStatusCommand } from './status.js';
import { registerHealthCommand } from './health.js';
import { registerInitCommand } from './init.js';
import { registerDashboardCommands } from './dashboard/index.js';
import { registerAdaptiveCommands } from './adaptive.js';

/**
 * Register essential commands with the CLI program
 * Streamlined to 6 core commands following TaskMaster approach
 */
export function registerAllCommands(program) {
  // Essential commands only (6 total)
  registerInitCommand(program);           // 1. guidant init
  registerStatusCommand(program);         // 2. guidant status
  registerDashboardCommands(program);     // 3. guidant dashboard
  registerHealthCommand(program);         // 4. guidant health
  registerAdaptiveCommands(program);      // 5. guidant adaptive (consolidated)
  // 6. guidant help (built-in commander help)
}

/**
 * Get list of essential commands for help
 * Streamlined to 6 core commands with clear, single purposes
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
      description: 'Show current state and next task',
      category: 'Core'
    },
    {
      name: 'dashboard',
      description: 'Single intelligent dashboard (auto-adapts)',
      category: 'Core'
    },
    {
      name: 'health',
      description: 'System health check',
      category: 'Core'
    },
    {
      name: 'adaptive',
      description: 'Workflow management (classify, modes, upgrade)',
      category: 'Workflow'
    },
    {
      name: 'help',
      description: 'Contextual help',
      category: 'Core'
    }
  ];
}
