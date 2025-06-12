/**
 * Init Command
 * Initialize a new Guidant project
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { initializeProjectStructure, isProjectInitialized, updateProjectFile } from '../../file-management/project-structure.js';
import { handleError, showSuccess, showWarning } from '../utils.js';
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
    // Display professional banner using new TaskMaster-style UI system
    displayGuidantBanner({
      clearScreen: !options.noClear,
      compact: options.compact
    });

    // Check if already initialized
    if (await isProjectInitialized()) {
      console.log(createStatusBox(
        'Guidant project already initialized in this directory.',
        'warning',
        { title: 'Project Already Exists' }
      ));

      if (!options.force) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Reinitialize project? This will reset all configuration.',
          default: false
        }]);

        if (!proceed) {
          console.log(createStatusBox('Initialization cancelled.', 'info'));
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

    console.log(createStatusBox(
      'Initializing Guidant project structure and configuration...',
      'progress',
      { title: 'Setup in Progress' }
    ));

    // Initialize project structure with force option
    await initializeProjectStructure(process.cwd(), {
      force: options.force || (await isProjectInitialized())
    });

    // Update project config with name and description
    await updateProjectFile('.guidant/project/config.json', (config) => ({
      ...config,
      name: projectName,
      description: projectDescription,
      lastModified: new Date().toISOString()
    }), process.cwd());

    console.log(createStatusBox(
      'Guidant project initialized successfully! Your AI workflow orchestrator is ready.',
      'success',
      { title: 'Initialization Complete' }
    ));

    // Enhanced progressive onboarding with project classification
    await displayEnhancedOnboarding(projectName, projectDescription, options);

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
      console.log(createProgressiveOnboarding([], {
        title: 'Things you should do next'
      }));
      return;
    }

    // Try AI classification first if we have a meaningful description
    let classification = null;
    if (projectDescription && projectDescription !== 'A new project built with Guidant') {
      console.log(createStatusBox(
        'Analyzing your project description to suggest optimal workflow...',
        'progress',
        { title: '🤖 AI Analysis' }
      ));

      try {
        const aiResult = await classifyProjectWithAI(projectDescription);
        if (aiResult.success) {
          classification = aiResult.classification;

          console.log(createStatusBox(
            `AI suggests: ${classification.type} project with ${classification.complexity} complexity\n` +
            `Confidence: ${classification.confidence}%`,
            'success',
            { title: '🎯 AI Classification Result' }
          ));
        }
      } catch (error) {
        // AI classification failed, will use default onboarding
      }
    }

    // Display project-specific onboarding
    if (classification) {
      console.log(createProgressiveOnboarding([], {
        title: `${classification.type.charAt(0).toUpperCase() + classification.type.slice(1)} Project Workflow`,
        projectType: classification.type,
        classification: classification
      }));

      // Suggest applying adaptive workflow
      console.log(createStatusBox(
        `Run "guidant adaptive classify" to apply the full ${classification.type} workflow with ${classification.complexity} complexity.`,
        'info',
        { title: '🚀 Next: Apply Adaptive Workflow' }
      ));
    } else {
      // Fallback to generic onboarding with hint about classification
      console.log(createProgressiveOnboarding([], {
        title: 'Things you should do next'
      }));

      console.log(createStatusBox(
        'For personalized workflow guidance, run "guidant adaptive classify" to analyze your project type.',
        'info',
        { title: '💡 Tip: Get Personalized Guidance' }
      ));
    }

  } catch (error) {
    console.log(createStatusBox(
      'Error during enhanced onboarding. Showing basic guidance.',
      'warning',
      { title: '⚠️ Onboarding Error' }
    ));

    // Fallback to basic onboarding
    console.log(createProgressiveOnboarding([], {
      title: 'Things you should do next'
    }));
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
