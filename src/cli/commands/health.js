/**
 * Health Command
 * Check project file health and integrity
 */

import chalk from 'chalk';
import { checkProjectHealth, repairProjectFiles } from '../../file-management/project-structure.js';
import { requireProject, handleError, showSuccess, showWarning } from '../utils.js';

/**
 * Health command implementation
 */
export async function healthCommand(options = {}) {
  try {
    console.log(chalk.blue('🏥 Checking project health...\n'));

    await requireProject();

    const health = await checkProjectHealth();

    // Display overall status
    const statusColor = health.overall === 'healthy' ? 'green' :
                       health.overall === 'warning' ? 'yellow' : 'red';
    const statusIcon = health.overall === 'healthy' ? '✅' :
                      health.overall === 'warning' ? '⚠️' : '❌';

    console.log(`${statusIcon} Overall Status: ${chalk[statusColor](health.overall.toUpperCase())}\n`);

    // Display file health
    console.log(chalk.bold('📁 File Health:'));
    Object.entries(health.files).forEach(([file, status]) => {
      const statusIcon = status.exists ? 
        (status.isValid ? chalk.green('✓') : chalk.red('✗')) : 
        chalk.yellow('?');
      const size = status.size ? `${Math.round(status.size / 1024)}KB` : '-';
      const backup = status.hasBackup ? chalk.green('✓') : chalk.gray('-');
      
      console.log(`  ${statusIcon} ${chalk.cyan(file)} ${chalk.gray(`(${size})`)} ${backup ? 'Backup: ' + backup : ''}`);
    });

    // Show issues if any
    if (health.issues.length > 0) {
      console.log(chalk.bold('\n⚠️  Issues Found:'));
      health.issues.forEach(issue => {
        console.log(chalk.yellow(`• ${issue.message || issue}`));
      });
    }

    // Repair if requested
    if (options.repair && health.issues.length > 0) {
      console.log(chalk.blue('\n🔧 Attempting repairs...'));
      const repairResult = await repairProjectFiles();
      
      if (repairResult.successful > 0) {
        showSuccess('Repairs completed successfully');
        if (repairResult.details.length > 0) {
          console.log(chalk.gray('Repair details:'));
          repairResult.details.forEach(detail => {
            const icon = detail.success ? chalk.green('✓') : chalk.red('✗');
            console.log(chalk.gray(`  ${icon} ${detail.file}: ${detail.message}`));
          });
        }
      } else {
        showWarning('No repairs were successful');
      }
    }

  } catch (error) {
    handleError(error, 'Health command');
  }
}

/**
 * Register health command with commander
 */
export function registerHealthCommand(program) {
  program
    .command('health')
    .description('Check project file health and integrity')
    .option('-r, --repair', 'Attempt to repair corrupted files from backups')
    .action(healthCommand);
}
