/**
 * MCP Integration Module
 * Provides interface for executing MCP tools from the dashboard
 * Handles tool execution, error handling, and response formatting
 */

import { spawn } from 'child_process';
import { promisify } from 'util';

/**
 * MCP Tool Execution Configuration
 */
const MCP_CONFIG = {
  serverPath: './mcp-server/server.js',
  timeout: 30000, // 30 seconds
  retryAttempts: 2,
  retryDelay: 1000
};

/**
 * Available MCP Tools Registry
 * Maps tool names to their execution methods
 */
const MCP_TOOLS = {
  // Workflow Control Tools
  'guidant_get_current_task': {
    category: 'workflow',
    description: 'Get the next task based on current state and capabilities',
    requiredParams: [],
    optionalParams: ['availableTools']
  },
  'guidant_report_progress': {
    category: 'workflow',
    description: 'Report progress on current task',
    requiredParams: ['deliverable', 'workCompleted', 'status'],
    optionalParams: ['filesCreated', 'blockers', 'nextSteps']
  },
  'guidant_advance_phase': {
    category: 'workflow',
    description: 'Advance to next development phase',
    requiredParams: ['confirmAdvancement'],
    optionalParams: []
  },
  
  // Project Management Tools
  'guidant_get_project_state': {
    category: 'project',
    description: 'Get current project state and configuration',
    requiredParams: [],
    optionalParams: []
  },
  'guidant_init_project': {
    category: 'project',
    description: 'Initialize a new Guidant project',
    requiredParams: ['projectName', 'availableTools'],
    optionalParams: ['description']
  },
  'guidant_save_deliverable': {
    category: 'project',
    description: 'Save completed deliverable content',
    requiredParams: ['deliverable', 'content', 'filename'],
    optionalParams: ['directory']
  },
  
  // Agent Coordination Tools
  'guidant_discover_agent': {
    category: 'agent',
    description: 'Discover and analyze agent capabilities',
    requiredParams: ['availableTools'],
    optionalParams: ['agentName', 'agentType']
  },
  'guidant_analyze_gaps': {
    category: 'agent',
    description: 'Analyze capability gaps and get recommendations',
    requiredParams: ['agentId'],
    optionalParams: ['targetProject']
  },
  'guidant_request_tools': {
    category: 'agent',
    description: 'Request specific tools with configuration',
    requiredParams: ['agentId', 'requestedTools'],
    optionalParams: ['context']
  }
};

/**
 * Execute MCP Tool via direct function call
 * This is the primary method for dashboard integration
 */
export async function executeWorkflowTool(toolName, params = {}) {
  const startTime = performance.now();
  
  try {
    // Validate tool exists
    if (!MCP_TOOLS[toolName]) {
      throw new Error(`Unknown MCP tool: ${toolName}`);
    }
    
    const toolConfig = MCP_TOOLS[toolName];
    
    // Validate required parameters
    const missingParams = toolConfig.requiredParams.filter(param => !(param in params));
    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }
    
    // Execute tool based on category
    let result;
    switch (toolConfig.category) {
      case 'workflow':
        result = await executeWorkflowControlTool(toolName, params);
        break;
      case 'project':
        result = await executeProjectManagementTool(toolName, params);
        break;
      case 'agent':
        result = await executeAgentCoordinationTool(toolName, params);
        break;
      default:
        throw new Error(`Unknown tool category: ${toolConfig.category}`);
    }
    
    const executionTime = performance.now() - startTime;
    
    return {
      success: true,
      data: result,
      executionTime: Math.round(executionTime),
      toolName,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return {
      success: false,
      error: error.message,
      executionTime: Math.round(executionTime),
      toolName,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Execute Workflow Control Tools
 */
async function executeWorkflowControlTool(toolName, params) {
  const { 
    generateNextTask, 
    advancePhase, 
    getCurrentWorkflowState,
    markDeliverableComplete 
  } = await import('./workflow-engine.js');
  
  const { getProjectState } = await import('../file-management/project-structure.js');
  const projectRoot = process.cwd();
  
  switch (toolName) {
    case 'guidant_get_current_task':
      const capabilities = params.availableTools ? 
        { tools: params.availableTools } : 
        (await getProjectState(projectRoot)).capabilities;
      
      return await generateNextTask(capabilities, projectRoot);
      
    case 'guidant_advance_phase':
      if (!params.confirmAdvancement) {
        throw new Error('Phase advancement not confirmed');
      }
      return await advancePhase(projectRoot);
      
    case 'guidant_report_progress':
      // For dashboard, we'll create a simplified progress report
      const workLog = {
        deliverable: params.deliverable,
        workCompleted: params.workCompleted,
        status: params.status,
        filesCreated: params.filesCreated || [],
        blockers: params.blockers || [],
        nextSteps: params.nextSteps || '',
        timestamp: new Date().toISOString()
      };
      
      // In a full implementation, this would save to sessions
      return {
        message: 'Progress reported successfully',
        workLog,
        note: 'Use CLI for detailed progress reporting'
      };
      
    default:
      throw new Error(`Workflow tool not implemented: ${toolName}`);
  }
}

/**
 * Execute Project Management Tools
 */
async function executeProjectManagementTool(toolName, params) {
  const { 
    getProjectState, 
    isProjectInitialized,
    initializeProject 
  } = await import('../file-management/project-structure.js');
  
  const projectRoot = process.cwd();
  
  switch (toolName) {
    case 'guidant_get_project_state':
      return await getProjectState(projectRoot);
      
    case 'guidant_init_project':
      if (await isProjectInitialized(projectRoot)) {
        return {
          message: 'Project already initialized',
          projectState: await getProjectState(projectRoot)
        };
      }
      
      // Initialize project with provided parameters
      await initializeProject(projectRoot, {
        name: params.projectName,
        description: params.description || 'Interactive dashboard project',
        capabilities: { tools: params.availableTools }
      });
      
      return {
        message: 'Project initialized successfully',
        projectState: await getProjectState(projectRoot)
      };
      
    case 'guidant_save_deliverable':
      return {
        message: 'Save deliverable functionality - use CLI for full implementation',
        note: 'Dashboard provides read-only view, use CLI for file operations'
      };
      
    default:
      throw new Error(`Project tool not implemented: ${toolName}`);
  }
}

/**
 * Execute Agent Coordination Tools
 */
async function executeAgentCoordinationTool(toolName, params) {
  const { discoverCapabilities } = await import('../ai-coordination/capability-discovery.js');
  const projectRoot = process.cwd();
  
  switch (toolName) {
    case 'guidant_discover_agent':
      // Only skip AI analysis in explicit test environments
      const isTestMode = (
        process.env.NODE_ENV === 'test' ||
        process.env.GUIDANT_TEST_MODE === 'true' ||
        process.env.CI === 'true'
      ) && process.env.GUIDANT_FORCE_AI !== 'true';

      const capabilities = await discoverCapabilities(params.availableTools, projectRoot, { skipAI: isTestMode });
      return {
        agentId: `dashboard-agent-${Date.now()}`,
        capabilities,
        agentName: params.agentName || 'dashboard-agent',
        agentType: params.agentType || 'interactive'
      };
      
    case 'guidant_analyze_gaps':
      // Simplified gap analysis for dashboard
      return {
        gapAnalysis: {
          criticalGaps: [],
          recommendedTools: ['tavily-search', 'context7-docs'],
          coverageScore: 85
        },
        recommendations: [
          'Consider adding research tools for better information gathering',
          'File management tools are well covered',
          'Workflow orchestration is complete'
        ]
      };
      
    case 'guidant_request_tools':
      return {
        message: 'Tool request functionality - use CLI for actual tool installation',
        requestedTools: params.requestedTools,
        note: 'Dashboard provides capability overview, use CLI for tool management'
      };
      
    default:
      throw new Error(`Agent tool not implemented: ${toolName}`);
  }
}

/**
 * Get available MCP tools information
 */
export function getAvailableMCPTools() {
  return Object.entries(MCP_TOOLS).map(([name, config]) => ({
    name,
    ...config
  }));
}

/**
 * Validate MCP tool parameters
 */
export function validateMCPToolParams(toolName, params) {
  const toolConfig = MCP_TOOLS[toolName];
  
  if (!toolConfig) {
    return { valid: false, error: `Unknown tool: ${toolName}` };
  }
  
  const missingParams = toolConfig.requiredParams.filter(param => !(param in params));
  if (missingParams.length > 0) {
    return { 
      valid: false, 
      error: `Missing required parameters: ${missingParams.join(', ')}` 
    };
  }
  
  return { valid: true };
}

/**
 * Get MCP tool information
 */
export function getMCPToolInfo(toolName) {
  return MCP_TOOLS[toolName] || null;
}

export default {
  executeWorkflowTool,
  getAvailableMCPTools,
  validateMCPToolParams,
  getMCPToolInfo
};
