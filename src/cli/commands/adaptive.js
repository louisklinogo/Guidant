/**
 * Adaptive Workflow Commands
 * CLI commands for adaptive workflow intelligence features
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { ProjectClassificationWizard, classifyProjectWithAI, PROJECT_TYPES, COMPLEXITY_LEVELS } from '../../workflow-intelligence/project-classifier.js';
import { AdaptiveWorkflowGenerator, getWorkflowModes } from '../../workflow-intelligence/adaptive-workflow.js';
import { getProjectState, isProjectInitialized } from '../../file-management/project-structure.js';
import { handleError, showSuccess, showWarning } from '../utils.js';

/**
 * Project classification command
 */
export async function classifyCommand(options = {}) {
  try {
    console.log(chalk.blue('🧠 Adaptive Project Classification\n'));

    // Check if project is initialized
    if (await isProjectInitialized()) {
      const state = await getProjectState();
      if (state.workflow?.adaptive) {
        console.log(chalk.yellow('⚠️ Project already has adaptive workflow.'));
        console.log(chalk.gray('Use "guidant upgrade" to modify workflow settings.\n'));
        return;
      }
    }

    let classification;

    if (options.description) {
      // Use AI classification with provided description
      console.log(chalk.blue('Using AI classification...'));
      const result = await classifyProjectWithAI(options.description);
      
      if (result.success) {
        classification = result.classification;
        console.log(chalk.green(`✅ AI Classification: ${classification.type} (${classification.confidence}% confidence)`));
        console.log(chalk.gray(`Reasoning: ${classification.reasoning}\n`));
      } else {
        console.log(chalk.yellow('⚠️ AI classification failed, using wizard...\n'));
      }
    }

    if (!classification) {
      // Use interactive wizard
      console.log(chalk.blue('🧙 Project Classification Wizard\n'));
      
      const wizard = new ProjectClassificationWizard();
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'scope',
          message: wizard.questions[0].question,
          choices: wizard.questions[0].options.map(opt => ({
            name: opt.label,
            value: opt.value
          }))
        },
        {
          type: 'list',
          name: 'timeline',
          message: wizard.questions[1].question,
          choices: wizard.questions[1].options.map(opt => ({
            name: opt.label,
            value: opt.value
          }))
        },
        {
          type: 'list',
          name: 'quality',
          message: wizard.questions[2].question,
          choices: wizard.questions[2].options.map(opt => ({
            name: opt.label,
            value: opt.value
          }))
        }
      ]);

      const wizardResult = wizard.classifyProject(answers);
      classification = {
        type: wizardResult.type,
        complexity: wizardResult.complexity.name.toLowerCase(),
        confidence: wizardResult.confidence,
        reasoning: `Wizard classification based on user answers`,
        projectType: wizardResult.projectType
      };
    }

    // Show classification results
    showClassificationResults(classification);

    // Ask if user wants to apply the workflow
    if (!options.dryRun) {
      const { apply } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'apply',
          message: 'Apply this adaptive workflow to your project?',
          default: true
        }
      ]);

      if (apply) {
        await applyAdaptiveWorkflow(classification);
      } else {
        console.log(chalk.gray('Classification saved. Use "guidant apply-workflow" later to apply.'));
      }
    }

  } catch (error) {
    handleError(error, 'Classification command');
  }
}

/**
 * Show workflow modes command
 */
export async function modesCommand() {
  try {
    console.log(chalk.blue('🎯 Adaptive Workflow Modes\n'));

    const modes = getWorkflowModes();
    
    Object.entries(modes).forEach(([key, mode]) => {
      console.log(chalk.bold(`${mode.name}:`));
      console.log(`  ${chalk.gray(mode.description)}`);
      console.log(`  ${chalk.cyan('Time to start:')} ${mode.timeToStart}`);
      
      if (mode.classification !== 'wizard' && mode.classification !== 'manual') {
        const type = mode.classification.type;
        const complexity = mode.classification.complexity;
        console.log(`  ${chalk.yellow('Project type:')} ${type} (${complexity} complexity)`);
      }
      console.log('');
    });

    console.log(chalk.bold('💡 Recommendations:'));
    console.log(`  ${chalk.green('Quick Start')} - For prototypes and simple scripts`);
    console.log(`  ${chalk.blue('Guided Setup')} - For most projects (recommended)`);
    console.log(`  ${chalk.magenta('Expert Mode')} - For complex enterprise projects\n`);

  } catch (error) {
    handleError(error, 'Modes command');
  }
}

/**
 * Upgrade workflow command
 */
export async function upgradeCommand(options = {}) {
  try {
    console.log(chalk.blue('⬆️ Workflow Upgrade Analysis\n'));

    if (!(await isProjectInitialized())) {
      console.log(chalk.red('❌ No project found. Initialize a project first.'));
      return;
    }

    const state = await getProjectState();
    
    if (!state.workflow?.adaptive) {
      console.log(chalk.yellow('🔄 Migrating to adaptive workflow...'));
      
      // Suggest classification for legacy projects
      const { classify } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'classify',
          message: 'Classify this project to get optimal adaptive workflow?',
          default: true
        }
      ]);

      if (classify) {
        await classifyCommand({ dryRun: false });
      }
      return;
    }

    // Analyze current workflow for upgrade opportunities
    console.log(chalk.green('✅ Project already using adaptive workflow'));
    console.log(`Current: ${state.workflow.projectType} (${state.workflow.complexity} complexity)\n`);

    // Show potential upgrades
    const suggestions = analyzeUpgradeOpportunities(state);
    
    if (suggestions.length === 0) {
      console.log(chalk.green('🎯 Current workflow is optimal for your project.'));
      return;
    }

    console.log(chalk.bold('💡 Upgrade Suggestions:'));
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${chalk.cyan(suggestion.title)}`);
      console.log(`   ${chalk.gray(suggestion.description)}`);
      console.log(`   ${chalk.yellow('Benefits:')} ${suggestion.benefits.join(', ')}\n`);
    });

  } catch (error) {
    handleError(error, 'Upgrade command');
  }
}

/**
 * Show classification results
 */
function showClassificationResults(classification) {
  const typeInfo = PROJECT_TYPES[classification.type];
  const complexityInfo = COMPLEXITY_LEVELS[classification.complexity];

  console.log(chalk.bold('\n📊 Classification Results:'));
  console.log(`${chalk.bold('Project Type:')} ${chalk.cyan(typeInfo.name)} (${classification.confidence}% confidence)`);
  console.log(`${chalk.bold('Complexity:')} ${chalk.yellow(complexityInfo.name)}`);
  console.log(`${chalk.bold('Phases:')} ${typeInfo.phases.join(' → ')}`);
  console.log(`${chalk.bold('Duration:')} ${typeInfo.estimatedDuration}`);
  console.log(`${chalk.bold('Quality Level:')} ${typeInfo.qualityLevel}`);
  console.log(`${chalk.bold('Research:')} ${typeInfo.researchRequirement}\n`);
  
  console.log(chalk.gray(`Reasoning: ${classification.reasoning}\n`));
}

/**
 * Apply adaptive workflow
 */
async function applyAdaptiveWorkflow(classification) {
  try {
    console.log(chalk.blue('🔧 Applying adaptive workflow...'));

    const generator = new AdaptiveWorkflowGenerator();
    const workflowConfig = await generator.generateWorkflow(classification);
    const result = await generator.applyWorkflow(workflowConfig);

    if (result.success) {
      showSuccess('Adaptive workflow applied successfully!');
      console.log(chalk.green(`✨ Your project now uses ${classification.type} workflow with ${classification.complexity} complexity.`));
      console.log(chalk.gray('Use "guidant dashboard" to see your new adaptive workflow.\n'));
    } else {
      console.log(chalk.red(`❌ Failed to apply workflow: ${result.error}`));
    }

  } catch (error) {
    console.log(chalk.red(`❌ Error applying workflow: ${error.message}`));
  }
}

/**
 * Analyze upgrade opportunities
 */
function analyzeUpgradeOpportunities(state) {
  const suggestions = [];
  const currentType = state.workflow.projectType;
  const currentComplexity = state.workflow.complexity;

  // Suggest complexity upgrades
  if (currentComplexity === 'simple') {
    suggestions.push({
      title: 'Upgrade to Standard Complexity',
      description: 'Add comprehensive testing and documentation',
      benefits: ['Better quality gates', 'Peer review process', 'Professional documentation']
    });
  }

  if (currentComplexity === 'standard' && currentType === 'product') {
    suggestions.push({
      title: 'Upgrade to Enterprise Complexity',
      description: 'Add enterprise-grade practices and governance',
      benefits: ['Formal review process', 'Extensive documentation', 'Scalable architecture']
    });
  }

  // Suggest type upgrades
  if (currentType === 'prototype') {
    suggestions.push({
      title: 'Evolve to Feature Development',
      description: 'Add requirements and deployment phases',
      benefits: ['Better planning', 'Production readiness', 'User feedback integration']
    });
  }

  return suggestions;
}

/**
 * Register adaptive workflow commands
 */
export function registerAdaptiveCommands(program) {
  program
    .command('classify')
    .description('Classify project type and get optimal adaptive workflow')
    .option('-d, --description <text>', 'Project description for AI classification')
    .option('--dry-run', 'Show classification without applying workflow')
    .action(classifyCommand);

  program
    .command('modes')
    .description('Show available workflow setup modes')
    .action(modesCommand);

  program
    .command('upgrade')
    .description('Analyze and upgrade current workflow')
    .action(upgradeCommand);
}
