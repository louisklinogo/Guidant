/**
 * Tasks Section Component (Ink/React)
 * Current and upcoming tasks display
 */

import React from 'react';
import { Box, Text, Newline } from 'ink';

/**
 * Tasks Section Component
 */
export function TasksSection({ 
  projectState, 
  workflowState, 
  compact = false, 
  selected = false 
}) {
  // Mock task data - replace with actual task generation
  const currentTask = {
    id: 'TASK-001',
    title: 'Implement Professional Status Dashboard',
    description: 'Create beautiful terminal UI components with Ink and legacy fallback',
    priority: 'high',
    status: 'in-progress',
    phase: workflowState?.currentPhase?.phase || 'implementation',
    progress: 75,
    subtasks: [
      { id: 'SUB-001', title: 'Create UI directory structure', status: 'completed' },
      { id: 'SUB-002', title: 'Implement banner component', status: 'completed' },
      { id: 'SUB-003', title: 'Implement progress bar component', status: 'completed' },
      { id: 'SUB-004', title: 'Create Ink renderer', status: 'in-progress' },
      { id: 'SUB-005', title: 'Test dashboard command', status: 'pending' }
    ]
  };

  const upcomingTasks = [
    { id: 'TASK-002', title: 'Add interactive navigation', priority: 'medium', phase: 'enhancement' },
    { id: 'TASK-003', title: 'Implement live dashboard mode', priority: 'medium', phase: 'enhancement' },
    { id: 'TASK-004', title: 'Create comprehensive documentation', priority: 'low', phase: 'documentation' }
  ];

  const borderColor = selected ? 'cyan' : 'gray';

  if (compact) {
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color="cyan" bold>📋 Current Task: </Text>
        <Text color="yellow">► </Text>
        <Text>{currentTask.title} </Text>
        <Text color={getPriorityColor(currentTask.priority)}>({currentTask.priority})</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginBottom={2}>
      {/* Current Task */}
      <CurrentTaskDisplay 
        task={currentTask}
        borderColor={borderColor}
      />

      {/* Upcoming Tasks */}
      <UpcomingTasksDisplay 
        tasks={upcomingTasks}
        compact={compact}
      />
    </Box>
  );
}

/**
 * Current Task Display Component
 */
function CurrentTaskDisplay({ task, borderColor }) {
  return (
    <Box borderStyle="round" borderColor={borderColor} padding={1} marginBottom={1}>
      <Box flexDirection="column">
        <Text color="cyan" bold>📋 Current Task</Text>
        <Newline />
        
        {/* Task Header */}
        <Box>
          <Text color="white" bold>{task.title}</Text>
        </Box>
        
        {/* Task Details */}
        <Box marginTop={1}>
          <Box width={15}>
            <Text color="gray">ID:</Text>
          </Box>
          <Text color="white">{task.id}</Text>
        </Box>
        
        <Box>
          <Box width={15}>
            <Text color="gray">Priority:</Text>
          </Box>
          <Text color={getPriorityColor(task.priority)}>{task.priority.toUpperCase()}</Text>
        </Box>
        
        <Box>
          <Box width={15}>
            <Text color="gray">Status:</Text>
          </Box>
          <Text color={getStatusColor(task.status)}>{getStatusIcon(task.status)} {task.status}</Text>
        </Box>
        
        <Box>
          <Box width={15}>
            <Text color="gray">Phase:</Text>
          </Box>
          <Text color="cyan">{task.phase}</Text>
        </Box>
        
        {/* Progress Bar */}
        <Box marginTop={1}>
          <Box width={15}>
            <Text color="gray">Progress:</Text>
          </Box>
          <Text>{createTaskProgressBar(task.progress)}</Text>
        </Box>
        
        {/* Description */}
        {task.description && (
          <Box marginTop={1}>
            <Text color="gray">{task.description}</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

/**
 * Subtasks Display Component
 */
function SubtasksDisplay({ subtasks, compact = false }) {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan" bold>Subtasks:</Text>
      <Newline />
      
      {subtasks.map((subtask, index) => (
        <Box key={index} marginBottom={compact ? 0 : 1}>
          <Box width={3}>
            <Text color={getStatusColor(subtask.status)}>
              {getStatusIcon(subtask.status)}
            </Text>
          </Box>
          <Text color="white">{subtask.title}</Text>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Upcoming Tasks Display Component
 */
function UpcomingTasksDisplay({ tasks, compact }) {
  if (!tasks || tasks.length === 0) {
    return (
      <Box borderStyle="round" borderColor="gray" padding={1}>
        <Text color="gray">No upcoming tasks</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>📅 Upcoming Tasks</Text>
      <Newline />
      
      {tasks.slice(0, compact ? 2 : 5).map((task, index) => (
        <UpcomingTaskRow 
          key={index}
          task={task}
          compact={compact}
        />
      ))}
      
      {tasks.length > (compact ? 2 : 5) && (
        <Box marginTop={1}>
          <Text color="gray">... and {tasks.length - (compact ? 2 : 5)} more tasks</Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Upcoming Task Row Component
 */
function UpcomingTaskRow({ task, compact }) {
  return (
    <Box marginBottom={compact ? 0 : 1}>
      <Box width={15}>
        <Text color="gray">{task.id}:</Text>
      </Box>
      <Box width={40}>
        <Text color="white">{task.title}</Text>
      </Box>
      <Box width={10}>
        <Text color={getPriorityColor(task.priority)}>{task.priority}</Text>
      </Box>
      <Box>
        <Text color="cyan">{task.phase}</Text>
      </Box>
    </Box>
  );
}

/**
 * Helper Functions
 */
function getPriorityColor(priority) {
  const colors = {
    high: 'red',
    medium: 'yellow',
    low: 'gray'
  };
  return colors[priority?.toLowerCase()] || 'white';
}

function getStatusColor(status) {
  const colors = {
    completed: 'green',
    'in-progress': 'yellow',
    pending: 'gray',
    blocked: 'red',
    review: 'magenta'
  };
  return colors[status?.toLowerCase()] || 'white';
}

function getStatusIcon(status) {
  const icons = {
    completed: '✅',
    'in-progress': '🔄',
    pending: '⏱️',
    blocked: '❌',
    review: '👀'
  };
  return icons[status?.toLowerCase()] || '?';
}

function createTaskProgressBar(percent, length = 20) {
  const filled = Math.round((percent * length) / 100);
  const empty = length - filled;

  let color = 'red';
  if (percent >= 75) color = 'green';
  else if (percent >= 50) color = 'yellow';
  else if (percent >= 25) color = 'yellow';

  const filledSection = '█'.repeat(filled);
  const emptySection = '░'.repeat(empty);

  return (
    <Text>
      <Text color={color}>{filledSection}</Text>
      <Text color="gray">{emptySection}</Text>
      <Text color={color}> {percent}%</Text>
    </Text>
  );
}

export default TasksSection;
