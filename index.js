#!/usr/bin/env node

/**
 * Guidant
 * AI Agent Workflow Orchestrator for systematic software development
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import figlet from 'figlet';
import gradient from 'gradient-string';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get package information
import { readFileSync } from 'fs';
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

// Import core functionality
import { initializeProjectStructure, isProjectInitialized, getProjectState } from './src/file-management/project-structure.js';
import { discoverCapabilities } from './src/ai-coordination/capability-discovery.js';
import { generateNextTask, getCurrentWorkflowState } from './src/workflow-logic/workflow-engine.js';

// Export version information
export const version = packageJson.version;

// CLI implementation  
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
	const program = new Command();

	program
		.name('guidant')
		.description('AI Agent Workflow Orchestrator')
		.version(version);

	// Initialize new project
	program
		.command('init')
		.description('Initialize a new Guidant project')
		.option('-n, --name <name>', 'Project name')
		.option('-d, --description <description>', 'Project description')
		.action(async (options) => {
			try {
				// Display banner with figlet
				const banner = figlet.textSync('Guidant', { font: 'Standard' });
				console.log(gradient(['cyan', 'magenta'])(banner));
				console.log(chalk.gray('AI Agent Workflow Orchestrator\n'));

				if (await isProjectInitialized()) {
					console.log(chalk.yellow('⚠️  Project already initialized'));
					return;
				}

				const projectName = options.name || 'My Project';
				const description = options.description || '';

				console.log(chalk.blue('🚀 Initializing project structure...'));
				await initializeProjectStructure();

				// Update project config with provided details
				const config = {
					name: projectName,
					description,
					version: '0.1.0',
					created: new Date().toISOString(),
					lastModified: new Date().toISOString()
				};

				// Save config (we'll need to implement this helper)
				console.log(chalk.green('✅ Project initialized successfully!'));
				console.log(chalk.gray('\nNext steps:'));
				console.log(chalk.gray('1. Configure your AI assistant with MCP tools'));
				console.log(chalk.gray('2. Use taskmaster_init_project in your AI assistant'));
				console.log(chalk.gray('3. Start systematic development with taskmaster_get_current_task'));

			} catch (error) {
				console.error(chalk.red('❌ Initialization failed:'), error.message);
				process.exit(1);
			}
		});

	// Show project status
	program
		.command('status')
		.description('Show current project status and progress')
		.action(async () => {
			try {
				// Display banner
				const banner = figlet.textSync('Guidant', { font: 'Standard' });
				console.log(gradient(['cyan', 'magenta'])(banner));
				console.log(chalk.gray('AI Agent Workflow Orchestrator\n'));
				
				if (!(await isProjectInitialized())) {
					console.log(chalk.yellow('⚠️  No Guidant project found. Run "guidant init" first.'));
					return;
				}

				const state = await getProjectState();
				const workflowState = await getCurrentWorkflowState();

				console.log(boxen(
					chalk.white(
						`${chalk.bold('Version:')} ${version}   ${chalk.bold('Project:')} ${state.config.name || 'Guidant Project'}`
					),
					{
						padding: 1,
						margin: { top: 0, bottom: 1 },
						borderStyle: 'round',
						borderColor: 'cyan'
					}
				));

				console.log(chalk.bold('\n📊 Project Status:'));
				console.log(`Current Phase: ${chalk.green(workflowState.currentPhase.phase)}`);
				console.log(`Current Role: ${chalk.blue(workflowState.currentRole.role || 'Not assigned')}`);
				console.log(`Started: ${chalk.gray(new Date(state.config.created).toLocaleDateString())}`);

				// Show phase progress with proper table
				console.log(chalk.bold('\n🎯 Phase Progress:'));
				
				// Calculate dynamic column widths based on terminal width
				const terminalWidth = process.stdout.columns || 80;
				const availableWidth = Math.max(60, terminalWidth - 10); // Leave margin
				const statusWidth = 8;
				const progressWidth = 12;
				const phaseWidth = availableWidth - statusWidth - progressWidth;
				
				const phaseTable = new Table({
					head: [
						chalk.cyan.bold('Status'),
						chalk.cyan.bold('Phase'),
						chalk.cyan.bold('Progress')
					],
					colWidths: [statusWidth, phaseWidth, progressWidth],
					style: {
						head: [],
						border: ['gray'],
						'padding-top': 0,
						'padding-bottom': 0,
						compact: true
					},
					chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
					wordWrap: true
				});
				
				for (const [phase, info] of Object.entries(state.phases.phases)) {
					const status = info.status === 'completed' ? chalk.green('✓') : 
					            info.status === 'active' ? chalk.blue('►') : chalk.yellow('○');
					phaseTable.push([status, chalk.cyan(phase), chalk.gray(info.status)]);
				}
				console.log(phaseTable.toString());

				// Show AI capabilities with proper table if available
				if (state.capabilities && Object.keys(state.capabilities).length > 0) {
					console.log(chalk.bold('\n🤖 AI Capabilities:'));
					
					// Calculate dynamic column widths for capabilities table
					const roleWidth = 15;
					const confidenceWidth = 12;
					const statusWidth = availableWidth - roleWidth - confidenceWidth;
					
					const capabilityTable = new Table({
						head: [
							chalk.cyan.bold('Role'),
							chalk.cyan.bold('Status'),
							chalk.cyan.bold('Confidence')
						],
						colWidths: [roleWidth, statusWidth, confidenceWidth],
						style: {
							head: [],
							border: ['gray'],
							'padding-top': 0,
							'padding-bottom': 0,
							compact: true
						},
						chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
						wordWrap: true
					});
					
					for (const [role, capability] of Object.entries(state.capabilities.roles || {})) {
						const confidence = Math.round(capability.confidence * 100);
						const status = capability.canFulfill ? 
							chalk.green('✓ Available') : 
							chalk.red('✗ Missing');
						const confidenceDisplay = capability.canFulfill ? 
							`${confidence}%` : 
							chalk.gray('-');
						capabilityTable.push([chalk.cyan(role), status, confidenceDisplay]);
					}
					console.log(capabilityTable.toString());
				}

			} catch (error) {
				console.error(chalk.red('❌ Failed to get status:'), error.message);
				process.exit(1);
			}
		});

	// Test capability discovery
	program
		.command('test-capabilities')
		.description('Test AI capability discovery with current environment')
		.action(async () => {
			try {
				console.log('Starting capability test...');
				
				// Simulate tools that would be available in this environment
				const simulatedTools = [
					'create_file', 'edit_file', 'read_file', 'list_directory',
					'web_search', 'mermaid', 'Bash', 'get_diagnostics'
				];

				console.log(chalk.blue('🔍 Testing capability discovery...'));
				console.log(chalk.gray(`Simulated tools: ${simulatedTools.join(', ')}`));

				// Initialize temp structure if needed
				if (!(await isProjectInitialized())) {
					console.log(chalk.gray('Initializing temporary project structure for testing...'));
					await initializeProjectStructure();
				}

				const capabilities = await discoverCapabilities(simulatedTools);
				
				console.log(chalk.bold('\n🎯 Role Analysis:'));
				for (const [role, analysis] of Object.entries(capabilities.roles)) {
					const confidence = Math.round(analysis.confidence * 100);
					const status = analysis.canFulfill ? 
						chalk.green(`✓ ${confidence}%`) : 
						chalk.red('✗ Missing tools');
					
					console.log(`${role}: ${status}`);
					
					if (!analysis.canFulfill) {
						console.log(chalk.gray(`  Missing: ${analysis.missingRequired.join(', ')}`));
					}
					if (analysis.availableOptional.length > 0) {
						console.log(chalk.gray(`  Optional tools: ${analysis.availableOptional.join(', ')}`));
					}
				}

				if (capabilities.limitations.length > 0) {
					console.log(chalk.bold('\n⚠️  Limitations:'));
					capabilities.limitations.forEach(limitation => {
						console.log(chalk.yellow(`${limitation.category}: ${limitation.issue}`));
						console.log(chalk.gray(`  Impact: ${limitation.impact}`));
					});
				}

			} catch (error) {
				console.error(chalk.red('❌ Capability test failed:'), error.message);
				console.error('Stack trace:', error.stack);
				process.exit(1);
			}
		});

	program.parse(process.argv);
}
