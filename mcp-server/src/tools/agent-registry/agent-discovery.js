/**
 * Agent Discovery Tools
 * Tools for discovering and listing AI agents and their capabilities
 */

import { z } from 'zod';
import { formatMCPResponse, formatSuccessResponse, formatErrorResponse } from '../shared/mcp-response.js';
import { 
	agentNameSchema, 
	availableToolsSchema, 
	agentTypeSchema 
} from '../shared/validation.js';

// Import agent registry functionality
import { 
	discoverAgent, 
	globalAgentRegistry 
} from '../../../../src/agent-registry/agent-discovery.js';

/**
 * Register agent discovery tools with the MCP server
 * @param {object} server - MCP server instance
 */
export function registerAgentDiscoveryTools(server) {
	// Discover current AI agent capabilities
	server.addTool({
		name: 'guidant_discover_agent',
		description: 'Discover and analyze the current AI agent\'s capabilities using universal tool registry',
		parameters: z.object({
			agentName: agentNameSchema,
			availableTools: availableToolsSchema,
			agentType: agentTypeSchema
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

				return formatMCPResponse({
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
				});
			} catch (error) {
				return formatErrorResponse(error.message);
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

				return formatMCPResponse({
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
				});
			} catch (error) {
				return formatErrorResponse(error.message);
			}
		}
	});
}
