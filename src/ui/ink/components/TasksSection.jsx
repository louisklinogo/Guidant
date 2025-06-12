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
  // Generate actual task based on current project state and workflow
  const currentTask = generateCurrentTask(projectState, workflowState);

  // Generate upcoming tasks based on project phase and workflow
  const upcomingTasks = generateUpcomingTasks(projectState, workflowState);

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

/**
 * Generate current task based on project state and workflow
 */
function generateCurrentTask(projectState, workflowState) {
  const currentPhase = workflowState?.currentPhase?.phase || 'concept';
  const projectName = projectState?.config?.name || 'Project';
  const progress = workflowState?.currentPhase?.progress || 0;

  // Generate task based on current phase
  const phaseTaskMap = {
    concept: {
      title: `Define ${projectName} Vision and Requirements`,
      description: `Research market needs, define user personas, and establish the core value proposition for ${projectName}.`,
      priority: 'high'
    },
    requirements: {
      title: `Create Detailed Requirements for ${projectName}`,
      description: `Document functional and non-functional requirements, create user stories, and define acceptance criteria.`,
      priority: 'high'
    },
    design: {
      title: `Design User Experience for ${projectName}`,
      description: `Create wireframes, user flows, and visual designs that deliver an excellent user experience.`,
      priority: 'high'
    },
    architecture: {
      title: `Design System Architecture for ${projectName}`,
      description: `Design the technical architecture, choose technology stack, and plan system components.`,
      priority: 'high'
    },
    implementation: {
      title: `Implement Core Features for ${projectName}`,
      description: `Build the core features, implement business logic, and ensure quality through testing.`,
      priority: 'high'
    },
    deployment: {
      title: `Deploy and Launch ${projectName}`,
      description: `Deploy to production, set up monitoring, and prepare for user launch.`,
      priority: 'high'
    }
  };

  const taskTemplate = phaseTaskMap[currentPhase] || {
    title: `Continue Development of ${projectName}`,
    description: `Work on the current phase deliverables for ${projectName}.`,
    priority: 'medium'
  };

  return {
    id: `${currentPhase.toUpperCase()}-001`,
    title: taskTemplate.title,
    description: taskTemplate.description,
    priority: taskTemplate.priority,
    status: progress > 0 ? 'in-progress' : 'pending',
    phase: currentPhase,
    progress: progress,
    subtasks: generateSubtasks(currentPhase, progress)
  };
}

/**
 * Generate upcoming tasks based on workflow
 */
function generateUpcomingTasks(projectState, workflowState) {
  const currentPhase = workflowState?.currentPhase?.phase || 'concept';
  const projectName = projectState?.config?.name || 'Project';

  const phaseOrder = ['concept', 'requirements', 'design', 'architecture', 'implementation', 'deployment'];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  const upcomingTasks = [];

  // Generate tasks for next 2-3 phases
  for (let i = currentIndex + 1; i < Math.min(currentIndex + 4, phaseOrder.length); i++) {
    const phase = phaseOrder[i];
    const phaseTaskMap = {
      requirements: { title: `Create Requirements for ${projectName}`, priority: 'high' },
      design: { title: `Design UX for ${projectName}`, priority: 'high' },
      architecture: { title: `Architect ${projectName} System`, priority: 'high' },
      implementation: { title: `Build ${projectName} Features`, priority: 'high' },
      deployment: { title: `Deploy ${projectName}`, priority: 'medium' }
    };

    const taskInfo = phaseTaskMap[phase];
    if (taskInfo) {
      upcomingTasks.push({
        id: `${phase.toUpperCase()}-001`,
        title: taskInfo.title,
        priority: taskInfo.priority,
        phase: phase
      });
    }
  }

  return upcomingTasks;
}

/**
 * Generate subtasks based on phase and progress
 */
function generateSubtasks(phase, progress) {
  const subtaskTemplates = {
    concept: [
      { title: 'Research market and competitors', threshold: 0 },
      { title: 'Define user personas', threshold: 25 },
      { title: 'Establish value proposition', threshold: 50 },
      { title: 'Create project vision document', threshold: 75 }
    ],
    requirements: [
      { title: 'Gather functional requirements', threshold: 0 },
      { title: 'Define non-functional requirements', threshold: 25 },
      { title: 'Create user stories', threshold: 50 },
      { title: 'Define acceptance criteria', threshold: 75 }
    ],
    design: [
      { title: 'Create user flow diagrams', threshold: 0 },
      { title: 'Design wireframes', threshold: 25 },
      { title: 'Create visual designs', threshold: 50 },
      { title: 'Validate design with users', threshold: 75 }
    ],
    architecture: [
      { title: 'Choose technology stack', threshold: 0 },
      { title: 'Design system architecture', threshold: 25 },
      { title: 'Plan data models', threshold: 50 },
      { title: 'Create technical specifications', threshold: 75 }
    ],
    implementation: [
      { title: 'Set up development environment', threshold: 0 },
      { title: 'Implement core features', threshold: 25 },
      { title: 'Add business logic', threshold: 50 },
      { title: 'Write tests and documentation', threshold: 75 }
    ],
    deployment: [
      { title: 'Set up production environment', threshold: 0 },
      { title: 'Configure monitoring', threshold: 25 },
      { title: 'Deploy application', threshold: 50 },
      { title: 'Validate production deployment', threshold: 75 }
    ]
  };

  const templates = subtaskTemplates[phase] || [];

  return templates.map((template, index) => ({
    id: `SUB-${String(index + 1).padStart(3, '0')}`,
    title: template.title,
    status: progress > template.threshold ? 'completed' : (progress > template.threshold - 25 ? 'in-progress' : 'pending')
  }));
}

export default TasksSection;
