/**
 * AI Coordination Tools for MCP Server
 * Provides tools for AI agents to interact with Guidant Evolution workflow
 */

import { z } from 'zod';
import { initializeProjectStructure, getProjectState, isProjectInitialized, writeProjectFile, readProjectFile } from '../../../src/file-management/project-structure.js';
import { discoverCapabilities, generateTaskRecommendations } from '../../../src/ai-coordination/capability-discovery.js';
import { generateNextTask, advancePhase, markDeliverableComplete, getCurrentWorkflowState, getDeliverableDirectory, checkPhaseCompletion } from '../../../src/workflow-logic/workflow-engine.js';
import { discoverAgent, globalAgentRegistry } from '../../../src/agent-registry/agent-discovery.js';
import { analyzeAgentGaps } from '../../../src/agent-registry/gap-analysis.js';
import { getConfigurationSuggestions, requestToolsForAgent } from '../../../src/agent-registry/tool-configurator.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Helper function to format MCP tool responses properly
 * MCP tools must return either a string or a content object
 */
function formatMCPResponse(data) {
	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(data, null, 2)
			}
		]
	};
}

/**
 * Register all AI coordination tools with the MCP server
 */
export function registerAICoordinationTools(server) {
	// Project initialization and setup
	server.addTool({
		name: 'guidant_init_project',
		description: 'Initialize a new Guidant Evolution project with structured workflow',
		parameters: z.object({
			projectName: z.string().describe('Name of the project'),
			description: z.string().optional().describe('Project description'),
			availableTools: z.array(z.string()).describe('List of tools available to the AI assistant')
		}),
		execute: async ({ projectName, description = '', availableTools }) => {
			try {
				const projectRoot = process.cwd();
				
				// Check if already initialized
				if (await isProjectInitialized(projectRoot)) {
					return formatMCPResponse({
						success: false,
						message: 'Project already initialized',
						nextAction: 'Use guidant_get_current_task to continue'
					});
				}

				// Initialize project structure
				await initializeProjectStructure(projectRoot);
				
				// Discover AI capabilities
				const capabilities = await discoverCapabilities(availableTools, projectRoot);
				const recommendations = generateTaskRecommendations(capabilities);
				
				// Update project config
				const projectConfig = {
					name: projectName,
					description,
					version: '0.1.0',
					created: new Date().toISOString(),
					lastModified: new Date().toISOString()
				};
				
				await writeProjectFile('PROJECT_CONFIG', projectConfig, projectRoot);

				return formatMCPResponse({
					success: true,
					message: `Project "${projectName}" initialized successfully`,
					capabilities: {
						strongSuits: recommendations.strongSuits,
						limitations: recommendations.possibleWithLimitations,
						notRecommended: recommendations.notRecommended
					},
					nextAction: 'Use guidant_get_current_task to start systematic development'
				});
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message,
					nextAction: 'Check project permissions and try again'
				});
			}
		}
	});

	// Get current task for AI to work on
	server.addTool({
		name: 'guidant_get_current_task',
		description: 'Get the next task the AI should work on based on current project state and capabilities',
		parameters: z.object({
			availableTools: z.array(z.string()).optional().describe('Current tools available to AI assistant')
		}),
		execute: async ({ availableTools = [] }) => {
			try {
				const projectRoot = process.cwd();
				
				if (!(await isProjectInitialized(projectRoot))) {
					return formatMCPResponse({
						success: false,
						message: 'Project not initialized',
						nextAction: 'Use guidant_init_project first'
					});
				}

				// Get or update capabilities if tools provided
				let capabilities;
				if (availableTools.length > 0) {
					capabilities = await discoverCapabilities(availableTools, projectRoot);
				} else {
					const state = await getProjectState(projectRoot);
					capabilities = state.capabilities;
				}

				// Generate next task
				const task = await generateNextTask(capabilities, projectRoot);
				
				return formatMCPResponse({
					success: true,
					task,
					currentState: await getCurrentWorkflowState(projectRoot)
				});
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Get project status and state
	server.addTool({
		name: 'guidant_get_project_state',
		description: 'Get current project state, progress, and workflow status',
		parameters: z.object({}),
		execute: async () => {
			try {
				const projectRoot = process.cwd();
				
				if (!(await isProjectInitialized(projectRoot))) {
					return formatMCPResponse({
						success: false,
						message: 'Project not initialized',
						nextAction: 'Use guidant_init_project first'
					});
				}

				const state = await getProjectState(projectRoot);
				const workflowState = await getCurrentWorkflowState(projectRoot);
				
				// Calculate overall progress
				const phaseCount = Object.keys(workflowState.phases.phases).length;
				const completedCount = Object.values(workflowState.phases.phases).filter(phase => phase.status === 'completed').length;
				const overallProgress = Math.round((completedCount / phaseCount) * 100);
				
				return formatMCPResponse({
					success: true,
					projectState: state,
					workflowState,
					summary: {
						currentPhase: workflowState.currentPhase.phase,
						currentRole: workflowState.currentRole.role,
						overallProgress,
						nextMilestone: {
							phase: workflowState.currentPhase.phase,
							nextPhase: workflowState.phaseDefinition?.nextPhase,
							description: workflowState.phaseDefinition?.description
						}
					}
				});
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Report progress on current task
	server.addTool({
		name: 'guidant_report_progress',
		description: 'Report progress on current task and log work completed',
		parameters: z.object({
			deliverable: z.string().describe('The deliverable that was worked on'),
			workCompleted: z.string().describe('Description of work completed'),
			filesCreated: z.array(z.string()).optional().describe('List of files created or modified'),
			status: z.enum(['in_progress', 'completed', 'blocked', 'review']).describe('Current status of the work'),
			blockers: z.array(z.string()).optional().describe('Any blockers encountered'),
			nextSteps: z.string().optional().describe('Planned next steps')
		}),
		execute: async ({ deliverable, workCompleted, filesCreated = [], status, blockers = [], nextSteps = '' }) => {
			try {
				const projectRoot = process.cwd();
				
				// Log the work session
				const workLog = {
					deliverable,
					workCompleted,
					filesCreated,
					status,
					blockers,
					nextSteps,
					timestamp: new Date().toISOString()
				};

				// Read current sessions and add new entry
				const sessions = await readProjectFile('SESSIONS', projectRoot);
				sessions.push(workLog);
				await writeProjectFile('SESSIONS', sessions, projectRoot);

				// If completed, mark deliverable as complete
				if (status === 'completed') {
					await markDeliverableComplete(deliverable, projectRoot);
				}

				// Check if phase should advance
				const state = await getCurrentWorkflowState(projectRoot);
				const phaseComplete = await checkPhaseCompletion(state.currentPhase.phase, projectRoot);

				let nextTask = null;
				if (status === 'completed' && !phaseComplete.isComplete) {
					// Get next task in same phase
					const capabilities = state.capabilities || await discoverCapabilities([], projectRoot);
					nextTask = await generateNextTask(capabilities, projectRoot);
				}

				return formatMCPResponse({
					success: true,
					message: 'Progress reported successfully',
					workLogged: workLog,
					phaseStatus: phaseComplete,
					nextTask: nextTask?.type === 'task_ticket' ? nextTask : null,
					readyToAdvance: phaseComplete.isComplete
				});
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});
}
