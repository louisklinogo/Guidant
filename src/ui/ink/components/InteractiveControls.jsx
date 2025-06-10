/**
 * Interactive Controls Component
 * Handles keyboard navigation and MCP tool execution for live dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Interactive Controls Hook
 * Provides comprehensive keyboard shortcuts for workflow management with real-time MCP tool execution
 *
 * @param {Object} options - Hook options
 * @param {Function} options.onMCPToolExecution - Callback for MCP tool execution
 * @param {Function} options.onStateUpdate - Callback for state updates
 * @param {boolean} options.enabled - Whether interactive controls are enabled
 * @param {Object} options.currentState - Current project/workflow state
 * @param {Function} options.onError - Error handling callback
 * @param {Function} options.onSuccess - Success handling callback
 */
export function useInteractiveControls({
  onMCPToolExecution,
  onStateUpdate,
  enabled = true,
  currentState = {},
  onError = () => {},
  onSuccess = () => {}
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [executionHistory, setExecutionHistory] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalExecutions: 0,
    successRate: 100,
    averageResponseTime: 0
  });

  /**
   * Execute MCP tool with comprehensive error handling and performance tracking
   */
  const executeMCPTool = useCallback(async (toolName, params = {}, actionDescription) => {
    if (isExecuting) {
      setFeedback('⚠️ Another action is in progress...');
      return { success: false, error: 'Execution in progress' };
    }

    const startTime = performance.now();
    setIsExecuting(true);
    setLastAction(actionDescription);
    setFeedback(`🔄 Executing: ${actionDescription}...`);

    try {
      // Validate tool name
      if (!toolName || typeof toolName !== 'string') {
        throw new Error('Invalid tool name provided');
      }

      // Execute MCP tool
      const result = await onMCPToolExecution(toolName, params);
      const executionTime = performance.now() - startTime;

      // Update performance metrics
      setPerformanceMetrics(prev => {
        const newTotal = prev.totalExecutions + 1;
        const newSuccessRate = result.success
          ? ((prev.successRate * prev.totalExecutions + 100) / newTotal)
          : ((prev.successRate * prev.totalExecutions) / newTotal);
        const newAvgTime = ((prev.averageResponseTime * prev.totalExecutions + executionTime) / newTotal);

        return {
          totalExecutions: newTotal,
          successRate: Math.round(newSuccessRate * 10) / 10,
          averageResponseTime: Math.round(newAvgTime)
        };
      });

      // Add to execution history
      const historyEntry = {
        toolName,
        actionDescription,
        success: result.success,
        executionTime: Math.round(executionTime),
        timestamp: new Date().toISOString(),
        error: result.error || null
      };

      setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

      if (result.success) {
        setFeedback(`✅ ${actionDescription} completed (${Math.round(executionTime)}ms)`);
        onSuccess(result, historyEntry);

        // Trigger state update if callback provided
        if (onStateUpdate) {
          await onStateUpdate();
        }
      } else {
        const errorMsg = result.error || 'Unknown error occurred';
        setFeedback(`❌ ${actionDescription} failed: ${errorMsg}`);
        onError(result, historyEntry);
      }

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMsg = error.message || 'Execution error';

      setFeedback(`❌ ${actionDescription} error: ${errorMsg}`);

      const historyEntry = {
        toolName,
        actionDescription,
        success: false,
        executionTime: Math.round(executionTime),
        timestamp: new Date().toISOString(),
        error: errorMsg
      };

      setExecutionHistory(prev => [historyEntry, ...prev.slice(0, 9)]);
      onError({ success: false, error: errorMsg }, historyEntry);

      return { success: false, error: errorMsg };

    } finally {
      setIsExecuting(false);
      // Clear feedback after 4 seconds (longer for better UX)
      setTimeout(() => setFeedback(''), 4000);
    }
  }, [isExecuting, onMCPToolExecution, onStateUpdate]);

  /**
   * Handle keyboard input with comprehensive action support and validation
   */
  const handleKeyPress = useCallback(async (key) => {
    if (!enabled) {
      setFeedback('⚠️ Interactive controls are disabled');
      setTimeout(() => setFeedback(''), 2000);
      return false;
    }

    if (isExecuting) {
      setFeedback('⚠️ Please wait for current action to complete...');
      setTimeout(() => setFeedback(''), 2000);
      return false;
    }

    // Validate current state before executing actions
    const hasValidState = currentState && typeof currentState === 'object';
    const hasCapabilities = hasValidState && currentState.capabilities;

    switch (key) {
      case 'n': // Get Next Task
        await executeMCPTool(
          'guidant_get_current_task',
          {
            availableTools: hasCapabilities ? (currentState.capabilities.tools || []) : []
          },
          'Get Next Task'
        );
        break;

      case 'p': // Report Progress (Enhanced)
        // Check if we have current task context
        if (hasValidState && currentState.currentTask) {
          setFeedback('📝 Progress reporting with current task context - use CLI for detailed input');
        } else {
          setFeedback('📝 Progress reporting requires task details - use CLI: guidant progress');
        }
        setTimeout(() => setFeedback(''), 4000);
        break;

      case 'a': // Advance Phase
        // Check if phase advancement is possible
        if (hasValidState && currentState.workflow?.currentPhase) {
          await executeMCPTool(
            'guidant_advance_phase',
            { confirmAdvancement: true },
            'Advance Phase'
          );
        } else {
          setFeedback('⚠️ No active phase found - initialize project first');
          setTimeout(() => setFeedback(''), 3000);
        }
        break;

      case 'r': // Refresh State
        await executeMCPTool(
          'guidant_get_project_state',
          {},
          'Refresh Project State'
        );
        break;

      case 's': // Save Current Work
        if (hasValidState && currentState.currentTask) {
          setFeedback('💾 Save functionality - use CLI: guidant save');
        } else {
          setFeedback('💾 No active task to save');
        }
        setTimeout(() => setFeedback(''), 3000);
        break;

      case 'c': // Show Capabilities
        await executeMCPTool(
          'guidant_discover_agent',
          {
            availableTools: hasCapabilities ? (currentState.capabilities.tools || []) : [],
            agentName: 'dashboard-agent',
            agentType: 'interactive'
          },
          'Discover Agent Capabilities'
        );
        break;

      case 'g': // Analyze Gaps
        if (hasCapabilities && currentState.capabilities.agentId) {
          await executeMCPTool(
            'guidant_analyze_gaps',
            {
              agentId: currentState.capabilities.agentId,
              targetProject: {
                name: currentState.project?.name || 'current-project'
              }
            },
            'Analyze Capability Gaps'
          );
        } else {
          setFeedback('⚠️ Agent discovery required first - press "c"');
          setTimeout(() => setFeedback(''), 3000);
        }
        break;

      case 'i': // Initialize Project
        await executeMCPTool(
          'guidant_init_project',
          {
            projectName: currentState.project?.name || 'interactive-project',
            availableTools: hasCapabilities ? (currentState.capabilities.tools || []) : []
          },
          'Initialize Project'
        );
        break;

      default:
        // Key not handled by interactive controls
        return false;
    }

    return true; // Key was handled
  }, [enabled, isExecuting, executeMCPTool, currentState]);

  /**
   * Enhanced keyboard shortcuts reference with comprehensive workflow actions
   */
  const getKeyboardShortcuts = () => [
    { key: 'n', description: 'Get Next Task', available: !isExecuting },
    { key: 'p', description: 'Report Progress', available: false, note: 'Use CLI' },
    { key: 'a', description: 'Advance Phase', available: !isExecuting },
    { key: 'r', description: 'Refresh Project State', available: !isExecuting },
    { key: 's', description: 'Save Current Work', available: false, note: 'Use CLI' },
    { key: 'c', description: 'Discover Capabilities', available: !isExecuting },
    { key: 'g', description: 'Analyze Gaps', available: !isExecuting },
    { key: 'i', description: 'Initialize Project', available: !isExecuting },
    { key: 'h', description: 'Toggle Help', available: true },
    { key: 'q', description: 'Quit Dashboard', available: true }
  ];

  /**
   * Get execution statistics for performance monitoring
   */
  const getExecutionStats = () => ({
    ...performanceMetrics,
    isExecuting,
    lastAction,
    historyCount: executionHistory.length
  });

  return {
    // Core functionality
    handleKeyPress,
    getKeyboardShortcuts,
    getExecutionStats,

    // State
    isExecuting,
    lastAction,
    feedback,
    enabled,

    // Performance & History
    performanceMetrics,
    executionHistory,

    // Direct tool execution (for advanced use)
    executeMCPTool
  };
}

/**
 * Interactive Controls Status Display
 * Shows current execution status and feedback
 */
export function InteractiveControlsStatus({ 
  isExecuting, 
  lastAction, 
  feedback,
  compact = false 
}) {
  if (compact && !feedback) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      {feedback && (
        <Box>
          <Text color={feedback.startsWith('✅') ? 'green' : feedback.startsWith('❌') ? 'red' : 'yellow'}>
            {feedback}
          </Text>
        </Box>
      )}
      
      {isExecuting && (
        <Box marginTop={feedback ? 1 : 0}>
          <Text color="cyan">
            ⏳ Executing: {lastAction}...
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Keyboard Shortcuts Help Display
 * Shows available keyboard shortcuts
 */
export function KeyboardShortcutsHelp({ shortcuts, compact = false }) {
  if (compact) {
    const availableShortcuts = shortcuts.filter(s => s.available);
    return (
      <Box>
        <Text color="gray">
          Shortcuts: {availableShortcuts.map(s => s.key).join(', ')} • h=help • q=quit
        </Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
      <Text color="cyan" bold>Keyboard Shortcuts</Text>
      <Newline />
      
      {shortcuts.map((shortcut, index) => (
        <Box key={index}>
          <Text color={shortcut.available ? 'white' : 'gray'}>
            {shortcut.key}: {shortcut.description}
            {shortcut.note && <Text color="yellow"> ({shortcut.note})</Text>}
            {!shortcut.available && !shortcut.note && <Text color="gray"> (disabled)</Text>}
          </Text>
          {index < shortcuts.length - 1 && <Newline />}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Interactive Controls Component
 * React component wrapper for the useInteractiveControls hook
 */
export function InteractiveControls(props) {
  return useInteractiveControls(props);
}

export default { useInteractiveControls, InteractiveControls };
