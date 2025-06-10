/**
 * Adaptive Workflow Intelligence MCP Tools - CONSOLIDATED (MCP-005)
 * Smart project classification and adaptive workflow generation
 *
 * CONSOLIDATION: 5 tools → 3 tools (40% reduction)
 * - guidant_classify_project (unchanged)
 * - guidant_manage_adaptive_workflow (consolidates generate + apply)
 * - guidant_workflow_intelligence (consolidates modes + upgrade suggestions)
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';

// Import workflow intelligence
import {
	ProjectClassificationWizard,
	classifyProjectWithAI,
	PROJECT_TYPES,
	COMPLEXITY_LEVELS
} from '../../../../src/workflow-intelligence/project-classifier.js';
import {
	AdaptiveWorkflowGenerator,
	getWorkflowModes
} from '../../../../src/workflow-intelligence/adaptive-workflow.js';

// Import core functionality
import {
	isProjectInitialized,
	getProjectState
} from '../../../../src/file-management/project-structure.js';

/**
 * Register adaptive workflow intelligence tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerAdaptiveWorkflowTools(server) {
	// Smart project classification wizard
	server.addTool({
		name: 'guidant_classify_project',
		description: 'Classify project type and complexity using 3-question wizard or AI analysis',
		parameters: z.object({
			method: z.enum(['wizard', 'ai', 'auto']).default('auto').describe('Classification method to use'),
			projectDescription: z.string().optional().describe('Project description for AI analysis'),
			wizardAnswers: z.object({
				scope: z.enum(['proof_concept', 'add_feature', 'full_product', 'research_analysis', 'automation_script']).optional(),
				timeline: z.enum(['days', 'weeks_short', 'weeks_long', 'months']).optional(),
				quality: z.enum(['basic', 'standard', 'enterprise']).optional()
			}).optional().describe('Answers to classification wizard questions')
		}),
		execute: async ({ method = 'auto', projectDescription, wizardAnswers }) => {
			try {
				const projectRoot = process.cwd();
				let classification = null;

				// Auto method: try AI first, fallback to wizard
				if (method === 'auto' || method === 'ai') {
					if (projectDescription) {
						const aiResult = await classifyProjectWithAI(projectDescription, [], projectRoot);
						if (aiResult.success) {
							classification = {
								...aiResult.classification,
								method: 'ai',
								source: 'AI analysis'
							};
						}
					}
				}

				// Wizard method or AI fallback
				if (!classification && (method === 'wizard' || method === 'auto')) {
					if (wizardAnswers && wizardAnswers.scope && wizardAnswers.timeline && wizardAnswers.quality) {
						const wizard = new ProjectClassificationWizard();
						const wizardResult = wizard.classifyProject(wizardAnswers);
						classification = {
							...wizardResult,
							method: 'wizard',
							source: 'Classification wizard'
						};
					} else {
						// Return wizard questions for user to answer
						const wizard = new ProjectClassificationWizard();
						return formatMCPResponse({
							success: true,
							needsInput: true,
							wizard: {
								questions: wizard.questions,
								instructions: 'Please answer these questions to classify your project'
							},
							availableTypes: PROJECT_TYPES,
							complexityLevels: COMPLEXITY_LEVELS
						});
					}
				}

				if (!classification) {
					return formatErrorResponse(
						'Unable to classify project. Please provide project description or wizard answers.'
					);
				}

				return formatMCPResponse({
					success: true,
					classification,
					projectType: PROJECT_TYPES[classification.type],
					complexity: COMPLEXITY_LEVELS[classification.complexity || classification.projectType?.complexity],
					nextAction: 'Use guidant_generate_adaptive_workflow to create optimized workflow'
				});

			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// CONSOLIDATED: Manage adaptive workflow (generate + apply operations)
	server.addTool({
		name: 'guidant_manage_adaptive_workflow',
		description: 'Manage adaptive workflow with operation: generate, apply, or generate_and_apply',
		parameters: z.object({
			operation: z.enum(['generate', 'apply', 'generate_and_apply']).describe('Operation to perform'),
			classification: z.object({
				type: z.string().describe('Project type from classification'),
				complexity: z.string().optional().describe('Complexity level'),
				projectType: z.object({
					phases: z.array(z.string()),
					complexity: z.string(),
					qualityLevel: z.string()
				}).optional()
			}).optional().describe('Project classification result (required for generate operations)'),
			workflowConfig: z.object({
				phases: z.object({}).describe('Phase configuration'),
				qualityGates: z.object({}).describe('Quality gate configuration'),
				metadata: z.object({}).describe('Workflow metadata')
			}).optional().describe('Workflow configuration (required for apply operations)'),
			customizations: z.object({
				additionalPhases: z.array(z.string()).optional().describe('Additional phases to include'),
				skipPhases: z.array(z.string()).optional().describe('Phases to skip'),
				qualityOverride: z.enum(['basic', 'standard', 'enterprise']).optional().describe('Override quality level')
			}).optional().describe('Workflow customizations'),
			confirm: z.boolean().default(false).describe('Confirm application of workflow (for apply operations)')
		}),
		execute: async ({ operation, classification, workflowConfig, customizations = {}, confirm = false }) => {
			try {
				const projectRoot = process.cwd();

				if (operation === 'generate' || operation === 'generate_and_apply') {
					if (!classification) {
						return formatErrorResponse('Classification is required for generate operations');
					}

					// Ensure we have complete classification
					const projectType = classification.projectType || PROJECT_TYPES[classification.type];
					const complexity = classification.complexity ?
						COMPLEXITY_LEVELS[classification.complexity] :
						COMPLEXITY_LEVELS[projectType.complexity];

					const completeClassification = {
						type: classification.type,
						projectType,
						complexity
					};

					// Generate adaptive workflow
					const generator = new AdaptiveWorkflowGenerator();
					workflowConfig = await generator.generateWorkflow(completeClassification, projectRoot);

					// Apply customizations
					if (customizations.additionalPhases) {
						customizations.additionalPhases.forEach(phase => {
							if (!workflowConfig.phases.phases[phase]?.required) {
								workflowConfig.phases.phases[phase] = {
									status: 'pending',
									required: true,
									customAdded: true
								};
							}
						});
					}

					if (customizations.skipPhases) {
						customizations.skipPhases.forEach(phase => {
							if (workflowConfig.phases.phases[phase]) {
								workflowConfig.phases.phases[phase] = {
									status: 'skipped',
									required: false,
									customSkipped: true
								};
							}
						});
					}

					if (operation === 'generate') {
						return formatMCPResponse({
							success: true,
							workflowConfig,
							summary: {
								projectType: classification.type,
								complexity: complexity.name,
								phases: Object.keys(workflowConfig.phases.phases).filter(
									phase => workflowConfig.phases.phases[phase].required
								),
								estimatedDuration: projectType.estimatedDuration,
								qualityLevel: customizations.qualityOverride || projectType.qualityLevel
							},
							nextAction: 'Use operation: apply to apply this configuration'
						});
					}
				}

				if (operation === 'apply' || operation === 'generate_and_apply') {
					if (!workflowConfig) {
						return formatErrorResponse('Workflow configuration is required for apply operations');
					}

					if (!confirm && operation !== 'generate_and_apply') {
						return formatMCPResponse({
							success: false,
							message: 'Workflow application requires confirmation',
							preview: {
								phases: Object.keys(workflowConfig.phases.phases).filter(
									phase => workflowConfig.phases.phases[phase].required
								),
								qualityLevel: workflowConfig.metadata.qualityLevel,
								estimatedDuration: workflowConfig.metadata.estimatedDuration
							},
							nextAction: 'Call again with confirm: true to apply workflow'
						});
					}

					// Check if project is already initialized
					if (await isProjectInitialized(projectRoot)) {
						const currentState = await getProjectState(projectRoot);
						if (currentState.workflow?.adaptive) {
							return formatErrorResponse(
								'Project already has adaptive workflow. Use workflow intelligence to modify.'
							);
						}
					}

					// Apply workflow configuration
					const generator = new AdaptiveWorkflowGenerator();
					const result = await generator.applyWorkflow(workflowConfig, projectRoot);

					if (result.success) {
						return formatMCPResponse({
							success: true,
							message: 'Adaptive workflow applied successfully',
							workflow: result.workflow,
							activePhase: workflowConfig.phases.current,
							nextAction: 'Use guidant_get_current_task to start working with adaptive workflow'
						});
					}

					return formatErrorResponse(result.error);
				}

				return formatErrorResponse(`Unknown operation: ${operation}`);

			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// CONSOLIDATED: Workflow intelligence (modes + upgrade suggestions + analysis)
	server.addTool({
		name: 'guidant_workflow_intelligence',
		description: 'Workflow intelligence with operation: get_modes, suggest_upgrade, or analyze_all',
		parameters: z.object({
			operation: z.enum(['get_modes', 'suggest_upgrade', 'analyze_all']).describe('Intelligence operation to perform'),
			currentMetrics: z.object({
				codebaseSize: z.number().optional().describe('Lines of code or file count'),
				userFeedback: z.number().optional().describe('Number of user feedback items'),
				teamSize: z.number().optional().describe('Number of team members'),
				timeSpent: z.number().optional().describe('Days spent on project')
			}).optional().describe('Current project metrics (for upgrade suggestions)')
		}),
		execute: async ({ operation, currentMetrics = {} }) => {
			try {
				const projectRoot = process.cwd();

				if (operation === 'get_modes') {
					const modes = getWorkflowModes();

					return formatMCPResponse({
						success: true,
						modes,
						recommendation: 'guided',
						description: 'Choose your preferred workflow setup approach',
						nextAction: 'Select a mode and use appropriate classification tool'
					});
				}

				if (operation === 'suggest_upgrade') {
					if (!(await isProjectInitialized(projectRoot))) {
						return formatErrorResponse(
							'Project not initialized. Initialize project first.'
						);
					}

					const projectState = await getProjectState(projectRoot);
					const currentWorkflow = projectState.workflow;

					if (!currentWorkflow?.adaptive) {
						return formatMCPResponse({
							success: true,
							suggestion: {
								type: 'migrate_to_adaptive',
								reason: 'Project using legacy workflow',
								benefits: ['Flexible phases', 'Right-sized quality gates', 'Better task generation'],
								action: 'Use guidant_classify_project to migrate to adaptive workflow'
							}
						});
					}

					// Generate upgrade suggestions
					const generator = new AdaptiveWorkflowGenerator();
					const suggestions = generator.suggestWorkflowUpgrade(currentWorkflow, currentMetrics);

					return formatMCPResponse({
						success: true,
						currentWorkflow: {
							type: currentWorkflow.projectType,
							complexity: currentWorkflow.complexity,
							phases: currentWorkflow.phases
						},
						suggestions,
						metrics: currentMetrics,
						nextAction: suggestions.length > 0 ?
							'Consider implementing suggested upgrades' :
							'Current workflow is optimal for project state'
					});
				}

				if (operation === 'analyze_all') {
					// Comprehensive workflow analysis
					const modes = getWorkflowModes();
					let upgradeAnalysis = null;
					let projectAnalysis = null;

					if (await isProjectInitialized(projectRoot)) {
						const projectState = await getProjectState(projectRoot);
						const currentWorkflow = projectState.workflow;

						projectAnalysis = {
							initialized: true,
							hasAdaptiveWorkflow: !!currentWorkflow?.adaptive,
							currentType: currentWorkflow?.projectType,
							currentComplexity: currentWorkflow?.complexity
						};

						if (currentWorkflow?.adaptive) {
							const generator = new AdaptiveWorkflowGenerator();
							const suggestions = generator.suggestWorkflowUpgrade(currentWorkflow, currentMetrics);
							upgradeAnalysis = {
								suggestions,
								needsUpgrade: suggestions.length > 0
							};
						}
					} else {
						projectAnalysis = {
							initialized: false,
							recommendation: 'Initialize project with guidant_classify_project'
						};
					}

					return formatMCPResponse({
						success: true,
						analysis: {
							workflowModes: modes,
							project: projectAnalysis,
							upgrades: upgradeAnalysis,
							metrics: currentMetrics
						},
						recommendations: projectAnalysis.initialized ?
							(upgradeAnalysis?.needsUpgrade ? 'Consider workflow upgrades' : 'Workflow is optimal') :
							'Start with project classification',
						nextAction: projectAnalysis.initialized ?
							'Use specific operations for detailed analysis' :
							'Use guidant_classify_project to initialize'
					});
				}

				return formatErrorResponse(`Unknown operation: ${operation}`);

			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// ========================================
	// DEPRECATED TOOLS (Backward Compatibility)
	// ========================================

	// DEPRECATED: Use guidant_manage_adaptive_workflow with operation: 'generate'
	server.addTool({
		name: 'guidant_generate_adaptive_workflow',
		description: '[DEPRECATED] Use guidant_manage_adaptive_workflow with operation: generate instead',
		parameters: z.object({
			classification: z.object({}).describe('Project classification'),
			customizations: z.object({}).optional().describe('Workflow customizations')
		}),
		execute: async ({ classification, customizations }) => {
			return formatMCPResponse({
				success: false,
				deprecated: true,
				message: 'This tool has been deprecated. Use guidant_manage_adaptive_workflow instead.',
				migration: {
					newTool: 'guidant_manage_adaptive_workflow',
					newParameters: {
						operation: 'generate',
						classification,
						customizations
					}
				}
			});
		}
	});

	// DEPRECATED: Use guidant_manage_adaptive_workflow with operation: 'apply'
	server.addTool({
		name: 'guidant_apply_adaptive_workflow',
		description: '[DEPRECATED] Use guidant_manage_adaptive_workflow with operation: apply instead',
		parameters: z.object({
			workflowConfig: z.object({}).describe('Workflow configuration'),
			confirm: z.boolean().default(false).describe('Confirm application')
		}),
		execute: async ({ workflowConfig, confirm }) => {
			return formatMCPResponse({
				success: false,
				deprecated: true,
				message: 'This tool has been deprecated. Use guidant_manage_adaptive_workflow instead.',
				migration: {
					newTool: 'guidant_manage_adaptive_workflow',
					newParameters: {
						operation: 'apply',
						workflowConfig,
						confirm
					}
				}
			});
		}
	});

	// DEPRECATED: Use guidant_workflow_intelligence with operation: 'get_modes'
	server.addTool({
		name: 'guidant_get_workflow_modes',
		description: '[DEPRECATED] Use guidant_workflow_intelligence with operation: get_modes instead',
		parameters: z.object({}),
		execute: async () => {
			return formatMCPResponse({
				success: false,
				deprecated: true,
				message: 'This tool has been deprecated. Use guidant_workflow_intelligence instead.',
				migration: {
					newTool: 'guidant_workflow_intelligence',
					newParameters: {
						operation: 'get_modes'
					}
				}
			});
		}
	});

	// DEPRECATED: Use guidant_workflow_intelligence with operation: 'suggest_upgrade'
	server.addTool({
		name: 'guidant_suggest_workflow_upgrade',
		description: '[DEPRECATED] Use guidant_workflow_intelligence with operation: suggest_upgrade instead',
		parameters: z.object({
			currentMetrics: z.object({}).optional().describe('Current project metrics')
		}),
		execute: async ({ currentMetrics }) => {
			return formatMCPResponse({
				success: false,
				deprecated: true,
				message: 'This tool has been deprecated. Use guidant_workflow_intelligence instead.',
				migration: {
					newTool: 'guidant_workflow_intelligence',
					newParameters: {
						operation: 'suggest_upgrade',
						currentMetrics
					}
				}
			});
		}
	});
}
