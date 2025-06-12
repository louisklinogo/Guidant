/**
 * Core Project Management Tools
 * Tools for initializing projects, getting state, and saving deliverables
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import {
	projectNameSchema,
	projectDescriptionSchema,
	availableToolsSchema,
	prdContentSchema,
	deliverableSchema,
	contentSchema,
	filenameSchema,
	directorySchema
} from '../shared/validation.js';

// Import core functionality
import {
	initializeProjectStructure,
	getProjectState,
	isProjectInitialized,
	writeProjectFile,
	readProjectFile
} from '../../../../src/file-management/project-structure.js';
import {
	discoverCapabilities,
	generateTaskRecommendations
} from '../../../../src/ai-coordination/capability-discovery.js';
import {
	getCurrentWorkflowState,
	getDeliverableDirectory
} from '../../../../src/workflow-logic/workflow-engine.js';
import {
	processPRDContent
} from '../../../../src/project-initialization/simple-prd-processor.js';

/**
 * Register project management tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerProjectManagementTools(server) {
	// Project initialization
	server.addTool({
		name: 'guidant_init_project',
		description: 'Initialize a new Guidant project with structured workflow and optional PRD processing',
		parameters: z.object({
			projectName: projectNameSchema,
			description: projectDescriptionSchema,
			availableTools: availableToolsSchema,
			prdContent: prdContentSchema
		}),
		execute: async ({ projectName, description = '', availableTools, prdContent }) => {
			try {
				const projectRoot = process.cwd();

				// Check if already initialized
				if (await isProjectInitialized(projectRoot)) {
					return formatErrorResponse(
						'Project already initialized',
						'Use guidant_get_current_task to continue'
					);
				}

				// Initialize project structure with enhanced error handling
				try {
					await initializeProjectStructure(projectRoot);
				} catch (structureError) {
					// Provide specific guidance based on error type
					if (structureError.message.includes('Permission denied')) {
						return formatErrorResponse(
							'Permission denied during project initialization',
							'Please check file permissions or run with appropriate privileges. You may need to run as administrator/sudo or change directory ownership.',
							{
								error: structureError.message,
								suggestions: [
									'Check if the current directory is writable',
									'Run with elevated permissions if necessary',
									'Ensure no files are locked by other processes'
								]
							}
						);
					} else if (structureError.message.includes('disk space')) {
						return formatErrorResponse(
							'Insufficient disk space for project initialization',
							'Free up disk space and try again.',
							{ error: structureError.message }
						);
					}
					throw structureError; // Re-throw other errors
				}
				
				// Discover AI capabilities
				const capabilities = await discoverCapabilities(availableTools, projectRoot);
				const recommendations = generateTaskRecommendations(capabilities);
				
				// Update project config
				let finalDescription = description;
				let taskCount = 0;
				let prdResult = null;

				// Process PRD if provided
				if (prdContent && prdContent.trim()) {
					try {
						prdResult = await processPRDContent(prdContent, {
							projectName,
							projectDescription: description,
							projectRoot
						});

						if (prdResult.success) {
							taskCount = prdResult.taskCount;
							if (prdResult.projectDescription) {
								finalDescription = prdResult.projectDescription;
							}
						}
					} catch (prdError) {
						console.warn('PRD processing failed:', prdError.message);
						// Continue with normal initialization
					}
				}

				const projectConfig = {
					name: projectName,
					description: finalDescription,
					version: '0.1.0',
					created: new Date().toISOString(),
					lastModified: new Date().toISOString(),
					prdProcessed: !!prdContent
				};

				await writeProjectFile('PROJECT_CONFIG', projectConfig, projectRoot);

				const response = {
					message: `Project "${projectName}" initialized successfully`,
					capabilities: {
						strongSuits: recommendations.strongSuits,
						limitations: recommendations.possibleWithLimitations,
						notRecommended: recommendations.notRecommended
					}
				};

				if (prdResult && taskCount > 0) {
					response.prdProcessing = {
						success: prdResult.success,
						tasksGenerated: taskCount,
						message: prdResult.message
					};
				}

				return formatSuccessResponse(
					response,
					`Project "${projectName}" initialized successfully${taskCount > 0 ? ` with ${taskCount} tasks from PRD` : ''}`,
					'Use guidant_get_current_task to start systematic development'
				);
			} catch (error) {
				return formatErrorResponse(error.message, 'Check project permissions and try again');
			}
		}
	});

	// Get project state (DEPRECATED - use guidant_get_current_task with includeFullState=true)
	server.addTool({
		name: 'guidant_get_project_state',
		description: '[DEPRECATED] Get current project state, progress, and workflow status. Use guidant_get_current_task with includeFullState=true instead.',
		parameters: z.object({}),
		execute: async () => {
			try {
				const projectRoot = process.cwd();
				
				if (!(await isProjectInitialized(projectRoot))) {
					return formatErrorResponse(
						'Project not initialized',
						'Use guidant_init_project first'
					);
				}

				const state = await getProjectState(projectRoot);
				const workflowState = await getCurrentWorkflowState(projectRoot);

				return formatMCPResponse({
					success: true,
					deprecated: true,
					deprecationMessage: 'This tool is deprecated. Use guidant_get_current_task with includeFullState=true instead.',
					projectState: state,
					workflowState,
					summary: {
						currentPhase: workflowState.currentPhase.phase,
						currentRole: workflowState.currentRole.role,
						overallProgress: calculateOverallProgress(workflowState.phases),
						nextMilestone: getNextMilestone(workflowState)
					}
				});
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// Save deliverable content
	server.addTool({
		name: 'guidant_save_deliverable',
		description: 'Save completed deliverable content to appropriate location in project structure',
		parameters: z.object({
			deliverable: deliverableSchema,
			content: contentSchema,
			filename: filenameSchema,
			directory: directorySchema
		}),
		execute: async ({ deliverable, content, filename, directory = '' }) => {
			try {
				const projectRoot = process.cwd();
				
				// Get current phase to determine appropriate directory
				const workflowState = await getCurrentWorkflowState(projectRoot);
				const currentPhase = workflowState.currentPhase.phase;
				
				// Use provided directory or auto-detect based on phase
				const targetDirectory = directory || getDeliverableDirectory(currentPhase);
				
				const basePath = path.join(projectRoot, '.guidant', 'deliverables');
				const fullDirectory = path.join(basePath, targetDirectory);
				const filePath = path.join(fullDirectory, filename);

				// Ensure directory exists
				await fs.mkdir(fullDirectory, { recursive: true });
				
				// Save content
				await fs.writeFile(filePath, content, 'utf8');

				return formatMCPResponse({
					success: true,
					message: `Deliverable "${deliverable}" saved successfully`,
					filePath: path.relative(projectRoot, filePath),
					savedTo: `deliverables/${targetDirectory}/`,
					nextAction: 'Use guidant_report_progress to mark as completed'
				});
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});
}

// Helper functions
function calculateOverallProgress(phases) {
	const phaseCount = Object.keys(phases.phases).length;
	const completedCount = Object.values(phases.phases).filter(phase => phase.status === 'completed').length;
	return Math.round((completedCount / phaseCount) * 100);
}

function getNextMilestone(workflowState) {
	const currentPhase = workflowState.currentPhase.phase;
	const phaseDefinition = workflowState.phaseDefinition;
	
	return {
		phase: currentPhase,
		nextPhase: phaseDefinition?.nextPhase,
		description: phaseDefinition?.description
	};
}
