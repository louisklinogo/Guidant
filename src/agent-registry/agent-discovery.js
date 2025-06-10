/**
 * Agent Discovery Protocol for Guidant Evolution
 * Universal system to discover any AI agent's capabilities
 */

import { UNIVERSAL_TOOL_REGISTRY, analyzeRoleCoverage, identifyOptimalTools } from '../ai-coordination/tool-registry.js';

/**
 * Agent Discovery Protocol - Works with any AI agent
 */
export class AgentDiscovery {
  constructor() {
    this.knownAgents = new Map();
    this.discoveryPrompts = {
      tools: "What tools and functions do you have access to? Please list them.",
      identity: "What is your name/identifier and what type of AI agent are you?",
      capabilities: "What are your main strengths and limitations?",
      preferences: "What types of tasks do you perform best at?"
    };
  }

  /**
   * Universal agent discovery - works via any communication method
   */
  async discoverAgent(communicationMethod, agentId = null) {
    const agentInfo = {
      id: agentId || `agent_${Date.now()}`,
      discoveredAt: new Date().toISOString(),
      tools: [],
      identity: {},
      capabilities: {},
      status: 'discovering'
    };

    try {
      // Method 1: Direct API/Function call discovery
      if (communicationMethod.type === 'direct') {
        return await this.discoverDirectly(communicationMethod.agent, agentInfo);
      }

      // Method 2: Interactive prompt-based discovery 
      if (communicationMethod.type === 'interactive') {
        return await this.discoverInteractively(communicationMethod.promptFunction, agentInfo);
      }

      // Method 3: MCP-based discovery
      if (communicationMethod.type === 'mcp') {
        return await this.discoverViaMCP(communicationMethod.server, agentInfo);
      }

      // Method 4: Configuration-based discovery
      if (communicationMethod.type === 'config') {
        return await this.discoverFromConfig(communicationMethod.config, agentInfo);
      }

    } catch (error) {
      agentInfo.status = 'discovery_failed';
      agentInfo.error = error.message;
    }

    return agentInfo;
  }

  /**
   * Direct discovery - Agent has explicit capability reporting
   */
  async discoverDirectly(agent, agentInfo) {
    if (typeof agent.reportCapabilities === 'function') {
      const capabilities = await agent.reportCapabilities();
      
      agentInfo.tools = capabilities.tools || [];
      agentInfo.identity = capabilities.identity || {};
      agentInfo.capabilities = capabilities.capabilities || {};
      agentInfo.status = 'discovered';
      
      return this.analyzeDiscoveredAgent(agentInfo);
    }

    throw new Error('Agent does not support direct capability reporting');
  }

  /**
   * Interactive discovery - Ask agent about its capabilities
   */
  async discoverInteractively(promptFunction, agentInfo) {
    const responses = {};

    // Ask about tools
    responses.tools = await promptFunction(this.discoveryPrompts.tools);
    agentInfo.tools = this.parseToolsFromResponse(responses.tools);

    // Ask about identity
    responses.identity = await promptFunction(this.discoveryPrompts.identity);
    agentInfo.identity = this.parseIdentityFromResponse(responses.identity);

    // Ask about capabilities
    responses.capabilities = await promptFunction(this.discoveryPrompts.capabilities);
    agentInfo.capabilities = this.parseCapabilitiesFromResponse(responses.capabilities);

    agentInfo.status = 'discovered';
    agentInfo.discoveryResponses = responses;

    return this.analyzeDiscoveredAgent(agentInfo);
  }

  /**
   * MCP discovery - Discover via Model Context Protocol
   */
  async discoverViaMCP(mcpServer, agentInfo) {
    if (mcpServer && mcpServer.getAvailableTools) {
      const tools = await mcpServer.getAvailableTools();
      agentInfo.tools = tools.map(tool => tool.name || tool);
      agentInfo.identity = { type: 'mcp_agent', server: mcpServer.name };
      agentInfo.status = 'discovered';
      
      return this.analyzeDiscoveredAgent(agentInfo);
    }

    throw new Error('MCP server does not support tool discovery');
  }

  /**
   * Config-based discovery - Load from configuration
   */
  async discoverFromConfig(config, agentInfo) {
    agentInfo.tools = config.tools || [];
    agentInfo.identity = config.identity || {};
    agentInfo.capabilities = config.capabilities || {};
    agentInfo.status = 'discovered';
    agentInfo.source = 'configuration';

    return this.analyzeDiscoveredAgent(agentInfo);
  }

  /**
   * Analyze discovered agent and assess capabilities
   */
  async analyzeDiscoveredAgent(agentInfo) {
    // Normalize tool names (handle aliases)
    agentInfo.normalizedTools = this.normalizeToolNames(agentInfo.tools);

    // Analyze role capabilities
    agentInfo.roleAnalysis = {};
    const roles = ['research', 'design', 'development', 'testing', 'deployment'];
    
    roles.forEach(role => {
      agentInfo.roleAnalysis[role] = analyzeRoleCoverage(agentInfo.normalizedTools, role);
    });

    // Identify optimal tools for improvement
    agentInfo.improvementSuggestions = {};
    roles.forEach(role => {
      const suggestions = identifyOptimalTools(agentInfo.normalizedTools, role);
      if (suggestions.length > 0) {
        agentInfo.improvementSuggestions[role] = suggestions;
      }
    });

    // Determine agent's strongest roles
    agentInfo.strongestRoles = roles
      .filter(role => agentInfo.roleAnalysis[role].canFulfill)
      .sort((a, b) => agentInfo.roleAnalysis[b].confidence - agentInfo.roleAnalysis[a].confidence);

    // Store in registry
    this.knownAgents.set(agentInfo.id, agentInfo);

    return agentInfo;
  }

  /**
   * Normalize tool names using registry aliases
   */
  normalizeToolNames(tools) {
    return tools.map(toolName => {
      // Check if it's already a known tool
      if (UNIVERSAL_TOOL_REGISTRY[toolName]) {
        return toolName;
      }

      // Look for aliases
      for (const [registryTool, info] of Object.entries(UNIVERSAL_TOOL_REGISTRY)) {
        if (info.alternatives?.includes(toolName)) {
          return registryTool;
        }
      }

      // Return as-is if not found (will be marked as unknown)
      return toolName;
    });
  }

  /**
   * Parse tools from natural language response
   */
  parseToolsFromResponse(response) {
    const tools = [];
    const lines = response.split('\n');
    
    lines.forEach(line => {
      // Look for tool patterns: "- toolname", "toolname:", "I have toolname"
      const matches = line.match(/(?:^-\s*|:\s*|have\s+|access\s+to\s+)([a-zA-Z_-]+)/gi);
      if (matches) {
        matches.forEach(match => {
          const tool = match.replace(/^(-\s*|:\s*|.*have\s+|.*access\s+to\s+)/i, '').trim();
          if (tool && !tools.includes(tool)) {
            tools.push(tool);
          }
        });
      }
    });

    return tools;
  }

  /**
   * Parse identity information from response
   */
  parseIdentityFromResponse(response) {
    const identity = { raw_response: response };
    
    // Extract name
    const nameMatch = response.match(/(?:I am|My name is|I'm called|Known as)\s+([A-Za-z0-9\s]+)/i);
    if (nameMatch) {
      identity.name = nameMatch[1].trim();
    }

    // Extract type
    const typeMatch = response.match(/(Claude|GPT|Copilot|AI assistant|language model)/i);
    if (typeMatch) {
      identity.type = typeMatch[1].toLowerCase();
    }

    return identity;
  }

  /**
   * Parse capabilities from response
   */
  parseCapabilitiesFromResponse(response) {
    return {
      raw_response: response,
      strengths: this.extractStrengths(response),
      limitations: this.extractLimitations(response)
    };
  }

  /**
   * Extract strengths from capability description
   */
  extractStrengths(response) {
    const strengths = [];
    const strengthPatterns = [
      /good at ([^.,\n]+)/gi,
      /excel at ([^.,\n]+)/gi,
      /strong in ([^.,\n]+)/gi,
      /capable of ([^.,\n]+)/gi
    ];

    strengthPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        strengths.push(match[1].trim());
      }
    });

    return strengths;
  }

  /**
   * Extract limitations from capability description
   */
  extractLimitations(response) {
    const limitations = [];
    const limitationPatterns = [
      /cannot ([^.,\n]+)/gi,
      /limited in ([^.,\n]+)/gi,
      /don't have access to ([^.,\n]+)/gi,
      /unable to ([^.,\n]+)/gi
    ];

    limitationPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        limitations.push(match[1].trim());
      }
    });

    return limitations;
  }

  /**
   * Get known agent information
   */
  getAgent(agentId) {
    return this.knownAgents.get(agentId);
  }

  /**
   * List all known agents
   */
  listAgents() {
    return Array.from(this.knownAgents.values());
  }

  /**
   * Find best agent for a specific role
   */
  findBestAgentForRole(role) {
    const agents = this.listAgents();
    
    return agents
      .filter(agent => agent.roleAnalysis?.[role]?.canFulfill)
      .sort((a, b) => (b.roleAnalysis[role]?.confidence || 0) - (a.roleAnalysis[role]?.confidence || 0))[0];
  }
}

/**
 * Global agent registry instance
 */
export const globalAgentRegistry = new AgentDiscovery();

/**
 * Convenience function for quick agent discovery
 */
export async function discoverAgent(method, agentId) {
  return await globalAgentRegistry.discoverAgent(method, agentId);
}

/**
 * Discover current agent - MCP-aware with honest console limitations
 */
export async function discoverCurrentAgent() {
  // Check if we're in an MCP environment
  if (await isMCPEnvironment()) {
    console.log('🔍 MCP environment detected - agent discovery will be effective');
    return await discoverAgentViaMCP();
  } else {
    console.log('📟 Console environment detected - limited discovery (agent discovery only effective in MCP)');
    return await discoverAgentInConsole();
  }
}

/**
 * Check if we're running in an MCP environment where real tool discovery is possible
 */
async function isMCPEnvironment() {
  // Check for MCP-specific indicators
  return (
    typeof globalThis !== 'undefined' &&
    (globalThis.mcpServer || globalThis.mcpTools || process.env.MCP_SERVER || process.env.MCP_ENABLED)
  );
}

/**
 * Discover agent capabilities via MCP (real tool discovery)
 * This is where the REAL agent discovery happens
 */
async function discoverAgentViaMCP() {
  try {
    // In a real MCP environment, we would query the actual available tools
    // This would use the MCP protocol to get the real tool list
    const mcpTools = await queryMCPTools();

    const currentAgent = {
      id: 'mcp_session_agent',
      type: 'mcp_discovery',
      tools: mcpTools,
      identity: {
        type: 'ai_assistant',
        environment: 'mcp',
        mcpEnabled: true,
        realDiscovery: true
      },
      discoveredAt: new Date().toISOString(),
      detectionMethod: 'mcp_protocol'
    };

    const discoveryMethod = {
      type: 'config',
      config: {
        tools: mcpTools,
        identity: currentAgent.identity,
        capabilities: {
          strengths: determineStrengthsFromTools(mcpTools),
          limitations: ['mcp_dependent']
        }
      }
    };

    return await globalAgentRegistry.discoverAgent(discoveryMethod, 'mcp_session');
  } catch (error) {
    console.warn('MCP discovery failed, falling back to console mode:', error.message);
    return await discoverAgentInConsole();
  }
}

/**
 * Console environment discovery - honest about limitations
 */
async function discoverAgentInConsole() {
  const currentAgent = {
    id: 'console_session_agent',
    type: 'console_limited',
    tools: [], // No real tool discovery possible in console
    identity: {
      type: 'ai_assistant',
      environment: 'console',
      realDiscovery: false,
      limitations: [
        'no_real_tool_discovery',
        'console_environment_only',
        'discovery_only_effective_in_mcp'
      ]
    },
    discoveredAt: new Date().toISOString(),
    detectionMethod: 'console_fallback',
    warning: 'Agent discovery is only effective in MCP environments. Console discovery provides limited information.'
  };

  const discoveryMethod = {
    type: 'config',
    config: {
      tools: [],
      identity: currentAgent.identity,
      capabilities: {
        strengths: ['conversation', 'guidance'],
        limitations: [
          'no_file_operations',
          'no_web_access',
          'no_tool_execution',
          'discovery_ineffective_in_console'
        ]
      }
    }
  };

  return await globalAgentRegistry.discoverAgent(discoveryMethod, 'console_session');
}

/**
 * Query MCP tools (placeholder for real MCP integration)
 * In a real implementation, this would use the MCP protocol
 */
async function queryMCPTools() {
  // This is a placeholder - in a real MCP environment, this would:
  // 1. Connect to the MCP server
  // 2. Query available tools using MCP protocol
  // 3. Return the actual tool list

  // For now, return empty array since we're not in a real MCP environment
  throw new Error('MCP tool query not implemented - requires real MCP server connection');
}

/**
 * Determine strengths based on available tools
 */
function determineStrengthsFromTools(tools) {
  const strengths = [];

  if (tools.some(t => t.includes('file') || t.includes('edit'))) {
    strengths.push('file_manipulation', 'code_editing');
  }

  if (tools.some(t => t.includes('web') || t.includes('search'))) {
    strengths.push('research', 'web_search');
  }

  if (tools.some(t => t.includes('process') || t.includes('terminal'))) {
    strengths.push('development', 'system_operations');
  }

  if (tools.some(t => t.includes('mermaid') || t.includes('render'))) {
    strengths.push('visualization', 'documentation');
  }

  return strengths;
}
