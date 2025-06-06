/**
 * Tool Configuration System for TaskMaster Evolution
 * Manages tool requests and helps users configure AI agents optimally
 */

import { UNIVERSAL_TOOL_REGISTRY } from '../ai-coordination/tool-registry.js';
import { analyzeAgentGaps } from './gap-analysis.js';

/**
 * Tool Configuration and Request System
 */
export class ToolConfigurator {
  constructor() {
    this.pendingRequests = new Map();
    this.configurationHistory = [];
    this.userPreferences = {
      autoApprove: false,
      preferredAlternatives: {},
      blockedTools: []
    };
  }

  /**
   * Request specific tools for an agent with reasoning
   */
  async requestTools(agentId, requiredTools, context = {}) {
    const request = {
      id: `req_${Date.now()}_${agentId}`,
      agentId,
      requiredTools,
      context,
      status: 'pending',
      createdAt: new Date().toISOString(),
      reasoning: this.generateToolRequestReasoning(requiredTools, context)
    };

    this.pendingRequests.set(request.id, request);

    // Generate user-friendly configuration instructions
    const instructions = await this.generateConfigurationInstructions(request);
    request.instructions = instructions;

    return request;
  }

  /**
   * Analyze agent and automatically suggest tool configuration
   */
  async suggestOptimalConfiguration(agentInfo, targetProject = null) {
    // Perform gap analysis
    const gapAnalysis = await analyzeAgentGaps(agentInfo, targetProject ? [targetProject] : []);

    const suggestion = {
      agentId: agentInfo.id,
      currentTools: agentInfo.tools || [],
      suggestedAt: new Date().toISOString(),
      gapScore: gapAnalysis.totalGapScore,
      recommendations: []
    };

    // Get top recommendations
    const topRecommendations = gapAnalysis.prioritizedRecommendations.slice(0, 10);

    topRecommendations.forEach(rec => {
      const configRec = {
        tool: rec.name,
        priority: rec.priority,
        reasoning: `Improves ${rec.benefitsRoles?.join(', ')} capabilities`,
        confidenceImpact: rec.totalConfidenceImpact,
        alternatives: rec.alternatives,
        configurationOptions: this.getConfigurationOptions(rec.name)
      };

      suggestion.recommendations.push(configRec);
    });

    // Generate implementation plan
    suggestion.implementationPlan = this.generateImplementationPlan(suggestion.recommendations);

    return suggestion;
  }

  /**
   * Generate reasoning for why tools are needed
   */
  generateToolRequestReasoning(requiredTools, context) {
    const reasoning = {
      summary: '',
      details: [],
      urgency: 'medium'
    };

    requiredTools.forEach(toolName => {
      const toolInfo = UNIVERSAL_TOOL_REGISTRY[toolName];
      if (toolInfo) {
        reasoning.details.push({
          tool: toolName,
          reason: `Required for ${toolInfo.capabilities.join(', ')}`,
          category: toolInfo.category,
          impact: toolInfo.confidence_boost > 0.4 ? 'high' : 'medium'
        });
      }
    });

    // Determine urgency
    const hasEssentialTools = requiredTools.some(tool => {
      const info = UNIVERSAL_TOOL_REGISTRY[tool];
      return info && info.confidence_boost > 0.4;
    });

    reasoning.urgency = hasEssentialTools ? 'high' : 'medium';

    // Generate summary
    const categories = [...new Set(reasoning.details.map(d => d.category))];
    reasoning.summary = `Requesting ${requiredTools.length} tools for ${categories.join(', ')} capabilities`;

    if (context.taskType) {
      reasoning.summary += ` to support ${context.taskType} tasks`;
    }

    return reasoning;
  }

  /**
   * Generate user-friendly configuration instructions
   */
  async generateConfigurationInstructions(request) {
    const instructions = {
      title: `Configure Tools for Enhanced AI Agent Capabilities`,
      overview: `Your AI agent needs additional tools to perform optimally. Here's how to configure them:`,
      steps: [],
      alternatives: {},
      troubleshooting: []
    };

    request.requiredTools.forEach(toolName => {
      const toolInfo = UNIVERSAL_TOOL_REGISTRY[toolName];
      if (!toolInfo) return;

      const step = {
        tool: toolName,
        description: toolInfo.description,
        category: toolInfo.category,
        instructions: this.getToolSpecificInstructions(toolName),
        verification: `Test with: Ask your AI agent if it has access to ${toolName}`
      };

      instructions.steps.push(step);

      // Add alternatives
      if (toolInfo.alternatives && toolInfo.alternatives.length > 0) {
        instructions.alternatives[toolName] = {
          primary: toolName,
          alternatives: toolInfo.alternatives,
          note: `If ${toolName} is not available, try: ${toolInfo.alternatives.join(', ')}`
        };
      }
    });

    // Add troubleshooting
    instructions.troubleshooting = [
      "If a tool isn't available, check the alternatives section",
      "Some tools may require API keys or additional setup",
      "After configuration, restart your AI session to ensure tools are loaded",
      "Test tool availability by asking your AI agent to list its available tools"
    ];

    return instructions;
  }

  /**
   * Get tool-specific configuration instructions
   */
  getToolSpecificInstructions(toolName) {
    const specificInstructions = {
      'git': {
        steps: ["Ensure Git is installed on your system", "Configure Git credentials if needed", "Grant AI agent access to Git commands"],
        requirements: ["Git CLI installed", "Repository access permissions"],
        notes: "Essential for version control and collaboration"
      },

      'playwright': {
        steps: ["Install Playwright: npm install playwright", "Download browser binaries: npx playwright install", "Grant AI agent browser automation permissions"],
        requirements: ["Node.js environment", "Browser binaries"],
        notes: "Required for end-to-end testing and browser automation"
      },

      'tavily-search': {
        steps: ["Sign up for Tavily API", "Get API key from Tavily dashboard", "Configure TAVILY_API_KEY environment variable"],
        requirements: ["Tavily API subscription", "Internet connection"],
        notes: "Provides real-time web search capabilities"
      },

      'get-library-docs': {
        steps: ["Ensure Context7 integration is available", "Configure library documentation access", "Test with a known library"],
        requirements: ["Context7 access", "Library documentation APIs"],
        notes: "Access to comprehensive technical documentation"
      },

      'docker': {
        steps: ["Install Docker Desktop", "Start Docker daemon", "Grant AI agent container management permissions"],
        requirements: ["Docker installed", "System permissions"],
        notes: "Required for containerization and deployment"
      },

      'database_query': {
        steps: ["Set up database connection", "Configure connection strings", "Grant appropriate database permissions"],
        requirements: ["Database server", "Connection credentials"],
        notes: "Enables data management and persistence"
      }
    };

    return specificInstructions[toolName] || {
      steps: [`Research how to install/configure ${toolName}`, `Grant AI agent access to ${toolName}`, `Test functionality`],
      requirements: ["Tool installation", "Proper permissions"],
      notes: "Standard tool configuration required"
    };
  }

  /**
   * Get configuration options for a tool
   */
  getConfigurationOptions(toolName) {
    const options = {
      difficulty: 'medium',
      timeEstimate: '10-30 minutes',
      prerequisites: [],
      apiRequired: false,
      systemAccess: false
    };

    const toolInfo = UNIVERSAL_TOOL_REGISTRY[toolName];
    if (!toolInfo) return options;

    // Customize based on tool category
    switch (toolInfo.category) {
      case 'research':
        options.apiRequired = true;
        options.prerequisites = ['API key signup'];
        break;

      case 'testing':
        options.difficulty = 'medium-high';
        options.timeEstimate = '30-60 minutes';
        options.prerequisites = ['Development environment'];
        break;

      case 'deployment':
        options.difficulty = 'high';
        options.timeEstimate = '1-2 hours';
        options.systemAccess = true;
        options.prerequisites = ['System admin access', 'Infrastructure setup'];
        break;

      case 'version_control':
        options.difficulty = 'low';
        options.timeEstimate = '5-15 minutes';
        options.prerequisites = ['Git installation'];
        break;

      default:
        break;
    }

    return options;
  }

  /**
   * Generate step-by-step implementation plan
   */
  generateImplementationPlan(recommendations) {
    const plan = {
      phases: [],
      totalTimeEstimate: '2-4 hours',
      prerequisites: new Set(),
      notes: []
    };

    // Group by priority and category
    const essential = recommendations.filter(r => r.priority === 'essential');
    const important = recommendations.filter(r => r.priority === 'important');
    const optional = recommendations.filter(r => r.priority === 'optional');

    if (essential.length > 0) {
      plan.phases.push({
        phase: 'Phase 1: Essential Tools',
        priority: 'Must implement first',
        tools: essential.map(r => r.tool),
        description: 'These tools are required for basic functionality',
        estimatedTime: '1-2 hours'
      });
    }

    if (important.length > 0) {
      plan.phases.push({
        phase: 'Phase 2: Important Tools',
        priority: 'Implement for optimal performance',
        tools: important.map(r => r.tool),
        description: 'These tools significantly improve capabilities',
        estimatedTime: '30-60 minutes'
      });
    }

    if (optional.length > 0) {
      plan.phases.push({
        phase: 'Phase 3: Optional Enhancements',
        priority: 'Implement when time permits',
        tools: optional.map(r => r.tool),
        description: 'These tools provide additional capabilities',
        estimatedTime: '15-30 minutes'
      });
    }

    // Collect all prerequisites
    recommendations.forEach(rec => {
      const options = this.getConfigurationOptions(rec.tool);
      options.prerequisites.forEach(prereq => plan.prerequisites.add(prereq));
    });

    plan.prerequisites = Array.from(plan.prerequisites);

    // Add implementation notes
    plan.notes = [
      "Start with Phase 1 tools as they're required for basic functionality",
      "Test each tool after configuration before moving to the next",
      "Keep API keys and credentials secure",
      "Consider using environment variables for configuration",
      "Some tools may require system restart or session refresh"
    ];

    return plan;
  }

  /**
   * Mark tool request as completed
   */
  completeToolRequest(requestId, configuredTools, notes = '') {
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      throw new Error(`Tool request ${requestId} not found`);
    }

    request.status = 'completed';
    request.completedAt = new Date().toISOString();
    request.configuredTools = configuredTools;
    request.completionNotes = notes;

    // Add to history
    this.configurationHistory.push(request);

    // Remove from pending
    this.pendingRequests.delete(requestId);

    return request;
  }

  /**
   * Get pending tool requests for an agent
   */
  getPendingRequests(agentId = null) {
    const requests = Array.from(this.pendingRequests.values());
    
    if (agentId) {
      return requests.filter(req => req.agentId === agentId);
    }
    
    return requests;
  }

  /**
   * Get configuration history
   */
  getConfigurationHistory(agentId = null) {
    if (agentId) {
      return this.configurationHistory.filter(config => config.agentId === agentId);
    }
    
    return this.configurationHistory;
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }
}

/**
 * Global tool configurator instance
 */
export const globalToolConfigurator = new ToolConfigurator();

/**
 * Convenience function for requesting tools
 */
export async function requestToolsForAgent(agentId, requiredTools, context = {}) {
  return await globalToolConfigurator.requestTools(agentId, requiredTools, context);
}

/**
 * Convenience function for getting configuration suggestions
 */
export async function getConfigurationSuggestions(agentInfo, targetProject = null) {
  return await globalToolConfigurator.suggestOptimalConfiguration(agentInfo, targetProject);
}
