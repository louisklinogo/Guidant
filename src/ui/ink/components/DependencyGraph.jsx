/**
 * ASCII Dependency Visualization Component
 * Beautiful task relationship graphs with Unicode box drawing
 * 
 * Features:
 * - Task dependencies with visual connections
 * - Color-coded status indicators
 * - Blocking issue highlights
 * - Progress indicators
 * - Compact and full view modes
 */

import React, { useMemo } from 'react';
import { Box, Text } from 'ink';

/**
 * Dependency Graph Component
 * Renders ASCII art dependency visualization for tasks
 */
export function DependencyGraph({
  tasks = [],
  currentTask = null,
  compact = false,
  showCompleted = false,
  maxDepth = 3,
  width = 60
}) {
  // Build dependency graph data structure
  const graphData = useMemo(() => {
    return buildDependencyGraph(tasks, currentTask, maxDepth, showCompleted);
  }, [tasks, currentTask, maxDepth, showCompleted]);

  // Render the graph
  const renderGraph = () => {
    if (!graphData || graphData.nodes.length === 0) {
      return (
        <Box>
          <Text color="gray">No dependencies to display</Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {/* Graph Header */}
        <Box marginBottom={1}>
          <Text color="cyan" bold>🔗 Task Dependencies</Text>
          {!compact && (
            <Text color="gray"> ({graphData.nodes.length} tasks, {graphData.edges.length} dependencies)</Text>
          )}
        </Box>

        {/* ASCII Graph */}
        <Box flexDirection="column">
          {renderGraphNodes(graphData, compact, width)}
        </Box>

        {/* Legend */}
        {!compact && (
          <Box marginTop={1}>
            <DependencyLegend />
          </Box>
        )}
      </Box>
    );
  };

  return renderGraph();
}

/**
 * Build dependency graph data structure
 */
function buildDependencyGraph(tasks, currentTask, maxDepth, showCompleted) {
  // Handle null/undefined tasks
  if (!tasks || !Array.isArray(tasks)) {
    return { nodes: [], edges: [], maxDepth: 0 };
  }

  const nodes = new Map();
  const edges = [];
  const visited = new Set();

  // Helper function to add a task node
  const addTaskNode = (task, depth = 0) => {
    if (!task || depth > maxDepth || visited.has(task.id)) return;

    // Skip completed tasks if not showing them
    if (!showCompleted && task.status === 'completed') return;

    visited.add(task.id);

    nodes.set(task.id, {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      progress: task.progress || 0,
      depth,
      isCurrent: currentTask && task.id === currentTask.id,
      isBlocked: isTaskBlocked(task, tasks)
    });

    // Add dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        const depTask = tasks.find(t => t.id === depId);
        if (depTask) {
          edges.push({
            from: depId,
            to: task.id,
            type: 'dependency'
          });

          // Recursively add dependency nodes
          addTaskNode(depTask, depth + 1);
        }
      });
    }
  };

  // Start with current task if provided, otherwise use all tasks
  if (currentTask) {
    addTaskNode(currentTask);

    // Also add tasks that depend on the current task
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.includes(currentTask.id)) {
        addTaskNode(task, 1);
      }
    });
  } else {
    tasks.forEach(task => addTaskNode(task));
  }

  const nodeArray = Array.from(nodes.values());
  return {
    nodes: nodeArray,
    edges,
    maxDepth: nodeArray.length > 0 ? Math.max(...nodeArray.map(n => n.depth)) : 0
  };
}

/**
 * Check if a task is blocked by incomplete dependencies
 */
function isTaskBlocked(task, allTasks) {
  if (!task || !task.dependencies || task.dependencies.length === 0) return false;
  if (!allTasks || !Array.isArray(allTasks)) return false;

  return task.dependencies.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status !== 'completed';
  });
}

/**
 * Render graph nodes with ASCII connections
 */
function renderGraphNodes(graphData, compact, width) {
  const { nodes, edges } = graphData;
  
  // Group nodes by depth for layered rendering
  const nodesByDepth = new Map();
  nodes.forEach(node => {
    if (!nodesByDepth.has(node.depth)) {
      nodesByDepth.set(node.depth, []);
    }
    nodesByDepth.get(node.depth).push(node);
  });

  const layers = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
  const renderedLines = [];

  layers.forEach((depth, layerIndex) => {
    const layerNodes = nodesByDepth.get(depth);
    
    // Render nodes at this depth
    layerNodes.forEach((node, nodeIndex) => {
      const nodeLines = renderTaskNode(node, compact);
      
      // Add connection lines if not the first layer
      if (layerIndex > 0) {
        const connectionLines = renderConnections(node, edges, nodes, compact);
        renderedLines.push(...connectionLines);
      }
      
      renderedLines.push(...nodeLines);
      
      // Add spacing between nodes
      if (nodeIndex < layerNodes.length - 1) {
        renderedLines.push(<Box key={`spacing-${depth}-${nodeIndex}`} height={1} />);
      }
    });
    
    // Add spacing between layers
    if (layerIndex < layers.length - 1) {
      renderedLines.push(<Box key={`layer-spacing-${depth}`} height={1} />);
    }
  });

  return renderedLines;
}

/**
 * Render a single task node
 */
function renderTaskNode(node, compact) {
  const statusIcon = getStatusIcon(node.status);
  const statusColor = getStatusColor(node.status);
  const priorityColor = getPriorityColor(node.priority);
  const borderColor = node.isCurrent ? 'cyan' : (node.isBlocked ? 'red' : 'gray');
  
  if (compact) {
    return [
      <Box key={`node-${node.id}`}>
        <Text color={statusColor}>{statusIcon} </Text>
        <Text color={node.isCurrent ? 'white' : 'gray'} bold={node.isCurrent}>
          {truncateText(node.title, 30)}
        </Text>
        <Text color={priorityColor}> ({node.priority})</Text>
        {node.isBlocked && <Text color="red"> 🚫</Text>}
      </Box>
    ];
  }

  const progressBar = createProgressBar(node.progress, 15);
  
  return [
    <Box key={`node-${node.id}`} borderStyle="round" borderColor={borderColor} padding={1}>
      <Box flexDirection="column">
        {/* Task header */}
        <Box>
          <Text color={statusColor}>{statusIcon} </Text>
          <Text color={node.isCurrent ? 'white' : 'gray'} bold={node.isCurrent}>
            {node.title}
          </Text>
        </Box>
        
        {/* Task details */}
        <Box marginTop={1}>
          <Text color="gray">ID: {node.id} | </Text>
          <Text color={priorityColor}>Priority: {node.priority.toUpperCase()}</Text>
          {node.isBlocked && <Text color="red"> | BLOCKED 🚫</Text>}
        </Box>
        
        {/* Progress bar */}
        {node.progress > 0 && (
          <Box marginTop={1}>
            <Text color="gray">Progress: {progressBar} {node.progress}%</Text>
          </Box>
        )}
      </Box>
    </Box>
  ];
}

/**
 * Render connection lines between nodes
 */
function renderConnections(node, edges, allNodes, compact) {
  const connections = edges.filter(edge => edge.to === node.id);
  if (connections.length === 0) return [];

  const connectionLines = [];
  
  connections.forEach((connection, index) => {
    const fromNode = allNodes.find(n => n.id === connection.from);
    if (!fromNode) return;

    const isLastConnection = index === connections.length - 1;
    const connector = compact ? '└─' : '└──';
    const line = compact ? '│' : '│';
    
    connectionLines.push(
      <Box key={`connection-${connection.from}-${connection.to}`}>
        <Text color="gray">
          {' '.repeat(fromNode.depth * 2)}{isLastConnection ? connector : '├─'} 
        </Text>
        <Text color="cyan">depends on </Text>
        <Text color="gray">{fromNode.title}</Text>
      </Box>
    );
  });

  return connectionLines;
}

/**
 * Dependency Legend Component
 */
function DependencyLegend() {
  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
      <Text color="cyan" bold>Legend:</Text>
      <Box marginTop={1}>
        <Text color="green">✓ Completed  </Text>
        <Text color="yellow">⚡ In Progress  </Text>
        <Text color="gray">○ Pending  </Text>
        <Text color="red">🚫 Blocked</Text>
      </Box>
      <Box>
        <Text color="red">High  </Text>
        <Text color="yellow">Medium  </Text>
        <Text color="green">Low Priority</Text>
      </Box>
    </Box>
  );
}

/**
 * Utility functions
 */
function getStatusIcon(status) {
  const icons = {
    completed: '✓',
    'in-progress': '⚡',
    pending: '○',
    blocked: '🚫',
    cancelled: '✗'
  };
  return icons[status] || '○';
}

function getStatusColor(status) {
  const colors = {
    completed: 'green',
    'in-progress': 'yellow',
    pending: 'gray',
    blocked: 'red',
    cancelled: 'red'
  };
  return colors[status] || 'gray';
}

function getPriorityColor(priority) {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  };
  return colors[priority] || 'gray';
}

function createProgressBar(percent, length = 15) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export default DependencyGraph;
