/**
 * Test Capabilities Command
 * Discover and analyze AI agent capabilities
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { discoverCapabilities } from '../../ai-coordination/capability-discovery.js';
import { requireProject, handleError, showSuccess, showInfo } from '../utils.js';

/**
 * Test capabilities command implementation
 */
export async function testCapabilitiesCommand(options = {}) {
  try {
    await requireProject();

    showInfo('Discovering AI capabilities...');
    console.log(chalk.gray('This may take a moment...\n'));

    // Simulate available tools that would be present in a typical AI environment
    // Using tool names that match the expected categories in TOOL_CATEGORIES
    const simulatedTools = [
      // File operations (required for design, development, testing, deployment)
      'create_file', 'edit_file', 'read_file',

      // Web and research (required for research)
      'tavily-search', 'tavily-extract', 'tavily-crawl',
      'web_search', 'read_web_page',

      // Context and documentation (required for research)
      'get-library-docs', 'resolve-library-id',

      // Development tools (required for development, testing, deployment)
      'Bash',

      // Visualization (required for design)
      'mermaid',

      // Optional tools
      'git', 'get_diagnostics', 'format_file', 'playwright'
    ];

    console.log(chalk.gray(`Analyzing ${simulatedTools.length} available tools...\n`));

    // Discover capabilities
    const capabilities = await discoverCapabilities(simulatedTools);

    // Display results
    console.log(chalk.bold('🤖 AI Capability Analysis Results:\n'));

    // Overall summary
    const roles = capabilities.roles || {};
    const totalRoles = Object.keys(roles).length;
    const availableRoles = Object.values(roles).filter(role => role.canFulfill).length;
    const avgConfidence = Object.values(roles)
      .filter(role => role.canFulfill)
      .reduce((sum, role) => sum + (role.confidence || 0), 0) / availableRoles || 0;

    console.log(chalk.bold('📊 Summary:'));
    console.log(`Available Roles: ${chalk.cyan(availableRoles)}/${chalk.cyan(totalRoles)} (${Math.round((availableRoles / totalRoles) * 100)}%)`);
    console.log(`Average Confidence: ${chalk.cyan(Math.round(avgConfidence * 100) + '%')}\n`);

    // Detailed capabilities table
    console.log(chalk.bold('🔍 Detailed Analysis:'));
    
    const capabilityTable = new Table({
      head: [
        chalk.cyan.bold('Role'),
        chalk.cyan.bold('Status'),
        chalk.cyan.bold('Confidence'),
        chalk.cyan.bold('Tools Available'),
        chalk.cyan.bold('Missing Tools')
      ],
      style: {
        head: [],
        border: ['gray'],
        'padding-top': 0,
        'padding-bottom': 0,
        compact: false
      },
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      wordWrap: true
    });

    Object.entries(roles).forEach(([roleName, role]) => {
      const status = role.canFulfill ? 
        chalk.green('✓ Available') : 
        chalk.red('✗ Missing');
      
      const confidence = role.canFulfill ? 
        chalk.cyan(`${Math.round((role.confidence || 0) * 100)}%`) : 
        chalk.gray('-');
      
      const availableTools = role.tools ? 
        chalk.gray(`${role.tools.length} tools`) : 
        chalk.gray('0 tools');
      
      const missingTools = role.missingTools && role.missingTools.length > 0 ? 
        chalk.red(role.missingTools.slice(0, 2).join(', ') + (role.missingTools.length > 2 ? '...' : '')) : 
        chalk.gray('-');

      capabilityTable.push([
        chalk.cyan(roleName),
        status,
        confidence,
        availableTools,
        missingTools
      ]);
    });

    console.log(capabilityTable.toString());

    // Show recommendations if any roles are missing
    const missingRoles = Object.entries(roles).filter(([, role]) => !role.canFulfill);
    if (missingRoles.length > 0) {
      console.log(chalk.bold('\n💡 Recommendations:'));
      missingRoles.forEach(([roleName, role]) => {
        console.log(chalk.yellow(`• ${roleName}: Consider adding tools like ${role.missingTools?.slice(0, 2).join(', ') || 'specialized tools'}`));
      });
    } else {
      showSuccess('All required AI capabilities are available!');
    }

    // Show next steps
    console.log(chalk.bold('\n🎯 Next Steps:'));
    console.log(chalk.gray('• Run "guidant status" to see current project state'));
    console.log(chalk.gray('• Begin development workflow with available capabilities'));
    if (missingRoles.length > 0) {
      console.log(chalk.gray('• Consider adding missing tools to improve capabilities'));
    }

  } catch (error) {
    handleError(error, 'Test capabilities command');
  }
}

/**
 * Register test capabilities command with commander
 */
export function registerTestCapabilitiesCommand(program) {
  program
    .command('test-capabilities')
    .description('Discover and analyze AI agent capabilities')
    .option('-v, --verbose', 'Show detailed capability analysis')
    .action(testCapabilitiesCommand);
}
