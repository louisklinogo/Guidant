/**
 * Capability Analysis Tools
 * Tools for analyzing agent gaps, suggesting configurations, and requesting tools
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import { 
	agentIdSchema, 
	targetProjectSchema,
	toolRequestContextSchema
} from '../shared/validation.js';

// Import agent registry functionality
import { globalAgentRegistry } from '../../../../src/agent-registry/agent-discovery.js';
import { analyzeAgentGaps } from '../../../../src/agent-registry/gap-analysis.js';
import { 
	getConfigurationSuggestions, 
	requestToolsForAgent 
} from '../../../../src/agent-registry/tool-configurator.js';

/**
 * Register capability analysis tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerCapabilityAnalysisTools(server) {
	// Analyze agent capability gaps
	server.addTool({
		name: 'guidant_analyze_gaps',
		description: 'Analyze gaps in agent capabilities and get specific tool recommendations',
		parameters: z.object({
			agentId: agentIdSchema,
			targetProject: targetProjectSchema
		}),
		execute: async ({ agentId, targetProject }) => {
			try {
				// Get agent info
				const agentInfo = globalAgentRegistry.getAgent(agentId);
				if (!agentInfo) {
					return formatErrorResponse(
						`Agent ${agentId} not found. Run guidant_discover_agent first.`
					);
				}

				// Perform gap analysis
				const gapAnalysis = await analyzeAgentGaps(agentInfo, targetProject ? [targetProject] : []);

				return formatMCPResponse({
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
				});
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});

	// Request tool configuration
	server.addTool({
		name: 'guidant_request_tools',
		description: 'Request specific tools with detailed configuration instructions',
		parameters: z.object({
			agentId: agentIdSchema,
			requestedTools: z.array(z.string()).describe('List of tools to request'),
			context: toolRequestContextSchema
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
				return formatErrorResponse(error.message);
			}
		}
	});

	// Get configuration suggestions
	server.addTool({
		name: 'guidant_suggest_config',
		description: 'Get optimal tool configuration suggestions for an agent',
		parameters: z.object({
			agentId: agentIdSchema,
			targetProject: targetProjectSchema
		}),
		execute: async ({ agentId, targetProject }) => {
			try {
				// Get agent info
				const agentInfo = globalAgentRegistry.getAgent(agentId);
				if (!agentInfo) {
					return formatErrorResponse(
						`Agent ${agentId} not found. Run guidant_discover_agent first.`
					);
				}

				// Get configuration suggestions
				const suggestions = await getConfigurationSuggestions(agentInfo, targetProject);

				return formatMCPResponse({
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
				});
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});
}
