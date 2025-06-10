/**
 * Tasks Pane Component
 * Enhanced task management for the Dynamic Terminal Layout System
 * 
 * Builds on existing TasksSection with enhanced task management, dependency visualization,
 * task status updates, and direct task execution via MCP tools.
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';
import { BasePane } from './BasePane.js';
import { DependencyGraph } from '../components/DependencyGraph.jsx';

/**
 * Tasks Pane Class
 * Displays current and upcoming tasks with dependencies
 */
export class TasksPane extends BasePane {
  constructor(props) {
    super(props);
    
    // Additional state for tasks pane
    this.state = {
      ...this.state,
      selectedTaskIndex: 0,
      showDependencies: props.showDependencies || false,
      taskFilter: 'all', // all, pending, in-progress, completed
      sortBy: 'priority', // priority, date, status
      viewMode: 'list' // list, graph
    };
  }

  /**
   * Lifecycle hooks
   */
  onMount() {
    this.loadTasksData();
  }

  onUnmount() {
    // Cleanup any timers or subscriptions
  }

  /**
   * Load tasks data from project state
   */
  async loadTasksData() {
    try {
      this.setLoading(true);
      
      // In real implementation, this would load from .guidant/ai/task-tickets/
      const tasksData = this.props.data || await this.fetchTasksData();
      
      this.setState({
        data: tasksData,
        lastUpdate: new Date(),
        internalState: 'ready'
      });
      
      this.setLoading(false);
      
    } catch (error) {
      this.handleError(error.message);
    }
  }

  /**
   * Fetch tasks data (mock implementation)
   */
  async fetchTasksData() {
    // Mock data - in real implementation, read from .guidant/ai/task-tickets/
    return {
      currentTask: {
        id: 'TASK-003',
        title: 'Implement Dynamic Terminal Layout System',
        description: 'Create VS Code-inspired multi-pane terminal interface with keyboard navigation',
        priority: 'high',
        status: 'in-progress',
        phase: 'implementation',
        progress: 75,
        assignee: 'AI Agent',
        estimatedHours: 16,
        actualHours: 12,
        dependencies: ['TASK-001', 'TASK-002'],
        subtasks: [
          { id: 'SUB-007', title: 'Create Layout Manager', status: 'completed', progress: 100 },
          { id: 'SUB-008', title: 'Create Pane Manager', status: 'completed', progress: 100 },
          { id: 'SUB-009', title: 'Create Keyboard Navigator', status: 'completed', progress: 100 },
          { id: 'SUB-010', title: 'Create Real-time Updater', status: 'completed', progress: 100 },
          { id: 'SUB-011', title: 'Create BasePane Component', status: 'in-progress', progress: 80 },
          { id: 'SUB-012', title: 'Create Enhanced Panes', status: 'pending', progress: 0 }
        ],
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T14:30:00Z'
      },
      upcomingTasks: [
        {
          id: 'TASK-004',
          title: 'Implement MCP Tool Integration',
          priority: 'high',
          status: 'pending',
          phase: 'implementation',
          estimatedHours: 8,
          dependencies: ['TASK-003']
        },
        {
          id: 'TASK-005',
          title: 'Create Interactive Controls',
          priority: 'medium',
          status: 'pending',
          phase: 'implementation',
          estimatedHours: 6,
          dependencies: ['TASK-003']
        },
        {
          id: 'TASK-006',
          title: 'Performance Optimization',
          priority: 'medium',
          status: 'pending',
          phase: 'testing',
          estimatedHours: 4,
          dependencies: ['TASK-004', 'TASK-005']
        }
      ],
      completedTasks: [
        {
          id: 'TASK-001',
          title: 'Design Dynamic Layout Architecture',
          status: 'completed',
          completedAt: '2025-01-12T16:00:00Z'
        },
        {
          id: 'TASK-002',
          title: 'Create Core Components',
          status: 'completed',
          completedAt: '2025-01-13T09:00:00Z'
        }
      ],
      statistics: {
        totalTasks: 6,
        completedTasks: 2,
        inProgressTasks: 1,
        pendingTasks: 3,
        averageCompletionTime: '1.5 days',
        currentVelocity: '2 tasks/day'
      }
    };
  }

  /**
   * Keyboard shortcuts for tasks pane
   */
  handleKeyPress(key) {
    switch (key) {
      case 'n':
        // Handle async task generation - don't await to maintain sync interface
        this.generateNextTask().catch(error => {
          this.handleError(`Task generation failed: ${error.message}`);
        });
        return true;
      case 'p':
        // Handle async progress reporting - don't await to maintain sync interface
        this.reportTaskProgress().catch(error => {
          this.handleError(`Progress reporting failed: ${error.message}`);
        });
        return true;
      case 'c':
        // Handle async task completion - don't await to maintain sync interface
        this.completeCurrentTask().catch(error => {
          this.handleError(`Task completion failed: ${error.message}`);
        });
        return true;
      case 'r':
        // Handle async refresh - don't await to maintain sync interface
        this.refreshTasks().catch(error => {
          this.handleError(`Refresh failed: ${error.message}`);
        });
        return true;
      case 'd':
        return this.toggleDependencies();
      case 'f':
        return this.cycleFilter();
      case 's':
        return this.cycleSorting();
      case 'g':
        return this.toggleViewMode();
      case 'Enter':
        return this.viewTaskDetails();
      case 'ArrowUp':
        return this.selectPreviousTask();
      case 'ArrowDown':
        return this.selectNextTask();
      default:
        return super.handleKeyPress(key);
    }
  }

  /**
   * Get context-sensitive help
   */
  getKeyboardHelp() {
    return [
      'Tasks Pane:',
      '  n - Generate next task',
      '  p - Report task progress',
      '  c - Complete current task',
      '  d - Toggle dependencies view',
      '  f - Filter tasks',
      '  s - Sort tasks',
      '  g - Toggle graph/list view',
      '  ↑/↓ - Navigate tasks',
      '  Enter - View task details',
      ...super.getKeyboardHelp()
    ];
  }

  /**
   * Task pane actions
   */
  async generateNextTask() {
    try {
      // In real implementation, call MCP tool guidant_get_current_task
      console.log('Generating next task...');
      
      // Mock task generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data after generation
      await this.loadTasksData();
      
      return true;
    } catch (error) {
      this.handleError(`Failed to generate next task: ${error.message}`);
      return false;
    }
  }

  async reportTaskProgress() {
    try {
      // In real implementation, call MCP tool guidant_report_progress
      console.log('Reporting task progress...');
      
      // Mock progress report
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      this.handleError(`Failed to report progress: ${error.message}`);
      return false;
    }
  }

  async completeCurrentTask() {
    try {
      // In real implementation, update task status and call MCP tools
      console.log('Completing current task...');
      
      // Mock task completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh data after completion
      await this.loadTasksData();
      
      return true;
    } catch (error) {
      this.handleError(`Failed to complete task: ${error.message}`);
      return false;
    }
  }

  async refreshTasks() {
    await this.loadTasksData();
    return true;
  }

  toggleDependencies() {
    this.setState(prev => ({
      showDependencies: !prev.showDependencies
    }));
    return true;
  }

  cycleFilter() {
    const filters = ['all', 'pending', 'in-progress', 'completed'];
    const currentIndex = filters.indexOf(this.state.taskFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    
    this.setState({ taskFilter: filters[nextIndex] });
    return true;
  }

  cycleSorting() {
    const sortOptions = ['priority', 'date', 'status'];
    const currentIndex = sortOptions.indexOf(this.state.sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;

    this.setState({ sortBy: sortOptions[nextIndex] });
    return true;
  }

  toggleViewMode() {
    this.setState(prev => ({
      viewMode: prev.viewMode === 'list' ? 'graph' : 'list'
    }));
    return true;
  }

  viewTaskDetails() {
    const { data, selectedTaskIndex } = this.state;
    if (data?.upcomingTasks?.[selectedTaskIndex]) {
      const task = data.upcomingTasks[selectedTaskIndex];
      console.log(`Viewing details for task: ${task.title}`);
    }
    return true;
  }

  selectPreviousTask() {
    const { data } = this.state;
    if (!data?.upcomingTasks) return false;
    
    this.setState(prev => ({
      selectedTaskIndex: prev.selectedTaskIndex > 0 
        ? prev.selectedTaskIndex - 1 
        : data.upcomingTasks.length - 1
    }));
    return true;
  }

  selectNextTask() {
    const { data } = this.state;
    if (!data?.upcomingTasks) return false;
    
    this.setState(prev => ({
      selectedTaskIndex: prev.selectedTaskIndex < data.upcomingTasks.length - 1
        ? prev.selectedTaskIndex + 1
        : 0
    }));
    return true;
  }

  /**
   * Render tasks content
   */
  renderContent() {
    const { data, selectedTaskIndex, showDependencies, taskFilter, sortBy, viewMode } = this.state;
    const { compact = false } = this.props;

    if (!data) {
      return (
        <Box>
          <Text color="yellow">No tasks data available</Text>
        </Box>
      );
    }

    // Graph view mode
    if (viewMode === 'graph' && !compact) {
      return this.renderGraphView();
    }

    // Default list view mode
    return (
      <Box flexDirection="column">
        {/* Current Task */}
        {data.currentTask && (
          <CurrentTaskDisplay
            task={data.currentTask}
            showDependencies={showDependencies}
            compact={compact}
          />
        )}

        {/* Task Statistics */}
        {!compact && data.statistics && (
          <TaskStatisticsDisplay statistics={data.statistics} />
        )}

        {/* Upcoming Tasks */}
        {data.upcomingTasks && (
          <UpcomingTasksDisplay
            tasks={data.upcomingTasks}
            selectedIndex={selectedTaskIndex}
            filter={taskFilter}
            sortBy={sortBy}
            compact={compact}
            onTaskSelect={(index) => this.setState({ selectedTaskIndex: index })}
          />
        )}

        {/* View Mode and Filter/Sort Status */}
        {!compact && (
          <Box marginTop={1}>
            <Text color="gray">
              View: {viewMode} | Filter: {taskFilter} | Sort: {sortBy} | g/f/s to change
            </Text>
          </Box>
        )}
      </Box>
    );
  }

  /**
   * Render graph view with dependency visualization
   */
  renderGraphView() {
    const { data, taskFilter } = this.state;

    // Combine all tasks for graph visualization
    const allTasks = [
      ...(data.completedTasks || []),
      ...(data.upcomingTasks || [])
    ];

    if (data.currentTask) {
      allTasks.push(data.currentTask);
    }

    return (
      <Box flexDirection="column">
        {/* Graph View Header */}
        <Box marginBottom={1}>
          <Text color="cyan" bold>📊 Task Dependency Graph</Text>
          <Text color="gray"> (g to switch to list view)</Text>
        </Box>

        {/* Dependency Graph */}
        <DependencyGraph
          tasks={allTasks}
          currentTask={data.currentTask}
          compact={false}
          showCompleted={taskFilter === 'all' || taskFilter === 'completed'}
          maxDepth={3}
          width={60}
        />

        {/* Graph Controls */}
        <Box marginTop={1}>
          <Text color="gray">
            Filter: {taskFilter} | f to change filter | g to switch to list view
          </Text>
        </Box>
      </Box>
    );
  }
}

/**
 * Current Task Display Component
 */
function CurrentTaskDisplay({ task, showDependencies, compact }) {
  const progressBar = createProgressBar(task.progress, compact ? 15 : 25);
  const priorityColor = getPriorityColor(task.priority);
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>📋 Current Task</Text>
      <Box marginTop={1}>
        <Text color="white" bold>{task.title}</Text>
      </Box>
      
      {!compact && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            <Text color="gray">ID: </Text>
            <Text>{task.id}</Text>
            <Text color="gray"> | Priority: </Text>
            <Text color={priorityColor}>{task.priority.toUpperCase()}</Text>
          </Box>
          
          <Box marginTop={1}>
            <Text color="gray">Progress: </Text>
            <Text>{progressBar} {task.progress}%</Text>
          </Box>
          
          <Box>
            <Text color="gray">Time: {task.actualHours}h / {task.estimatedHours}h</Text>
          </Box>
          
          {showDependencies && task.dependencies && (
            <Box marginTop={1}>
              <Text color="gray">Dependencies: {task.dependencies.join(', ')}</Text>
            </Box>
          )}
        </Box>
      )}
      
      {/* Subtasks */}
      {!compact && task.subtasks && (
        <SubtasksDisplay subtasks={task.subtasks} />
      )}
    </Box>
  );
}

/**
 * Subtasks Display Component
 */
function SubtasksDisplay({ subtasks }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan">Subtasks:</Text>
      {subtasks.map((subtask, index) => (
        <Box key={index} marginLeft={2}>
          <Text color={getStatusColor(subtask.status)}>
            {getStatusIcon(subtask.status)} {subtask.title}
          </Text>
          <Text color="gray"> ({subtask.progress}%)</Text>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Task Statistics Display Component
 */
function TaskStatisticsDisplay({ statistics }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>📊 Task Statistics</Text>
      <Box marginTop={1}>
        <Text color="gray">
          Total: {statistics.totalTasks} | 
          Completed: {statistics.completedTasks} | 
          In Progress: {statistics.inProgressTasks} | 
          Pending: {statistics.pendingTasks}
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          Velocity: {statistics.currentVelocity} | 
          Avg Time: {statistics.averageCompletionTime}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Upcoming Tasks Display Component
 */
function UpcomingTasksDisplay({ tasks, selectedIndex, filter, sortBy, compact, onTaskSelect }) {
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });
  
  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'date':
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });
  
  const displayTasks = compact ? sortedTasks.slice(0, 3) : sortedTasks;
  
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan" bold>📅 Upcoming Tasks</Text>
      <Newline />
      
      {displayTasks.map((task, index) => (
        <UpcomingTaskRow
          key={task.id}
          task={task}
          isSelected={index === selectedIndex}
          compact={compact}
          onSelect={() => onTaskSelect(index)}
        />
      ))}
      
      {compact && sortedTasks.length > 3 && (
        <Box marginTop={1}>
          <Text color="gray">... and {sortedTasks.length - 3} more tasks</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Upcoming Task Row Component
 */
function UpcomingTaskRow({ task, isSelected, compact, onSelect }) {
  const priorityColor = getPriorityColor(task.priority);
  const borderColor = isSelected ? 'cyan' : 'gray';
  
  return (
    <Box marginBottom={1}>
      <Box>
        <Text color={priorityColor}>► </Text>
        <Text color={isSelected ? 'white' : 'gray'}>
          {task.title}
        </Text>
        <Text color="gray"> ({task.priority})</Text>
      </Box>
      
      {!compact && (
        <Box marginLeft={2}>
          <Text color="gray">
            {task.estimatedHours}h | Phase: {task.phase}
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Utility functions
 */
function createProgressBar(percent, length = 25) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;
  return `${'█'.repeat(filled)}${'░'.repeat(empty)}`;
}

function getPriorityColor(priority) {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'green'
  };
  return colors[priority] || 'gray';
}

function getStatusColor(status) {
  const colors = {
    completed: 'green',
    'in-progress': 'yellow',
    pending: 'gray',
    blocked: 'red'
  };
  return colors[status] || 'gray';
}

function getStatusIcon(status) {
  const icons = {
    completed: '✅',
    'in-progress': '🔄',
    pending: '⏳',
    blocked: '🚫'
  };
  return icons[status] || '📋';
}

/**
 * Default props
 */
TasksPane.defaultProps = {
  ...BasePane.defaultProps,
  paneId: 'tasks',
  title: '📋 Tasks',
  showDependencies: false
};

export default TasksPane;
