/**
 * Init Command
 * Initialize a new Guidant project
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { initializeProjectStructure, isProjectInitialized, updateProjectFile } from '../../file-management/project-structure.js';
import { handleError, showSuccess, showWarning } from '../utils.js';
import { classifyProjectWithAI } from '../../workflow-intelligence/project-classifier.js';
import fs from 'fs/promises';
import path from 'path';
import { execa } from 'execa';
import {
  displayGuidantBanner,
  createStatusBox,
  createProgressiveOnboarding
} from '../utils/guidant-ui.js';

/**
 * Init command implementation
 */
export async function initCommand(options = {}) {
  try {
    // Display professional banner
    displayGuidantBanner({
      clearScreen: !options.noClear,
      compact: options.compact
    });

    // Check if already initialized
    if (await isProjectInitialized() && !options.force) {
      console.log(createStatusBox(
        'Guidant project already initialized.',
        'warning',
        { title: 'Project Exists' }
      ));
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Re-initialize? This may reset configuration.',
        default: false
      }]);
      if (!proceed) {
        console.log(createStatusBox('Initialization cancelled.', 'info'));
        return;
      }
    }

    // --- START: .env handling ---
    const projectRoot = process.cwd();
    const envPath = path.join(projectRoot, '.env');
    const envExamplePath = path.join(projectRoot, '.env.example');
    try {
      await fs.access(envPath);
    } catch (error) {
      try {
        await fs.copyFile(envExamplePath, envPath);
        console.log(createStatusBox(
          'Created .env file. Please add your API keys to it.',
          'info',
          { title: 'Environment Setup' }
        ));
      } catch (copyError) {
        console.log(createStatusBox(
          'Could not create .env file. Please copy .env.example manually.',
          'warning',
          { title: 'Setup Warning' }
        ));
      }
    }
    // --- END: .env handling ---

    // Get project details
    const answers = options.yes ? { name: options.name, description: options.description } : await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Project name:', default: options.name || 'My Guidant Project', validate: input => input.trim().length > 0 },
      { type: 'input', name: 'description', message: 'Project description:', default: options.description || 'A new project with Guidant' }
    ]);
    
    const projectName = answers.name || 'My Guidant Project';
    const projectDescription = answers.description || 'A new project with Guidant';

    console.log(createStatusBox('Initializing Guidant project...', 'progress', { title: 'Setup in Progress' }));

    // Initialize project structure
    await initializeProjectStructure(projectRoot, { force: options.force || await isProjectInitialized() });
    await updateProjectFile('.guidant/project/config.json', (config) => ({
      ...config,
      name: projectName,
      description: projectDescription,
      lastModified: new Date().toISOString()
    }), projectRoot);

    console.log(createStatusBox('Guidant project initialized successfully!', 'success', { title: 'Initialization Complete' }));

    // Enhanced onboarding
    await displayEnhancedOnboarding(projectName, projectDescription, options);

    // --- START: Dependency installation prompt ---
    if (!options.yes) {
      const { installDeps } = await inquirer.prompt([{
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies now? (runs `bun install`)',
        default: true
      }]);
      if (installDeps) {
        console.log(createStatusBox('Installing dependencies...', 'progress', { title: 'Installing Dependencies' }));
        try {
          await execa('bun', ['install'], { stdio: 'inherit' });
          console.log(createStatusBox('Dependencies installed!', 'success', { title: 'Installation Complete' }));
        } catch (installError) {
          console.log(createStatusBox('Installation failed. Please run `bun install` manually.', 'warning', { title: 'Installation Failed' }));
        }
      }
    }
    // --- END: Dependency installation prompt ---

  } catch (error) {
    handleError(error, 'Init command');
  }
}

/**
 * Display enhanced progressive onboarding with project classification
 * @param {string} projectName - Project name
 * @param {string} projectDescription - Project description
 * @param {Object} options - Command options
 */
async function displayEnhancedOnboarding(projectName, projectDescription, options = {}) {
  try {
    // Skip classification if user wants basic onboarding or used --yes flag
    if (options.skipClassification || options.basic || options.yes) {
      console.log(createProgressiveOnboarding([], { title: 'Next Steps' }));
      return;
    }

    let classification = null;
    if (projectDescription && projectDescription !== 'A new project with Guidant') {
      console.log(createStatusBox('Analyzing project to suggest workflow...', 'progress', { title: '🤖 AI Analysis' }));
      try {
        // This function needs to be defined/imported for this to work
        const aiResult = await classifyProjectWithAI(projectDescription); 
        if (aiResult.success) {
          classification = aiResult.classification;
          console.log(createStatusBox(
            `AI suggests: ${classification.type} project (${classification.complexity} complexity)`,
            'success',
            { title: '🎯 AI Classification Result' }
          ));
        } else {
          throw new Error(aiResult.error || 'AI classification returned no result.');
        }
      } catch (error) {
        // --- START: Improved error handling ---
        console.log(createStatusBox(
          'Could not get AI recommendation. Check API keys in .env and internet connection.',
          'warning',
          { title: '🤖 AI Analysis Failed' }
        ));
        // --- END: Improved error handling ---
      }
    }

    // Display project-specific or generic onboarding
    if (classification) {
      console.log(createProgressiveOnboarding([], {
        title: `${classification.type} Project Workflow`,
        projectType: classification.type,
        classification
      }));
      console.log(createStatusBox(
        `Run "guidant adaptive classify" to apply the full ${classification.type} workflow.`,
        'info',
        { title: '🚀 Next Step' }
      ));
    } else {
      console.log(createProgressiveOnboarding([], { title: 'Next Steps' }));
      console.log(createStatusBox(
        'Run "guidant adaptive classify" to get personalized workflow guidance.',
        'info',
        { title: '💡 Tip' }
      ));
    }
  } catch (error) {
    console.log(createStatusBox('Error during onboarding. Showing basic guidance.', 'warning', { title: '⚠️ Onboarding Error' }));
    console.log(createProgressiveOnboarding([], { title: 'Next Steps' }));
  }
}

/**
 * Register init command with commander
 */
export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize a new Guidant project with intelligent onboarding')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('-y, --yes', 'Skip interactive prompts and use defaults')
    .option('-f, --force', 'Force reinitialize if project already exists')
    .option('--skip-classification', 'Skip project classification and use basic onboarding')
    .option('--basic', 'Use basic onboarding without project-specific guidance')
    .action(initCommand);
}
