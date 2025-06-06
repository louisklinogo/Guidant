/**
 * AI Coordination Tools for MCP Server
 * Provides tools for AI agents to interact with Guidant Evolution workflow
 */

import { z } from 'zod';

/**
 * Helper function to format MCP tool responses as simple strings
 */
function formatMCPResponse(data) {
	return JSON.stringify(data, null, 2);
}
import { initializeProjectStructure, getProjectState, isProjectInitialized, writeProjectFile, readProjectFile } from '../../../src/file-management/project-structure.js';
import { discoverCapabilities, generateTaskRecommendations } from '../../../src/ai-coordination/capability-discovery.js';
import { generateNextTask, advancePhase, markDeliverableComplete, getCurrentWorkflowState, getDeliverableDirectory, checkPhaseCompletion } from '../../../src/workflow-logic/workflow-engine.js';
import { discoverAgent, globalAgentRegistry } from '../../../src/agent-registry/agent-discovery.js';
import { analyzeAgentGaps } from '../../../src/agent-registry/gap-analysis.js';
import { getConfigurationSuggestions, requestToolsForAgent } from '../../../src/agent-registry/tool-configurator.js';

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

	// Advance to next phase
	server.addTool({
		name: 'guidant_advance_phase',
		description: 'Advance to the next development phase after completing current phase requirements',
		parameters: z.object({
			confirmAdvancement: z.boolean().describe('Confirm that current phase is complete and ready to advance')
		}),
		execute: async ({ confirmAdvancement }) => {
			try {
				if (!confirmAdvancement) {
					return formatMCPResponse({
						success: false,
						message: 'Phase advancement not confirmed'
					});
				}

				const projectRoot = process.cwd();
				const result = await advancePhase(projectRoot);
				
				if (result.success) {
					// Get next task for new phase
					const state = await getProjectState(projectRoot);
					const capabilities = state.capabilities;
					const nextTask = await generateNextTask(capabilities, projectRoot);
					
					return formatMCPResponse({
						success: true,
						message: result.message,
						nextPhase: result.nextPhase,
						nextTask: nextTask?.type === 'task_ticket' ? nextTask : null
					});
				}

				return result;
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
				
				return {
					success: true,
					projectState: state,
					workflowState,
					summary: {
						currentPhase: workflowState.currentPhase.phase,
						currentRole: workflowState.currentRole.role,
						overallProgress: calculateOverallProgress(workflowState.phases),
						nextMilestone: getNextMilestone(workflowState)
					}
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Save deliverable content
	server.addTool({
		name: 'guidant_save_deliverable',
		description: 'Save completed deliverable content to appropriate location in project structure',
		parameters: z.object({
			deliverable: z.string().describe('Name of the deliverable'),
			content: z.string().describe('Content to save'),
			filename: z.string().describe('Filename to save as'),
			directory: z.string().optional().describe('Subdirectory within deliverables (e.g., wireframes, architecture)')
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

				return {
					success: true,
					message: `Deliverable "${deliverable}" saved successfully`,
					filePath: path.relative(projectRoot, filePath),
					savedTo: `deliverables/${targetDirectory}/`,
					nextAction: 'Use guidant_report_progress to mark as completed'
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// === UNIVERSAL AGENT MANAGEMENT TOOLS ===

	// Discover current AI agent capabilities
	server.addTool({
		name: 'guidant_discover_agent',
		description: 'Discover and analyze the current AI agent\'s capabilities using universal tool registry',
		parameters: z.object({
			agentName: z.string().optional().describe('Name/identifier for this agent session'),
			availableTools: z.array(z.string()).describe('List of tools the AI agent has access to'),
			agentType: z.string().optional().describe('Type of AI agent (claude, gpt, copilot, etc.)')
		}),
		execute: async ({ agentName = 'current_agent', availableTools, agentType = 'unknown' }) => {
			try {
				// Discover agent using universal system
				const agentInfo = await discoverAgent({
					type: 'config',
					config: {
						identity: { name: agentName, type: agentType },
						tools: availableTools,
						capabilities: {
							discoveredVia: 'mcp',
							session: new Date().toISOString()
						}
					}
				}, agentName);

				return {
					success: true,
					agent: {
						id: agentInfo.id,
						name: agentInfo.identity.name,
						type: agentInfo.identity.type,
						toolCount: agentInfo.tools.length,
						normalizedTools: agentInfo.normalizedTools,
						strongestRoles: agentInfo.strongestRoles,
						roleCapabilities: Object.fromEntries(
							Object.entries(agentInfo.roleAnalysis).map(([role, analysis]) => [
								role, 
								{
									canFulfill: analysis.canFulfill,
									confidence: Math.round(analysis.confidence * 100),
									reasoning: analysis.reasoning
								}
							])
						)
					},
					nextAction: 'Use guidant_analyze_gaps to identify improvement opportunities'
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Analyze agent capability gaps
	server.addTool({
		name: 'guidant_analyze_gaps',
		description: 'Analyze gaps in agent capabilities and get specific tool recommendations',
		parameters: z.object({
			agentId: z.string().describe('Agent ID from discovery'),
			targetProject: z.object({
				name: z.string(),
				phases: z.array(z.string()).optional()
			}).optional().describe('Specific project requirements to analyze against')
		}),
		execute: async ({ agentId, targetProject }) => {
			try {
				// Get agent info
				const agentInfo = globalAgentRegistry.getAgent(agentId);
				if (!agentInfo) {
					return {
						success: false,
						error: `Agent ${agentId} not found. Run guidant_discover_agent first.`
					};
				}

				// Perform gap analysis
				const gapAnalysis = await analyzeAgentGaps(agentInfo, targetProject ? [targetProject] : []);

				return {
					success: true,
					gapAnalysis: {
						agentId,
						gapScore: gapAnalysis.totalGapScore,
						interpretation: gapAnalysis.totalGapScore < 30 ? 'Well equipped' : 
							gapAnalysis.totalGapScore < 60 ? 'Some gaps' : 'Significant gaps',
						topRecommendations: gapAnalysis.prioritizedRecommendations.slice(0, 5).map(rec => ({
							tool: rec.name,
							priority: rec.priority,
							category: rec.category,
							benefitsRoles: rec.benefitsRoles,
							confidenceImpact: Math.round(rec.totalConfidenceImpact * 100)
						})),
						roleGaps: Object.fromEntries(
							Object.entries(gapAnalysis.roleGaps).map(([role, gap]) => [
								role,
								{
									canFulfill: gap.canCurrentlyFulfill,
									confidence: Math.round(gap.currentConfidence * 100),
									missingEssential: gap.missingEssentialCategories,
									topRecommendation: gap.recommendedTools[0]?.name
								}
							])
						)
					},
					nextAction: 'Use guidant_request_tools to get configuration instructions for missing tools'
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Request tool configuration
	server.addTool({
		name: 'guidant_request_tools',
		description: 'Request specific tools with detailed configuration instructions',
		parameters: z.object({
			agentId: z.string().describe('Agent ID from discovery'),
			requestedTools: z.array(z.string()).describe('List of tools to request'),
			context: z.object({
				taskType: z.string().optional(),
				urgency: z.enum(['low', 'medium', 'high']).optional(),
				projectPhase: z.string().optional()
			}).optional().describe('Context for why tools are needed')
		}),
		execute: async ({ agentId, requestedTools, context = {} }) => {
			try {
				// Create tool request
				const toolRequest = await requestToolsForAgent(agentId, requestedTools, context);

				return formatMCPResponse({
					success: true,
					toolRequest: {
						id: toolRequest.id,
						agentId: toolRequest.agentId,
						requestedTools: toolRequest.requiredTools,
						urgency: toolRequest.reasoning.urgency,
						reasoning: toolRequest.reasoning.summary,
						configurationInstructions: {
							title: toolRequest.instructions.title,
							overview: toolRequest.instructions.overview,
							totalSteps: toolRequest.instructions.steps.length,
							timeEstimate: toolRequest.instructions.steps.reduce((total, step) => {
								const options = step.instructions?.requirements || {};
								return total + 15; // Rough estimate per tool
							}, 0),
							steps: toolRequest.instructions.steps.map(step => ({
								tool: step.tool,
								description: step.description,
								category: step.category,
								difficulty: step.instructions?.difficulty || 'medium',
								requirements: step.instructions?.requirements || []
							})),
							alternatives: toolRequest.instructions.alternatives
						},
						implementationPlan: toolRequest.instructions.troubleshooting
					},
					nextAction: 'Follow configuration instructions, then use guidant_discover_agent again to verify'
				});
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// Get configuration suggestions
	server.addTool({
		name: 'guidant_suggest_config',
		description: 'Get optimal tool configuration suggestions for an agent',
		parameters: z.object({
			agentId: z.string().describe('Agent ID from discovery'),
			targetProject: z.object({
				name: z.string(),
				type: z.string().optional(),
				phases: z.array(z.string()).optional()
			}).optional().describe('Target project to optimize for')
		}),
		execute: async ({ agentId, targetProject }) => {
			try {
				// Get agent info
				const agentInfo = globalAgentRegistry.getAgent(agentId);
				if (!agentInfo) {
					return {
						success: false,
						error: `Agent ${agentId} not found. Run guidant_discover_agent first.`
					};
				}

				// Get configuration suggestions
				const suggestions = await getConfigurationSuggestions(agentInfo, targetProject);

				return {
					success: true,
					suggestions: {
						agentId,
						currentGapScore: suggestions.gapScore,
						totalRecommendations: suggestions.recommendations.length,
						implementationPlan: {
							phases: suggestions.implementationPlan.phases.map(phase => ({
								name: phase.phase,
								priority: phase.priority,
								tools: phase.tools,
								timeEstimate: phase.estimatedTime
							})),
							totalTimeEstimate: suggestions.implementationPlan.totalTimeEstimate,
							prerequisites: suggestions.implementationPlan.prerequisites
						},
						topRecommendations: suggestions.recommendations.slice(0, 8).map(rec => ({
							tool: rec.tool,
							priority: rec.priority,
							reasoning: rec.reasoning,
							confidenceImpact: Math.round(rec.confidenceImpact * 100),
							alternatives: rec.alternatives?.slice(0, 3)
						}))
					},
					nextAction: 'Use guidant_request_tools to get detailed instructions for priority tools'
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});

	// List discovered agents
	server.addTool({
		name: 'guidant_list_agents',
		description: 'List all discovered agents and their capabilities',
		parameters: z.object({}),
		execute: async () => {
			try {
				const agents = globalAgentRegistry.listAgents();

				return {
					success: true,
					agents: agents.map(agent => ({
						id: agent.id,
						name: agent.identity?.name || 'Unknown',
						type: agent.identity?.type || 'Unknown',
						toolCount: agent.tools?.length || 0,
						strongestRoles: agent.strongestRoles || [],
						discoveredAt: agent.discoveredAt,
						gapScore: agent.gapScore || 'Not analyzed'
					})),
					bestAgents: {
						research: globalAgentRegistry.findBestAgentForRole('research')?.identity?.name,
						design: globalAgentRegistry.findBestAgentForRole('design')?.identity?.name,
						development: globalAgentRegistry.findBestAgentForRole('development')?.identity?.name,
						testing: globalAgentRegistry.findBestAgentForRole('testing')?.identity?.name,
						deployment: globalAgentRegistry.findBestAgentForRole('deployment')?.identity?.name
					},
					nextAction: 'Use guidant_discover_agent to register current session or new agents'
				};
			} catch (error) {
				return formatMCPResponse({
					success: false,
					error: error.message
				});
			}
		}
	});
}

// Helper functions
import fs from 'fs/promises';
import path from 'path';

function calculateOverallProgress(phases) {
	const phaseCount = Object.keys(phases.phases).length;
	const completedCount = Object.values(phases.phases).filter(phase => phase.status === 'completed').length;
	return Math.round((completedCount / phaseCount) * 100);
}

function getNextMilestone(workflowState) {
	const currentPhase = workflowState.currentPhase.phase;
	const phaseDefinition = workflowState.phaseDefinition;
	
	return formatMCPResponse({
		phase: currentPhase,
		nextPhase: phaseDefinition?.nextPhase,
		description: phaseDefinition?.description
	});
}
