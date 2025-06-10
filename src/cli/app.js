/**
 * CLI Application
 * Main CLI application setup and configuration
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerAllCommands, getAvailableCommands } from './commands/index.js';

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

/**
 * Create and configure the CLI application
 */
export function createCLIApp() {
  const program = new Command();

  // Basic program configuration
  program
    .name('guidant')
    .description('AI Agent Workflow Orchestrator - Systematic SDLC for AI coding agents')
    .version(packageJson.version, '-v, --version', 'Show version number')
    .helpOption('-h, --help', 'Show help information');

  // Custom help
  program.configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
  });

  // Register all commands
  registerAllCommands(program);

  // Add custom help command
  program
    .command('help [command]')
    .description('Show help for a specific command')
    .action((commandName) => {
      if (commandName) {
        const command = program.commands.find(cmd => cmd.name() === commandName);
        if (command) {
          command.help();
        } else {
          console.log(chalk.red(`Unknown command: ${commandName}`));
          showAvailableCommands();
        }
      } else {
        program.help();
      }
    });

  // Handle unknown commands
  program.on('command:*', (operands) => {
    console.log(chalk.red(`Unknown command: ${operands[0]}`));
    console.log(chalk.gray('Run "guidant help" to see available commands.\n'));
    showAvailableCommands();
    process.exit(1);
  });

  // Show help if no command provided
  if (process.argv.length <= 2) {
    showAvailableCommands();
    process.exit(0);
  }

  return program;
}

/**
 * Show available commands in a nice format
 */
function showAvailableCommands() {
  const commands = getAvailableCommands();
  const categories = [...new Set(commands.map(cmd => cmd.category))];

  console.log(chalk.bold('Available Commands:\n'));

  categories.forEach(category => {
    console.log(chalk.cyan.bold(`${category}:`));
    commands
      .filter(cmd => cmd.category === category)
      .forEach(cmd => {
        console.log(`  ${chalk.green(cmd.name.padEnd(20))} ${chalk.gray(cmd.description)}`);
      });
    console.log();
  });

  console.log(chalk.gray('Use "guidant <command> --help" for detailed command information.'));
}

/**
 * Run the CLI application
 */
export function runCLI() {
  const program = createCLIApp();
  
  try {
    program.parse();
  } catch (error) {
    console.error(chalk.red('❌ CLI Error:'), error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}
