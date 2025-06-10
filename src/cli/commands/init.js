/**
 * Init Command
 * Initialize a new Guidant project
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { initializeProjectStructure, isProjectInitialized, updateProjectFile } from '../../file-management/project-structure.js';
import { handleError, showSuccess, showWarning } from '../utils.js';

/**
 * Init command implementation
 */
export async function initCommand(options = {}) {
  try {
    // Display banner
    const banner = figlet.textSync('Guidant', { font: 'Standard' });
    console.log(gradient(['cyan', 'magenta'])(banner));
    console.log(chalk.gray('AI Agent Workflow Orchestrator\n'));

    // Check if already initialized
    if (await isProjectInitialized()) {
      showWarning('Guidant project already initialized in this directory.');
      
      if (!options.force) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Reinitialize project? This will reset all configuration.',
          default: false
        }]);
        
        if (!proceed) {
          console.log(chalk.gray('Initialization cancelled.'));
          return;
        }
      }
    }

    // Get project details
    let projectName = options.name;
    let projectDescription = options.description;

    if (!options.yes && !projectName) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: 'My Guidant Project',
          validate: input => input.trim().length > 0 || 'Project name is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description:',
          default: 'A new project built with Guidant'
        }
      ]);
      
      projectName = answers.name;
      projectDescription = answers.description;
    }

    // Use defaults if not provided
    projectName = projectName || 'My Guidant Project';
    projectDescription = projectDescription || 'A new project built with Guidant';

    console.log(chalk.blue('\n🚀 Initializing Guidant project...\n'));

    // Initialize project structure
    await initializeProjectStructure(process.cwd());

    // Update project config with name and description
    await updateProjectFile('.guidant/project/config.json', (config) => ({
      ...config,
      name: projectName,
      description: projectDescription,
      lastModified: new Date().toISOString()
    }), process.cwd());

    showSuccess('Guidant project initialized successfully!');
    
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.gray('• Run "guidant status" to see project overview'));
    console.log(chalk.gray('• Run "guidant test-capabilities" to analyze AI capabilities'));
    console.log(chalk.gray('• Start building with systematic AI workflows\n'));

  } catch (error) {
    handleError(error, 'Init command');
  }
}

/**
 * Register init command with commander
 */
export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize a new Guidant project')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('-y, --yes', 'Skip interactive prompts and use defaults')
    .option('-f, --force', 'Force reinitialize if project already exists')
    .action(initCommand);
}
