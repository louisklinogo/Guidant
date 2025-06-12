/**
 * Guidant Evolution MCP Tools Registry
 * Orchestrates registration of all modular MCP tools
 */

// Import tool registration functions
import { registerProjectManagementTools } from './core/project-management.js';
import { registerWorkflowControlTools } from './core/workflow-control.js';
import { registerDeliverableAnalysisTools } from './core/deliverable-analysis.js';
import { registerAgentDiscoveryTools } from './agent-registry/agent-discovery.js';
import { registerCapabilityAnalysisTools } from './agent-registry/capability-analysis.js';
import { registerAdaptiveWorkflowTools } from './workflow-intelligence/adaptive-tools.js';
import { registerQualityValidationTools } from './quality/quality-validation-tools.js';
import { registerOrchestrationTools } from './orchestration/orchestration-tools.js';
import { registerAnalyticsTools } from './analytics/analytics-tools.js';

/**
 * Register all Guidant Evolution MCP tools with the server
 * @param {object} server - MCP server instance
 */
export function registerAllGuidantTools(server) {
	try {
		// Core project management tools
		registerProjectManagementTools(server);

		// Workflow control tools
		registerWorkflowControlTools(server);

		// Deliverable analysis tools
		registerDeliverableAnalysisTools(server);

		// Agent discovery tools
		registerAgentDiscoveryTools(server);
		
		// Capability analysis tools
		registerCapabilityAnalysisTools(server);

		// Adaptive workflow intelligence tools
		registerAdaptiveWorkflowTools(server);

		// Quality validation tools
		registerQualityValidationTools(server);

		// Tool orchestration tools (MCP-009)
		registerOrchestrationTools(server);

		// Tool analytics tools (MCP-010)
		registerAnalyticsTools(server);

		console.log('✅ All Guidant Evolution MCP tools registered successfully');
		console.log('📊 Tool Categories:');
		console.log('   • Core Project Management (3 tools)');
		console.log('   • Workflow Control (3 tools)');
		console.log('   • Deliverable Analysis (3 tools)');
		console.log('   • Agent Discovery (2 tools)');
		console.log('   • Capability Analysis (3 tools)');
		console.log('   • Adaptive Workflow Intelligence (5 tools)');
		console.log('   • Quality Validation (4 tools)');
		console.log('   • Tool Orchestration (8 tools)');
		console.log('   • Tool Analytics (9 tools)');
		console.log('   📈 Total: 40 tools registered');
		
	} catch (error) {
		console.error('❌ Error registering Guidant tools:', error);
		throw error;
	}
}

/**
 * Get information about all available tools
 * @returns {object} Tool registry information
 */
export function getToolRegistry() {
	return {
		categories: {
			'core-project-management': {
				description: 'Project initialization, state management, and deliverable saving',
				tools: ['guidant_init_project', 'guidant_get_project_state', 'guidant_save_deliverable']
			},
			'workflow-control': {
				description: 'Task management, progress reporting, and phase advancement',
				tools: ['guidant_get_current_task', 'guidant_report_progress', 'guidant_advance_phase']
			},
			'deliverable-analysis': {
				description: 'Content analysis, insight extraction, and quality assessment',
				tools: ['guidant_analyze_deliverable', 'guidant_analyze_phase', 'guidant_extract_insights']
			},
			'relationship-analysis': {
				description: 'Cross-deliverable relationship mapping and change impact analysis',
				tools: ['guidant_analyze_project_relationships', 'guidant_get_deliverable_relationships', 'guidant_analyze_change_impact', 'guidant_get_relationship_system_health']
			},
			'agent-discovery': {
				description: 'AI agent capability discovery and registry management',
				tools: ['guidant_discover_agent', 'guidant_list_agents']
			},
			'capability-analysis': {
				description: 'Gap analysis, configuration suggestions, and tool requests',
				tools: ['guidant_analyze_gaps', 'guidant_request_tools', 'guidant_suggest_config']
			},
			'adaptive-workflow-intelligence': {
				description: 'Smart project classification and adaptive workflow generation',
				tools: ['guidant_classify_project', 'guidant_generate_adaptive_workflow', 'guidant_apply_adaptive_workflow', 'guidant_get_workflow_modes', 'guidant_suggest_workflow_upgrade']
			},
			'quality-validation': {
				description: 'Content quality validation, scoring, and improvement feedback',
				tools: ['guidant_validate_deliverable_quality', 'guidant_get_quality_history', 'guidant_get_quality_statistics', 'guidant_configure_quality_system']
			},
			'tool-orchestration': {
				description: 'Multi-tool workflow orchestration and execution management',
				tools: ['guidant_execute_workflow', 'guidant_get_workflow_status', 'guidant_cancel_workflow', 'guidant_list_workflow_templates', 'guidant_get_workflow_template', 'guidant_create_workflow', 'guidant_validate_workflow', 'guidant_get_orchestrator_metrics']
			},
			'tool-analytics': {
				description: 'Tool usage analytics, performance monitoring, and optimization insights',
				tools: ['guidant_get_analytics_report', 'guidant_get_tool_metrics', 'guidant_get_usage_patterns', 'guidant_start_monitoring', 'guidant_stop_monitoring', 'guidant_get_performance_summary', 'guidant_record_metric', 'guidant_get_category_metrics', 'guidant_export_analytics']
			}
		},
		totalTools: 40,
		version: '2.5.0-orchestration-analytics'
	};
}
