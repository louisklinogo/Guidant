/**
 * MCP Tools Pane Component
 * Direct MCP tool interface for the Dynamic Terminal Layout System
 * 
 * Provides available tools list, execution status, quick tool execution shortcuts,
 * result display and history, and tool help and documentation.
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import Spinner from 'ink-spinner';
import { BasePane } from './BasePane.js';

/**
 * Tool execution states
 */
const EXECUTION_STATES = {
  IDLE: 'idle',
  EXECUTING: 'executing',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * MCP Tools Pane Class
 * Displays available MCP tools and enables direct execution
 */
export class MCPToolsPane extends BasePane {
  constructor(props) {
    super(props);
    
    // Additional state for MCP tools pane
    this.state = {
      ...this.state,
      selectedToolIndex: 0,
      executionState: EXECUTION_STATES.IDLE,
      executionResult: null,
      executionHistory: [],
      toolFilter: 'all', // all, core, workflow, analysis
      showHelp: false,
      quickActions: props.quickActions || ['n', 'p', 'a', 'r']
    };
  }

  /**
   * Lifecycle hooks
   */
  onMount() {
    this.loadMCPToolsData();
  }

  onUnmount() {
    // Cleanup any pending executions
  }

  /**
   * Load MCP tools data
   */
  async loadMCPToolsData() {
    try {
      this.setLoading(true);
      
      // In real implementation, this would query available MCP tools
      const toolsData = this.props.data || await this.fetchMCPToolsData();
      
      this.safeSetState({
        data: toolsData,
        lastUpdate: new Date(),
        internalState: 'ready'
      });
      
      this.setLoading(false);
      
    } catch (error) {
      this.handleError(error.message);
    }
  }

  /**
   * Fetch MCP tools data (mock implementation)
   */
  async fetchMCPToolsData() {
    // Mock data - in real implementation, query MCP server for available tools
    return {
      tools: [
        {
          name: 'guidant_get_current_task',
          category: 'workflow',
          description: 'Generate the next task based on current project state',
          parameters: [],
          shortcut: 'n',
          lastUsed: '2025-01-13T14:20:00Z',
          executionCount: 15,
          averageTime: '1.2s',
          successRate: 98
        },
        {
          name: 'guidant_report_progress',
          category: 'workflow',
          description: 'Report progress on current task or phase',
          parameters: [
            { name: 'deliverable', type: 'string', required: true },
            { name: 'workCompleted', type: 'string', required: true },
            { name: 'status', type: 'enum', required: true, values: ['in_progress', 'completed', 'blocked'] }
          ],
          shortcut: 'p',
          lastUsed: '2025-01-13T14:15:00Z',
          executionCount: 8,
          averageTime: '0.8s',
          successRate: 100
        },
        {
          name: 'guidant_advance_phase',
          category: 'workflow',
          description: 'Advance to the next development phase',
          parameters: [
            { name: 'confirmAdvancement', type: 'boolean', required: true }
          ],
          shortcut: 'a',
          lastUsed: '2025-01-13T12:00:00Z',
          executionCount: 3,
          averageTime: '2.1s',
          successRate: 100
        },
        {
          name: 'guidant_get_project_state',
          category: 'core',
          description: 'Get current project state and workflow status',
          parameters: [],
          shortcut: 'r',
          lastUsed: '2025-01-13T14:30:00Z',
          executionCount: 25,
          averageTime: '0.5s',
          successRate: 100
        },
        {
          name: 'guidant_discover_agent',
          category: 'analysis',
          description: 'Discover and analyze current AI agent capabilities',
          parameters: [
            { name: 'availableTools', type: 'array', required: true }
          ],
          shortcut: 'c',
          lastUsed: '2025-01-13T10:00:00Z',
          executionCount: 2,
          averageTime: '3.5s',
          successRate: 100
        },
        {
          name: 'guidant_analyze_gaps',
          category: 'analysis',
          description: 'Analyze capability gaps and get tool recommendations',
          parameters: [
            { name: 'agentId', type: 'string', required: true }
          ],
          shortcut: 'g',
          lastUsed: '2025-01-13T10:30:00Z',
          executionCount: 1,
          averageTime: '2.8s',
          successRate: 100
        }
      ],
      statistics: {
        totalTools: 16,
        availableTools: 16,
        totalExecutions: 54,
        successRate: 99.1,
        averageResponseTime: '1.4s'
      },
      quickActions: {
        'n': 'guidant_get_current_task',
        'p': 'guidant_report_progress',
        'a': 'guidant_advance_phase',
        'r': 'guidant_get_project_state'
      }
    };
  }

  /**
   * Keyboard shortcuts for MCP tools pane
   */
  handleKeyPress(key) {
    const { data } = this.state;

    // Check for quick action shortcuts
    if (data?.quickActions?.[key]) {
      // Handle async quick action - don't await to maintain sync interface
      this.executeQuickAction(key).catch(error => {
        this.handleError(`Quick action failed: ${error.message}`);
      });
      return true;
    }

    switch (key) {
      case 'Enter':
        // Handle async tool execution - don't await to maintain sync interface
        this.executeSelectedTool().catch(error => {
          this.handleError(`Tool execution failed: ${error.message}`);
        });
        return true;
      case 'i':
        return this.showToolInfo();
      case 'h':
        return this.toggleToolHelp();
      case 'f':
        return this.cycleFilter();
      case 'x':
        return this.clearExecutionResult();
      case 'ArrowUp':
        return this.selectPreviousTool();
      case 'ArrowDown':
        return this.selectNextTool();
      default:
        return super.handleKeyPress(key);
    }
  }

  /**
   * Get context-sensitive help
   */
  getKeyboardHelp() {
    const { data } = this.state;
    const help = [
      'MCP Tools Pane:',
      '  Enter - Execute selected tool',
      '  i - Show tool information',
      '  h - Toggle tool help',
      '  f - Filter tools',
      '  x - Clear result',
      '  ↑/↓ - Navigate tools'
    ];
    
    if (data?.quickActions) {
      help.push('', 'Quick Actions:');
      Object.entries(data.quickActions).forEach(([key, toolName]) => {
        help.push(`  ${key} - ${toolName.replace('guidant_', '')}`);
      });
    }
    
    return [...help, ...super.getKeyboardHelp()];
  }

  /**
   * MCP tools pane actions
   */
  async executeQuickAction(shortcut) {
    const { data } = this.state;
    const toolName = data?.quickActions?.[shortcut];
    
    if (toolName) {
      return await this.executeTool(toolName);
    }
    
    return false;
  }

  async executeSelectedTool() {
    const { data, selectedToolIndex } = this.state;
    const filteredTools = this.getFilteredTools();
    const selectedTool = filteredTools[selectedToolIndex];
    
    if (selectedTool) {
      return await this.executeTool(selectedTool.name);
    }
    
    return false;
  }

  async executeTool(toolName, parameters = {}) {
    try {
      this.safeSetState({
        executionState: EXECUTION_STATES.EXECUTING,
        executionResult: null
      });
      
      // In real implementation, call actual MCP tool
      console.log(`Executing MCP tool: ${toolName}`, parameters);
      
      // Mock execution
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      const executionTime = Date.now() - startTime;
      
      // Mock result
      const result = {
        toolName,
        parameters,
        success: Math.random() > 0.1, // 90% success rate
        executionTime,
        timestamp: new Date(),
        data: {
          message: `${toolName} executed successfully`,
          details: { executionTime: `${executionTime}ms` }
        }
      };
      
      // Add to execution history
      this.safeSetState(prev => ({
        executionHistory: [result, ...prev.executionHistory.slice(0, 9)], // Keep last 10
        executionResult: result,
        executionState: result.success ? EXECUTION_STATES.SUCCESS : EXECUTION_STATES.ERROR
      }));
      
      return true;
      
    } catch (error) {
      this.safeSetState({
        executionState: EXECUTION_STATES.ERROR,
        executionResult: {
          toolName,
          success: false,
          error: error.message,
          timestamp: new Date()
        }
      });
      
      return false;
    }
  }

  showToolInfo() {
    const { data, selectedToolIndex } = this.state;
    const filteredTools = this.getFilteredTools();
    const selectedTool = filteredTools[selectedToolIndex];
    
    if (selectedTool) {
      console.log('Tool info:', selectedTool);
    }
    
    return true;
  }

  toggleToolHelp() {
    this.safeSetState(prev => ({ showHelp: !prev.showHelp }));
    return true;
  }

  cycleFilter() {
    const filters = ['all', 'core', 'workflow', 'analysis'];
    const currentIndex = filters.indexOf(this.state.toolFilter);
    const nextIndex = (currentIndex + 1) % filters.length;

    this.safeSetState({
      toolFilter: filters[nextIndex],
      selectedToolIndex: 0 // Reset selection
    });

    return true;
  }

  clearExecutionResult() {
    this.safeSetState({
      executionResult: null,
      executionState: EXECUTION_STATES.IDLE
    });
    return true;
  }

  selectPreviousTool() {
    const filteredTools = this.getFilteredTools();

    this.safeSetState(prev => ({
      selectedToolIndex: prev.selectedToolIndex > 0
        ? prev.selectedToolIndex - 1
        : filteredTools.length - 1
    }));

    return true;
  }

  selectNextTool() {
    const filteredTools = this.getFilteredTools();

    this.safeSetState(prev => ({
      selectedToolIndex: prev.selectedToolIndex < filteredTools.length - 1
        ? prev.selectedToolIndex + 1
        : 0
    }));

    return true;
  }

  getFilteredTools() {
    const { data, toolFilter } = this.state;
    if (!data?.tools) return [];
    
    if (toolFilter === 'all') {
      return data.tools;
    }
    
    return data.tools.filter(tool => tool.category === toolFilter);
  }

  /**
   * Render MCP tools content
   */
  renderContent() {
    const { 
      data, 
      selectedToolIndex, 
      executionState, 
      executionResult, 
      toolFilter, 
      showHelp 
    } = this.state;
    const { compact = false } = this.props;
    
    if (!data) {
      return (
        <Box>
          <Text color="yellow">No MCP tools data available</Text>
        </Box>
      );
    }

    const filteredTools = this.getFilteredTools();

    return (
      <Box flexDirection="column">
        {/* Header with statistics */}
        <MCPToolsHeader 
          statistics={data.statistics}
          toolFilter={toolFilter}
          executionState={executionState}
          compact={compact}
        />
        
        {/* Execution Result */}
        {executionResult && (
          <ExecutionResult 
            result={executionResult}
            compact={compact}
          />
        )}
        
        {/* Tools List */}
        <ToolsList
          tools={filteredTools}
          selectedIndex={selectedToolIndex}
          showHelp={showHelp}
          compact={compact}
        />
        
        {/* Quick Actions */}
        {!compact && data.quickActions && (
          <QuickActionsDisplay quickActions={data.quickActions} />
        )}
      </Box>
    );
  }
}

/**
 * MCP Tools Header Component
 */
function MCPToolsHeader({ statistics, toolFilter, executionState, compact }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color="cyan" bold>⚡ MCP Tools</Text>
        {executionState === EXECUTION_STATES.EXECUTING && (
          <Box marginLeft={2}>
            <Spinner type="dots" />
            <Text color="yellow"> Executing...</Text>
          </Box>
        )}
      </Box>
      
      {!compact && statistics && (
        <Box marginTop={1}>
          <Text color="gray">
            {statistics.availableTools}/{statistics.totalTools} tools | 
            {statistics.successRate}% success | 
            Filter: {toolFilter}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Execution Result Component
 */
function ExecutionResult({ result, compact }) {
  const statusColor = result.success ? 'green' : 'red';
  const statusIcon = result.success ? '✅' : '❌';
  
  return (
    <Box flexDirection="column" marginBottom={1} padding={1} borderStyle="round" borderColor={statusColor}>
      <Box>
        <Text color={statusColor}>
          {statusIcon} {result.toolName}
        </Text>
        <Text color="gray"> ({result.executionTime}ms)</Text>
      </Box>
      
      {!compact && (
        <Box marginTop={1}>
          <Text color="gray">
            {result.success ? result.data?.message : result.error}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Tools List Component
 */
function ToolsList({ tools, selectedIndex, showHelp, compact }) {
  const displayTools = compact ? tools.slice(0, 3) : tools;
  
  return (
    <Box flexDirection="column">
      {displayTools.map((tool, index) => (
        <ToolRow
          key={tool.name}
          tool={tool}
          isSelected={index === selectedIndex}
          showHelp={showHelp}
          compact={compact}
        />
      ))}
      
      {compact && tools.length > 3 && (
        <Box marginTop={1}>
          <Text color="gray">... and {tools.length - 3} more tools</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Tool Row Component
 */
function ToolRow({ tool, isSelected, showHelp, compact }) {
  const borderColor = isSelected ? 'cyan' : 'gray';
  const successColor = tool.successRate >= 95 ? 'green' : tool.successRate >= 90 ? 'yellow' : 'red';
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isSelected ? 'white' : 'gray'}>
          {tool.shortcut ? `[${tool.shortcut}] ` : ''}
          {tool.name.replace('guidant_', '')}
        </Text>
        {!compact && (
          <Text color={successColor}> ({tool.successRate}%)</Text>
        )}
      </Box>
      
      {!compact && (
        <Box marginLeft={2}>
          <Text color="gray">{tool.description}</Text>
        </Box>
      )}
      
      {showHelp && isSelected && !compact && tool.parameters && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color="cyan">Parameters:</Text>
          {tool.parameters.map((param, index) => (
            <Box key={index} marginLeft={2}>
              <Text color="gray">
                {param.name} ({param.type}){param.required && ' *'}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

/**
 * Quick Actions Display Component
 */
function QuickActionsDisplay({ quickActions }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan">Quick Actions:</Text>
      <Box marginTop={1}>
        {Object.entries(quickActions).map(([key, toolName]) => (
          <Text key={key} color="gray" marginRight={2}>
            {key}:{toolName.replace('guidant_', '')}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

/**
 * Default props
 */
MCPToolsPane.defaultProps = {
  ...BasePane.defaultProps,
  paneId: 'tools',
  title: '⚡ MCP Tools',
  quickActions: ['n', 'p', 'a', 'r']
};

export default MCPToolsPane;
