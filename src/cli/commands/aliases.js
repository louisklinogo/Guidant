/**
 * Command Aliases and Shortcuts
 * Convenient shortcuts for common operations
 */

/**
 * Register command aliases for improved developer productivity
 */
export function registerAliases(program) {
  // Status shortcuts
  program
    .command('s')
    .alias('st')
    .description('Quick status check (alias for status)')
    .option('-c, --compact', 'Show compact view')
    .action(async (options) => {
      const { statusCommand } = await import('./status.js');
      await statusCommand(options);
    });

  // Dashboard shortcuts
  program
    .command('d')
    .alias('dash')
    .description('Quick dashboard (alias for dashboard)')
    .option('-c, --compact', 'Show compact view')
    .action(async (options) => {
      const { dashboardCommand } = await import('./dashboard.js');
      await dashboardCommand(options);
    });

  // Init shortcuts
  program
    .command('i')
    .description('Quick init (alias for init)')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <desc>', 'Project description')
    .option('--quick', 'Quick setup with defaults')
    .action(async (options) => {
      const { initCommand } = await import('./init.js');
      await initCommand(options);
    });

  // Health shortcuts
  program
    .command('h')
    .description('Quick health check (alias for health)')
    .option('-v, --verbose', 'Show detailed information')
    .action(async (options) => {
      const { healthCommand } = await import('./health.js');
      await healthCommand(options);
    });

  // Test capabilities shortcuts
  program
    .command('tc')
    .alias('caps')
    .description('Test capabilities (alias for test-capabilities)')
    .option('-v, --verbose', 'Show detailed capability analysis')
    .action(async (options) => {
      const { testCapabilitiesCommand } = await import('./test-capabilities.js');
      await testCapabilitiesCommand(options);
    });

  // Classify shortcuts
  program
    .command('c')
    .alias('class')
    .description('Classify project (alias for classify)')
    .option('-d, --description <text>', 'Project description for AI classification')
    .option('--dry-run', 'Show classification without applying workflow')
    .action(async (options) => {
      const { classifyCommand } = await import('./adaptive.js');
      await classifyCommand(options);
    });

  // Live dashboard shortcuts
  program
    .command('l')
    .alias('live')
    .description('Live dashboard (alias for live)')
    .option('-i, --interval <ms>', 'Refresh interval in milliseconds', '5000')
    .option('-c, --compact', 'Show compact view')
    .action(async (options) => {
      const { liveDashboardCommand } = await import('./dashboard.js');
      await liveDashboardCommand(options);
    });

  // Quick actions
  program
    .command('quick')
    .alias('q')
    .description('Quick actions menu')
    .action(async () => {
      await showQuickActionsMenu();
    });
}

/**
 * Show interactive quick actions menu
 */
async function showQuickActionsMenu() {
  const inquirer = await import('inquirer');
  const chalk = await import('chalk');

  console.log(chalk.default.cyan.bold('\n🚀 Guidant Quick Actions\n'));

  const choices = [
    { name: '📊 Project Status', value: 'status' },
    { name: '🎯 Dashboard', value: 'dashboard' },
    { name: '🏥 Health Check', value: 'health' },
    { name: '🤖 Test Capabilities', value: 'test-capabilities' },
    { name: '🔄 Live Dashboard', value: 'live' },
    { name: '📋 Classify Project', value: 'classify' },
    { name: '❌ Exit', value: 'exit' }
  ];

  const { action } = await inquirer.default.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices
    }
  ]);

  if (action === 'exit') {
    console.log(chalk.default.gray('👋 Goodbye!'));
    return;
  }

  // Execute the selected action
  try {
    switch (action) {
      case 'status':
        const { statusCommand } = await import('./status.js');
        await statusCommand();
        break;
      case 'dashboard':
        const { dashboardCommand } = await import('./dashboard.js');
        await dashboardCommand();
        break;
      case 'health':
        const { healthCommand } = await import('./health.js');
        await healthCommand();
        break;
      case 'test-capabilities':
        const { testCapabilitiesCommand } = await import('./test-capabilities.js');
        await testCapabilitiesCommand();
        break;
      case 'live':
        const { liveDashboardCommand } = await import('./dashboard.js');
        await liveDashboardCommand();
        break;
      case 'classify':
        const { classifyCommand } = await import('./adaptive.js');
        await classifyCommand();
        break;
    }
  } catch (error) {
    console.error(chalk.default.red('❌ Action failed:'), error.message);
  }
}

/**
 * Get list of available aliases for help
 */
export function getAvailableAliases() {
  return [
    { alias: 's, st', command: 'status', description: 'Quick status check' },
    { alias: 'd, dash', command: 'dashboard', description: 'Quick dashboard' },
    { alias: 'i', command: 'init', description: 'Quick project initialization' },
    { alias: 'h', command: 'health', description: 'Quick health check' },
    { alias: 'tc, caps', command: 'test-capabilities', description: 'Test AI capabilities' },
    { alias: 'c, class', command: 'classify', description: 'Classify project type' },
    { alias: 'l, live', command: 'live', description: 'Live dashboard with auto-refresh' },
    { alias: 'q, quick', command: 'quick', description: 'Interactive quick actions menu' }
  ];
}
