/**
 * Adaptive Workflow System
 * Creates flexible workflows based on project classification
 */

import { PROJECT_TYPES, COMPLEXITY_LEVELS } from './project-classifier.js';
import { writeProjectFile, readProjectFile } from '../file-management/project-structure.js';
import { PROJECT_PHASES, QUALITY_GATES, PROJECT_METADATA } from '../constants/paths.js';

/**
 * Quality gate definitions by complexity level
 */
const QUALITY_GATE_TEMPLATES = {
	simple: {
		concept: {
			required: ['basic_research'],
			optional: ['user_personas'],
			description: 'Basic validation and research'
		},
		design: {
			required: ['wireframes'],
			optional: ['user_flows'],
			description: 'Simple design and layout'
		},
		implementation: {
			required: ['core_features'],
			optional: ['basic_testing'],
			description: 'Core functionality implementation'
		}
	},
	
	standard: {
		concept: {
			required: ['market_analysis', 'user_personas'],
			optional: ['competitor_research'],
			description: 'Comprehensive research and validation'
		},
		requirements: {
			required: ['prd_complete', 'user_stories'],
			optional: ['feature_specifications'],
			description: 'Detailed requirements and specifications'
		},
		design: {
			required: ['wireframes', 'user_flows'],
			optional: ['component_specifications'],
			description: 'Complete design and user experience'
		},
		implementation: {
			required: ['core_features', 'testing_suite'],
			optional: ['documentation'],
			description: 'Full implementation with testing'
		},
		deployment: {
			required: ['production_environment'],
			optional: ['monitoring_setup'],
			description: 'Production deployment'
		}
	},
	
	enterprise: {
		concept: {
			required: ['market_analysis', 'user_personas', 'competitor_research'],
			optional: ['stakeholder_analysis'],
			description: 'Comprehensive market and user research'
		},
		requirements: {
			required: ['prd_complete', 'user_stories', 'feature_specifications'],
			optional: ['acceptance_criteria'],
			description: 'Detailed requirements with specifications'
		},
		design: {
			required: ['wireframes', 'user_flows', 'component_specifications'],
			optional: ['design_system'],
			description: 'Complete design system and specifications'
		},
		architecture: {
			required: ['system_design', 'database_schema', 'api_specification'],
			optional: ['security_design'],
			description: 'Comprehensive technical architecture'
		},
		implementation: {
			required: ['core_features', 'testing_suite', 'documentation'],
			optional: ['performance_optimization'],
			description: 'Full implementation with comprehensive testing'
		},
		deployment: {
			required: ['production_environment', 'monitoring_setup', 'user_documentation'],
			optional: ['disaster_recovery'],
			description: 'Enterprise-grade deployment and monitoring'
		}
	}
};

/**
 * Research requirement templates by project type
 */
const RESEARCH_REQUIREMENTS = {
	prototype: {
		mandatory: ['basic_validation'],
		checkpoints: ['concept_validation'],
		depth: 'minimal'
	},
	
	feature: {
		mandatory: ['user_impact_analysis', 'integration_research'],
		checkpoints: ['requirements_validation', 'design_validation'],
		depth: 'moderate'
	},
	
	product: {
		mandatory: ['market_research', 'competitor_analysis', 'user_research'],
		checkpoints: ['concept_validation', 'requirements_validation', 'design_validation', 'architecture_validation'],
		depth: 'comprehensive'
	},
	
	research: {
		mandatory: ['literature_review', 'methodology_design'],
		checkpoints: ['research_design_validation', 'methodology_validation'],
		depth: 'extensive'
	},
	
	script: {
		mandatory: ['requirements_analysis'],
		checkpoints: ['implementation_validation'],
		depth: 'minimal'
	}
};

/**
 * Adaptive Workflow Generator
 */
export class AdaptiveWorkflowGenerator {
	/**
	 * Generate workflow configuration based on project classification
	 */
	async generateWorkflow(classification, projectRoot = process.cwd()) {
		const { type, complexity, projectType } = classification;
		
		// Generate phase configuration
		const phases = this.generatePhaseConfiguration(projectType, complexity);
		
		// Generate quality gates
		const qualityGates = this.generateQualityGates(projectType.phases, complexity.name.toLowerCase());
		
		// Generate research requirements
		const researchRequirements = this.generateResearchRequirements(type);
		
		// Create workflow metadata
		const workflowMetadata = {
			projectType: type,
			complexity: complexity.name.toLowerCase(),
			phases: projectType.phases,
			estimatedDuration: projectType.estimatedDuration,
			qualityLevel: projectType.qualityLevel,
			researchRequirement: projectType.researchRequirement,
			generated: new Date().toISOString(),
			adaptive: true
		};

		return {
			phases,
			qualityGates,
			researchRequirements,
			metadata: workflowMetadata
		};
	}

	/**
	 * Generate phase configuration with flexible sequencing
	 */
	generatePhaseConfiguration(projectType, complexity) {
		const phases = {
			current: projectType.phases[0],
			phases: {}
		};

		// Initialize all possible phases as pending
		const allPhases = ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'];
		allPhases.forEach(phase => {
			phases.phases[phase] = { status: 'pending' };
		});

		// Activate phases included in project type
		projectType.phases.forEach((phase, index) => {
			if (index === 0) {
				phases.phases[phase] = {
					status: 'active',
					startedAt: new Date().toISOString(),
					required: true
				};
			} else {
				phases.phases[phase] = {
					status: 'pending',
					required: true
				};
			}
		});

		// Mark excluded phases as optional or skipped
		allPhases.forEach(phase => {
			if (!projectType.phases.includes(phase)) {
				phases.phases[phase] = {
					status: 'optional',
					required: false,
					reason: `Not required for ${projectType.name.toLowerCase()} projects`
				};
			}
		});

		return phases;
	}

	/**
	 * Generate quality gates based on complexity level
	 */
	generateQualityGates(projectPhases, complexityLevel) {
		const qualityGates = {};
		const template = QUALITY_GATE_TEMPLATES[complexityLevel] || QUALITY_GATE_TEMPLATES.standard;

		projectPhases.forEach(phase => {
			if (template[phase]) {
				qualityGates[phase] = {
					...template[phase],
					status: 'pending',
					completed: []
				};
			} else {
				// Fallback for phases not in template
				qualityGates[phase] = {
					required: ['basic_completion'],
					optional: [],
					description: `Complete ${phase} phase deliverables`,
					status: 'pending',
					completed: []
				};
			}
		});

		return qualityGates;
	}

	/**
	 * Generate research requirements based on project type
	 */
	generateResearchRequirements(projectType) {
		const requirements = RESEARCH_REQUIREMENTS[projectType] || RESEARCH_REQUIREMENTS.feature;
		
		return {
			...requirements,
			enforced: true,
			checkpoints: requirements.checkpoints.map(checkpoint => ({
				name: checkpoint,
				required: true,
				status: 'pending',
				description: `Research validation checkpoint: ${checkpoint.replace('_', ' ')}`
			}))
		};
	}

	/**
	 * Apply workflow configuration to project
	 */
	async applyWorkflow(workflowConfig, projectRoot = process.cwd()) {
		try {
			// Write phase configuration
			await writeProjectFile(PROJECT_PHASES, workflowConfig.phases, projectRoot);
			
			// Write quality gates
			await writeProjectFile(QUALITY_GATES, workflowConfig.qualityGates, projectRoot);
			
			// Update project metadata with workflow info
			const existingMetadata = await readProjectFile(PROJECT_METADATA, projectRoot);
			const updatedMetadata = {
				...existingMetadata,
				workflow: workflowConfig.metadata,
				researchRequirements: workflowConfig.researchRequirements
			};
			await writeProjectFile(PROJECT_METADATA, updatedMetadata, projectRoot);

			return {
				success: true,
				message: 'Adaptive workflow applied successfully',
				workflow: workflowConfig.metadata
			};
		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Suggest workflow upgrades based on project evolution
	 */
	suggestWorkflowUpgrade(currentWorkflow, projectEvolution) {
		const suggestions = [];

		// Suggest complexity upgrade if project is growing
		if (projectEvolution.codebaseSize > 1000 && currentWorkflow.complexity === 'simple') {
			suggestions.push({
				type: 'complexity_upgrade',
				from: 'simple',
				to: 'standard',
				reason: 'Project has grown in complexity',
				benefits: ['Better testing', 'More documentation', 'Improved quality gates']
			});
		}

		// Suggest additional phases if missing critical ones
		if (currentWorkflow.projectType === 'prototype' && projectEvolution.userFeedback > 5) {
			suggestions.push({
				type: 'phase_addition',
				phases: ['requirements', 'architecture'],
				reason: 'User feedback indicates need for more structured development',
				benefits: ['Better requirements', 'Scalable architecture']
			});
		}

		return suggestions;
	}
}

/**
 * Workflow Mode Selection Helper
 */
export function getWorkflowModes() {
	return {
		quickStart: {
			name: 'Quick Start',
			description: 'Minimal setup, get started immediately',
			classification: { type: 'prototype', complexity: 'simple' },
			timeToStart: '< 5 minutes'
		},
		
		guided: {
			name: 'Guided Setup',
			description: 'Answer questions to get optimal workflow',
			classification: 'wizard',
			timeToStart: '5-10 minutes'
		},
		
		expert: {
			name: 'Expert Mode',
			description: 'Full customization and control',
			classification: 'manual',
			timeToStart: '10-20 minutes'
		}
	};
}
