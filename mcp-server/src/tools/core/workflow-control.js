/**
 * Workflow Control Tools
 * Tools for managing workflow progression, tasks, and progress reporting
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import { 
	availableToolsSchema,
	deliverableSchema,
	workCompletedSchema,
	filesCreatedSchema,
	workStatusSchema,
	blockersSchema,
	nextStepsSchema,
	confirmationSchema
} from '../shared/validation.js';

// Import core functionality
import { 
	isProjectInitialized, 
	getProjectState, 
	writeProjectFile, 
	readProjectFile 
} from '../../../../src/file-management/project-structure.js';
import { 
	discoverCapabilities 
} from '../../../../src/ai-coordination/capability-discovery.js';
import {
	generateNextTask,
	advancePhase,
	markDeliverableComplete,
	getCurrentWorkflowState,
	checkPhaseCompletion,
	formatImplementationTicket
} from '../../../../src/workflow-logic/workflow-engine.js';

/**
 * Register workflow control tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerWorkflowControlTools(server) {
	// Get current task
	server.addTool({
		name: 'guidant_get_current_task',
		description: 'Get the next task the AI should work on based on current project state and capabilities. Can optionally include full project state.',
		parameters: z.object({
			availableTools: availableToolsSchema.optional(),
			includeFullState: z.boolean().default(false).describe('Include complete project state information (replaces guidant_get_project_state)')
		}),
		execute: async ({ availableTools = [], includeFullState = false }) => {
			try {
				const projectRoot = process.cwd();
				
				if (!(await isProjectInitialized(projectRoot))) {
					return formatErrorResponse(
						'Project not initialized',
						'Use guidant_init_project first'
					);
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

				// Get current workflow state
				const currentState = await getCurrentWorkflowState(projectRoot);

				// Enhance task with focus display context
				const enhancedTask = await enhanceTaskForFocusDisplay(task, currentState, projectRoot);

				// Build response - include full state if requested
				const response = {
					success: true,
					task: enhancedTask,
					currentState
				};

				// Include full project state if requested (replaces guidant_get_project_state)
				if (includeFullState) {
					const fullProjectState = await getProjectState(projectRoot);
					response.projectState = fullProjectState;
					response.summary = {
						currentPhase: currentState.currentPhase.phase,
						currentRole: currentState.currentRole.role,
						overallProgress: calculateOverallProgress(currentState.phases),
						nextMilestone: getNextMilestone(currentState)
					};
				}

				// Add formatted YAML for implementation tickets
				if (task.type === 'implementation_ticket') {
					response.formattedTicket = formatImplementationTicket(task);
					response.message = 'Implementation ticket generated - see formattedTicket for detailed YAML format';
				}

				return formatMCPResponse(response);
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// Report progress
	server.addTool({
		name: 'guidant_report_progress',
		description: 'Report progress on current task and log work completed',
		parameters: z.object({
			deliverable: deliverableSchema,
			workCompleted: workCompletedSchema,
			filesCreated: filesCreatedSchema,
			status: workStatusSchema,
			blockers: blockersSchema,
			nextSteps: nextStepsSchema
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

				const response = {
					success: true,
					message: 'Progress reported successfully',
					workLogged: workLog,
					phaseStatus: phaseComplete,
					nextTask: nextTask?.type === 'task_ticket' ? nextTask : null,
					readyToAdvance: phaseComplete.isComplete
				};

				// Add formatted YAML for implementation tickets
				if (nextTask?.type === 'implementation_ticket') {
					response.formattedNextTicket = formatImplementationTicket(nextTask);
				}

				return formatMCPResponse(response);
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// Advance phase
	server.addTool({
		name: 'guidant_advance_phase',
		description: 'Advance to the next development phase after completing current phase requirements',
		parameters: z.object({
			confirmAdvancement: confirmationSchema
		}),
		execute: async ({ confirmAdvancement }) => {
			try {
				if (!confirmAdvancement) {
					return formatErrorResponse('Phase advancement not confirmed');
				}

				const projectRoot = process.cwd();
				const result = await advancePhase(projectRoot);
				
				if (result.success) {
					// Get next task for new phase
					const state = await getProjectState(projectRoot);
					const capabilities = state.capabilities;
					const nextTask = await generateNextTask(capabilities, projectRoot);

					const response = {
						success: true,
						message: result.message,
						nextPhase: result.nextPhase,
						nextTask: nextTask?.type === 'task_ticket' ? nextTask : null
					};

					// Add formatted YAML for implementation tickets
					if (nextTask?.type === 'implementation_ticket') {
						response.formattedNextTicket = formatImplementationTicket(nextTask);
						response.message += ' - Implementation ticket generated with detailed specifications';
					}

					return formatMCPResponse(response);
				}

				return formatMCPResponse(result);
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});
}

// Helper functions for full state support
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

/**
 * Enhance task with additional context for focus display
 */
async function enhanceTaskForFocusDisplay(task, workflowState, projectRoot) {
	if (!task) return task;

	try {
		// Add workflow context
		const enhancedTask = {
			...task,
			workflowContext: {
				currentPhase: workflowState.currentPhase?.phase,
				totalPhases: Object.keys(workflowState.phases || {}).length,
				overallProgress: calculateOverallProgress(workflowState.phases),
				nextPhase: getNextPhaseFromState(workflowState),
				readyToAdvance: await checkPhaseReadiness(workflowState, projectRoot)
			}
		};

		// Add dependencies if available
		if (task.dependencies) {
			enhancedTask.dependencies = await enhanceDependencies(task.dependencies, projectRoot);
		}

		// Add contextual actions
		enhancedTask.suggestedActions = generateTaskActions(task, workflowState);

		return enhancedTask;
	} catch (error) {
		console.warn('Failed to enhance task for focus display:', error.message);
		return task;
	}
}

/**
 * Get next phase from workflow state
 */
function getNextPhaseFromState(workflowState) {
	if (!workflowState.phases || !workflowState.currentPhase) return null;

	const phaseNames = Object.keys(workflowState.phases);
	const currentIndex = phaseNames.indexOf(workflowState.currentPhase.phase);

	if (currentIndex >= 0 && currentIndex < phaseNames.length - 1) {
		return phaseNames[currentIndex + 1];
	}

	return null;
}

/**
 * Check if current phase is ready to advance
 */
async function checkPhaseReadiness(workflowState, projectRoot) {
	try {
		const phaseCompletion = await checkPhaseCompletion(workflowState.currentPhase?.phase, projectRoot);
		return phaseCompletion.isComplete;
	} catch (error) {
		return false;
	}
}

/**
 * Enhance dependencies with status information
 */
async function enhanceDependencies(dependencies, projectRoot) {
	if (!Array.isArray(dependencies)) return [];

	return dependencies.map(dep => ({
		...dep,
		status: dep.status || 'pending',
		title: dep.title || dep.id || 'Unknown dependency'
	}));
}

/**
 * Generate contextual actions for task
 */
function generateTaskActions(task, workflowState) {
	const actions = [];
	const status = task.status || 'pending';
	const currentPhase = workflowState.currentPhase?.phase;

	// Status-based actions
	if (status === 'pending') {
		actions.push({
			description: 'Start working on this task',
			command: 'guidant progress --status=in-progress',
			type: 'primary'
		});
	} else if (status === 'in-progress') {
		actions.push({
			description: 'Report progress update',
			command: 'guidant progress --update',
			type: 'primary'
		});
		actions.push({
			description: 'Mark task as completed',
			command: 'guidant progress --status=completed',
			type: 'success'
		});
	}

	// Phase-based actions
	if (currentPhase) {
		actions.push({
			description: 'Check phase completion status',
			command: 'guidant status --phase',
			type: 'info'
		});
	}

	// General actions
	actions.push({
		description: 'View full project status',
		command: 'guidant status',
		type: 'info'
	});

	return actions.slice(0, 4); // Limit to 4 actions
}
